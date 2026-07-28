import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import {
  listCatalogCategories,
  listCatalogProducts,
} from "@/features/catalog/services/catalog.service";

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    listCatalogProducts(),
    listCatalogCategories(),
  ]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#1C1816]">
      <section className="py-8 md:py-10">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <CatalogGrid
            products={products.data}
            categories={categories}
            title="Tất cả sản phẩm"
          />
        </div>
      </section>
    </main>
  );
}
