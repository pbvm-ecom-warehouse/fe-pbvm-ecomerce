"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
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
  hasCustomPrintItems,
} from "@/features/cart/utils/cart";
import { CupConfigDetails } from "./cup-config-details";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency } from "@/utils/format-currency";
import { getOrder, cancelOrder } from "@/features/order/services/order.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const freeShippingThreshold = 5_000_000;

export function CartPageClient() {
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const toggleSelectItem = useCartStore((state) => state.toggleSelectItem);
  const toggleSelectAll = useCartStore((state) => state.toggleSelectAll);
  const restoreItems = useCartStore((state) => state.restoreItems);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const isCanceledParam = params.get("cancel") === "true" || params.get("canceled") === "true";
    const savedOrderId = sessionStorage.getItem("lastCreatedOrderId");

    if (isCanceledParam || savedOrderId) {
      const processCanceledOrder = async () => {
        if (savedOrderId) {
          if (!/^[0-9a-fA-F]{24}$/.test(savedOrderId)) {
            sessionStorage.removeItem("lastCreatedOrderId");
            if (isCanceledParam) {
              toast.info("Bạn đã hủy thanh toán đơn hàng.");
            }
          } else {
            try {
              toast.loading("Đang khôi phục sản phẩm vào giỏ hàng...", { id: "restore-cart" });
              const order = (await getOrder(savedOrderId)) as any;
            if (
              order &&
              order.paymentStatus === "UNPAID" &&
              order.orderStatus === "PLACED"
            ) {
              await cancelOrder(savedOrderId, "Khách hàng hủy thanh toán và quay về giỏ hàng");
              const cartItems = order.items.map((item: any) => {
                const isCustom = item.isPrintItem;
                let designFileSnapshot: any = undefined;
                if (item.designFile) {
                  try {
                    designFileSnapshot = typeof item.designFile === "string"
                      ? JSON.parse(item.designFile)
                      : item.designFile;
                  } catch {
                    // ignore
                  }
                }
                return {
                  cartItemId: isCustom
                    ? `custom:${item.sku}:${item.designId || ""}:${Date.now()}`
                    : `standard:${item.sku}`,
                  productId: item.sku,
                  productRefId: item.sku,
                  name: item.name || item.sku,
                  slug: item.sku,
                  price: item.unitPrice,
                  quantity: item.quantity,
                  unit: "cái",
                  imageUrl: designFileSnapshot?.previewDataUrl || "/images/product-placeholder.svg",
                  fulfillmentType: isCustom ? "CUSTOM_PRINT" : "STANDARD",
                  designId: item.designId ?? undefined,
                  designFile: designFileSnapshot,
                  selectedSize: designFileSnapshot?.artwork?.cup?.size,
                  selectedMaterial: designFileSnapshot?.artwork?.cup?.materialType,
                  selectedStyle: designFileSnapshot?.artwork?.cup?.style,
                };
              });
              await restoreItems(cartItems);
              toast.success("Đã hủy thanh toán. Các sản phẩm của bạn đã được khôi phục vào giỏ hàng!", { id: "restore-cart" });
            } else {
              toast.dismiss("restore-cart");
            }
          } catch (err) {
            console.error("Failed to restore canceled order to cart:", err);
            toast.dismiss("restore-cart");
          } finally {
            sessionStorage.removeItem("lastCreatedOrderId");
          }
        }
      } else if (isCanceledParam) {
          toast.info("Bạn đã hủy thanh toán đơn hàng.");
        }

        if (isCanceledParam) {
          const url = new URL(window.location.href);
          url.searchParams.delete("cancel");
          url.searchParams.delete("canceled");
          url.searchParams.delete("orderCode");
          window.history.replaceState({}, "", url.toString());
        }
      };

      processCanceledOrder();
    }
  }, [restoreItems]);

  // Filter selected items for calculations
  const selectedItems = items.filter((item) => item.selected !== false);
  const totals = calculateCartTotals(selectedItems);
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const progressPercent = Math.min(
    (totals.subtotal / freeShippingThreshold) * 100,
    100,
  );
  const remainingForFreeShipping = Math.max(
    freeShippingThreshold - totals.subtotal,
    0,
  );
  const hasCustomPrint = hasCustomPrintItems(selectedItems);

  return (
    <div className="w-full">
      <Card className="overflow-hidden rounded-2xl border-border bg-white p-0 shadow-sm">
        <CardHeader className="border-b border-border/70 bg-muted/40 px-6 py-4 flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-primary">
            <ShoppingBag className="size-4" />
            Sản phẩm trong giỏ ({items.length})
          </CardTitle>
          {items.length > 0 && (
            <div className="flex items-center gap-6">
              {/* Check all */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={items.every((item) => item.selected !== false)}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer transition-all accent-primary"
                />
                <span className="text-xs font-bold text-muted-foreground select-none">Chọn tất cả</span>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-primary hover:underline"
              >
                Thêm sản phẩm
              </Link>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6 divide-y divide-border/60">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-14 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                <ShoppingBag className="size-7" />
              </div>
              <div>
                <h2 className="text-base font-black">
                  Chưa có sản phẩm
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quay lại catalog để chọn nguyên liệu, ly in sẵn hoặc tự
                  thiết kế ly custom.
                </p>
              </div>
              <Button
                asChild
                className="h-11 rounded-xl bg-primary px-5 font-bold text-white hover:bg-[#2FA36E]"
              >
                <Link href="/products">Khám phá sản phẩm</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="grid gap-4 first:pt-0 sm:grid-cols-[auto_100px_1fr_auto] items-start"
                >
                  {/* Selection Checkbox */}
                  <div className="pt-8">
                    <input
                      type="checkbox"
                      checked={item.selected !== false}
                      onChange={() => toggleSelectItem(item.cartItemId)}
                      className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer transition-all accent-primary"
                    />
                  </div>

                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full rounded-xl border border-border bg-muted/40 flex items-center justify-center p-2">
                    {item.imageUrl && item.imageUrl.startsWith("data:") ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : item.imageUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover p-1"
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No image</span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1.5">
                    <div>
                      {item.fulfillmentType === "CUSTOM_PRINT" ? (
                        <span className="font-extrabold text-foreground text-sm sm:text-base leading-snug block">
                          {item.name}
                        </span>
                      ) : (
                        <Link href={`/products/${item.slug}`} className="font-extrabold text-foreground text-sm sm:text-base leading-snug hover:text-primary transition-colors">
                          {item.name}
                        </Link>
                      )}
                    </div>

                    {/* Configuration Details (Ly in / Ly plain / Nguyên liệu) */}
                    <CupConfigDetails item={item} />

                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <span>{formatCurrency(item.price)}</span>
                      <span>/ {item.unit}</span>
                    </div>

                    {/* Quantity selectors */}
                    <div className="pt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-border bg-white overflow-hidden shadow-xs">
                        <button
                          type="button"
                          className="px-2.5 py-1.5 hover:bg-muted text-muted-foreground transition-colors border-r border-border active:scale-95"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        >
                          <Minus className="size-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          aria-label="Số lượng sản phẩm trong giỏ"
                          className="w-10 text-center text-xs font-extrabold text-foreground bg-transparent outline-none border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1) {
                              updateQuantity(item.cartItemId, val);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="px-2.5 py-1.5 hover:bg-muted text-muted-foreground transition-colors border-l border-border active:scale-95"
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
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg h-9 w-9 shrink-0 transition-colors"
                      onClick={() => setDeletingItemId(item.cartItemId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="pt-6 space-y-6">
              {/* Progress bar / Free shipping bar */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] text-primary">
                    <Info className="size-4" />
                    Ưu đãi giao hàng sỉ
                  </span>
                  <span className="font-bold text-foreground">
                    {remainingForFreeShipping === 0
                      ? "Đã đạt miễn phí"
                      : `Cần thêm ${formatCurrency(remainingForFreeShipping)}`}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full border border-border bg-white">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] leading-5 text-muted-foreground">
                  Đơn từ {formatCurrency(freeShippingThreshold)} được miễn phí
                  giao chành xe theo chính sách tạm tính hiện tại.
                </p>
              </div>

              {/* Summary detail layout */}
              <div className="space-y-4 pt-2">
                {/* Custom cup and trust guidelines */}
                <div className="text-xs text-muted-foreground space-y-3 w-full">
                  {hasCustomPrint ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 leading-5">
                      Giỏ có ly in custom nên checkout chỉ hiển thị các phương thức
                      thanh toán online, không dùng COD.
                    </div>
                  ) : null}
                </div>

                {/* Calculation breakdown and Checkout CTA */}
                <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-4 w-full">
                  <div className="text-xs font-black uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
                    Chi tiết thanh toán ({totalItems} sản phẩm được chọn)
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between gap-4 text-muted-foreground">
                      <span>Tạm tính</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(totals.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-muted-foreground">
                      <span>Phí giao hàng</span>
                      <span className="font-bold text-foreground">
                        {totals.shippingFee === 0
                          ? "Miễn phí"
                          : formatCurrency(totals.shippingFee)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                    <span className="font-black text-primary text-sm">Tổng cộng</span>
                    <span className="text-xl font-black text-primary">
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>

                  <Button
                    asChild
                    className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#2FA36E] text-xs flex items-center justify-center gap-1.5"
                    disabled={selectedItems.length === 0}
                  >
                    {selectedItems.length > 0 ? (
                      user ? (
                        <Link href="/checkout">
                          Tiến hành thanh toán ({selectedItems.length})
                          <ArrowRight className="size-4" />
                        </Link>
                      ) : (
                        <Link href="/login?redirect=/checkout">
                          Đăng nhập để thanh toán ({selectedItems.length})
                          <ArrowRight className="size-4" />
                        </Link>
                      )
                    ) : (
                      <span className="cursor-not-allowed text-white/50">Chọn sản phẩm để thanh toán</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Item Deletion */}
      <Dialog open={deletingItemId !== null} onOpenChange={(open) => !open && setDeletingItemId(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-sm font-black text-[#253D4E] uppercase tracking-wider">
              Xác nhận xóa sản phẩm
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingItemId(null)}
              className="h-10 rounded-xl px-4 font-bold text-xs cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingItemId) {
                  removeItem(deletingItemId);
                  setDeletingItemId(null);
                }
              }}
              className="h-10 rounded-xl px-4 font-bold text-xs bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
