import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import { listCatalogProducts } from "@/features/catalog/services/catalog.service";

const categoryFilters = ["Nguyên liệu", "Ly chưa in", "Ly đã in"];

const commerceHighlights = [
  { label: "Catalog", value: "Sync từ WMS" },
  { label: "Checkout", value: "Giữ tồn realtime" },
  { label: "Khách hàng", value: "B2B / B2C" },
];

export default async function HomePage() {
  const products = await listCatalogProducts();
  const featuredProducts = products.data.slice(0, 8);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-lg border bg-card p-5">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-teal-700">
              Nhà phân phối nguyên liệu & ly trà sữa
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Đặt hàng nhanh cho quán, theo tồn kho từng chi nhánh
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Catalog được sync từ WMS; tồn kho checkout sẽ gọi API realtime để
              chọn kho xuất phù hợp.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {categoryFilters.map((category) => (
              <span
                key={category}
                className="rounded-lg border bg-background px-3 py-1 text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-3 rounded-lg border bg-card p-4">
          {commerceHighlights.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <CatalogGrid products={featuredProducts} title="Sản phẩm bán chạy" />
    </main>
  );
}
