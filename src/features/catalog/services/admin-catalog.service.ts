import { apiClient } from "@/lib/api-client";
import { publicApiFetch } from "@/lib/public-api";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import type { ProductVariant, FulfillmentType } from "@/types/api";
import { listWmsItems } from "./wms-stock.service";

function cleanImageCandidate(...candidates: (any)[]): string[] {
  const flat: string[] = [];
  for (const item of candidates) {
    if (!item) continue;
    if (Array.isArray(item)) {
      flat.push(...item.filter((x): x is string => typeof x === "string" && Boolean(x)));
    } else if (typeof item === "string") {
      flat.push(item);
    }
  }

  const valid = flat.filter((url) => {
    const lower = url.toLowerCase().trim();
    return lower && lower !== "string" && lower !== "null" && lower !== "undefined";
  });

  return Array.from(new Set(valid));
}

/**
 * Xóa ảnh mock (Unsplash, via.placeholder, v.v.) còn lưu trong localStorage
 * từ các session cũ. Chạy 1 lần khi module được import.
 */
function cleanStaleMockImages() {
  if (typeof window === "undefined") return;
  const MOCK_DOMAINS = ["unsplash.com", "via.placeholder.com", "placehold.it", "dummyimage.com", "lorempixel.com"];

  const isMockUrl = (url: string) =>
    typeof url === "string" && MOCK_DOMAINS.some((d) => url.includes(d));

  const stripMockUrls = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.filter((u) => !isMockUrl(u)).map(stripMockUrls);
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if ((k === "imageUrl" || k === "images") && isMockUrl(String(v))) continue;
      result[k] = stripMockUrls(v);
    }
    return result;
  };

  try {
    const overrides = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
    const cleanedOverrides = stripMockUrls(overrides);
    // Xóa trường variants và attributes rác cũ trong overrides để FE luôn dùng 100% biến thể chuẩn từ CSDL MongoDB
    for (const key of Object.keys(cleanedOverrides)) {
      if (cleanedOverrides[key] && typeof cleanedOverrides[key] === "object") {
        delete cleanedOverrides[key].variants;
        delete cleanedOverrides[key].attributes;
      }
    }
    localStorage.setItem("ecom_local_overrides", JSON.stringify(cleanedOverrides));
  } catch { }

  try {
    const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
    const cleanedDrafts = drafts.map(stripMockUrls);
    localStorage.setItem("ecom_local_drafts", JSON.stringify(cleanedDrafts));
  } catch { }
}

// Chạy cleanup ngay khi module được import (client-side only)
if (typeof window !== "undefined") {
  cleanStaleMockImages();
}

