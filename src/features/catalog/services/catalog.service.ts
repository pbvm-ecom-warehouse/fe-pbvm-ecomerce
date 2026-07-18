import { publicApiFetch } from "@/lib/public-api";
import type { ApiListResponse, CatalogProduct } from "@/types/api";

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
  const variants: any[] = p.variants ?? [];
  const activeVariant = variants.find((v) => v.isActive !== false) ?? variants[0];
  const price = activeVariant?.price ?? 0;
  const category: CatalogProduct["category"] = CATEGORY_MAP[p.categoryId] ?? "ingredient";

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
    stockSnapshot: variants.reduce((sum: number, v: any) => sum + (v.availableQty ?? 0), 0),
    imageUrl: getValidImageUrl(p.images?.[0]),
    updatedAt: p.updatedAt ?? new Date().toISOString(),
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
