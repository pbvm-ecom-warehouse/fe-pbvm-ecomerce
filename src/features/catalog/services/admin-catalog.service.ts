import { apiClient } from "@/lib/api-client";
import { publicApiFetch } from "@/lib/public-api";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import type { ProductVariant, FulfillmentType } from "@/types/api";

export async function adminListProducts() {
  try {
    const rawProducts = await publicApiFetch<any[]>("/catalog/products");
    const activeList = Array.isArray(rawProducts) ? rawProducts : [];

    // Enrich each active product with variants from its detail page
    const enrichedActive = await Promise.all(
      activeList.map(async (p) => {
        try {
          const detail = await publicApiFetch<any>(
            `/catalog/products/${encodeURIComponent(p.slug)}`,
          );
          return {
            ...p,
            id: p.id || p._id,
            variants: detail?.variants || [],
          };
        } catch {
          return {
            ...p,
            id: p.id || p._id,
            variants: [],
          };
        }
      }),
    );

    // Retrieve local draft products
    let drafts: any[] = [];
    if (typeof window !== "undefined") {
      try {
        drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      } catch {
        drafts = [];
      }
    }

    // Filter out drafts that became active in the backend database
    const activeIds = new Set(enrichedActive.map((p) => p.id || p._id));
    const activeSlugs = new Set(enrichedActive.map((p) => p.slug));
    const filteredDrafts = drafts.filter(
      (d) => !activeIds.has(d.id || d._id) && !activeSlugs.has(d.slug),
    );

    // Update local storage if any items were synchronized/removed
    if (typeof window !== "undefined" && drafts.length !== filteredDrafts.length) {
      localStorage.setItem("ecom_local_drafts", JSON.stringify(filteredDrafts));
    }

    // Prepend drafts so they show up at the top
    return [...filteredDrafts, ...enrichedActive];
  } catch (error) {
    console.error("adminListProducts storefront enrichment failed:", error);
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function adminCreateProduct(data: {
  name: string;
  slug: string;
  description?: string;
  images?: string[];
  categoryId: string;
  status?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}) {
  const response = await apiClient.post<any>("/admin/catalog/products", data);
  const created = unwrapApiData(response.data);

  // Cache created DRAFT product locally to show it in the list
  if (typeof window !== "undefined") {
    try {
      const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      drafts.push({
        ...created,
        id: created.id || created._id,
        status: "DRAFT",
        variants: [],
      });
      localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));
    } catch (e) {
      console.error("Failed to cache draft product:", e);
    }
  }

  return created;
}

export async function adminUpdateProduct(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    images?: string[];
    categoryId?: string;
    status?: string;
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
  },
) {
  const response = await apiClient.patch<any>(
    `/admin/catalog/products/${id}`,
    data,
  );
  const updated = unwrapApiData(response.data);

  // Update in local drafts cache if exists
  if (typeof window !== "undefined") {
    try {
      const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      const idx = drafts.findIndex((d: any) => (d.id || d._id) === id);
      if (idx !== -1) {
        drafts[idx] = { ...drafts[idx], ...updated };
        localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));
      }
    } catch (e) {
      console.error("Failed to update cached draft:", e);
    }
  }

  return updated;
}

export async function adminPublishProduct(id: string) {
  const response = await apiClient.put<any>(
    `/admin/catalog/products/${id}/publish`,
  );
  const published = unwrapApiData(response.data);

  // Remove published product from local drafts cache (since it is now active in database)
  if (typeof window !== "undefined") {
    try {
      let drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      drafts = drafts.filter((d: any) => (d.id || d._id) !== id);
      localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));
    } catch (e) {
      console.error("Failed to clear published draft from cache:", e);
    }
  }

  return published;
}

export async function adminCreateVariant(data: {
  sku: string;
  productId: string;
  price: number;
  attributes?: Record<string, string>;
  fulfillmentType: FulfillmentType;
}): Promise<ProductVariant> {
  const response = await apiClient.post<any>("/admin/catalog/variants", data);
  const created = unwrapApiData(response.data);

  // Associate variant with the cached local draft product
  if (typeof window !== "undefined") {
    try {
      const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      const idx = drafts.findIndex((d: any) => (d.id || d._id) === data.productId);
      if (idx !== -1) {
        drafts[idx].variants = drafts[idx].variants || [];
        drafts[idx].variants.push({
          ...created,
          id: created.id || created._id,
          price: created.price,
          sku: created.sku,
          attributes: created.attributes,
          fulfillmentType: created.fulfillmentType,
          availableQty: 0,
        });
        localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));
      }
    } catch (e) {
      console.error("Failed to associate variant in cache:", e);
    }
  }

  return created;
}

export async function adminUpdateVariant(
  id: string,
  data: {
    sku?: string;
    price?: number;
    attributes?: Record<string, string>;
    fulfillmentType?: FulfillmentType;
    isActive?: boolean;
  },
): Promise<ProductVariant> {
  const response = await apiClient.patch<any>(
    `/admin/catalog/variants/${id}`,
    data,
  );
  const updated = unwrapApiData(response.data) as ProductVariant;

  // Update inside cached local draft variants if exists
  if (typeof window !== "undefined") {
    try {
      const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      let updatedCache = false;
      for (const d of drafts) {
        const vIdx = d.variants?.findIndex((v: any) => (v.id || v._id) === id);
        if (vIdx !== -1 && vIdx !== undefined) {
          d.variants[vIdx] = { ...d.variants[vIdx], ...updated };
          updatedCache = true;
          break;
        }
      }
      if (updatedCache) {
        localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));
      }
    } catch (e) {
      console.error("Failed to update cached variant:", e);
    }
  }

  return updated;
}

export async function adminListCategories() {
  const response = await apiClient.get<any>("/catalog/categories");
  return unwrapApiData(response.data);
}

export async function adminCreateCategory(data: {
  name: string;
  slug: string;
  parentId?: string | null;
  position?: number;
}) {
  const response = await apiClient.post<any>("/admin/catalog/categories", data);
  return unwrapApiData(response.data);
}
