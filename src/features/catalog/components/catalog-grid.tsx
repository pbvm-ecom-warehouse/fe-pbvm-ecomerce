"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard } from "@/features/catalog/components/product-card";
import type { CatalogProduct } from "@/types/api";
import { cn } from "@/lib/utils";
import { adminListProducts, adminListCategories, subscribeProductSync } from "@/features/catalog/services/admin-catalog.service";

export function CatalogGridContent({
  products: initialProducts,
  title,
}: {
  products: CatalogProduct[];
  title: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);

  useEffect(() => {
    adminListCategories()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setDynamicCategories(res);
        }
      })
      .catch((err) => console.warn("CatalogGrid categories fetch warning:", err));
  }, []);

  useEffect(() => {
    const syncProducts = async () => {
      if (typeof window === "undefined") return;
      try {
        const list = await adminListProducts();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((p: any) => {
            const dImages =
              p.images && p.images.length > 0
                ? p.images
                : p.imageUrl
                ? [p.imageUrl]
                : [];

            const activeVariant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
            const activeAttributes = activeVariant?.attributes || p.attributes || {};
            const varPrice = activeVariant?.price ?? p.price ?? 0;

            const catId =
              p.categoryId ||
              (typeof p.category === "object"
                ? p.category?.id || p.category?._id
                : p.category);
            const catSlug =
              typeof p.category === "object"
                ? p.category?.slug
                : typeof p.category === "string"
                ? p.category
                : p.categoryId;

            return {
              id: p.id || p._id,
              productRefId: p.slug?.toUpperCase() || p.id,
              slug: p.slug,
              name: p.name,
              description: p.description || "",
              category: catSlug || catId || "ingredient",
              categoryId: catId,
              fulfillmentType: p.fulfillmentType || activeVariant?.fulfillmentType || "STANDARD",
              price: varPrice,
              b2bPrice: varPrice,
              unit: "cái",
              stockSnapshot:
                p.variants?.reduce(
                  (sum: number, v: any) => sum + (v.availableQty || 0),
                  0,
                ) || 0,
              imageUrl: dImages[0] || "/images/product-placeholder.svg",
              images: dImages,
              updatedAt: p.updatedAt || new Date().toISOString(),
              variants: p.variants || [],
              attributes: activeAttributes,
              capacity: activeAttributes.capacity || activeAttributes.size || activeAttributes.spec || "",
              material: activeAttributes.material || "",
              style: activeAttributes.style || "",
              color: activeAttributes.color || "",
            } as any;
          });
          setProducts(mapped);
        }
      } catch (e) {
        console.error("Failed to sync products in CatalogGrid:", e);
      }
    };

    syncProducts();

    const unsubscribe = subscribeProductSync(syncProducts);
    return () => {
      unsubscribe();
    };
  }, [initialProducts, router]);


  const selectedCategory = searchParams.get("category") || "all";

  // Build complete Category Tab items
  const categoryTabs = useMemo(() => {
    const defaultTabs = [{ id: "all", slug: "all", label: "Tất cả" }];

    if (dynamicCategories.length > 0) {
      const dbTabs = dynamicCategories.map((c) => ({
        id: String(c.id || c._id),
        slug: c.slug || String(c.id || c._id),
        label: c.name,
      }));
      return [...defaultTabs, ...dbTabs];
    }

    // Fallback default tabs
    return [
      ...defaultTabs,
      { id: "plain_cup", slug: "plain_cup", label: "Ly chưa in" },
      { id: "printed_cup", slug: "printed_cup", label: "Ly đã in" },
      { id: "ingredient", slug: "ingredient", label: "Nguyên liệu" },
    ];
  }, [dynamicCategories]);

  const handleCategoryChange = (slugOrId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slugOrId === "all") {
      params.delete("category");
    } else {
      params.set("category", slugOrId);
    }
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  // Robust product filtering matching Category ID, Slug, or Name
  const filteredProducts = useMemo(() => {
    if (!selectedCategory || selectedCategory === "all") return products;

    const selLower = selectedCategory.toLowerCase().trim();

    // Match target category object from database list if present
    const targetObj = dynamicCategories.find((c) => {
      const cId = String(c.id || c._id || "").toLowerCase();
      const cSlug = String(c.slug || "").toLowerCase();
      const cName = String(c.name || "").toLowerCase();
      return cId === selLower || cSlug === selLower || cName === selLower;
    });

    const targetIds = new Set<string>();
    const targetSlugs = new Set<string>();

    if (targetObj) {
      if (targetObj.id || targetObj._id) targetIds.add(String(targetObj.id || targetObj._id));
      if (targetObj.slug) targetSlugs.add(targetObj.slug.toLowerCase());
      if (targetObj.name) targetSlugs.add(targetObj.name.toLowerCase());
    }

    targetSlugs.add(selLower);
    targetIds.add(selectedCategory);

    // Map category aliases flexibly across backend ObjectId, slugs, and UI labels
    if (
      selLower === "plain_cup" ||
      selLower === "ly-chua-in" ||
      selLower === "6a6320d8f523987981061904"
    ) {
      targetSlugs.add("plain_cup");
      targetSlugs.add("ly-chua-in");
      targetSlugs.add("ly chưa in");
      targetIds.add("6a6320d8f523987981061904");
    }
    if (
      selLower === "ingredient" ||
      selLower === "nguyen-lieu" ||
      selLower === "nguyen-lieu-tra-sua" ||
      selLower === "6a632f16869af8381fd7245f"
    ) {
      targetSlugs.add("ingredient");
      targetSlugs.add("nguyen-lieu");
      targetSlugs.add("nguyen-lieu-tra-sua");
      targetSlugs.add("nguyên liệu");
      targetSlugs.add("nguyên liệu trà sữa");
      targetIds.add("6a632f16869af8381fd7245f");
    }
    if (
      selLower === "printed_cup" ||
      selLower === "ly-da-in" ||
      selLower === "685ba0cb233b28b7fa99c264"
    ) {
      targetSlugs.add("printed_cup");
      targetSlugs.add("ly-da-in");
      targetSlugs.add("ly đã in");
      targetIds.add("685ba0cb233b28b7fa99c264");
    }
    if (
      selLower === "custom_print" ||
      selLower === "ly-in-theo-yeu-cau" ||
      selLower === "685ba0cb233b28b7fa99c265"
    ) {
      targetSlugs.add("custom_print");
      targetSlugs.add("ly-in-theo-yeu-cau");
      targetSlugs.add("ly in theo yêu cầu");
      targetIds.add("685ba0cb233b28b7fa99c265");
    }

    return products.filter((p: any) => {
      const pCatId = String(p.categoryId || p.category?._id || p.category?.id || p.category || "");
      const pCatSlug = String(p.category?.slug || p.categorySlug || p.category || "").toLowerCase();
      const pCatName = String(p.category?.name || p.categoryName || "").toLowerCase();

      if (pCatId && targetIds.has(pCatId)) return true;
      if (pCatSlug && (targetSlugs.has(pCatSlug) || targetSlugs.has(pCatSlug.replace(/_/g, "-")))) return true;
      if (pCatName && targetSlugs.has(pCatName)) return true;

      return false;
    });
  }, [products, selectedCategory, dynamicCategories]);

  return (
    <section className="space-y-6">
      {/* Grid Header with Categories Tab */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-100 dark:border-zinc-800/80 pb-3 gap-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#253D4E] dark:text-zinc-100 tracking-tight">
          {title}
        </h2>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
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
