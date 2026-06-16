import Image from "next/image";
import Link from "next/link";
import { Box, Paintbrush, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/features/catalog/components/add-to-cart-button";
import type { CatalogProduct } from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";

const categoryCopy: Record<CatalogProduct["category"], string> = {
  ingredient: "Nguyên liệu",
  plain_cup: "Ly chưa in",
  printed_cup: "Ly đã in",
};

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const imageSrc = product.imageUrl || "/images/product-placeholder.svg";
  const isCustomPrint = product.fulfillmentType === "CUSTOM_PRINT";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E6DFD9] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#FAF8F6]">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge className="border-0 bg-white/90 text-[#5C3D2E] shadow-sm">
              {categoryCopy[product.category]}
            </Badge>
            {isCustomPrint ? (
              <Badge className="border-0 bg-primary text-white shadow-sm">
                <Sparkles className="mr-1 size-3" />
                Custom
              </Badge>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="min-h-[92px]">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#7A6F68]">
            <Box className="size-3.5 text-primary" />
            {product.productRefId}
          </div>
          <h3 className="line-clamp-2 text-base font-black leading-snug text-[#1C1917]">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className="mt-2 text-xs font-medium text-[#7A6F68]">
            Tồn kho:{" "}
            <span className="font-bold text-[#1C1917]">
              {product.stockSnapshot.toLocaleString("vi-VN")} {product.unit}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-3">
          <div className="text-xl font-black text-primary">
            {formatCurrency(product.b2bPrice)}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-[#7A6F68]">
            Giá lẻ tham chiếu: {formatCurrency(product.price)} / {product.unit}
          </div>
        </div>

        <div className="mt-auto">
          {isCustomPrint ? (
            <Button
              asChild
              className="h-10 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
            >
            <Link href={`/design-cup?productId=${product.id}`}>
              <Paintbrush data-icon="inline-start" />
              Thiết kế ly
            </Link>
            </Button>
          ) : (
            <AddToCartButton
              className="h-10 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
              product={product}
            />
          )}
        </div>
      </div>
    </article>
  );
}
