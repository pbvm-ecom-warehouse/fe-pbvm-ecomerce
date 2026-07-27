import { publicApiFetch } from "@/lib/public-api";
import { apiClient } from "@/lib/api-client";
import type { ApiListResponse, CatalogProduct, ProductVariant } from "@/types/api";

export const fallbackCatalogProducts: CatalogProduct[] = [];

// Map category ObjectId to slug string used in FE
const CATEGORY_MAP: Record<string, CatalogProduct["category"]> = {
  "685ba0cb233b28b7fa99c262": "ingredient",
  "685ba0cb233b28b7fa99c263": "plain_cup",
  "685ba0cb233b28b7fa99c264": "printed_cup",
};

const UNIT_MAP: Record<CatalogProduct["category"], string> = {
  ingredient: "bao",
  plain_cup: "thùng",
  printed_cup: "thùng",
  custom_print: "cái",
};

function getValidImageUrl(img: string | undefined): string {
  if (!img) return "/images/product-placeholder.svg";
  const lowercase = img.toLowerCase().trim();
  if (
    lowercase === "string" ||
    lowercase === "undefined" ||
    lowercase === "null" ||
    lowercase === ""
  ) {
    return "/images/product-placeholder.svg";
  }
  if (
    img.startsWith("http://") ||
    img.startsWith("https://") ||
    img.startsWith("/") ||
    img.startsWith("data:")
  ) {
    return img;
  }
  return "/images/product-placeholder.svg";
}

