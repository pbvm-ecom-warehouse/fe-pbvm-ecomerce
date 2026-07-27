"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ProductCard } from "@/features/catalog/components/product-card";
import { subscribeProductSync } from "@/features/catalog/services/admin-catalog.service";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/types/api";

function looksLikeObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

export function CatalogGridContent({
  products: initialProducts,
  title,
}: {
  products: CatalogProduct[];
  title: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    return subscribeProductSync(() => router.refresh());
  }, [router]);

  const selectedCategory = searchParams.get("category") || "all";

  const categoryTabs = useMemo(() => {
    const tabs = new Map<string, { id: string; slug: string; label: string }>();
    tabs.set("all", { id: "all", slug: "all", label: "Tất cả" });

    products.forEach((product: any) => {
      const id = String(
        product.categoryId ||
        product.categoryObj?.id ||
        product.categoryObj?._id ||
        product.category ||
        "",
      );
      const slug = String(product.categoryObj?.slug || product.category || id);
      const label = String(product.categoryName || product.categoryObj?.name || product.category || slug);

      if (slug && label && !looksLikeObjectId(label) && !tabs.has(slug)) {
        tabs.set(slug, { id: id || slug, slug, label });
      }
    });

    return Array.from(tabs.values());
  }, [products]);

  const handleCategoryChange = (slugOrId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slugOrId === "all") {
      params.delete("category");
    } else {
      params.set("category", slugOrId);
    }
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const filteredProducts = useMemo(() => {
    if (!selectedCategory || selectedCategory === "all") return products;

    const selected = selectedCategory.toLowerCase().trim();

    return products.filter((product: any) => {
      const values = [
        product.categoryId,
        product.category,
        product.categorySlug,
        product.categoryName,
        product.categoryObj?.id,
        product.categoryObj?._id,
        product.categoryObj?.slug,
        product.categoryObj?.name,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase().trim());

      return values.includes(selected);
    });
  }, [products, selectedCategory]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-3 dark:border-zinc-800/80 md:flex-row md:items-end md:justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#253D4E] dark:text-zinc-100 md:text-3xl">
          {title}
        </h2>

        <div className="-mx-4 flex items-center gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:gap-6 sm:px-0 md:pb-0">
          {categoryTabs.map((cat) => {
            const isActive =
              selectedCategory === cat.slug ||
              selectedCategory === cat.id ||
              (selectedCategory === "all" && cat.slug === "all");

            return (
              <button
                key={cat.id || cat.slug}
                onClick={() => handleCategoryChange(cat.slug)}
                className={cn(
                  "relative border-0 bg-transparent py-1 text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer",
                  isActive
                    ? "text-[#3BB77E] after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[2px] after:bg-[#3BB77E]"
                    : "text-[#253D4E] hover:-translate-y-[1px] hover:text-[#3BB77E] dark:text-zinc-400 dark:hover:text-[#3BB77E]",
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-[#FAF8F6] p-12 text-center text-sm text-muted-foreground dark:bg-[#1C1816]/30">
          Chưa có sản phẩm nào thuộc danh mục này.
        </div>
      )}
    </section>
  );
}

export function CatalogGrid(props: {
  products: CatalogProduct[];
  title: string;
}) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Đang tải sản phẩm...</div>}>
      <CatalogGridContent {...props} />
    </Suspense>
  );
}
