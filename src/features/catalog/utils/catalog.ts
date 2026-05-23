import type { CatalogProduct } from "@/types/api";

export function filterCatalogProducts(
  products: CatalogProduct[],
  query: string,
  category?: CatalogProduct["category"] | "all",
) {
  const normalizedQuery = query.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory =
      !category || category === "all" || product.category === category;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.slug.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
