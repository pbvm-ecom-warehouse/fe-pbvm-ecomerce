"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard } from "@/features/catalog/components/product-card";
import type { CatalogProduct } from "@/types/api";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "printed_cup", label: "Ly đã in" },
  { id: "plain_cup", label: "Ly chưa in" },
  { id: "ingredient", label: "Nguyên liệu" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export function CatalogGrid({
  products,
  title,
}: {
  products: CatalogProduct[];
  title: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedCategory = (searchParams.get("category") || "all") as CategoryId;

  const handleCategoryChange = (catId: CategoryId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catId === "all") {
      params.delete("category");
    } else {
      params.set("category", catId);
    }
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <section className="space-y-6">
      {/* Grid Header with Categories Tab */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-100 dark:border-zinc-800/80 pb-3 gap-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#253D4E] dark:text-zinc-100 tracking-tight">
          {title}
        </h2>
        
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={cn(
                  "text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border-0 bg-transparent py-1 relative",
                  isActive
                    ? "text-[#3BB77E] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#3BB77E]"
                    : "text-[#253D4E] dark:text-zinc-400 hover:text-[#3BB77E] dark:hover:text-[#3BB77E] hover:-translate-y-[1px]"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Items */}
      {filteredProducts.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-[#FAF8F6] dark:bg-[#1C1816]/30 p-12 text-center text-sm text-muted-foreground">
          Chưa có sản phẩm nào thuộc danh mục này.
        </div>
      )}
    </section>
  );
}
