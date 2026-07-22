import { publicApiFetch } from "@/lib/public-api";
import type { ApiListResponse, CatalogProduct, ProductVariant } from "@/types/api";

export const fallbackCatalogProducts: CatalogProduct[] = [
  {
    id: "p1",
    productRefId: "REF-TRA-01",
    slug: "tra-den-co-thu-bao-1kg",
    name: "Trà Đen Cổ Thụ chuyên pha trà sữa (Bao 1kg)",
    category: "ingredient",
    price: 150000,
    b2bPrice: 120000,
    unit: "bao",
    stockSnapshot: 500,
    imageUrl: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p2",
    productRefId: "REF-BOT-SUA-01",
    slug: "bot-sua-indo-kievit-vana-blanca-25kg",
    name: "Bột sữa Indo Kievit Vana Blanca (Bao 25kg)",
    category: "ingredient",
    price: 1650000,
    b2bPrice: 1450000,
    unit: "bao",
    stockSnapshot: 150,
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p3",
    productRefId: "REF-LY-PP500",
    slug: "ly-nhua-pp-500ml-thung-1000",
    name: "Ly nhựa PP 500ml dày dặn chuyên trà sữa (Thùng 1000 cái)",
    category: "plain_cup",
    price: 450000,
    b2bPrice: 380000,
    unit: "thùng",
    stockSnapshot: 80,
    imageUrl: "/images/clear_cups.png",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p4",
    productRefId: "REF-TRAN-CHAU-01",
    slug: "tran-chau-den-gia-uy-3kg",
    name: "Trân châu đen Gia Uy túi 3kg dai giòn sần sật",
    category: "ingredient",
    price: 75000,
    b2bPrice: 65000,
    unit: "túi",
    stockSnapshot: 240,
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p5",
    productRefId: "REF-SIRO-01",
    slug: "siro-duong-den-maulin-25kg",
    name: "Siro Đường Đen Đài Loan Maulin 2.5kg",
    category: "ingredient",
    price: 230000,
    b2bPrice: 195000,
    unit: "chai",
    stockSnapshot: 310,
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p6",
    productRefId: "REF-LY-IN-500",
    slug: "ly-nhua-pp-500ml-in-logo-thung-1000",
    name: "Ly nhựa PP 500ml in sẵn logo phong cách hiện đại (Thùng 1000 cái)",
    category: "printed_cup",
    price: 520000,
    b2bPrice: 460000,
    unit: "thùng",
    stockSnapshot: 45,
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p7",
    productRefId: "REF-LY-PET700",
    slug: "ly-nhua-pet-700ml-thung-1000",
    name: "Ly nhựa PET 700ml trong suốt dày dặn (Thùng 1000 cái)",
    category: "plain_cup",
    price: 480000,
    b2bPrice: 420000,
    unit: "thùng",
    stockSnapshot: 120,
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p8",
    productRefId: "REF-LY-IN-700",
    slug: "ly-nhua-pet-700ml-in-logo-thung-1000",
    name: "Ly nhựa PET 700ml in logo thiết kế theo yêu cầu (Thùng 1000 cái)",
    category: "printed_cup",
    price: 560000,
    b2bPrice: 490000,
    unit: "thùng",
    stockSnapshot: 35,
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80",
    updatedAt: new Date().toISOString(),
  }
];

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

/**
 * Map một product detail (từ /catalog/products/:slug có variants)
 * thành CatalogProduct dùng ở FE.
 */
function mapProductDetail(p: any): CatalogProduct {
  const rawVariants: any[] = p.variants ?? [];
  const activeVariant = rawVariants.find((v) => v.isActive !== false) ?? rawVariants[0];
  const price = activeVariant?.price ?? 0;
  const category: CatalogProduct["category"] = CATEGORY_MAP[p.categoryId] ?? "ingredient";

  const mappedVariants: ProductVariant[] = rawVariants.map((v: any) => ({
    id: v.id ?? v._id,
    sku: v.sku ?? p.slug.toUpperCase(),
    productId: v.productId ?? p.id ?? p._id,
    attributes: v.attributes ?? {},
    price: v.price ?? price,
    availableQty: v.availableQty ?? v.stockSnapshot ?? 0,
    fulfillmentType: v.fulfillmentType ?? "STANDARD",
    isActive: v.isActive !== false,
  }));

  return {
    id: p.id ?? p._id,
    productRefId: activeVariant?.sku ?? p.slug.toUpperCase(),
    slug: p.slug,
    name: p.name,
    category,
    fulfillmentType: activeVariant?.fulfillmentType ?? "STANDARD",
    price,
    b2bPrice: price,
    unit: UNIT_MAP[category] ?? "bao",
    stockSnapshot: mappedVariants.reduce((sum: number, v: ProductVariant) => sum + (v.availableQty ?? 0), 0),
    imageUrl: getValidImageUrl(p.images?.[0]),
    updatedAt: p.updatedAt ?? new Date().toISOString(),
    variants: mappedVariants,
  };
}

/**
 * Map một product từ list API (không có variants) — dùng giá trị mặc định trống/0.
 */
