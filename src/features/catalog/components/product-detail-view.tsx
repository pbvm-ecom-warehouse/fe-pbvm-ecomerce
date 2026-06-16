import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgePercent,
  Box,
  FileText,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddToCartButton } from "@/features/catalog/components/add-to-cart-button";
import type { CatalogProduct } from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";

const categoryCopy: Record<CatalogProduct["category"], string> = {
  ingredient: "Nguyên liệu",
  plain_cup: "Ly chưa in",
  printed_cup: "Ly đã in",
};

function getSpecs(product: CatalogProduct) {
  return [
    {
      label: "Quy cách",
      value:
        product.category === "ingredient"
          ? "Bao/thùng theo lô nhập WMS"
          : "Thùng hoặc cây ly theo SKU",
    },
    {
      label: "Fulfillment",
      value: product.fulfillmentType ?? "STANDARD",
    },
    {
      label: "Tồn kho",
      value: `${product.stockSnapshot.toLocaleString("vi-VN")} ${product.unit}`,
    },
    {
      label: "Mã hàng",
      value: product.productRefId,
    },
  ];
}

export function ProductDetailView({ product }: { product: CatalogProduct }) {
  const imageSrc = product.imageUrl || "/images/product-placeholder.svg";
  const isCustomPrint = product.fulfillmentType === "CUSTOM_PRINT";
  const specs = getSpecs(product);

  return (
    <main className="min-h-screen bg-[#FAF8F6] px-4 py-8 text-[#1C1917]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Link
          href="/products"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[#7A6F68] transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Quay lại danh mục sản phẩm
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#E6DFD9] bg-white p-8 shadow-sm">
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                priority
                className="object-contain p-6"
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge className="border-0 bg-primary text-white">
                  {categoryCopy[product.category]}
                </Badge>
                {product.price > product.b2bPrice ? (
                  <Badge className="border-0 bg-emerald-600 text-white">
                    <BadgePercent className="mr-1 size-3" />
                    Giá sỉ
                  </Badge>
                ) : null}
              </div>
            </div>

            <Card className="overflow-hidden rounded-2xl border-[#E6DFD9] bg-white shadow-sm">
              <CardHeader className="border-b border-[#E6DFD9]/60 bg-[#FAF8F6]">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#5C3D2E]">
                  <FileText className="size-4 text-primary" />
                  Thông số sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-4"
                  >
                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7A6F68]">
                      {spec.label}
                    </div>
                    <div className="mt-1 text-sm font-black text-[#1C1917]">
                      {spec.value}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <Card className="overflow-hidden rounded-2xl border-[#E6DFD9] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-[#D2B48C]">
                  SKU: {product.productRefId}
                </Badge>
                {isCustomPrint ? (
                  <Badge className="border-0 bg-primary text-white">
                    <Sparkles className="mr-1 size-3" />
                    Ly in custom
                  </Badge>
                ) : null}
              </div>

              <h1 className="mt-4 text-2xl font-black leading-tight tracking-normal">
                {product.name}
              </h1>

              <div className="mt-5 rounded-2xl border border-[#E6DFD9] bg-[#FAF8F6] p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7A6F68]">
                  Giá B2B
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary">
                    {formatCurrency(product.b2bPrice)}
                  </span>
                  <span className="text-xs font-bold text-[#7A6F68]">
                    / {product.unit}
                  </span>
                </div>
                <div className="mt-1 text-xs font-medium text-[#7A6F68]">
                  Giá lẻ tham chiếu: {formatCurrency(product.price)}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#E6DFD9] bg-white p-4 text-xs text-[#7A6F68]">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Tồn kho ecommerce</span>
                  <span className="font-black text-[#1C1917]">
                    {product.stockSnapshot.toLocaleString("vi-VN")}{" "}
                    {product.unit}
                  </span>
                </div>
                <p className="mt-2 leading-5">
                  Tồn kho sẽ được xác nhận lại khi đặt hàng và chọn kho xuất
                  phù hợp.
                </p>
              </div>

              <div className="mt-5">
                {isCustomPrint ? (
                  <Button
                    asChild
                    className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
                  >
                    <Link href={`/design-cup?productId=${product.id}`}>
                      <Paintbrush data-icon="inline-start" />
                      Mở xưởng thiết kế 3D
                    </Link>
                  </Button>
                ) : (
                  <AddToCartButton
                    className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
                    product={product}
                  />
                )}
              </div>
            </Card>

            <div className="grid gap-3">
              <div className="flex items-start gap-3 rounded-xl border border-[#E6DFD9] bg-white p-4">
                <ShieldCheck className="mt-0.5 size-5 text-primary" />
                <p className="text-xs leading-5 text-[#7A6F68]">
                  Sản phẩm đồng bộ từ WMS, giá và tồn kho được cập nhật theo
                  dữ liệu vận hành.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[#E6DFD9] bg-white p-4">
                <Truck className="mt-0.5 size-5 text-primary" />
                <p className="text-xs leading-5 text-[#7A6F68]">
                  Đơn hàng sỉ hỗ trợ giao chành xe, hàng sẵn vẫn có thể dùng COD.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[#E6DFD9] bg-white p-4">
                <Box className="mt-0.5 size-5 text-primary" />
                <p className="text-xs leading-5 text-[#7A6F68]">
                  Ly custom cần mẫu thiết kế và thanh toán online trước khi mở
                  lệnh in.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
