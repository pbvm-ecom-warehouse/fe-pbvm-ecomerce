import { ProductCard } from "@/features/catalog/components/product-card";
import type { CatalogProduct } from "@/types/api";

export function CatalogGrid({
  products,
  title,
}: {
  products: CatalogProduct[];
  title: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
          </p>
        </div>
      </div>
      {products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
          Chưa có sản phẩm từ ecommerce-api.
        </div>
      )}
    </section>
  );
}
