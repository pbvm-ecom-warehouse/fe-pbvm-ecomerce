"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Paintbrush, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/features/catalog/components/add-to-cart-button";
import type { CatalogProduct } from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/lib/utils";

const categoryCopy: Record<string, string> = {
  ingredient: "Nguyên liệu",
  plain_cup: "Ly chưa in",
  printed_cup: "Ly đã in",
  custom_print: "Ly in theo yêu cầu",
};

function getVendorName(product: CatalogProduct) {
  return (
    (product as any).vendorName ||
    (product as any).supplierName ||
    (product as any).brandName ||
    ""
  );
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
    setProduct(initialProduct);
    setImgLoaded(false);
  }, [initialProduct]);

  const imageSrc = product.imageUrl;
  const isCustomPrint =
    product.fulfillmentType === "CUSTOM_PRINT" &&
    product.category !== "printed_cup" &&
    !(product as any).isPrinted;

  const totalStock = product.variants
    ? product.variants.reduce((s, v) => s + (v.availableQty ?? 0), 0)
    : product.stockSnapshot ?? 0;

  const hasDiscount = product.price > product.b2bPrice;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.b2bPrice) / product.price) * 100)
    : 0;

  const catLabel = product.categoryName || categoryCopy[product.category] || product.category || "";
  const vendorName = getVendorName(product);

  return (
    <article className="group relative flex h-full flex-col rounded-[22px] bg-white/60 p-1.5 shadow-[0_2px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.06] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(59,183,126,0.14),0_2px_8px_rgba(0,0,0,0.06)] hover:ring-[#BCE3C9]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[16px] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
        {hasDiscount && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-black text-white shadow-md shadow-rose-400/30">
            <Zap className="size-2.5" strokeWidth={3} />
            -{discountPct}%
          </div>
        )}

        <Link href={`/products/${encodeURIComponent(product.slug)}`} className="block">
          <div className="relative aspect-square w-full overflow-hidden rounded-[14px] bg-[#F7FAF8]">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                priority={priority}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                onLoad={() => setImgLoaded(true)}
                className={cn(
                  "object-contain p-5 mix-blend-multiply transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]",
                  imgLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
                )}
              />
            ) : null}
          </div>
        </Link>

        <div className="flex flex-1 flex-col gap-1.5 p-4 pt-3">
          {catLabel ? (
            <span className="text-[9.5px] font-black uppercase tracking-[0.14em] text-[#3BB77E]/70">
              {catLabel}
            </span>
          ) : null}

          <h3 className="line-clamp-2 min-h-[36px] text-[13px] font-black leading-snug tracking-tight text-[#1A2E26]">
            <Link
              href={`/products/${encodeURIComponent(product.slug)}`}
              className="transition-colors duration-300 hover:text-[#3BB77E]"
            >
              {product.name}
            </Link>
          </h3>

          {vendorName ? (
            <p className="text-[10.5px] font-medium text-slate-400">
              bởi <span className="font-bold text-[#3BB77E]/90">{vendorName}</span>
            </p>
          ) : null}

          <div className="my-1 h-px w-full bg-gradient-to-r from-transparent via-[#E2EDE8] to-transparent" />

          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              {product.variants && product.variants.length > 0 && (
                <span className="mb-0.5 text-[9px] font-extrabold uppercase leading-none tracking-widest text-[#3BB77E]/60">
                  Giá từ
                </span>
              )}
              <span className="text-[17px] font-black leading-none text-[#1A2E26]">
                {formatCurrency(product.b2bPrice || product.price)}
              </span>
              {hasDiscount && (
                <span className="mt-0.5 text-[11px] leading-none text-slate-400 line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            <div className="shrink-0">
              {isCustomPrint ? (
                <Button
                  asChild
                  className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-[#DEF9EC] px-3.5 text-xs font-bold text-[#3BB77E] shadow-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#3BB77E] hover:text-white active:scale-[0.96]"
                >
                  <Link href={`/design-cup?productId=${product.id}`}>
                    <Paintbrush className="size-3.5" />
                    Thiết kế
                  </Link>
                </Button>
              ) : (
                <AddToCartButton
                  className="h-9 cursor-pointer rounded-xl border-0 bg-[#DEF9EC] px-3.5 text-xs font-bold text-[#3BB77E] shadow-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#3BB77E] hover:text-white active:scale-[0.96]"
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
