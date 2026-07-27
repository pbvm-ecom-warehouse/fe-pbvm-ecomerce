import { publicApiFetch } from "@/lib/public-api";
import type { ApiListResponse, CatalogProduct, ProductVariant } from "@/types/api";
import {
  coerceVariantAttributes,
  normalizeVariantAttributes,
} from "@/features/catalog/utils/variant-attributes";

function getValidImageUrl(img: string | undefined): string | undefined {
  if (!img) return undefined;
  const lowercase = img.toLowerCase().trim();
  if (
    lowercase === "string" ||
    lowercase === "undefined" ||
    lowercase === "null" ||
    lowercase === ""
  ) {
    return undefined;
  }
  if (
    img.startsWith("http://") ||
    img.startsWith("https://") ||
    img.startsWith("/") ||
    img.startsWith("data:")
  ) {
    return img;
  }
  return undefined;
}

export function cleanProductName(name: string | undefined, sku?: string): string {
  return (name || sku || "").trim();
}

function unwrapShopPayload(payload: any): any {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    !("id" in payload) &&
    !("_id" in payload) &&
    !("slug" in payload)
  ) {
    return payload.data;
  }
  return payload;
}

function readArrayPayload(payload: any): any[] | null {
  const data = unwrapShopPayload(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.variants)) return data.variants;
  return null;
}

function getCategoryId(category: any) {
  return category?.id ?? category?._id;
}

function normalizeCatalogText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

async function readCatalogCategoriesById() {
  try {
    const response = await publicApiFetch<any>("/catalog/categories");
    const categories = readArrayPayload(response) ?? [];
    const byId = new Map<string, any>();
    for (const category of categories) {
      const id = getCategoryId(category);
      if (id) byId.set(String(id), category);
    }
    return byId;
  } catch {
    return new Map<string, any>();
  }
}

async function readBlankCupCategoryIds() {
  const categoriesById = await readCatalogCategoriesById();
  const ids = new Set<string>();

  for (const [id, category] of categoriesById.entries()) {
    const slug = normalizeCatalogText(String(category?.slug ?? ""));
    const name = normalizeCatalogText(String(category?.name ?? ""));
    const code = normalizeCatalogText(String(category?.code ?? ""));

    if (
      slug === "ly-chua-in" ||
      slug === "plain-cup" ||
      slug === "plain_cup" ||
      name === "ly chua in" ||
      code === "ly-chua-in" ||
      code === "plain_cup"
    ) {
      ids.add(id);
    }
  }

  return { ids, categoriesById };
}

function attachCategory(product: any, categoriesById: Map<string, any>) {
  const categoryId = String(
    product?.categoryId ||
      (typeof product?.category === "object" ? getCategoryId(product.category) : "") ||
      "",
  );
  if (!categoryId) return product;
  const category = categoriesById.get(categoryId);
  if (!category) return product;

  return {
    ...product,
    category,
    categoryId,
  };
}

function readVariantAttributeSource(variant: any) {
  return {
    ...coerceVariantAttributes(variant?.attributes),
    ...coerceVariantAttributes(variant?.attributeValues),
    ...coerceVariantAttributes(variant?.variantAttributes),
    ...(variant?.capacity ? { capacity: variant.capacity } : {}),
    ...(variant?.size ? { size: variant.size } : {}),
    ...(variant?.style ? { style: variant.style } : {}),
    ...(variant?.material ? { material: variant.material } : {}),
    ...(variant?.color ? { color: variant.color } : {}),
  };
}

