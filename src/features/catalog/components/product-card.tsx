"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Paintbrush, ShoppingCart, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/features/catalog/components/add-to-cart-button";
import type { CatalogProduct } from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/lib/utils";
import { subscribeProductSync } from "@/features/catalog/services/admin-catalog.service";

const categoryCopy: Record<CatalogProduct["category"], string> = {
  ingredient: "Nguyên liệu",
  plain_cup: "Ly chưa in",
  printed_cup: "Ly đã in",
  custom_print: "Ly in theo yêu cầu",
};

function getVendorName(product: CatalogProduct) {
  if (product.slug.includes("kievit")) return "Kievit Indo";
  if (product.slug.includes("tra-den") || product.slug.includes("phuc-long")) return "Phúc Long";
  if (product.slug.includes("gia-uy")) return "Gia Uy";
  if (product.slug.includes("maulin")) return "Maulin";
  if (product.slug.includes("ly-nhua") || product.slug.includes("pet") || product.slug.includes("pp")) return "PBVM Plastic";
  return "PBVM Supplier";
}

export function ProductCard({
  product: initialProduct,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const [product, setProduct] = useState<CatalogProduct>(initialProduct);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const syncOverride = () => {
      if (typeof window === "undefined") return;
      try {
        const overrides = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
        const pId = initialProduct.id;
        const pSlug = initialProduct.slug;
        const pRef = initialProduct.productRefId;
        const pNameKey = initialProduct.name ? initialProduct.name.toLowerCase().trim().replace(/\s+/g, "-") : "";

        let ov =
          (pId ? overrides[pId] : null) ||
          (pSlug ? overrides[pSlug] : null) ||
          (pRef ? overrides[pRef] : null) ||
          (pNameKey ? overrides[pNameKey] : null);

        if (!ov && typeof overrides === "object") {
          ov = Object.values(overrides).find((item: any) => {
            if (!item) return false;
            const itemSlug = String(item.slug || "").toLowerCase();
            const itemName = String(item.name || "").toLowerCase().trim().replace(/\s+/g, "-");
            const itemId = String(item.id || item._id || "");
            return (
              (pSlug && itemSlug === pSlug.toLowerCase()) ||
              (pNameKey && itemName === pNameKey) ||
              (pId && itemId === pId)
            );
          });
        }

        if (ov) {
          const newImg = (ov.images && ov.images[0]) || ov.imageUrl;
          const newName = ov.name || initialProduct.name;
          const beVariants = initialProduct.variants && initialProduct.variants.length > 0 ? initialProduct.variants : null;
          const newVariants = beVariants ?? ov.variants ?? [];
          const validVariantPrices = newVariants
            .map((v: any) => Number(v.price))
            .filter((pr: number) => !isNaN(pr) && pr > 0);
          const minVariantPrice = validVariantPrices.length > 0 ? Math.min(...validVariantPrices) : (initialProduct.price ?? ov.price);

          setProduct((prev) => ({
            ...prev,
            name: newName,
            imageUrl: newImg || prev.imageUrl,
            price: minVariantPrice,
            b2bPrice: minVariantPrice,
            variants: newVariants,
          }));
        } else {
          setProduct(initialProduct);
        }
      } catch (e) {
        console.error("ProductCard override error:", e);
      }
    };

    syncOverride();
    const unsubscribe = subscribeProductSync(syncOverride);
    return () => unsubscribe();
  }, [initialProduct]);

  const imageSrc = product.imageUrl || "/images/product-placeholder.svg";
  const isCustomPrint =
    product.fulfillmentType === "CUSTOM_PRINT" &&
    product.category !== "printed_cup" &&
    !(product as any).isPrinted;

  const totalStock = product.variants
    ? product.variants.reduce((s, v) => s + (v.availableQty ?? 0), 0)
    : product.stockSnapshot ?? 0;
  const inStock = totalStock > 0;

  const hasDiscount = product.price > product.b2bPrice;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.b2bPrice) / product.price) * 100)
    : 0;

  const catLabel = categoryCopy[product.category] ?? "Sản phẩm";

  return (
    /* ── OUTER SHELL (Double-Bezel) ── */
    <article className="group relative flex h-full flex-col p-1.5 rounded-[22px] ring-1 ring-black/[0.06] bg-white/60 shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(59,183,126,0.14),0_2px_8px_rgba(0,0,0,0.06)] hover:ring-[#BCE3C9]">

      {/* ── INNER CORE ── */}
      <div className="relative flex h-full flex-col overflow-hidden rounded-[16px] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-black text-white shadow-md shadow-rose-400/30">
            <Zap className="size-2.5" strokeWidth={3} />
            -{discountPct}%
          </div>
        )}



        {/* Image */}
        <Link href={`/products/${encodeURIComponent(product.slug)}`} className="block">
          <div className="relative aspect-square w-full overflow-hidden rounded-[14px] bg-[#F7FAF8]">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              onLoad={() => setImgLoaded(true)}
              className={cn(
                "object-contain p-5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06] mix-blend-multiply",
                imgLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
              )}
            />
          </div>
        </Link>

        {/* Info section */}
        <div className="flex flex-1 flex-col gap-1.5 p-4 pt-3">
          {/* Category eyebrow */}
          <span className="text-[9.5px] font-black uppercase tracking-[0.14em] text-[#3BB77E]/70">
            {catLabel}
          </span>

          {/* Name */}
          <h3 className="line-clamp-2 text-[13px] font-black leading-snug text-[#1A2E26] min-h-[36px] tracking-tight">
            <Link
              href={`/products/${encodeURIComponent(product.slug)}`}
              className="transition-colors duration-300 hover:text-[#3BB77E]"
            >
              {product.name}
            </Link>
          </h3>

          {/* Vendor */}
          <p className="text-[10.5px] text-slate-400 font-medium">
            bởi{" "}
            <span className="font-bold text-[#3BB77E]/90">{getVendorName(product)}</span>
          </p>

          {/* Divider */}
          <div className="my-1 h-px w-full bg-gradient-to-r from-transparent via-[#E2EDE8] to-transparent" />

          {/* Price + CTA */}
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              {product.variants && product.variants.length > 0 && (
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#3BB77E]/60 leading-none mb-0.5">
                  Giá từ
                </span>
              )}
              <span className="text-[17px] font-black leading-none text-[#1A2E26]">
                {formatCurrency(product.b2bPrice || product.price)}
              </span>
              {hasDiscount && (
                <span className="mt-0.5 text-[11px] text-slate-400 line-through leading-none">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            <div className="shrink-0">
              {isCustomPrint ? (
                <Button
                  asChild
                  className="h-9 rounded-xl bg-[#DEF9EC] hover:bg-[#3BB77E] hover:text-white text-[#3BB77E] font-bold text-xs transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] px-3.5 cursor-pointer border-0 shadow-none active:scale-[0.96] flex items-center gap-1.5"
                >
                  <Link href={`/design-cup?productId=${product.id}`}>
                    <Paintbrush className="size-3.5" />
                    Thiết kế
                  </Link>
                </Button>
              ) : (
                <AddToCartButton
                  className="h-9 rounded-xl bg-[#DEF9EC] hover:bg-[#3BB77E] hover:text-white text-[#3BB77E] font-bold text-xs transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] px-3.5 cursor-pointer border-0 shadow-none active:scale-[0.96]"
                  product={product}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
