import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import type { CatalogProduct } from "@/types/api";

export function StorefrontHome({
  featuredProducts,
}: {
  featuredProducts: CatalogProduct[];
}) {
  return (
    <main className="min-h-screen bg-white dark:bg-[#1C1816]">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
        <CatalogGrid products={featuredProducts} title="Tất cả sản phẩm" />
      </section>
    </main>
  );
}
