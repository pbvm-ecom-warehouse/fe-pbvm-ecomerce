"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Info,
  Minus,
  Paintbrush,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateCartTotals,
  isCustomPrintCartItem,
} from "@/features/cart/utils/cart";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/utils/format-currency";

const freeShippingThreshold = 5_000_000;

export function CartPageClient() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const totals = calculateCartTotals(items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const progressPercent = Math.min(
    (totals.subtotal / freeShippingThreshold) * 100,
    100,
  );
  const remainingForFreeShipping = Math.max(
    freeShippingThreshold - totals.subtotal,
    0,
  );
  const hasCustomPrint = items.some(isCustomPrintCartItem);


  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_370px]">
      <div className="space-y-5">
        {items.length > 0 ? (
          <Card className="rounded-2xl border-[#E6DFD9] bg-white p-0 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] text-primary">
                  <Info className="size-4" />
                  Ưu đãi giao hàng sỉ
                </span>
                <span className="font-bold text-[#1C1917]">
                  {remainingForFreeShipping === 0
                    ? "Đã đạt miễn phí"
                    : `Cần thêm ${formatCurrency(remainingForFreeShipping)}`}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full border border-[#E6DFD9] bg-[#FAF8F6]">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs leading-5 text-[#7A6F68]">
                Đơn từ {formatCurrency(freeShippingThreshold)} được miễn phí
                giao chành xe theo chính sách tạm tính hiện tại.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="overflow-hidden rounded-2xl border-[#E6DFD9] bg-white p-0 shadow-sm">
          <CardHeader className="border-b border-[#E6DFD9]/70 bg-[#FAF8F6] px-6 py-4">
            <CardTitle className="flex items-center justify-between gap-4 text-sm font-black uppercase tracking-[0.14em] text-primary">
              <span>Sản phẩm trong giỏ ({totalItems})</span>
              {items.length > 0 ? (
                <Link
                  href="/products"
                  className="text-xs normal-case tracking-normal hover:underline"
                >
                  Thêm sản phẩm
                </Link>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-14 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#FAF8F6] text-[#7A6F68]">
                  <ShoppingBag className="size-7" />
                </div>
                <div>
                  <h2 className="text-base font-black">
                    Chưa có sản phẩm nào
                  </h2>
                  <p className="mt-1 text-sm text-[#7A6F68]">
                    Quay lại catalog để chọn nguyên liệu, ly in sẵn hoặc tự
                    thiết kế ly custom.
                  </p>
                </div>
                <Button
                  asChild
                  className="h-11 rounded-xl bg-primary px-5 font-bold text-white hover:bg-[#4A2E22]"
                >
                  <Link href="/products">Khám phá sản phẩm</Link>
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[100px_1fr_auto] items-start"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full rounded-xl border border-[#E6DFD9]/60 overflow-hidden bg-[#FAF8F6] flex items-center justify-center p-2">
                    {item.imageUrl && item.imageUrl.startsWith("data:") ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover p-1"
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No image</span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1.5">
                    <div>
                      {item.fulfillmentType === "CUSTOM_PRINT" ? (
                        <span className="font-extrabold text-[#1C1917] text-sm sm:text-base leading-snug block">
                          {item.name}
                        </span>
                      ) : (
                        <Link href={`/products/${item.slug}`} className="font-extrabold text-[#1C1917] text-sm sm:text-base leading-snug hover:text-primary transition-colors">
                          {item.name}
                        </Link>
                      )}
                    </div>

                    {item.fulfillmentType === "CUSTOM_PRINT" && item.designFile && (
                      <div className="space-y-1 rounded-xl bg-[#FAF8F6] p-3 text-[10px] font-semibold text-[#7A6F68] border border-[#E6DFD9]/50 max-w-md">
                        <div className="text-[#5C3D2E] font-bold uppercase text-[9px] tracking-wider mb-1 flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-primary" /> Bản in CUSTOM_PRINT:
                        </div>
                        <div>• Design ID: <span className="text-[#1C1917]">{item.designId}</span></div>
                        <div>• Size cốc: <span className="text-[#1C1917]">{item.designFile.artwork.cup.size}</span></div>
                        <div>• Chất liệu: <span className="text-[#1C1917]">{item.designFile.artwork.cup.materialType}</span></div>
                        <div>• Chiều cao in: <span className="text-[#1C1917]">{item.designFile.artwork.artboard.printHeightPercent}%</span></div>
                        <div>• Layers: <span className="text-[#1C1917]">{item.designFile.artwork.layers.length}</span></div>
                      </div>

                      <div className="min-w-0 space-y-2">
                        <div>
                          <Link
                            href={`/products/${item.slug}`}
                            className="text-base font-black leading-tight transition-colors hover:text-primary"
                          >
                            {item.name}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#7A6F68]">
                            <span>{formatCurrency(item.price)}</span>
                            <span>/ {item.unit}</span>
                          </div>
                        </div>

                    {/* Quantity selectors */}
                    <div className="pt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-[#E6DFD9] bg-white overflow-hidden shadow-xs">
                        <button
                          type="button"
                          className="px-2.5 py-1.5 hover:bg-[#FAF8F6] text-[#7A6F68] transition-colors border-r border-[#E6DFD9] active:scale-95"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-10 text-center text-xs font-extrabold text-[#1C1917]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1.5 hover:bg-[#FAF8F6] text-[#7A6F68] transition-colors border-l border-[#E6DFD9] active:scale-95"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions and total */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                    <div className="font-extrabold text-primary text-sm sm:text-base">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-[#7A6F68] hover:text-red-500 hover:bg-red-50 rounded-lg h-9 w-9 shrink-0 transition-colors"
                      onClick={() => removeItem(item.cartItemId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-36">
        <Card className="overflow-hidden rounded-2xl border-[#E6DFD9] bg-white p-0 shadow-sm">
          <CardHeader className="border-b border-[#E6DFD9]/70 bg-[#FAF8F6] px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-primary">
              <FileText className="size-4" />
              Hóa đơn tạm tính
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 text-sm">
            <div className="space-y-2.5">
              <div className="flex justify-between gap-4 text-[#7A6F68]">
                <span>Hàng hóa</span>
                <span className="font-bold text-[#1C1917]">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-[#7A6F68]">
                <span>Giao hàng</span>
                <span className="font-bold text-[#1C1917]">
                  {totals.shippingFee === 0
                    ? "Miễn phí"
                    : formatCurrency(totals.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-[#7A6F68]">
                <span>VAT dự kiến</span>
                <span className="font-bold text-[#1C1917]">
                  {formatCurrency(totals.tax)}
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-4 border-t border-[#E6DFD9] pt-4">
              <span className="font-black text-primary">Tổng</span>
              <span className="text-xl font-black text-primary">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>

            {hasCustomPrint ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-[#7A6F68]">
                Giỏ có ly in custom nên checkout chỉ hiển thị các phương thức
                thanh toán online, không dùng COD.
              </div>
            ) : null}

            <Button
              asChild
              className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
              disabled={items.length === 0}
            >
              <Link href="/checkout">
                Tiến hành thanh toán
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-4 text-xs leading-5 text-[#7A6F68]">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <span>
            Ly custom được lưu kèm mã thiết kế và file mẫu để xưởng in xử lý.
          </span>
        </div>
      </aside>
    </div>
  );
}
