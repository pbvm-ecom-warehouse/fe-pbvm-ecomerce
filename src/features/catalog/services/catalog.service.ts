import { publicApiFetch } from "@/lib/public-api";
import type { ApiListResponse, CatalogProduct } from "@/types/api";

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
    return await publicApiFetch<ApiListResponse<CatalogProduct>>(
      "/catalog/products",
    );
  } catch {
    return emptyCatalogResponse;
  }
}

export async function getCatalogProductBySlug(slug: string) {
  try {
    return await publicApiFetch<CatalogProduct>(
      `/catalog/products/${encodeURIComponent(slug)}`,
    );
  } catch {
    return null;
  }
}
