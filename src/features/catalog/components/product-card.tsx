import Image from "next/image";
import Link from "next/link";
import { Paintbrush } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <Card className="h-full">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </Link>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">{categoryCopy[product.category]}</Badge>
          <span className="text-xs text-muted-foreground">
            {product.stockSnapshot.toLocaleString("vi-VN")} còn
          </span>
        </div>
        <CardTitle className="text-base">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </CardTitle>
        <CardDescription>{product.productRefId}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold">
          {formatCurrency(product.price)}
        </div>
        <div className="text-xs text-muted-foreground">
          Giá B2B: {formatCurrency(product.b2bPrice)} / {product.unit}
        </div>
      </CardContent>
      <CardFooter>
        {product.fulfillmentType === "CUSTOM_PRINT" ? (
          <Button asChild className="w-full">
            <Link href={`/design-cup?productId=${product.id}`}>
              <Paintbrush data-icon="inline-start" />
              Thiết kế ly
            </Link>
          </Button>
        ) : (
          <AddToCartButton className="w-full" product={product} />
        )}
      </CardFooter>
    </Card>
  );
}
