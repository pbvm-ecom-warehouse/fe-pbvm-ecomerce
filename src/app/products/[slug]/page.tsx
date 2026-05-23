import Image from "next/image";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddToCartButton } from "@/features/catalog/components/add-to-cart-button";
import { getCatalogProductBySlug } from "@/features/catalog/services/catalog.service";
import { formatCurrency } from "@/utils/format-currency";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const imageSrc = product.imageUrl || "/images/product-placeholder.svg";

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_420px]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-card">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>
      <Card>
        <CardHeader>
          <Badge variant="secondary">{product.productRefId}</Badge>
          <CardTitle className="text-2xl">{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-3xl font-semibold">
              {formatCurrency(product.price)}
            </div>
            <div className="text-sm text-muted-foreground">
              Giá B2B: {formatCurrency(product.b2bPrice)} / {product.unit}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            Stock snapshot:{" "}
            <span className="font-semibold">
              {product.stockSnapshot.toLocaleString("vi-VN")} {product.unit}
            </span>
            . Checkout sẽ gọi WMS realtime để chọn kho xuất.
          </div>
          <AddToCartButton className="w-full" product={product} />
        </CardContent>
      </Card>
    </main>
  );
}