export function cleanProductName(name: string | undefined, sku?: string): string {
  const target = (name || sku || "").trim();
  if (!target) return "Sản phẩm E-Commerce";

  // Check if target is a raw SKU (e.g. no spaces, uppercase with hyphens/numbers like CUP-HRT-GN-500-CLR)
  const isRawSku = !target.includes(" ") && (/^[A-Z0-9_-]+$/i.test(target) || target.includes("-"));

  if (!isRawSku && target !== sku) {
    return target;
  }

  // Parse SKU code to build readable name
  const upper = target.toUpperCase();

  if (upper.includes("CUP-HRT") || upper.includes("CUP_HRT") || upper.includes("HRT")) {
    const sizeMatch = upper.match(/(\d{3,4})/);
    const size = sizeMatch ? `${sizeMatch[1]}ml` : "500ml";
    return `Ly Nhựa Nắp Tim ${size} (Cao cấp)`;
  }

  if (upper.includes("CUP-PET") || upper.includes("PET")) {
    const sizeMatch = upper.match(/(\d{3,4})/);
    const size = sizeMatch ? `${sizeMatch[1]}ml` : "";
    return `Ly Nhựa PET Trong Suốt ${size}`.trim();
  }

  if (upper.includes("CUP-PP") || upper.includes("PP")) {
    const sizeMatch = upper.match(/(\d{3,4})/);
    const size = sizeMatch ? `${sizeMatch[1]}ml` : "";
    return `Ly Nhựa PP Ép Màng ${size}`.trim();
  }

  if (upper.includes("CUP") || upper.includes("LY")) {
    const sizeMatch = upper.match(/(\d{3,4})/);
    const size = sizeMatch ? `${sizeMatch[1]}ml` : "";
    return `Ly Nhựa In Thương Hiệu ${size}`.trim();
  }

  if (upper.includes("ING") || upper.includes("BAO")) {
    return `Bao Bì & Nguyên Liệu Pha Chế`;
  }

  // Fallback: replace hyphens/underscores with spaces and capitalize
  return target
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Map một product detail (từ /catalog/products/:slug có variants)
 * thành CatalogProduct dùng ở FE.
 */
/**
 * Map một product detail (từ /catalog/products/:slug có variants)
 * thành CatalogProduct dùng ở FE.
 */
export function mapProductDetail(p: any): CatalogProduct {
  let ov: any = {};
  if (typeof window !== "undefined") {
    try {
      const overridesMap = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
      ov = overridesMap[p.id || p._id] || overridesMap[p.slug] || {};
    } catch {
      ov = {};
    }
  }

  const mergedP = { ...ov, ...p };

  // Đọc danh sách variants gốc từ BE hoặc override
  const baseVariants: any[] =
    Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants
      : (Array.isArray(ov.variants) && ov.variants.length > 0 ? ov.variants : []);

  // Áp dụng giá đã cập nhật từ Admin (nếu có trong overrides)
  const rawVariants = baseVariants.map((v: any) => {
    let overridePrice = v.price;
    if (ov.variants && Array.isArray(ov.variants)) {
      const matchOv = ov.variants.find(
        (ovV: any) => (ovV.id || ovV._id) === (v.id || v._id) || (ovV.sku && v.sku && ovV.sku === v.sku),
      );
      if (matchOv && matchOv.price !== undefined && Number(matchOv.price) > 0) {
        overridePrice = Number(matchOv.price);
      }
    }
    if (ov.price !== undefined && Number(ov.price) > 0 && (!overridePrice || overridePrice <= 0)) {
      overridePrice = Number(ov.price);
    }
    return {
      ...v,
      price: overridePrice,
    };
  });

  const activeVariant = rawVariants.find((v) => v.isActive !== false) ?? rawVariants[0];

  const validVariantPrices = rawVariants
    .map((v) => Number(v.price))
    .filter((pr) => !isNaN(pr) && pr > 0);

  const minVariantPrice = validVariantPrices.length > 0
    ? Math.min(...validVariantPrices)
    : (ov.price ?? p.price ?? activeVariant?.price ?? 0);

  const price = minVariantPrice;

  const rawCatId = mergedP.categoryId || p.categoryId || (typeof mergedP.category === "object" ? mergedP.category?.id || mergedP.category?._id : mergedP.category);
  const rawCatSlug = typeof mergedP.category === "object" ? mergedP.category?.slug : (typeof mergedP.category === "string" ? mergedP.category : null);
  const rawCatName = typeof mergedP.category === "object" ? mergedP.category?.name : null;

  const mappedCategorySlug = rawCatSlug || CATEGORY_MAP[rawCatId] || rawCatId || "ingredient";

  let mappedVariants: ProductVariant[] = rawVariants.map((v: any) => ({
    id: v.id ?? v._id,
    sku: v.sku ?? mergedP.slug.toUpperCase(),
    productId: v.productId ?? mergedP.id ?? mergedP._id,
    attributes: v.attributes ?? {},
    price: v.price ?? price,
    availableQty: v.availableQty ?? v.stockSnapshot ?? 0,
    fulfillmentType: v.fulfillmentType ?? "STANDARD",
    isActive: v.isActive !== false,
  }));

  if (mappedVariants.length === 0) {
    mappedVariants = [
      {
        id: `var-${mergedP.id ?? mergedP._id ?? Date.now()}`,
        sku: mergedP.productRefId ?? mergedP.sku ?? (mergedP.slug ? mergedP.slug.toUpperCase() : "SKU"),
        productId: mergedP.id ?? mergedP._id,
        attributes: mergedP.attributes || {},
        price: price > 0 ? price : (mergedP.price || 0),
        availableQty: mergedP.stockSnapshot ?? 0,
        fulfillmentType: mergedP.fulfillmentType ?? "STANDARD",
        isActive: true,
      },
    ];
  }

  const rawCandidates = [
    ...(mergedP.images || []),
    mergedP.imageUrl,
    ...(p.images || []),
    p.imageUrl,
  ].filter((url): url is string => typeof url === "string" && Boolean(url.trim()));

  const imageCandidates = Array.from(new Set(rawCandidates));

  const activeAttributes = activeVariant?.attributes || mergedP.attributes || {};

  return {
    id: mergedP.id ?? mergedP._id,
    productRefId: activeVariant?.sku ?? mergedP.slug.toUpperCase(),
    slug: mergedP.slug,
    name: cleanProductName(mergedP.name, activeVariant?.sku ?? mergedP.productRefId),
    description: mergedP.description || "",
    category: mappedCategorySlug,
    categoryId: rawCatId,
    categoryObj: typeof mergedP.category === "object" ? mergedP.category : undefined,
    categoryName: rawCatName,
    fulfillmentType: mergedP.fulfillmentType ?? activeVariant?.fulfillmentType ?? "STANDARD",
    price,
    b2bPrice: price,
    unit: UNIT_MAP[mappedCategorySlug as keyof typeof UNIT_MAP] ?? "cái",
    stockSnapshot: mappedVariants.reduce((sum: number, v: ProductVariant) => sum + (v.availableQty ?? 0), 0),
    imageUrl: getValidImageUrl(imageCandidates[0]),
    images: imageCandidates,
    updatedAt: mergedP.updatedAt ?? new Date().toISOString(),
    variants: mappedVariants,
    attributes: activeAttributes,
    capacity: activeAttributes.capacity || activeAttributes.size || activeAttributes.spec || "",
    material: activeAttributes.material || "",
    style: activeAttributes.style || "",
    color: activeAttributes.color || "",
  } as any;
}

/**
 * Map một product từ list API (nếu có variants thì lấy giá variant thấp nhất).
 */
function mapProductListItem(p: any): CatalogProduct {
  let ov: any = {};
  if (typeof window !== "undefined") {
    try {
      const overridesMap = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
      ov = overridesMap[p.id || p._id] || overridesMap[p.slug] || {};
    } catch {
      ov = {};
    }
  }

  const mergedP = { ...ov, ...p };

  const baseVariants: any[] =
    Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants
      : (Array.isArray(ov.variants) && ov.variants.length > 0 ? ov.variants : []);

  // Áp dụng giá đã cập nhật từ Admin (nếu có trong overrides)
  const rawVariants = baseVariants.map((v: any) => {
    let overridePrice = v.price;
    if (ov.variants && Array.isArray(ov.variants)) {
      const matchOv = ov.variants.find(
        (ovV: any) => (ovV.id || ovV._id) === (v.id || v._id) || (ovV.sku && v.sku && ovV.sku === v.sku),
      );
      if (matchOv && matchOv.price !== undefined && Number(matchOv.price) > 0) {
        overridePrice = Number(matchOv.price);
      }
    }
    if (ov.price !== undefined && Number(ov.price) > 0 && (!overridePrice || overridePrice <= 0)) {
      overridePrice = Number(ov.price);
    }
    return {
      ...v,
      price: overridePrice,
    };
  });

  const validVariantPrices = rawVariants
    .map((v) => Number(v.price))
    .filter((pr) => !isNaN(pr) && pr > 0);

  const minVariantPrice = validVariantPrices.length > 0
    ? Math.min(...validVariantPrices)
    : (ov.price ?? p.price ?? 0);

  const price = minVariantPrice;

  const rawCatId = mergedP.categoryId || p.categoryId || (typeof mergedP.category === "object" ? mergedP.category?.id || mergedP.category?._id : mergedP.category);
  const rawCatSlug = typeof mergedP.category === "object" ? mergedP.category?.slug : (typeof mergedP.category === "string" ? mergedP.category : null);
  const rawCatName = typeof mergedP.category === "object" ? mergedP.category?.name : null;

  const mappedCategorySlug = rawCatSlug || CATEGORY_MAP[rawCatId] || rawCatId || "ingredient";

  let mappedVariants: ProductVariant[] = rawVariants.map((v: any) => ({
    id: v.id ?? v._id,
    sku: v.sku ?? mergedP.slug.toUpperCase(),
    productId: v.productId ?? mergedP.id ?? mergedP._id,
    attributes: v.attributes ?? {},
    price: v.price ?? price,
    availableQty: v.availableQty ?? v.stockSnapshot ?? 0,
    fulfillmentType: v.fulfillmentType ?? "STANDARD",
    isActive: v.isActive !== false,
  }));

  if (mappedVariants.length === 0) {
    mappedVariants = [
      {
        id: `var-${mergedP.id ?? mergedP._id ?? Date.now()}`,
        sku: mergedP.productRefId ?? mergedP.sku ?? (mergedP.slug ? mergedP.slug.toUpperCase() : "SKU"),
        productId: mergedP.id ?? mergedP._id,
        attributes: mergedP.attributes || {},
        price: price > 0 ? price : (mergedP.price || 0),
        availableQty: mergedP.stockSnapshot ?? 0,
        fulfillmentType: mergedP.fulfillmentType ?? "STANDARD",
        isActive: true,
      },
    ];
  }

  const rawCandidates = [
    ...(mergedP.images || []),
    mergedP.imageUrl,
    ...(p.images || []),
    p.imageUrl,
  ].filter((url): url is string => typeof url === "string" && Boolean(url.trim()));

  const imageCandidates = Array.from(new Set(rawCandidates));

  return {
    id: mergedP.id ?? mergedP._id,
    productRefId: mappedVariants[0]?.sku ?? mergedP.slug.toUpperCase(),
    slug: mergedP.slug,
    name: cleanProductName(mergedP.name, mappedVariants[0]?.sku ?? mergedP.productRefId),
    category: mappedCategorySlug,
    categoryId: rawCatId,
    categoryObj: typeof mergedP.category === "object" ? mergedP.category : undefined,
    categoryName: rawCatName,
    fulfillmentType: mergedP.fulfillmentType ?? "STANDARD",
    price,
    b2bPrice: price,
    unit: UNIT_MAP[mappedCategorySlug as keyof typeof UNIT_MAP] ?? "cái",
    stockSnapshot: mappedVariants.length > 0
      ? mappedVariants.reduce((sum: number, v: ProductVariant) => sum + (v.availableQty ?? 0), 0)
      : (mergedP.stockSnapshot ?? 0),
    imageUrl: getValidImageUrl(imageCandidates[0]),
    updatedAt: mergedP.updatedAt ?? new Date().toISOString(),
    variants: mappedVariants,
  };
}

const emptyCatalogResponse: ApiListResponse<CatalogProduct> = {
  data: [],
  meta: { pagination: { page: 1, pageSize: 0, total: 0, totalPages: 0 } },
};

/**
 * Lấy danh sách sản phẩm từ BE. Vì list API không trả về variants/giá,
 * mình sẽ enrichment bằng cách gọi detail cho từng slug song song.
 * Nếu detail thất bại, dùng mapProductListItem.
 *
 * Lưu ý: không mời local drafts từ localStorage — hàm này chạy
 * server-side nên không có window. Shop chỉ hiển thị sản phẩm từ BE.
 */
export async function listCatalogProducts() {
  try {
    let rawProducts: any[] = [];
    try {
      rawProducts = (await publicApiFetch<any[]>("/catalog/products")) ?? [];
    } catch {
      rawProducts = [];
    }

    if (rawProducts.length === 0) {
      return emptyCatalogResponse;
    }

    const enriched = rawProducts.map((p) => {
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        return mapProductDetail(p);
      }
      return mapProductListItem(p);
    });

    return {
      data: enriched,
      meta: {
        pagination: {
          page: 1,
          pageSize: enriched.length,
          total: enriched.length,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("listCatalogProducts: BE error:", error);
    return emptyCatalogResponse;
  }
}

/**
 * Lấy chi tiết sản phẩm theo slug từ BE — có đầy đủ variants và giá.
 */
export async function getCatalogProductBySlug(slug: string) {
  const decodedSlug = decodeURIComponent(slug);
  const normalizedSlug = decodedSlug.trim();
  const hyphenatedSlug = normalizedSlug.toLowerCase().replace(/\s+/g, "-");

  const targetSlug = hyphenatedSlug || decodedSlug;
  try {
    const p = await publicApiFetch<any>(
      `/catalog/products/${encodeURIComponent(targetSlug)}`,
    );
    if (p) return mapProductDetail(p);
  } catch {
    if (decodedSlug !== targetSlug) {
      try {
        const p = await publicApiFetch<any>(
          `/catalog/products/${encodeURIComponent(decodedSlug)}`,
        );
        if (p) return mapProductDetail(p);
      } catch {}
    }
  }

  // Fallback check local drafts/overrides if backend detail is missing or stale
  if (typeof window !== "undefined") {
    try {
      const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
      const found = drafts.find(
        (d: any) =>
          d.slug === decodedSlug ||
          d.slug === hyphenatedSlug ||
          d.id === decodedSlug ||
          d._id === decodedSlug
      );
      if (found) return mapProductDetail(found);
    } catch (e) {
      console.error(e);
    }
  }

  return null;
}

/**
 * Gọi API lấy đúng các variant ly từ DB — không fallback, không fix cứng.
 * Flow:
 *  1. GET /catalog/products → danh sách sản phẩm
 *  2. Lọc sản phẩm ly (plain_cup / printed_cup / slug/name chứa "ly")
 *  3. Với mỗi sản phẩm ly → GET /catalog/products/:slug để lấy variants thực
 *  4. Parse từng variant: detect materialType / style / size từ attributes
 *     → Bỏ qua nếu không parse được (không tự đoán)
 */
export async function fetchInStockCupVariantsFromApi() {
  type ParsedVariant = {
    materialType: "clear" | "frosted" | "paper" | "glass";
    style: "straight" | "u_shape" | "heart" | "mug";
    size: "350ml" | "500ml" | "700ml" | "1000ml";
    availableQty: number;
    price?: number;
  };

  try {
    // ── BƯỚC 1: lấy danh sách sản phẩm từ DB ──
    let rawList: any[] = [];
    try {
      rawList = (await publicApiFetch<any[]>("/catalog/products")) ?? [];
    } catch {
      rawList = [];
    }

    // ── BƯỚC 2: lấy local drafts từ admin ──
    let drafts: any[] = [];
    if (typeof window !== "undefined") {
      try {
        drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") ?? "[]");
      } catch {
        drafts = [];
      }
    }

    // ── BƯỚC 3: gộp rồi lọc sản phẩm ly ──
    const allRaw = [...drafts, ...rawList];
    const cupRaw = allRaw.filter(
      (p: any) =>
        p.category === "plain_cup" ||
        p.category === "printed_cup" ||
        p.category === "custom_print" ||
        String(p.slug ?? "").toLowerCase().includes("ly") ||
        String(p.name ?? "").toLowerCase().includes("ly"),
    );

    if (cupRaw.length === 0) {
      console.warn("[Cup DB Inventory] Không tìm thấy sản phẩm ly nào trong DB.");
      return [];
    }

    // ── BƯỚC 4: lấy detail (có variants) cho từng sản phẩm ly ──
    const detailedProducts = await Promise.all(
      cupRaw.map(async (p: any) => {
        // draft đã có variants sẵn, không cần fetch lại
        if (Array.isArray(p.variants) && p.variants.length > 0) return p;
        if (!p.slug) return p;
        try {
          const detail = await publicApiFetch<any>(
            `/catalog/products/${encodeURIComponent(p.slug)}`,
          );
          return detail ?? p;
        } catch {
          return p;
        }
      }),
    );

    // ── BƯỚC 5: parse variants ──
    const result: ParsedVariant[] = [];

    function parseMaterial(text: string): "clear" | "frosted" | "paper" | "glass" | null {
      if (text.includes("pet") || text.includes("nhựa trong") || text.includes("trong suốt")) return "clear";
      if (text.includes("pp") || text.includes("nhựa mờ") || text.includes("mờ")) return "frosted";
      if (text.includes("giấy") || text.includes("kraft") || text.includes("paper")) return "paper";
      if (text.includes("thủy tinh") || text.includes("glass")) return "glass";
      return null;
    }

    function parseStyle(text: string): "straight" | "u_shape" | "heart" | "mug" | null {
      if (text.includes("thẳng") || text.includes("straight")) return "straight";
      if (text.includes("bầu") || text.includes("u-shape") || text.includes("đáy u") || text.includes("u_shape")) return "u_shape";
      if (text.includes("tim") || text.includes("heart")) return "heart";
      if (text.includes("mug") || text.includes("quai")) return "mug";
      return null;
    }

    function parseSize(text: string): "350ml" | "500ml" | "700ml" | "1000ml" | null {
      if (text.includes("1000") || text.includes("1l ") || text.includes(" 1l")) return "1000ml";
      if (text.includes("700")) return "700ml";
      if (text.includes("500")) return "500ml";
      if (text.includes("350")) return "350ml";
      return null;
    }

    detailedProducts.forEach((p: any) => {
      const rawVariants: any[] =
        Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [p];

      rawVariants.forEach((v: any) => {
        const availableQty = v.availableQty ?? v.stockSnapshot ?? p.stockSnapshot ?? 0;
        if (availableQty <= 0 || v.isActive === false) return;

        const attr = v.attributes ?? {};

        // Ưu tiên đọc từ attributes object trước (key chuẩn và key tiếng Việt)
        const attrMaterial = (
          attr.material ??
          attr["chất liệu"] ??
          attr["chat lieu"] ??
          ""
        ).toLowerCase();
        const attrStyle = (
          attr.style ??
          attr["kiểu dáng"] ??
          attr["kieu dang"] ??
          ""
        ).toLowerCase();
        const attrSize = (
          attr.size ??
          attr.capacity ??
          attr["dung tích"] ??
          attr["dung tich"] ??
          ""
        ).toLowerCase();

        // Build full text để detect nếu attributes không đủ
        const fullText = [
          attrMaterial,
          attrStyle,
          attrSize,
          p.name,
          p.slug,
          v.name,
          v.sku,
          ...Object.values(attr).map(String),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const material = parseMaterial(attrMaterial) ?? parseMaterial(fullText);
        const style = parseStyle(attrStyle) ?? parseStyle(fullText);
        const size = parseSize(attrSize) ?? parseSize(fullText);

        // Bỏ qua variant không parse được — không tự đoán
        if (!material || !style || !size) {
          console.warn("[Cup DB Inventory] Bỏ qua variant không parse được:", {
            productName: p.name,
            sku: v.sku,
            attr,
          });
          return;
        }

        result.push({ materialType: material, style, size, availableQty, price: v.price ?? p.price });
      });
    });

    console.log("[Cup DB Inventory] Variants từ DB:", result);
    return result;
  } catch (error) {
    console.error("fetchInStockCupVariantsFromApi error:", error);
    return [];
  }
}

/**
 * Lấy TẤT CẢ variant ly từng nhập kho (kể cả hết hàng) — dùng cho Design First.
 * Thêm field `inStock: boolean` để FE phân biệt hiển thị badge "Hết hàng".
 *
 * ⚠️ BE NOTE: Nếu API GET /catalog/products không trả về sản phẩm có availableQty=0,
 * cần yêu cầu BE thêm query param `includeOutOfStock=true` hoặc endpoint riêng.
 * Hiện tại FE parse tất cả variant nhận được, KHÔNG lọc theo availableQty.
 */
export async function fetchAllCupVariantsFromApi(): Promise<
  Array<{
    materialType: "clear" | "frosted" | "paper" | "glass";
    style: "straight" | "u_shape" | "heart" | "mug";
    size: "350ml" | "500ml" | "700ml" | "1000ml";
    availableQty: number;
    inStock: boolean;
    price?: number;
    productId?: string;
    variantId?: string;
    sku?: string;
  }>
> {
  try {
    // ── Ưu tiên admin API (có JWT) để lấy TẤT CẢ sản phẩm kể cả hết hàng/chưa publish ──
    let rawList: any[] = [];
    try {
      // Admin endpoint trả về toàn bộ products không lọc status
      const adminRes = await apiClient.get<any>("/admin/catalog/products", {
        params: { page: 1, pageSize: 200 },
      });
      const adminData = adminRes?.data;
      // Xử lý cả dạng array lẫn paginated { data: [...] }
      if (Array.isArray(adminData)) {
        rawList = adminData;
      } else if (adminData?.data && Array.isArray(adminData.data)) {
        rawList = adminData.data;
      } else if (adminData?.items && Array.isArray(adminData.items)) {
        rawList = adminData.items;
      }
    } catch {
      // Fallback: public catalog (chỉ active products)
      try {
        rawList = (await publicApiFetch<any[]>("/catalog/products")) ?? [];
      } catch {
        rawList = [];
      }
    }

    // ── Lấy local drafts từ admin ──
    let drafts: any[] = [];
    if (typeof window !== "undefined") {
      try {
        drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") ?? "[]");
      } catch {
        drafts = [];
      }
    }

    // ── Lọc sản phẩm phôi ly / ly custom in theo yêu cầu từ DB (CHỈ LY CHƯA IN) ──
    const allRaw = [...drafts, ...rawList];
    const cupRaw = allRaw.filter((p: any) => {
      const category = String(p.category ?? "").toLowerCase();
      const slug = String(p.slug ?? "").toLowerCase();
      const name = String(p.name ?? "").toLowerCase();
      const fulfillmentType = String(p.fulfillmentType ?? "").toLowerCase();
      const itemType = String(p.itemType ?? p.type ?? "").toUpperCase();

      // RÀNG BUỘC: Bỏ qua tất cả ly đã in sẵn của NSX (printed_cup / CUP_PRINTED / isPrinted === true)
      if (
        category === "printed_cup" ||
        p.isPrinted === true ||
        itemType === "CUP_PRINTED" ||
        fulfillmentType === "pre_printed" ||
        (fulfillmentType === "standard" && category === "printed_cup")
      ) {
        return false;
      }

      return (
        category === "plain_cup" ||
        category === "custom_print" ||
        fulfillmentType === "custom_print" ||
        itemType === "CUP_BLANK" ||
        name.includes("phôi") ||
        name.includes("custom") ||
        name.includes("tự thiết kế") ||
        slug.includes("custom") ||
        slug.includes("phoi") ||
        (name.includes("ly") && (name.includes("trơn") || name.includes("in theo yêu cầu")))
      );
    });

    if (cupRaw.length === 0) {
      console.warn("[Cup DB All] Không tìm thấy phôi ly hoặc sản phẩm custom print nào trong DB.");
      return [];
    }

    // ── Fetch detail (có variants) cho từng sản phẩm ──
    const detailedProducts = await Promise.all(
      cupRaw.map(async (p: any) => {
        if (Array.isArray(p.variants) && p.variants.length > 0) return p;
        if (!p.slug) return p;
        try {
          const detail = await publicApiFetch<any>(
            `/catalog/products/${encodeURIComponent(p.slug)}`,
          );
          return detail ?? p;
        } catch {
          return p;
        }
      }),
    );

    // ── Parse helpers chuẩn hóa từ thuộc tính DB và mã SKU Kho ──
    function parseMaterial(text: string, sku: string = ""): "clear" | "frosted" | "paper" | "glass" {
      const full = (text + " " + sku).toLowerCase();
      if (full.includes("pet") || full.includes("nhựa trong") || full.includes("trong")) return "clear";
      if (full.includes("pp") || full.includes("nhựa mờ") || full.includes("mờ")) return "frosted";
      if (full.includes("giấy") || full.includes("kraft") || full.includes("paper")) return "paper";
      if (full.includes("thủy tinh") || full.includes("glass")) return "glass";
      return "clear";
    }

    function parseStyle(text: string, sku: string = ""): "straight" | "u_shape" | "heart" | "mug" {
      const full = (text + " " + sku).toLowerCase();
      if (full.includes("-u") || full.includes("bầu") || full.includes("u-shape") || full.includes("đáy u") || full.includes("u_shape")) return "u_shape";
      if (full.includes("heart") || full.includes("tim")) return "heart";
      if (full.includes("mug") || full.includes("quai")) return "mug";
      return "straight";
    }

    function parseSize(text: string, sku: string = ""): "350ml" | "500ml" | "700ml" | "1000ml" {
      const full = (text + " " + sku).toLowerCase();
      if (full.includes("1000") || full.includes("1l")) return "1000ml";
      if (full.includes("700") || full.includes("750") || full.includes("l ") || full.includes("large")) return "700ml";
      if (full.includes("350") || full.includes("s ") || full.includes("small")) return "350ml";
      return "500ml";
    }

    // ── Parse variants chính xác từ DB — KHÔNG lọc theo availableQty ──
    const result: Array<{
      materialType: "clear" | "frosted" | "paper" | "glass";
      style: "straight" | "u_shape" | "heart" | "mug";
      size: "350ml" | "500ml" | "700ml" | "1000ml";
      availableQty: number;
      inStock: boolean;
      price?: number;
      productId?: string;
      variantId?: string;
      sku?: string;
    }> = [];

    detailedProducts.forEach((p: any) => {
      // Bỏ qua variant bị xoá hoàn toàn (isActive === false) nhưng giữ hết hàng (availableQty === 0)
      const rawVariants: any[] =
        Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [p];

      rawVariants.forEach((v: any) => {
        // Chỉ bỏ qua variant bị vô hiệu hoá
        if (v.isActive === false) return;

        const availableQty = v.availableQty ?? v.stockSnapshot ?? p.stockSnapshot ?? 0;
        const inStock = availableQty > 0;

        let attrObj: Record<string, string> = {};
        const rawAttr = v.attributes ?? p.attributes ?? {};
        if (Array.isArray(rawAttr)) {
          rawAttr.forEach((item: any) => {
            if (item && (item.name || item.key) && item.value) {
              attrObj[String(item.name || item.key).toLowerCase()] = String(item.value).toLowerCase();
            }
          });
        } else if (rawAttr && typeof rawAttr === "object") {
          Object.entries(rawAttr).forEach(([k, val]) => {
            attrObj[String(k).toLowerCase()] = String(val).toLowerCase();
          });
        }

        const attrMaterial = (attrObj.material ?? attrObj["chất liệu"] ?? attrObj["chat lieu"] ?? attrObj["materialtype"] ?? "").toLowerCase();
        const attrStyle = (attrObj.style ?? attrObj["kiểu dáng"] ?? attrObj["kieu dang"] ?? attrObj["dáng"] ?? "").toLowerCase();
        const attrSize = (attrObj.size ?? attrObj.capacity ?? attrObj["dung tích"] ?? attrObj["dung tich"] ?? attrObj["dungtich"] ?? "").toLowerCase();

        const skuStr = String(v.sku ?? p.sku ?? p.productRefId ?? "").toLowerCase();

        const fullText = [
          attrMaterial, attrStyle, attrSize,
          p.name, p.slug, v.name, skuStr,
          ...Object.values(attrObj).map(String),
        ].filter(Boolean).join(" ").toLowerCase();

        const material = parseMaterial(attrMaterial || fullText, skuStr);
        const style = parseStyle(attrStyle || fullText, skuStr);
        const size = parseSize(attrSize || fullText, skuStr);

        const sku = v.sku || p.sku || p.productRefId;

        // Dedupe: nếu combo đã có với inStock=true thì ưu tiên thông tin còn hàng
        const existing = result.find(
          (r) => r.materialType === material && r.style === style && r.size === size,
        );
        if (existing) {
          if (inStock && !existing.inStock) {
            existing.inStock = true;
            existing.availableQty = availableQty;
            existing.price = v.price ?? p.price;
            if (sku) existing.sku = sku;
            if (v.id || v._id) existing.variantId = v.id || v._id;
          }
          return;
        }

        result.push({
          materialType: material,
          style,
          size,
          availableQty,
          inStock,
          price: v.price ?? p.price,
          productId: p.id || p._id,
          variantId: v.id || v._id || sku,
          sku,
        });
      });
    });

    console.log("[Cup DB All] Tất cả variants phôi ly chưa in:", result);
    return result;
  } catch (error) {
    console.error("fetchAllCupVariantsFromApi error:", error);
    return [];
  }
}
