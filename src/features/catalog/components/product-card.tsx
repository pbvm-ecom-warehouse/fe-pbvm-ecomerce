import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/features/catalog/components/add-to-cart-button";
import type { CatalogProduct } from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";

const categoryCopy: Record<CatalogProduct["category"], string> = {
  ingredient: "Nguyên liệu",
  plain_cup: "Ly chưa in",
  printed_cup: "Ly đã in",
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
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const imageSrc = product.imageUrl || "/images/product-placeholder.svg";

  // Determine badge text and styles
  let badgeText = "";
  let badgeBgClass = "";

  if (product.price > product.b2bPrice) {
    const discount = Math.round(((product.price - product.b2bPrice) / product.price) * 100);
    badgeText = `-${discount}%`;
    badgeBgClass = "bg-[#D2B48C] text-[#1C1917]"; // Beige for discount
  } else if (product.slug.includes("tra-den") || product.slug.includes("ly-nhua-pp-500ml")) {
    badgeText = "Hot";
    badgeBgClass = "bg-[#5C3D2E] text-white"; // Espresso brown for Hot
  } else if (product.slug.includes("siro") || product.slug.includes("in-logo")) {
    badgeText = "Mới";
    badgeBgClass = "bg-[#A37B5C] text-white"; // Light brown for New
  }

  return (
    <div className="relative bg-white border border-[#E6DFD9] rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-primary/20 transition-all duration-300 group h-full">
      {/* Top Badge */}
      {badgeText && (
        <div className="absolute top-0 left-0 z-10">
          <span className={cn("inline-block px-3 py-1 text-[10px] font-bold rounded-tl-2xl rounded-br-2xl shadow-sm tracking-wide uppercase", badgeBgClass)}>
            {badgeText}
          </span>
        </div>
      )}

      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-square w-full mb-4 overflow-hidden rounded-xl bg-transparent flex items-center justify-center">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Product Metadata & Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <div className="text-[10px] text-[#7A6F68] font-bold tracking-wider uppercase mb-1">
            {categoryCopy[product.category] || "Sản phẩm"}
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-extrabold text-[#1C1917] leading-snug line-clamp-2 min-h-[2.5rem] hover:text-primary transition-colors">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[#7A6F68] font-medium">
            <Star className="size-3 fill-[#D2B48C] text-[#D2B48C]" />
            <span>({(4.0 + (product.name.length % 10) / 10).toFixed(1)})</span>
          </div>

          {/* Vendor */}
          <div className="text-[11px] text-[#7A6F68] font-medium mt-1">
            By <span className="text-primary font-bold hover:underline cursor-pointer">{getVendorName(product)}</span>
          </div>
        </div>

        {/* Pricing & Cart Action */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E6DFD9]/40">
          <div>
            <div className="text-sm sm:text-base font-extrabold text-primary">
              {formatCurrency(product.b2bPrice)}
            </div>
            {product.price > product.b2bPrice && (
              <div className="text-[10px] sm:text-xs text-[#7A6F68] line-through -mt-0.5">
                {formatCurrency(product.price)}
              </div>
            )}
          </div>

          <AddToCartButton
            product={product}
            variant="secondary"
            className="bg-[#EADEC9]/30 text-primary hover:bg-primary hover:text-[#FAF8F6] border-0 transition-colors font-bold text-xs h-8 px-3 rounded-md cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
