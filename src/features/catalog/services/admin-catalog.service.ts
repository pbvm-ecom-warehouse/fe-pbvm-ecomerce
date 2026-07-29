import { apiClient } from "@/lib/api-client";
import { publicApiFetch } from "@/lib/public-api";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import type { ProductVariant, FulfillmentType } from "@/types/api";

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

function sanitizeProductSlug(slug: string | undefined) {
  return (slug || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeProductList(payload: any): any[] {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export function isApprovedCatalogProduct(product: any): boolean {
  const status = String(product?.status || "").toUpperCase();
  if (status && status !== "ACTIVE") return false;
  if (product?.isActive === false) return false;
  return status === "ACTIVE" || product?.isActive === true;
}

export async function adminListProducts() {
  try {
    const rawProducts = await publicApiFetch<any>("/catalog/products");
    const activeList = normalizeProductList(rawProducts);
    return activeList.map((p) => {
      const id = String(p.id || p._id || "");
      const finalImages = cleanImageCandidate(
        p.images,
        p.imageUrl,
      );

      return {
        ...p,
        id,
        variants: Array.isArray(p.variants) ? p.variants : [],
        images: finalImages,
      };
    });
  } catch (error) {
    console.warn("adminListProducts backend error:", error);
    return [];
  }
}

export async function adminListInactiveProducts() {
  const isInactiveProduct = (product: any) =>
    product?.isActive === false ||
    product?.status === "DRAFT" ||
    product?.status === "INACTIVE";

  try {
    const rawProducts = await publicApiFetch<any>("/catalog/products");
    const list = normalizeProductList(rawProducts);
    return list.filter(isInactiveProduct);
  } catch (error) {
    console.warn("adminListInactiveProducts public endpoint error:", error);
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
  const cleanSlug = sanitizeProductSlug(data.slug) || `sp-${Date.now()}`;
  const cleanData: Record<string, any> = {
    name: data.name,
    slug: cleanSlug,
    description: data.description || "",
    images: data.images || [],
    categoryId: data.categoryId,
    status: data.status || "DRAFT",
    ...(data.seo ? { seo: data.seo } : {}),
  };

  const response = await apiClient.post<any>("/admin/catalog/products", cleanData);
  const created = unwrapApiData(response.data);
  notifyProductSync();
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
    price?: number;
    variants?: any[];
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
  },
) {
  const { price: _price, variants: _variants, ...patchData } = data;
  if (patchData.slug !== undefined) {
    patchData.slug = sanitizeProductSlug(patchData.slug);
  }

  const response = await apiClient.patch<any>(`/admin/catalog/products/${id}`, patchData);
  const updated = unwrapApiData(response.data);
  notifyProductSync(data.slug ? [`/products/${data.slug}`] : []);
  return updated;
}

export async function adminGetProductVariants(
  productId: string,
  _productSlug?: string,
): Promise<ProductVariant[]> {
  if (!productId) return [];

  try {
    const response = await apiClient.get<any>(`/admin/catalog/products/${productId}/variants`);
    const variants = unwrapApiData(response.data);
    return Array.isArray(variants) ? variants : [];
  } catch (error) {
    console.warn("adminGetProductVariants backend error:", error);
    return [];
  }
}

export async function adminPublishProduct(id: string) {
  const response = await apiClient.put<any>(`/admin/catalog/products/${id}/publish`);
  const published = unwrapApiData(response.data);
  notifyProductSync(published?.slug ? [`/products/${published.slug}`] : []);
  return published;
}

function getVariantId(variant: any): string {
  return String(variant?.id || variant?._id || "");
}

function looksLikeObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

export async function adminActivateProductVariants(id: string): Promise<ProductVariant[]> {
  const variants = await adminGetProductVariants(id);
  const inactiveVariantIds = variants
    .filter((variant: any) => variant?.isActive !== true)
    .map(getVariantId)
    .filter(Boolean);

  if (inactiveVariantIds.length === 0) {
    return variants;
  }

  await Promise.all(
    inactiveVariantIds.map((variantId) => adminActivateVariant(variantId)),
  );

  return adminGetProductVariants(id);
}

export async function adminPublishProductWithVariants(id: string) {
  const published = await adminPublishProduct(id);
  const variants = await adminActivateProductVariants(id);

  return {
    product: published,
    variants,
  };
}
export async function adminDeleteProduct(id: string, slug?: string, extraKeys: string[] = []) {
  await apiClient.patch<any>(`/admin/catalog/products/${id}`, {
    status: "HIDDEN",
  });
  notifyProductSync(slug ? [`/products/${slug}`] : []);
  return true;
}
export async function adminCreateVariant(data: {
  sku: string;
  productId: string;
  price: number;
  attributes?: Record<string, string>;
  fulfillmentType: FulfillmentType;
  image?: string | null;
}): Promise<ProductVariant> {
  const cleanPayload = {
    sku: data.sku ? data.sku.trim() : "SKU",
    productId: data.productId,
    price: Number(data.price),
    attributes: data.attributes || {},
    fulfillmentType: data.fulfillmentType || "STANDARD",
    ...(data.image ? { image: data.image } : {}),
  };
  const response = await apiClient.post<any>("/admin/catalog/variants", cleanPayload);
  const created = unwrapApiData(response.data) as ProductVariant;
  notifyProductSync();
  return created;
}
export async function adminUpdateVariant(
  id: string,
  data: {
    sku?: string;
    productId?: string;
    attributes?: Record<string, string>;
    price?: number;
    fulfillmentType?: FulfillmentType;
    isActive?: boolean;
    image?: string | null;
    productSlug?: string;
  },
): Promise<ProductVariant> {
  const patchPayload: Record<string, any> = {};
  if (data.sku !== undefined) patchPayload.sku = data.sku.trim();
  if (data.productId !== undefined && looksLikeObjectId(data.productId)) {
    patchPayload.productId = data.productId;
  }
  if (data.attributes !== undefined) patchPayload.attributes = data.attributes;
  if (data.price !== undefined) patchPayload.price = Number(data.price);
  if (data.fulfillmentType !== undefined) patchPayload.fulfillmentType = data.fulfillmentType;
  if (data.isActive !== undefined) patchPayload.isActive = data.isActive;
  if (data.image !== undefined) patchPayload.image = data.image;

  const response = await apiClient.patch<any>(`/admin/catalog/variants/${id}`, patchPayload);
  const updated = unwrapApiData(response.data) as ProductVariant;
  notifyProductSync(data.productSlug ? [`/products/${data.productSlug}`] : []);
  return updated;
}
export async function adminListInactiveVariants(): Promise<ProductVariant[]> {
  const response = await apiClient.get<ApiEnvelope<ProductVariant[]> | ProductVariant[]>(
    "/admin/catalog/variants/inactive",
  );
  const variants = unwrapApiData(response.data);
  return Array.isArray(variants) ? variants : [];
}

export async function adminActivateVariant(id: string): Promise<ProductVariant> {
  const response = await apiClient.patch<ApiEnvelope<ProductVariant> | ProductVariant>(
    `/admin/catalog/variants/${id}/activate`,
  );
  return unwrapApiData(response.data) as ProductVariant;
}

export async function adminListCategories(_includeHidden: boolean = false) {
  const response = await apiClient.get<any>("/catalog/categories");
  const rawCategories = unwrapApiData(response.data);
  return Array.isArray(rawCategories) ? rawCategories : [];
}

export async function adminListHiddenCategories() {
  const response = await apiClient.get<any>("/admin/catalog/categories/deleted");
  const categories = unwrapApiData(response.data);
  return Array.isArray(categories) ? categories : [];
}

export async function adminRestoreCategory(
  id: string,
  _catSlug?: string,
  _allProducts: any[] = [],
) {
  const response = await apiClient.patch<any>(
    `/admin/catalog/categories/${id}/restore`,
  );
  notifyProductSync();
  return unwrapApiData(response.data) || { id, success: true };
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
  const response = await apiClient.post<any>("/admin/catalog/categories", cleanData);
  const created = unwrapApiData(response.data);
  notifyProductSync([`/products?category=${created?.slug || cleanData.slug}`]);
  return created;
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

  const response = await apiClient.patch<any>(`/admin/catalog/categories/${id}`, cleanData);
  const updated = unwrapApiData(response.data);
  notifyProductSync(updated?.slug || cleanData.slug ? [`/products?category=${updated?.slug || cleanData.slug}`] : []);
  return updated;
}
export async function adminDeleteCategory(
  id: string,
  _currentProducts: any[] = [],
  catSlug?: string,
) {
  await apiClient.patch<any>(`/admin/catalog/categories/${id}/soft-delete`);
  notifyProductSync(catSlug ? [`/products?category=${catSlug}`] : []);
  return { id, success: true, hiddenProductCount: 0 };
}
/**
 * Upload ảnh sản phẩm lên Cloudinary qua Backend NestJS endpoint `POST /catalog/products/images` hoặc `POST /designs/upload`.
 */
export async function adminUploadProductImage(imageSource: string): Promise<string> {
  if (!imageSource || !imageSource.startsWith("data:")) {
    return imageSource;
  }

  const arr = imageSource.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const fileObj = new File([u8arr], "product-image.png", { type: mime });

  // ── Validate trước khi gửi lên BE ────────────────────────────────────────
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!ALLOWED_MIME_TYPES.includes(fileObj.type)) {
    throw new Error(
      `Định dạng ảnh không hỗ trợ: ${fileObj.type}. Chỉ chấp nhận JPEG, PNG, WEBP, GIF.`,
    );
  }

  if (fileObj.size > MAX_SIZE_BYTES) {
    const sizeMB = (fileObj.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `Ảnh quá lớn (${sizeMB}MB). Vui lòng chọn ảnh nhỏ hơn ${MAX_SIZE_MB}MB.`,
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  const formData = new FormData();
  formData.append("file", fileObj);

  const response = await apiClient.post<any>("/admin/catalog/products/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const data = unwrapApiData(response.data);
  const resUrl = data.file || data.url || data.secure_url || data.thumbnail;
  if (!resUrl) {
    throw new Error("Product image upload response is missing image URL.");
  }
  return resUrl;
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

  const handleCustom = () => callback();

  window.addEventListener("ecom_products_updated", handleCustom);

  return () => {
    if (channel) channel.close();
    window.removeEventListener("ecom_products_updated", handleCustom);
  };
}