async function withFreshProductVariants(product: any) {
  product = unwrapShopPayload(product);
  if (!product) return product;

  const identifiers = Array.from(
    new Set(
      [product?.id, product?._id, product?.slug, product?.productRefId, product?.sku]
        .filter((value) => value !== undefined && value !== null && String(value).trim())
        .map((value) => String(value).trim()),
    ),
  );
  if (identifiers.length === 0) return product;

  let variants: any[] | null = null;
  for (const identifier of identifiers) {
    try {
      const response = await publicApiFetch<any>(
        `/catalog/products/${encodeURIComponent(identifier)}/variants`,
      );
      const data = readArrayPayload(response);
      if (data && data.length > 0) {
        variants = data;
        break;
      }
    } catch {}
  }
  if (!variants) return product;

  const variantsFromDetail = Array.isArray(product.variants) ? product.variants : [];
  const detailVariantById = new Map<string, any>();
  const detailVariantBySku = new Map<string, any>();
  for (const variant of variantsFromDetail) {
    const id = variant?.id ?? variant?._id;
    if (id) detailVariantById.set(String(id), variant);
    if (variant?.sku) detailVariantBySku.set(String(variant.sku), variant);
  }

  const mergedVariants = variants.map((variant) => {
    const detailVariant =
      detailVariantById.get(String(variant?.id ?? variant?._id ?? "")) ||
      detailVariantBySku.get(String(variant?.sku ?? "")) ||
      {};
    return {
      ...detailVariant,
      ...variant,
      attributes: {
        ...readVariantAttributeSource(detailVariant),
        ...readVariantAttributeSource(variant),
      },
    };
  });

  return { ...product, variants: mergedVariants };
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
  const mergedP = unwrapShopPayload(p);

  // Đọc danh sách variants gốc từ BE hoặc override
  const baseVariants: any[] =
    Array.isArray(mergedP.variants) && mergedP.variants.length > 0
      ? mergedP.variants
      : [];

  const rawVariants = baseVariants;

  const activeVariant = rawVariants.find((v) => v.isActive !== false) ?? rawVariants[0];

  const validVariantPrices = rawVariants
    .map((v) => Number(v.price))
    .filter((pr) => !isNaN(pr) && pr > 0);

  const minVariantPrice = validVariantPrices.length > 0
    ? Math.min(...validVariantPrices)
    : (mergedP.price ?? activeVariant?.price ?? 0);

  const price = minVariantPrice;

  const rawCatId = mergedP.categoryId || (typeof mergedP.category === "object" ? mergedP.category?.id || mergedP.category?._id : mergedP.category);
  const rawCatSlug = typeof mergedP.category === "object" ? mergedP.category?.slug : (typeof mergedP.category === "string" ? mergedP.category : null);
  const rawCatName = typeof mergedP.category === "object" ? mergedP.category?.name : null;

  const mappedCategorySlug = rawCatSlug || rawCatId || "";

  let mappedVariants: ProductVariant[] = rawVariants.map((v: any) => {
    const sku = v.sku ?? "";
    const rawAttrs = readVariantAttributeSource(v);
    const normalizedAttrs = normalizeVariantAttributes(rawAttrs, sku);
    return {
      id: v.id ?? v._id,
      sku,
      productId: v.productId ?? mergedP.id ?? mergedP._id,
      attributes: { ...rawAttrs, ...normalizedAttrs },
      price: v.price ?? price,
      availableQty: v.availableQty ?? v.stockSnapshot ?? 0,
      fulfillmentType: v.fulfillmentType ?? "STANDARD",
      isActive: v.isActive !== false,
    };
  });


  const rawCandidates = [
    ...(mergedP.images || []),
    mergedP.imageUrl,
  ].filter((url): url is string => typeof url === "string" && Boolean(url.trim()));

  const imageCandidates = Array.from(new Set(rawCandidates));

  const activeAttributes = mappedVariants[0]?.attributes || activeVariant?.attributes || mergedP.attributes || {};

  return {
    id: mergedP.id ?? mergedP._id,
    productRefId: mergedP.productRefId ?? mergedP.sku ?? mergedP.code ?? mergedP.productSku ?? "",
    slug: mergedP.slug ?? "",
    name: cleanProductName(mergedP.name, mergedP.productRefId ?? mergedP.sku),
    description: mergedP.description || "",
    category: mappedCategorySlug,
    categoryId: rawCatId,
    categoryObj: typeof mergedP.category === "object" ? mergedP.category : undefined,
    categoryName: rawCatName,
    fulfillmentType: mergedP.fulfillmentType ?? activeVariant?.fulfillmentType ?? "STANDARD",
    price,
    b2bPrice: price,
    unit: mergedP.unit ?? activeVariant?.unit ?? "",
    stockSnapshot: mappedVariants.reduce((sum: number, v: ProductVariant) => sum + (v.availableQty ?? 0), 0),
    imageUrl: getValidImageUrl(imageCandidates[0]) ?? "",
    images: imageCandidates.filter((url) => getValidImageUrl(url)),
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
  const mergedP = p;

  const baseVariants: any[] =
    Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants: [];

  const rawVariants = baseVariants;

  const validVariantPrices = rawVariants
    .map((v) => Number(v.price))
    .filter((pr) => !isNaN(pr) && pr > 0);

  const minVariantPrice = validVariantPrices.length > 0
    ? Math.min(...validVariantPrices)
    : (p.price ?? 0);

  const price = minVariantPrice;

  const rawCatId = mergedP.categoryId || p.categoryId || (typeof mergedP.category === "object" ? mergedP.category?.id || mergedP.category?._id : mergedP.category);
  const rawCatSlug = typeof mergedP.category === "object" ? mergedP.category?.slug : (typeof mergedP.category === "string" ? mergedP.category : null);
  const rawCatName = typeof mergedP.category === "object" ? mergedP.category?.name : null;

  const mappedCategorySlug = rawCatSlug || rawCatId || "";

  let mappedVariants: ProductVariant[] = rawVariants.map((v: any) => {
    const sku = v.sku ?? "";
    const rawAttrs = readVariantAttributeSource(v);
    const normalizedAttrs = normalizeVariantAttributes(rawAttrs, sku);
    return {
      id: v.id ?? v._id,
      sku,
      productId: v.productId ?? mergedP.id ?? mergedP._id,
      attributes: { ...rawAttrs, ...normalizedAttrs },
      price: v.price ?? price,
      availableQty: v.availableQty ?? v.stockSnapshot ?? 0,
      fulfillmentType: v.fulfillmentType ?? "STANDARD",
      isActive: v.isActive !== false,
    };
  });


  const rawCandidates = [
    ...(mergedP.images || []),
    mergedP.imageUrl,
    ...(p.images || []),
    p.imageUrl,
  ].filter((url): url is string => typeof url === "string" && Boolean(url.trim()));

  const imageCandidates = Array.from(new Set(rawCandidates));

  return {
    id: mergedP.id ?? mergedP._id,
    productRefId: mergedP.productRefId ?? mergedP.sku ?? mergedP.code ?? mergedP.productSku ?? "",
    slug: mergedP.slug ?? "",
    name: cleanProductName(mergedP.name, mergedP.productRefId ?? mergedP.sku),
    category: mappedCategorySlug,
    categoryId: rawCatId,
    categoryObj: typeof mergedP.category === "object" ? mergedP.category : undefined,
    categoryName: rawCatName,
    fulfillmentType: mergedP.fulfillmentType ?? "STANDARD",
    price,
    b2bPrice: price,
    unit: mergedP.unit ?? "",
    stockSnapshot: mappedVariants.length > 0
      ? mappedVariants.reduce((sum: number, v: ProductVariant) => sum + (v.availableQty ?? 0), 0)
      : (mergedP.stockSnapshot ?? 0),
    imageUrl: getValidImageUrl(imageCandidates[0]) ?? "",
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

    const filtered = rawProducts;
    const categoriesById = await readCatalogCategoriesById();

    const enriched = await Promise.all(
      filtered.map(async (p) => {
        const productWithVariants = attachCategory(
          await withFreshProductVariants(p),
          categoriesById,
        );
        if (Array.isArray(productWithVariants.variants) && productWithVariants.variants.length > 0) {
          return mapProductDetail(productWithVariants);
        }
        return mapProductListItem(productWithVariants);
      }),
    );

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
    const product = unwrapShopPayload(p);
    if (product) {
      const productWithVariants = await withFreshProductVariants(product);
      const categoriesById = await readCatalogCategoriesById();
      return mapProductDetail(
        attachCategory(productWithVariants, categoriesById),
      );
    }
  } catch {
    if (decodedSlug !== targetSlug) {
      try {
        const p = await publicApiFetch<any>(
          `/catalog/products/${encodeURIComponent(decodedSlug)}`,
        );
        const product = unwrapShopPayload(p);
        if (product) {
          const productWithVariants = await withFreshProductVariants(product);
          const categoriesById = await readCatalogCategoriesById();
          return mapProductDetail(
            attachCategory(productWithVariants, categoriesById),
          );
        }
      } catch {}
    }
  }

  return null;
}

/**
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

    const allRaw = rawList;
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
          const detail = unwrapShopPayload(await publicApiFetch<any>(
            `/catalog/products/${encodeURIComponent(p.slug)}`,
          ));
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
    productName?: string;
    color?: string;
    attributes?: Record<string, string>;
  }>
> {
  try {
    const { ids: blankCupCategoryIds, categoriesById } = await readBlankCupCategoryIds();
    // ── Lấy sản phẩm đang bán từ public catalog và lọc phôi ly theo category API ──
    let rawList: any[] = [];
    try {
      const adminData = await publicApiFetch<any>("/catalog/products");
      // Xử lý cả dạng array lẫn paginated { data: [...] }
      if (Array.isArray(adminData)) {
        rawList = adminData;
      } else if (adminData?.data && Array.isArray(adminData.data)) {
        rawList = adminData.data;
      } else if (adminData?.items && Array.isArray(adminData.items)) {
        rawList = adminData.items;
      }
    } catch {
      try {
        rawList = (await publicApiFetch<any[]>("/catalog/products")) ?? [];
      } catch {
        rawList = [];
      }
    }

    const allRaw = rawList;
    const cupRaw = allRaw.filter((p: any) => {
      const rawCategoryId = String(
        p.categoryId ??
          p.categoryObj?.id ??
          p.categoryObj?._id ??
          p.category?.id ??
          p.category?._id ??
          "",
      );
      const categoryFromApi = rawCategoryId ? categoriesById.get(rawCategoryId) : null;
      const category = normalizeCatalogText(String(
        p.categoryObj?.slug ??
          p.category?.slug ??
          categoryFromApi?.slug ??
          p.category ??
          "",
      ));
      const categoryName = normalizeCatalogText(String(
        p.categoryName ??
          p.categoryObj?.name ??
          p.category?.name ??
          categoryFromApi?.name ??
          "",
      ));
      const slug = normalizeCatalogText(String(p.slug ?? ""));
      const name = normalizeCatalogText(String(p.name ?? ""));
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
        (rawCategoryId && blankCupCategoryIds.has(rawCategoryId)) ||
        category === "plain_cup" ||
        category === "ly-chua-in" ||
        categoryName.includes("ly chua in") ||
        category === "custom_print" ||
        fulfillmentType === "custom_print" ||
        itemType === "CUP_BLANK" ||
        name.includes("phoi") ||
        name.includes("custom") ||
        name.includes("tu thiet ke") ||
        slug.includes("custom") ||
        slug.includes("phoi") ||
        (name.includes("ly") && (name.includes("tron") || name.includes("in theo yeu cau")))
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
          const detail = unwrapShopPayload(await publicApiFetch<any>(
            `/catalog/products/${encodeURIComponent(p.slug)}`,
          ));
          return detail ?? p;
        } catch {
          return p;
        }
      }),
    );

    // ── Parse helpers chuẩn hóa từ thuộc tính DB và mã SKU Kho ──
    function normalizeCupText(text: string) {
      return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .toLowerCase();
    }

    function parseMaterial(text: string, sku: string = ""): "clear" | "frosted" | "paper" | "glass" | null {
      const full = normalizeCupText(`${text} ${sku}`);
      if (full.includes("pet") || full.includes("nhua trong") || full.includes("trong suot")) return "clear";
      if (full.includes("pp") || full.includes("nhua mo") || full.includes("mo")) return "frosted";
      if (full.includes("giay") || full.includes("kraft") || full.includes("paper")) return "paper";
      if (full.includes("thuy tinh") || full.includes("glass")) return "glass";
      return null;
    }

    function parseStyle(text: string, sku: string = ""): "straight" | "u_shape" | "heart" | "mug" | null {
      const full = normalizeCupText(`${text} ${sku}`);
      if (full.includes("tru") || full.includes("tron") || full.includes("thang") || full.includes("straight") || full.includes("rnd")) return "straight";
      if (full.includes("-u") || full.includes("bau") || full.includes("u-shape") || full.includes("day u") || full.includes("u_shape")) return "u_shape";
      if (full.includes("heart") || full.includes("tim")) return "heart";
      if (full.includes("mug") || full.includes("quai")) return "mug";
      return null;
    }

    function parseSize(text: string, sku: string = ""): "350ml" | "500ml" | "700ml" | "1000ml" | null {
      const full = normalizeCupText(`${text} ${sku}`);
      if (full.includes("1000") || full.includes("1l")) return "1000ml";
      if (full.includes("700") || full.includes("750") || full.includes("l ") || full.includes("large")) return "700ml";
      if (full.includes("500")) return "500ml";
      if (full.includes("350") || full.includes("s ") || full.includes("small")) return "350ml";
      return null;
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
      productName?: string;
      color?: string;
      attributes?: Record<string, string>;
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
              attrObj[String(item.name || item.key).toLowerCase()] = String(item.value).trim();
            }
          });
        } else if (rawAttr && typeof rawAttr === "object") {
          Object.entries(rawAttr).forEach(([k, val]) => {
            attrObj[String(k).toLowerCase()] = String(val).trim();
          });
        }

        const attrMaterial = (attrObj.material ?? attrObj["chất liệu"] ?? attrObj["chat lieu"] ?? attrObj["materialtype"] ?? "").toLowerCase();
        const attrStyle = (attrObj.style ?? attrObj["kiểu dáng"] ?? attrObj["kieu dang"] ?? attrObj["dáng"] ?? "").toLowerCase();
        const attrSize = (attrObj.size ?? attrObj.capacity ?? attrObj["dung tích"] ?? attrObj["dung tich"] ?? attrObj["dungtich"] ?? "").toLowerCase();
        const attrColor = String(attrObj.color ?? attrObj["màu sắc"] ?? attrObj["mau sac"] ?? "").trim();

        const material = parseMaterial(attrMaterial);
        const style = parseStyle(attrStyle);
        const size = parseSize(attrSize);

        if (!material || !style || !size) {
          console.warn("[Cup DB All] Skip variant without explicit cup attributes:", {
            productName: p.name,
            sku: v.sku,
            attributes: rawAttr,
          });
          return;
        }

        const sku = v.sku || p.sku || p.productRefId;

        // Dedupe: nếu combo đã có với inStock=true thì ưu tiên thông tin còn hàng
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
          productName: p.name,
          color: attrColor || undefined,
          attributes: attrObj,
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