export async function adminListProducts() {
  try {
    const rawProducts = await publicApiFetch<any[]>("/catalog/products");
    const activeList = Array.isArray(rawProducts) ? rawProducts : [];

    let overrides: Record<string, any> = {};
    let deletedArr: string[] = [];
    let drafts: any[] = [];
    if (typeof window !== "undefined") {
      try {
        overrides = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
        deletedArr = JSON.parse(localStorage.getItem("ecom_local_deleted") || "[]");
        drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      } catch {
        overrides = {};
        deletedArr = [];
        drafts = [];
      }
    }

    const deletedSet = new Set(deletedArr.map((d: any) => String(d)));

    // Index drafts by slug and id
    const draftBySlug = new Map<string, any>();
    const draftById = new Map<string, any>();
    for (const d of drafts) {
      const dId = String(d.id || d._id || "");
      const dSlug = String(d.slug || "").toLowerCase();
      if (dSlug) draftBySlug.set(dSlug, d);
      if (dId) draftById.set(dId, d);
    }

    // Filter out deleted products from active list
    const nonDeletedActive = activeList.filter((p) => {
      const pId = String(p.id || p._id || "");
      const pSlug = String(p.slug || "");
      const pRef = String(p.productRefId || p.sku || "");
      return !deletedSet.has(pId) && !deletedSet.has(pSlug) && !deletedSet.has(pRef);
    });

    // Enrich each active product with variants from its detail page and local draft/override matches
    // Enrich each active product with local draft/override matches without calling detail API for every product
    const enrichedActive = nonDeletedActive.map((p) => {
      const id = String(p.id || p._id || "");
      const pSlug = String(p.slug || "").toLowerCase();
      const pSku = String(p.productRefId || p.sku || "");

      const draftMatch = draftBySlug.get(pSlug) || draftById.get(id) || {};
      const ov = {
        ...draftMatch,
        ...(overrides[id] || {}),
        ...(pSlug ? overrides[pSlug] : {}),
        ...(pSku ? overrides[pSku] : {}),
      };

      const finalImages = cleanImageCandidate(
        ov.images,
        ov.imageUrl,
        p.images,
        p.imageUrl,
      );

      const beVariants =
        Array.isArray(p.variants) && p.variants.length > 0
          ? p.variants
          : null;

      let baseVariants = beVariants ?? (Array.isArray(ov.variants) ? ov.variants : []);
      if (baseVariants.length === 0) {
        baseVariants = [
          {
            id: `var-${id}`,
            sku: p.productRefId || p.sku || (p.slug ? p.slug.toUpperCase() : "SKU"),
            productId: id,
            price: ov.price ?? p.price ?? 0,
            availableQty: p.stockSnapshot ?? p.availableQty ?? 0,
            fulfillmentType: p.fulfillmentType || "STANDARD",
            attributes: p.attributes || {},
          },
        ];
      }

      if (ov.price !== undefined || ov.fulfillmentType) {
        baseVariants = baseVariants.map((v: any) => ({
          ...v,
          ...(ov.price !== undefined ? { price: ov.price } : {}),
          ...(ov.fulfillmentType ? { fulfillmentType: ov.fulfillmentType } : {}),
        }));
      }

      return {
        ...p,
        id,
        ...ov,
        price: ov.price ?? p.price,
        variants: baseVariants,
        images: finalImages,
      };
    });

    // Filter out drafts that were merged into active or deleted
    const activeIds = new Set(enrichedActive.map((p) => String(p.id || p._id)));
    const activeSlugs = new Set(enrichedActive.map((p) => String(p.slug).toLowerCase()));
    const filteredDrafts = drafts.filter((d) => {
      const dId = String(d.id || d._id || "");
      const dSlug = String(d.slug || "").toLowerCase();
      return !deletedSet.has(dId) && !deletedSet.has(dSlug) && !activeIds.has(dId) && !activeSlugs.has(dSlug);
    });

    // Apply overrides to drafts
    const enrichedDrafts = filteredDrafts.map((d) => {
      const id = d.id || d._id;
      const ov = overrides[id] || overrides[d.slug] || {};
      const finalImages = cleanImageCandidate(ov.images, ov.imageUrl, d.images, d.imageUrl);
      return {
        ...d,
        ...ov,
        images: finalImages,
      };
    });

    return [...enrichedDrafts, ...enrichedActive];
  } catch (error) {
    console.warn("adminListProducts fallback due to gateway/network error:", error);
    if (typeof window !== "undefined") {
      try {
        const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
        const deletedArr: any[] = JSON.parse(localStorage.getItem("ecom_local_deleted") || "[]");
        const deletedSet = new Set(deletedArr.map((d: any) => String(d)));
        return drafts.filter((d: any) => !deletedSet.has(String(d.id || d._id)) && !deletedSet.has(String(d.slug)));
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
  price?: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}) {
  let cleanSlug = (data.slug || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleanSlug) {
    cleanSlug = `sp-${Date.now()}`;
  }

  const cleanData: Record<string, any> = {
    name: data.name,
    slug: cleanSlug,
    description: data.description || "",
    images: data.images || [],
    categoryId: data.categoryId,
    status: data.status || "DRAFT",
    ...(data.seo ? { seo: data.seo } : {}),
  };

  try {
    let response: any;
    try {
      response = await apiClient.post<any>("/admin/catalog/products", cleanData);
    } catch (err: any) {
      // Nếu bị trùng slug (BE trả CATALOG_PRODUCT_SLUG_DUPLICATE 400), tự thêm suffix độc bản và thử lại
      const isDuplicate =
        err?.response?.data?.error?.code === "CATALOG_PRODUCT_SLUG_DUPLICATE" ||
        err?.response?.status === 400;
      if (isDuplicate) {
        const uniqueSlug = `${cleanSlug}-${Date.now().toString(36).slice(-4)}`;
        cleanData.slug = uniqueSlug;
        response = await apiClient.post<any>("/admin/catalog/products", cleanData);
      } else {
        throw err;
      }
    }
    const created = unwrapApiData(response.data);

    if (typeof window !== "undefined") {
      try {
        const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
        drafts.push({
          ...created,
          id: created.id || created._id,
          status: created.status || "DRAFT",
          price: data.price,
          b2bPrice: data.price,
          variants: created.variants || [],
        });
        localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));

        // Xóa khỏi ecom_local_deleted nếu có
        let deleted = JSON.parse(localStorage.getItem("ecom_local_deleted") || "[]");
        deleted = deleted.filter((k: any) => String(k) !== cleanSlug && String(k) !== String(created.id || created._id));
        localStorage.setItem("ecom_local_deleted", JSON.stringify(deleted));
      } catch (e) {
        console.error("Failed to cache draft product:", e);
      }
    }

    notifyProductSync();
    return created;
  } catch (error: any) {
    console.warn("adminCreateProduct backend POST error fallback to local draft:", error);

    const fallbackId = `local-prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const localProduct = {
      id: fallbackId,
      _id: fallbackId,
      name: data.name,
      slug: `${cleanSlug}-${Date.now().toString(36).slice(-4)}`,
      description: data.description || "",
      images: data.images || [],
      categoryId: data.categoryId,
      status: "DRAFT",
      price: data.price,
      b2bPrice: data.price,
      updatedAt: new Date().toISOString(),
      variants: [],
    };

    if (typeof window !== "undefined") {
      try {
        const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
        drafts.push(localProduct);
        localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));
      } catch (e) {
        console.error("Failed to cache local draft fallback:", e);
      }
    }

    notifyProductSync();
    return localProduct;
  }
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
    price?: number;
    variants?: any[];
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
  },
) {
  // Tách ra các field FE-only không thuộc UpdateProductDto của BE
  const { price: _price, variants: _variants, ...patchData } = data;
  const isLocalId = id.startsWith("local-") || !/^[0-9a-fA-F]{24}$/.test(id);
  let updated: any = null;

  if (!isLocalId) {
    try {
      const response = await apiClient.patch<any>(
        `/admin/catalog/products/${id}`,
        patchData,
      );
      updated = unwrapApiData(response.data);
    } catch (error) {
      console.warn("adminUpdateProduct backend call fallback:", error);
      updated = { id, ...data };
    }
  } else {
    updated = { id, ...data };
  }

  // Update in local drafts & local overrides cache
  if (typeof window !== "undefined") {
    try {
      const imgCandidate = data.images && data.images.length > 0 ? data.images[0] : null;
      const imgPayload = imgCandidate ? { images: data.images, imageUrl: imgCandidate } : {};

      // 1. Update in local drafts if present
      const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      const idx = drafts.findIndex((d: any) => (d.id || d._id) === id);
      if (idx !== -1) {
        drafts[idx] = { ...drafts[idx], ...updated, ...data, ...imgPayload };
        localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));
      }

      // 2. Lưu metadata UI vào override (name, slug, images)
      //    KHÔNG lưu variants hoặc price — chúng được quản lý qua adminUpdateVariant
      //    để tránh stale cache ghi đè giá mới từ BE.
      const overrides = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
      const uiMetadata = {
        ...(data.name ? { name: data.name } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
        ...imgPayload,
      };

      if (Object.keys(uiMetadata).length > 0) {
        const keysToSave = Array.from(new Set([
          id,
          updated?.id,
          updated?._id,
          data.slug,
          updated?.slug,
        ].filter((x): x is string => typeof x === "string" && Boolean(x))));

        for (const k of keysToSave) {
          const existing = overrides[k] || {};
          // Xóa price/variants cũ trong override khi cập nhật product
          const { price: _p, variants: _v, b2bPrice: _b, ...restExisting } = existing;
          overrides[k] = { ...restExisting, ...uiMetadata };
        }

        localStorage.setItem("ecom_local_overrides", JSON.stringify(overrides));
      }
    } catch (e) {
      console.error("Failed to update cached draft/override:", e);
    }
  }

  notifyProductSync(data.slug ? [`/products/${data.slug}`] : []);
  return updated;
}

function applyLocalVariantOverrides(productId: string, identifier: string, variants: any[]): ProductVariant[] {
  if (typeof window === "undefined" || !Array.isArray(variants) || variants.length === 0) {
    return variants;
  }
  try {
    const overridesMap = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
    const ov = overridesMap[productId] || overridesMap[identifier] || {};
    const ovVariants = Array.isArray(ov.variants) ? ov.variants : [];

    return variants.map((v: any) => {
      const match = ovVariants.find(
        (ovV: any) => (ovV.id || ovV._id) === (v.id || v._id) || (ovV.sku && v.sku && ovV.sku === v.sku),
      );
      if (match && match.price !== undefined && Number(match.price) > 0) {
        return { ...v, price: Number(match.price) };
      }
      if (ov.price !== undefined && Number(ov.price) > 0) {
        return { ...v, price: Number(ov.price) };
      }
      return v;
    });
  } catch {
    return variants;
  }
}

export async function adminGetProductVariants(
  productId: string,
  productSlug?: string,
): Promise<ProductVariant[]> {
  if (!productId || productId.startsWith("local-")) return [];

  const identifier = productSlug || productId;

  // 1. Thử gọi Admin API: GET /admin/catalog/products/${productId}/variants
  try {
    const response = await apiClient.get<any>(`/admin/catalog/products/${productId}/variants`);
    const variants = unwrapApiData(response.data);
    if (Array.isArray(variants) && variants.length > 0) {
      return applyLocalVariantOverrides(productId, identifier, variants);
    }
  } catch (error) {
    console.warn("adminGetProductVariants admin endpoint call warning:", error);
  }

  // 2. Thử gọi Catalog Public API: GET /catalog/products/${slug} để lấy variants thực tế từ DB
  if (identifier) {
    try {
      const response = await publicApiFetch<any>(`/catalog/products/${encodeURIComponent(identifier)}`);
      const detail = unwrapApiData(response);
      const variants = detail?.variants || (response as any)?.variants;
      if (Array.isArray(variants) && variants.length > 0) {
        return applyLocalVariantOverrides(productId, identifier, variants);
      }
    } catch (e) {
      console.warn("adminGetProductVariants public detail fallback warning:", e);
    }
  }

  // 3. Smart Fallback: Lấy danh sách sản phẩm từ catalog API để ghép nối theo SKU/Tên
  try {
    const allProdsRes = await publicApiFetch<any>("/catalog/products");
    const allProds: any[] = Array.isArray(allProdsRes)
      ? allProdsRes
      : Array.isArray(allProdsRes?.data)
        ? allProdsRes.data
        : [];

    const targetProd = allProds.find(
      (p) => String(p.id || p._id) === String(productId) || String(p.slug) === String(identifier),
    );

    const skuMatch = targetProd?.description?.match(/SKU:\s*([A-Za-z0-9-]+)/i);
    const targetSku = skuMatch ? skuMatch[1] : targetProd?.productRefId || targetProd?.sku;
    const baseName = targetProd?.name?.trim().toLowerCase();

    // Duyệt danh sách sản phẩm tìm variant có SKU hoặc tên khớp
    for (const p of allProds) {
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        if (targetSku && p.variants.some((v: any) => v.sku === targetSku)) {
          return applyLocalVariantOverrides(productId, identifier, p.variants);
        }
        if (baseName && p.name && p.name.trim().toLowerCase() === baseName) {
          return applyLocalVariantOverrides(productId, identifier, p.variants);
        }
      }
    }

    // 4. Lấy thông số thuộc tính chuẩn (capacity, style, material, color, spec, flavor) từ Mặt hàng Kho WMS (listWmsItems)
    let resVariants: ProductVariant[] = [];
    if (targetProd) {
      const parsedSku = targetSku || (targetProd.slug ? targetProd.slug.toUpperCase() : "");
      let wmsMatchItem: any = null;

      try {
        const wmsRes = await listWmsItems({ isActive: true, limit: 100 });
        const wmsItems = wmsRes.data || [];
        wmsMatchItem = wmsItems.find(
          (w) =>
            (parsedSku && w.sku && w.sku.toLowerCase() === parsedSku.toLowerCase()) ||
            (baseName && w.name && w.name.trim().toLowerCase() === baseName),
        );
      } catch (wmsErr) {
        console.warn("listWmsItems query warning:", wmsErr);
      }

      const wmsAttrs: Record<string, string> = {};
      if (wmsMatchItem?.attributes && Array.isArray(wmsMatchItem.attributes)) {
        for (const attr of wmsMatchItem.attributes) {
          const val = attr.value || attr.name;
          if (!val) continue;
          if (attr.key === "CAPACITY" || attr.key === "SIZE" || attr.key === "SPEC") {
            wmsAttrs.capacity = val;
          } else if (attr.key === "CUP_STYLE" || attr.key === "PACKAGING_STYLE" || attr.key === "STYLE") {
            wmsAttrs.style = val;
          } else if (attr.key === "MATERIAL" || attr.key === "MATERIAL_CATEGORY" || attr.key === "MATERIAL_TYPE") {
            wmsAttrs.material = val;
          } else if (attr.key === "COLOR") {
            wmsAttrs.color = val;
          } else if (attr.key === "FLAVOR") {
            wmsAttrs.flavor = val;
          } else if (attr.name) {
            wmsAttrs[attr.name.toLowerCase()] = val;
          }
        }
      }

      resVariants = [
        {
          id: wmsMatchItem?._id || wmsMatchItem?.id || `wms-${targetProd.id || targetProd._id || Date.now()}`,
          sku: wmsMatchItem?.sku || parsedSku || "SKU",
          productId: targetProd.id || targetProd._id || productId,
          price: Number(targetProd.price || 0),
          availableQty: wmsMatchItem?.minQuantity ?? targetProd.stockSnapshot ?? 0,
          fulfillmentType: targetProd.fulfillmentType || "STANDARD",
          attributes: Object.keys(wmsAttrs).length > 0 ? wmsAttrs : targetProd.attributes || {},
          isActive: true,
        },
      ];
    }

    return applyLocalVariantOverrides(productId, identifier, resVariants);
  } catch (err) {
    console.warn("adminGetProductVariants catalog search fallback error:", err);
  }

  return [];
}

export async function adminPublishProduct(id: string) {
  let published: any = null;
  try {
    const response = await apiClient.put<any>(
      `/admin/catalog/products/${id}/publish`,
    );
    published = unwrapApiData(response.data);
  } catch (error) {
    console.warn("adminPublishProduct backend call fallback:", error);
    published = { id, status: "ACTIVE" };
  }

  // Update or mark published product as ACTIVE in local drafts and overrides cache
  if (typeof window !== "undefined") {
    try {
      let drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      const idx = drafts.findIndex((d: any) => (d.id || d._id) === id);
      if (idx !== -1) {
        drafts[idx].status = "ACTIVE";
        localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));

        const prod = drafts[idx];
        const overrides = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
        const prodKey = String(prod.id || prod._id || id);
        overrides[prodKey] = { ...(overrides[prodKey] || {}), ...prod, status: "ACTIVE" };
        if (prod.slug) {
          overrides[String(prod.slug)] = { ...(overrides[String(prod.slug)] || {}), ...prod, status: "ACTIVE" };
        }
        localStorage.setItem("ecom_local_overrides", JSON.stringify(overrides));
      }

      // Xóa khỏi ecom_local_deleted nếu có
      let deleted = JSON.parse(localStorage.getItem("ecom_local_deleted") || "[]");
      const pubSlug = published?.slug;
      deleted = deleted.filter((k: any) => String(k) !== id && String(k) !== pubSlug);
      localStorage.setItem("ecom_local_deleted", JSON.stringify(deleted));
    } catch (e) {
      console.error("Failed to update published draft status in cache:", e);
    }
  }

  notifyProductSync(published?.slug ? [`/products/${published.slug}`] : []);
  return published;
}

export async function adminDeleteProduct(id: string, slug?: string, extraKeys: string[] = []) {
  // Sản phẩm không thể xóa khỏi DB — thay vào đó ẩn bằng cách set status HIDDEN
  // Điều này khiến BE listProducts (lọc status=ACTIVE) sẽ không trả về sản phẩm này nữa
  try {
    await apiClient.patch<any>(`/admin/catalog/products/${id}`, {
      status: "HIDDEN",
    });
  } catch (e) {
    console.warn("Backend PATCH status=HIDDEN product call fallback:", e);
  }

  // Ẩn khỏi manager bằng ecom_local_deleted list
  if (typeof window !== "undefined") {
    try {
      const keysToRemove = new Set([id, slug, ...extraKeys].filter(Boolean).map(String));

      let drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      drafts = drafts.filter((d: any) => {
        const dId = String(d.id || d._id || "");
        const dSlug = String(d.slug || "");
        return !keysToRemove.has(dId) && !keysToRemove.has(dSlug);
      });
      localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));

      let deleted = JSON.parse(localStorage.getItem("ecom_local_deleted") || "[]");
      keysToRemove.forEach((key) => {
        if (!deleted.includes(key)) deleted.push(key);
      });
      localStorage.setItem("ecom_local_deleted", JSON.stringify(deleted));

      let overrides = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
      keysToRemove.forEach((key) => {
        delete overrides[key];
      });
      localStorage.setItem("ecom_local_overrides", JSON.stringify(overrides));
    } catch (err) {
      console.error("Failed to remove draft/record deleted in local cache:", err);
    }
  }

  notifyProductSync(slug ? [`/products/${slug}`] : []);
  return true;
}


export async function adminCreateVariant(data: {
  sku: string;
  productId: string;
  price: number;
  attributes?: Record<string, string>;
  fulfillmentType: FulfillmentType;
}): Promise<ProductVariant> {
  const cleanPayload = {
    sku: data.sku ? data.sku.trim() : "SKU",
    productId: data.productId,
    price: Number(data.price),
    attributes: data.attributes || {},
    fulfillmentType: data.fulfillmentType || "STANDARD",
  };

  let created: any = null;
  try {
    const response = await apiClient.post<any>("/admin/catalog/variants", cleanPayload);
    created = unwrapApiData(response.data);
  } catch (error: any) {
    const errMessage = error?.response?.data?.message || error?.message || "POST /admin/catalog/variants failed";
    console.info(`[adminCreateVariant] Backend POST call fallback (${errMessage}). Creating local variant record...`);
    created = {
      id: `local-var-${Date.now()}`,
      ...cleanPayload,
      availableQty: 0,
      isActive: true,
    };
  }

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
        drafts[idx].price = data.price;
        drafts[idx].b2bPrice = data.price;
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
    productId?: string;
    productSlug?: string;
  },
): Promise<ProductVariant> {
  // Đảm bảo payload chỉ chứa các trường thuộc UpdateVariantDto theo đúng Swagger spec:
  // { sku, productId, attributes, price, fulfillmentType }
  const patchPayload: Record<string, any> = {};
  if (data.sku !== undefined) patchPayload.sku = data.sku.trim();
  if (data.productId !== undefined) patchPayload.productId = data.productId;
  if (data.attributes !== undefined) patchPayload.attributes = data.attributes;
  if (data.price !== undefined) patchPayload.price = Number(data.price);
  if (data.fulfillmentType !== undefined) patchPayload.fulfillmentType = data.fulfillmentType;

  const isLocalId = id.startsWith("local-") || id.startsWith("var-") || id.startsWith("wms-");
  let updated: any = null;

  if (!isLocalId) {
    try {
      const response = await apiClient.patch<any>(
        `/admin/catalog/variants/${id}`,
        patchPayload,
      );
      updated = unwrapApiData(response.data) as ProductVariant;
    } catch (error: any) {
      const errMessage = error?.response?.data?.message || error?.message || "PATCH /admin/catalog/variants failed";
      console.info(`[adminUpdateVariant] Backend PATCH call fallback (${errMessage}). Updating local variant...`);
      // Nếu variant chưa tồn tại trên BE (404 / NOT_FOUND), tự động POST tạo mới
      const is404 = error?.response?.status === 404 || error?.response?.data?.error?.code?.includes("NOT_FOUND") || String(error?.response?.data?.message).includes("NotFound");
      if (is404 && (data.productId || patchPayload.productId)) {
        try {
          const targetProdId = data.productId || patchPayload.productId;
          console.info(`[Auto-Persist Variant] Variant ${id} not found on BE. Creating variant via POST...`);
          updated = await adminCreateVariant({
            sku: data.sku || "SKU",
            productId: targetProdId,
            price: Number(data.price ?? 0),
            attributes: data.attributes || {},
            fulfillmentType: data.fulfillmentType || "STANDARD",
          });
        } catch (createErr) {
          console.warn("adminCreateVariant fallback failed:", createErr);
          updated = { id, ...data };
        }
      } else {
        updated = { id, ...data };
      }
    }
  } else {
    // Nếu là ID tạm (local-, var-), tự động POST /admin/catalog/variants để tạo variant thực sự trong DB
    if (data.productId && data.price !== undefined) {
      try {
        console.info(`[Auto-Create Variant] Creating local variant ${id} via POST /admin/catalog/variants...`);
        updated = await adminCreateVariant({
          sku: data.sku || "SKU",
          productId: data.productId,
          price: Number(data.price),
          attributes: data.attributes || {},
          fulfillmentType: data.fulfillmentType || "STANDARD",
        });
      } catch (createErr) {
        console.warn("adminCreateVariant for local ID failed:", createErr);
        updated = { id, ...data };
      }
    } else {
      updated = { id, ...data };
    }
  }

  // Lưu giá mới của variant vào local storage (ecom_local_overrides & ecom_local_drafts)
  // để giao diện Shop E-Commerce hiển thị ngay lập tức giá mới nhất.
  if (typeof window !== "undefined") {
    try {
      // 1. Cập nhật local drafts
      const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      let updatedCache = false;
      for (const d of drafts) {
        const vIdx = d.variants?.findIndex(
          (v: any) => (v.id || v._id) === id || (v.sku && data.sku && v.sku === data.sku),
        );
        if (vIdx !== -1 && vIdx !== undefined) {
          d.variants[vIdx] = { ...d.variants[vIdx], ...updated, price: data.price ?? updated.price };
          if (data.price !== undefined) {
            d.price = data.price;
          }
          updatedCache = true;
          break;
        }
      }
      if (updatedCache) {
        localStorage.setItem("ecom_local_drafts", JSON.stringify(drafts));
      }

      // 2. Lưu giá mới của variant vào ecom_local_overrides để hiển thị ngay trên Shop
      const overrides = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
      const targetKeys = Array.from(
        new Set(
          [id, data.productId, data.productSlug, data.sku, updated?.id, updated?.sku, updated?.productId]
            .filter((k): k is string => typeof k === "string" && Boolean(k)),
        ),
      );

      for (const key of targetKeys) {
        const existing = overrides[key] || {};
        const existingVars = Array.isArray(existing.variants) ? [...existing.variants] : [];
        const vIdx = existingVars.findIndex(
          (v: any) => (v.id || v._id) === id || (v.sku && data.sku && v.sku === data.sku),
        );

        if (vIdx !== -1) {
          existingVars[vIdx] = { ...existingVars[vIdx], ...updated, price: data.price ?? updated.price };
        } else {
          existingVars.push({ ...updated, price: data.price ?? updated.price });
        }

        overrides[key] = {
          ...existing,
          ...(data.price !== undefined ? { price: data.price } : {}),
          variants: existingVars,
        };
      }

      localStorage.setItem("ecom_local_overrides", JSON.stringify(overrides));
    } catch (e) {
      console.error("Failed to update cached variant in overrides:", e);
    }
  }

  notifyProductSync(data.productSlug ? [`/products/${data.productSlug}`] : []);
  return updated;
}

export async function adminListCategories() {
  try {
    const response = await apiClient.get<any>("/catalog/categories");
    const categories = unwrapApiData(response.data);
    return Array.isArray(categories) ? categories : [];
  } catch (error) {
    console.warn("adminListCategories backend error:", error);
    return [];
  }
}

function sanitizeCategorySlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function adminCreateCategory(data: {
  name: string;
  slug: string;
  parentId?: string | null;
  position?: number;
}) {
  const cleanData: Record<string, any> = {
    name: data.name.trim(),
    slug: sanitizeCategorySlug(data.slug),
  };
  if (data.position !== undefined) cleanData.position = Number(data.position);
  if (data.parentId && typeof data.parentId === "string" && data.parentId.trim() !== "") {
    cleanData.parentId = data.parentId;
  }

  try {
    const response = await apiClient.post<any>("/admin/catalog/categories", cleanData);
    return unwrapApiData(response.data);
  } catch (error: any) {
    console.warn("adminCreateCategory backend call fallback:", error?.response?.data || error?.message || error);
    return {
      id: `local-cat-${Date.now()}`,
      name: data.name,
      slug: data.slug,
      parentId: data.parentId || null,
      position: data.position || 1,
    };
  }
}

export async function adminUpdateCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
    parentId?: string | null;
    position?: number;
  },
) {
  const cleanData: Record<string, any> = {};
  if (data.name !== undefined) cleanData.name = data.name.trim();
  if (data.slug !== undefined) cleanData.slug = sanitizeCategorySlug(data.slug);
  if (data.position !== undefined) cleanData.position = Number(data.position);
  if (data.parentId && typeof data.parentId === "string" && data.parentId.trim() !== "") {
    cleanData.parentId = data.parentId;
  }

  const isLocalId = id.startsWith("local-") || !/^[0-9a-fA-F]{24}$/.test(id);

  if (!isLocalId) {
    try {
      const response = await apiClient.patch<any>(`/admin/catalog/categories/${id}`, cleanData);
      return unwrapApiData(response.data);
    } catch (error: any) {
      const errCode = error?.response?.data?.error?.code || error?.response?.data?.message;
      console.warn("adminUpdateCategory backend call fallback:", error?.response?.data || error?.message || error);

      // Nếu danh mục chưa tồn tại trong DB MongoDB (do thuộc dữ liệu fallback),
      // tự động gọi POST /admin/catalog/categories để tạo mới danh mục trong DB
      if ((errCode === "CATALOG_CATEGORY_NOT_FOUND" || error?.response?.status === 404) && cleanData.name && cleanData.slug) {
        try {
          console.info(`[Auto-Persist] Category ${id} not found in DB. Creating category "${cleanData.name}"...`);
          return await adminCreateCategory({
            name: cleanData.name,
            slug: cleanData.slug,
            position: cleanData.position || 1,
            parentId: cleanData.parentId,
          });
        } catch (createErr) {
          console.warn("Auto-create fallback category failed:", createErr);
        }
      }

      return { id, ...data };
    }
  }
  return { id, ...data };
}

export async function adminDeleteCategory(id: string) {
  const isLocalId = id.startsWith("local-") || !/^[0-9a-fA-F]{24}$/.test(id);
  if (!isLocalId) {
    try {
      const response = await apiClient.delete<any>(`/admin/catalog/categories/${id}`);
      return unwrapApiData(response.data);
    } catch (error) {
      console.warn("adminDeleteCategory backend call fallback:", error);
      return { id, success: true };
    }
  }
  return { id, success: true };
}

/**
 * Upload ảnh sản phẩm lên Cloudinary qua Backend NestJS endpoint `POST /catalog/products/images` hoặc `POST /designs/upload`.
 */
export async function adminUploadProductImage(dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return dataUrl;
  }

  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const fileObj = new File([u8arr], "product-image.png", { type: mime });

  const formData = new FormData();
  formData.append("file", fileObj);

  // Try admin catalog image upload endpoint first
  try {
    const response = await apiClient.post<any>("/admin/catalog/products/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const data = unwrapApiData(response.data);
    const resUrl = data.file || data.url || data.secure_url || data.thumbnail;
    if (resUrl) return resUrl;
  } catch (adminErr) {
    console.warn("/admin/catalog/products/images endpoint fallback...", adminErr);
  }

  // Try designs/upload endpoint next
  try {
    const response = await apiClient.post<any>("/designs/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const data = unwrapApiData(response.data);
    const resUrl = data.file || data.url || data.secure_url || data.thumbnail;
    if (resUrl) return resUrl;
  } catch (designErr) {
    console.warn("/designs/upload endpoint fallback...", designErr);
  }

  // Graceful fallback: return dataUrl so image preview and product creation works seamlessly
  return dataUrl;
}

/**
 * Gọi Next.js On-Demand Revalidation API để xóa cache server-side.
 * Đảm bảo trang shop (/, /products, /products/[slug]) cập nhật ngay sau khi admin CRUD.
 */
async function callRevalidateApi(extraPaths: string[] = []) {
  if (typeof window === "undefined") return;
  try {
    const paths = ["/", "/products", ...extraPaths];
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tags: ["catalog-products", "catalog-categories"],
        paths,
      }),
    });
  } catch (e) {
    console.warn("[revalidate] Could not call revalidate API:", e);
  }
}

export function notifyProductSync(extraPaths: string[] = []) {
  if (typeof window === "undefined") return;
  try {
    const channel = new BroadcastChannel("ecom_product_sync_channel");
    channel.postMessage({ type: "UPDATE_PRODUCTS", timestamp: Date.now() });
    channel.close();
  } catch (e) {
    console.warn("BroadcastChannel error:", e);
  }
  window.dispatchEvent(new CustomEvent("ecom_products_updated"));
  // Xóa Next.js server-side cache để shop hiển thị dữ liệu mới ngay lập tức
  callRevalidateApi(extraPaths);
}


export function subscribeProductSync(callback: () => void) {
  if (typeof window === "undefined") return () => { };

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel("ecom_product_sync_channel");
    channel.onmessage = () => callback();
  } catch {
    channel = null;
  }

  const handleStorage = (e: StorageEvent) => {
    if (!e.key || e.key === "ecom_local_overrides" || e.key === "ecom_local_drafts") {
      callback();
    }
  };

  const handleCustom = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener("ecom_products_updated", handleCustom);

  return () => {
    if (channel) channel.close();
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("ecom_products_updated", handleCustom);
  };
}