function mapProductListItem(p: any): CatalogProduct {
  const category: CatalogProduct["category"] = CATEGORY_MAP[p.categoryId] ?? "ingredient";

  return {
    id: p.id ?? p._id,
    productRefId: p.slug.toUpperCase(),
    slug: p.slug,
    name: p.name,
    category,
    fulfillmentType: "STANDARD",
    price: 0,
    b2bPrice: 0,
    unit: UNIT_MAP[category] ?? "bao",
    stockSnapshot: 0,
    imageUrl: getValidImageUrl(p.images?.[0]),
    updatedAt: p.updatedAt ?? new Date().toISOString(),
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
 */
export async function listCatalogProducts() {
  try {
    const rawProducts = await publicApiFetch<any[]>("/catalog/products");
    if (!rawProducts || !Array.isArray(rawProducts) || rawProducts.length === 0) {
      return emptyCatalogResponse;
    }

    // Enrich each product with variant/price via detail endpoint
    const enriched = await Promise.all(
      rawProducts.map(async (p) => {
        try {
          const detail = await publicApiFetch<any>(
            `/catalog/products/${encodeURIComponent(p.slug)}`,
          );
          
          // Log pricing details for debug
          console.log(`[API Price Log] Product: ${p.name} | Slug: ${p.slug}`);
          if (detail?.variants) {
            detail.variants.forEach((v: any) => {
              console.log(`  -> Variant SKU: ${v.sku} | Price: ${v.price} | Available: ${v.availableQty}`);
            });
          }

          return detail ? mapProductDetail(detail) : mapProductListItem(p);
        } catch (err) {
          console.error(`[API Price Log Error] Failed to fetch details for ${p.slug}:`, err);
          return mapProductListItem(p);
        }
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
  try {
    const p = await publicApiFetch<any>(
      `/catalog/products/${encodeURIComponent(slug)}`,
    );
    if (!p) return null;

    // Log pricing details for debug
    console.log(`[API Price Log] Detail for ${slug}:`);
    if (p.variants) {
      p.variants.forEach((v: any) => {
        console.log(`  -> Variant SKU: ${v.sku} | Price: ${v.price} | Fulfillment: ${v.fulfillmentType}`);
      });
    }

    return mapProductDetail(p);
  } catch (error) {
    console.error(`getCatalogProductBySlug(${slug}): BE error:`, error);
    return null;
  }
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
  }>
> {
  try {
    // ── Lấy danh sách sản phẩm từ DB (kể cả hết hàng nếu BE trả về) ──
    let rawList: any[] = [];
    try {
      rawList = (await publicApiFetch<any[]>("/catalog/products")) ?? [];
    } catch {
      rawList = [];
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

    // ── Lọc sản phẩm phôi ly / ly custom in theo yêu cầu từ DB ──
    const allRaw = [...drafts, ...rawList];
    const cupRaw = allRaw.filter((p: any) => {
      const category = String(p.category ?? "").toLowerCase();
      const slug = String(p.slug ?? "").toLowerCase();
      const name = String(p.name ?? "").toLowerCase();
      const fulfillmentType = String(p.fulfillmentType ?? "").toLowerCase();

      // Bỏ qua ly in hình sẵn của NSX (printed_cup) nếu không phải phôi/custom
      if (category === "printed_cup" && !name.includes("custom") && !name.includes("phôi")) {
        return false;
      }

      return (
        category === "plain_cup" ||
        category === "custom_print" ||
        fulfillmentType === "custom_print" ||
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

    // ── Parse helpers chuẩn hóa từ thuộc tính DB ──
    function parseMaterial(text: string): "clear" | "frosted" | "paper" | "glass" {
      if (text.includes("pet") || text.includes("nhựa trong") || text.includes("trong")) return "clear";
      if (text.includes("pp") || text.includes("nhựa mờ") || text.includes("mờ")) return "frosted";
      if (text.includes("giấy") || text.includes("kraft") || text.includes("paper")) return "paper";
      if (text.includes("thủy tinh") || text.includes("glass")) return "glass";
      return "frosted";
    }

    function parseStyle(text: string): "straight" | "u_shape" | "heart" | "mug" {
      if (text.includes("bầu") || text.includes("u-shape") || text.includes("đáy u") || text.includes("u_shape")) return "u_shape";
      if (text.includes("tim") || text.includes("heart")) return "heart";
      if (text.includes("mug") || text.includes("quai")) return "mug";
      return "straight";
    }

    function parseSize(text: string): "350ml" | "500ml" | "700ml" | "1000ml" {
      if (text.includes("1000") || text.includes("1l")) return "1000ml";
      if (text.includes("700") || text.includes("750") || text.includes("l ") || text.includes("large")) return "700ml";
      if (text.includes("350") || text.includes("s ") || text.includes("small")) return "350ml";
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

        const attr = v.attributes ?? {};
        const attrMaterial = (attr.material ?? attr["chất liệu"] ?? attr["chat lieu"] ?? "").toLowerCase();
        const attrStyle = (attr.style ?? attr["kiểu dáng"] ?? attr["kieu dang"] ?? "").toLowerCase();
        const attrSize = (attr.size ?? attr.capacity ?? attr["dung tích"] ?? attr["dung tich"] ?? "").toLowerCase();

        const fullText = [
          attrMaterial, attrStyle, attrSize,
          p.name, p.slug, v.name, v.sku,
          ...Object.values(attr).map(String),
        ].filter(Boolean).join(" ").toLowerCase();

        const material = parseMaterial(attrMaterial || fullText);
        const style = parseStyle(attrStyle || fullText);
        const size = parseSize(attrSize || fullText);

        // Dedupe: nếu combo đã có với inStock=true thì ưu tiên thông tin còn hàng
        const existing = result.find(
          (r) => r.materialType === material && r.style === style && r.size === size,
        );
        if (existing) {
          if (inStock && !existing.inStock) {
            existing.inStock = true;
            existing.availableQty = availableQty;
            existing.price = v.price ?? p.price;
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
          productId: p.id,
          sku: v.sku,
        });
      });
    });

    console.log("[Cup DB All] Tất cả variants (kể cả hết hàng):", result);
    return result;
  } catch (error) {
    console.error("fetchAllCupVariantsFromApi error:", error);
    return [];
  }
}
