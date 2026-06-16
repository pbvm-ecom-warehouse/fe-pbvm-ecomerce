import { publicApiFetch } from "@/lib/public-api";
import type { ApiListResponse, CatalogProduct } from "@/types/api";

const fallbackCatalogProducts: CatalogProduct[] = [
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
    imageUrl: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80",
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

const emptyCatalogResponse: ApiListResponse<CatalogProduct> = {
  data: [],
  meta: {
    pagination: {
      page: 1,
      pageSize: 0,
      total: 0,
      totalPages: 0,
    },
  },
};

export async function listCatalogProducts() {
  try {
    const res = await publicApiFetch<ApiListResponse<CatalogProduct>>(
      "/catalog/products",
    );
    if (!res || !res.data || res.data.length === 0) {
      return emptyCatalogResponse;
    }
    return res;
  } catch {
    return emptyCatalogResponse;
  }
}

export async function getCatalogProductBySlug(slug: string) {
  try {
    const product = await publicApiFetch<CatalogProduct>(
      `/catalog/products/${encodeURIComponent(slug)}`,
    );
    if (!product) {
      return fallbackCatalogProducts.find(p => p.slug === slug) || null;
    }
    return product;
  } catch {
    return fallbackCatalogProducts.find(p => p.slug === slug) || null;
  }
}
