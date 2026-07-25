"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Box, Paintbrush } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

          // BE là source of truth cho variants và price.
          const beVariants = initialProduct.variants && initialProduct.variants.length > 0
            ? initialProduct.variants
            : null;
          const newVariants = beVariants ?? ov.variants ?? [];

          const validVariantPrices = newVariants
            .map((v: any) => Number(v.price))
            .filter((pr: number) => !isNaN(pr) && pr > 0);

          const minVariantPrice = validVariantPrices.length > 0
            ? Math.min(...validVariantPrices)
            : (initialProduct.price ?? ov.price);

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
    return () => {
      unsubscribe();
    };
  }, [initialProduct]);

  const imageSrc = product.imageUrl || "/images/product-placeholder.svg";
  const isCustomPrint =
    product.fulfillmentType === "CUSTOM_PRINT" &&
    product.category !== "printed_cup" &&
    !(product as any).isPrinted;

  // Determine badge text and background styles
  let badgeText = "";
  let badgeBgClass = "bg-[#3BB77E] text-white"; // default green
  let discountValue = 0;

  if (product.price > product.b2bPrice) {
    discountValue = Math.round(((product.price - product.b2bPrice) / product.price) * 100);
    badgeText = `${discountValue}%`;
    
    // Vary colors based on discount value just like the reference image
    if (discountValue >= 15) {
      badgeBgClass = "bg-[#FD6E6E] text-white"; // Red/coral for high discounts
    } else if (discountValue < 12) {
      badgeBgClass = "bg-[#67B1EC] text-white"; // Blue for lower discounts
    }
  }

  // Top-right secondary status badge (e.g. Sale / New)
  let statusBadgeText = "";
  if (product.slug.includes("kievit") || product.slug.includes("phuc-long")) {
    statusBadgeText = "New";
  } else if (isCustomPrint || product.slug.includes("in-logo")) {
    statusBadgeText = "Sale";
  }

  const isCupProduct =
    product.category === "plain_cup" ||
    product.category === "printed_cup" ||
    product.category === "custom_print" ||
    product.slug.includes("ly-") ||
    product.name.toLowerCase().includes("ly nhựa") ||
    product.name.toLowerCase().includes("ly giấy");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[#E2EDE8] dark:border-[#2C332F] bg-white dark:bg-[#1C1F1D] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#BCE3C9] dark:hover:border-primary/50">
      {/* Absolute Badges */}
      <div className="absolute left-0 top-0 z-10">
        {badgeText && (
          <div className={cn("text-[10px] font-bold px-3 py-1.5 rounded-tl-[20px] rounded-br-[20px]", badgeBgClass)}>
            {badgeText}
          </div>
        )}
      </div>

      {statusBadgeText && (
        <div className="absolute right-3 top-3 z-10">
          <span className="bg-[#3BB77E] text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded-full">
            {statusBadgeText}
          </span>
        </div>
      )}

      {/* Image Container */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square w-full flex items-center justify-center p-3.5 bg-transparent mt-2">
          <div className="relative w-full h-full">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain transition-transform duration-500 group-hover:scale-105 mix-blend-multiply dark:mix-blend-normal"
            />
          </div>
        </div>
      </Link>

      {/* Card Info Section */}
      <div className="flex flex-1 flex-col p-4 pt-1.5">
        <span className="text-[11px] font-medium text-muted-foreground/80 dark:text-zinc-400">
          {categoryCopy[product.category]}
        </span>

        <h3 className="line-clamp-2 text-sm font-bold text-[#253D4E] dark:text-zinc-100 mt-1 min-h-[36px] leading-tight">
          <Link href={`/products/${product.slug}`} className="hover:text-[#3BB77E] transition-colors">
            {product.name}
          </Link>
        </h3>


        {/* Vendor */}
        <div className="text-[11px] text-muted-foreground/80 dark:text-zinc-400">
          By <span className="text-[#3BB77E] font-bold hover:underline cursor-pointer">{getVendorName(product)}</span>
        </div>

        {/* Footer: Price & Actions */}
        <div className="flex items-center justify-between mt-2.5 pt-0.5">
          <div className="flex flex-col">
            {Boolean(product.variants && product.variants.length > 0) && (
              <span className="text-[10px] font-extrabold text-[#3BB77E]/80 uppercase tracking-wider leading-none mb-0.5">
                Giá từ
              </span>
            )}
            <span className="text-base font-extrabold text-[#3BB77E] dark:text-[#3BB77E]">
              {formatCurrency(product.b2bPrice || product.price)}
            </span>
            {product.price > product.b2bPrice && (
              <span className="text-xs text-muted-foreground line-through leading-none mt-0.5">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          <div>
            {isCustomPrint ? (
              <Button
                asChild
                className="h-8 rounded-lg bg-[#DEF9EC] dark:bg-[#1b3d2f] hover:bg-[#3BB77E] hover:text-white text-[#3BB77E] dark:text-[#4ade80] font-bold text-xs transition-all duration-200 px-3 cursor-pointer border-0 shadow-none flex items-center gap-1 active:scale-[0.98]"
              >
                <Link href={`/design-cup?productId=${product.id}`}>
                  <Paintbrush className="size-3.5 mr-1" />
                  Thiết kế
                </Link>
              </Button>
            ) : (
              <AddToCartButton
                className="h-8 rounded-lg bg-[#DEF9EC] dark:bg-[#1b3d2f] hover:bg-[#3BB77E] hover:text-white text-[#3BB77E] dark:text-[#4ade80] font-bold text-xs transition-all duration-200 px-3 cursor-pointer border-0 shadow-none active:scale-[0.98]"
                product={product}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

