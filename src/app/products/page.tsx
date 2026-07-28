import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import {
  listCatalogCategories,
  listCatalogProducts,
} from "@/features/catalog/services/catalog.service";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    listCatalogProducts(),
    listCatalogCategories(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <CatalogGrid
        products={products.data}
        categories={categories}
        title="Tất cả sản phẩm"
      />
    </main>
  );
}
