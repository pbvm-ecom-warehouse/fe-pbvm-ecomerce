"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateCartTotals } from "@/features/cart/utils/cart";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/utils/format-currency";

export function CartPageClient() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const totals = calculateCartTotals(items);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Giỏ hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Giỏ hàng đang trống. Quay lại catalog để chọn sản phẩm.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[88px_1fr_auto]"
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <Link href={`/products/${item.slug}`} className="font-medium">
                    {item.name}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(item.price)} / {item.unit}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3 sm:block sm:text-right">
                  <div className="font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                  <Button
                    className="mt-2"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tạm tính</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Hàng hóa</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Giao hàng</span>
            <span>{formatCurrency(totals.shippingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT dự kiến</span>
            <span>{formatCurrency(totals.tax)}</span>
          </div>
          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Tổng</span>
            <span>{formatCurrency(totals.grandTotal)}</span>
          </div>
          <Button asChild className="w-full" disabled={items.length === 0}>
            <Link href="/checkout">Checkout</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
