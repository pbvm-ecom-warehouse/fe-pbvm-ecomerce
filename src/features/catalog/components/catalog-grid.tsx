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
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Catalog realtime
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-normal">{title}</h2>
          <p className="mt-1 text-sm text-[#7A6F68]">
            Giá B2B/B2C và tồn kho được đồng bộ từ hệ thống bán hàng.
          </p>
        </div>
      </div>
      {products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#D2B48C] bg-white/70 p-8 text-sm text-[#7A6F68]">
          Chưa có sản phẩm từ ecommerce-api.
        </div>
      )}
    </section>
  );
}
