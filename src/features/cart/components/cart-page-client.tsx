"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Info } from "lucide-react";

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

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const freeShippingThreshold = 5_000_000;
  const progressPercent = Math.min((totals.subtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = freeShippingThreshold - totals.subtotal;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
      {/* Left Column: Cart items and status */}
      <div className="flex flex-col gap-6">
        {/* Free Shipping Tracker */}
        {items.length > 0 && (
          <Card className="border-[#E6DFD9] bg-white shadow-sm rounded-2xl overflow-hidden p-5">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#5C3D2E] uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="size-4 text-primary" /> Tiến trình ưu đãi giao nhận chành xe
                </span>
                <span className="font-bold text-primary">
                  {totals.subtotal >= freeShippingThreshold 
                    ? "Đã đạt ưu đãi!" 
                    : `Cần thêm ${formatCurrency(remainingForFreeShipping)}`}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-[#FAF8F6] rounded-full h-2.5 border border-[#E6DFD9]/60 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              
              <p className="text-[10px] text-[#7A6F68] leading-relaxed">
                {totals.subtotal >= freeShippingThreshold 
                  ? "🎉 Chúc mừng! Đơn hàng sỉ của bạn đã đủ điều kiện nhận miễn phí vận chuyển xe tải/chành xe toàn quốc." 
                  : `* Đơn hàng sỉ từ ${formatCurrency(freeShippingThreshold)} được miễn cước chành xe. Hãy mua thêm sản phẩm nguyên liệu hoặc ly nhựa để tiết kiệm chi phí.`}
              </p>
            </div>
          </Card>
        )}

        <Card className="border-[#E6DFD9] bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#FAF8F6] border-b border-[#E6DFD9]/60 py-4 px-6">
            <CardTitle className="text-sm font-bold text-[#5C3D2E] uppercase tracking-wider flex items-center justify-between">
              <span>Sản phẩm trong giỏ hàng ({totalItems})</span>
              {items.length > 0 && (
                <Link href="/products" className="text-primary hover:underline lowercase normal-case text-xs font-bold">
                  Thêm sản phẩm khác
                </Link>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 divide-y divide-[#E6DFD9]/40">
            {items.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-4">
                <div className="size-12 rounded-full bg-[#FAF8F6] flex items-center justify-center text-[#7A6F68]">
                  <ShoppingBag className="size-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917]">Giỏ hàng của bạn đang trống</h3>
                  <p className="text-xs text-[#7A6F68] mt-1">Quay lại catalog sản phẩm để lựa chọn nguyên liệu và in ly.</p>
                </div>
                <Link href="/products">
                  <Button className="bg-primary hover:bg-[#4A2E22] text-white px-6 py-2 rounded-xl text-xs font-bold">
                    Khám phá sản phẩm
                  </Button>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[100px_1fr_auto] items-start"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full rounded-xl border border-[#E6DFD9]/60 overflow-hidden bg-[#FAF8F6] flex items-center justify-center p-2">
                    {item.imageUrl && item.imageUrl.startsWith("data:") ? (
                      <img
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
                      {item.customConfig ? (
                        <span className="font-extrabold text-[#1C1917] text-sm sm:text-base leading-snug block">
                          {item.name}
                        </span>
                      ) : (
                        <Link href={`/products/${item.slug}`} className="font-extrabold text-[#1C1917] text-sm sm:text-base leading-snug hover:text-primary transition-colors">
                          {item.name}
                        </Link>
                      )}
                    </div>

                    {/* Show custom specifications if 3D customized */}
                    {item.customConfig && (
                      <div className="space-y-1 rounded-xl bg-[#FAF8F6] p-3 text-[10px] font-semibold text-[#7A6F68] border border-[#E6DFD9]/50 max-w-md">
                        <div className="text-[#5C3D2E] font-bold uppercase text-[9px] tracking-wider mb-1 flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-primary" /> Bản vẽ in ấn 3D tùy chỉnh:
                        </div>
                        <div>• Kiểu dáng: <span className="text-[#1C1917]">
                          {item.customConfig.style === "straight" ? "Ly thẳng classic" :
                           item.customConfig.style === "u_shape" ? "Ly bầu đáy tròn" :
                           item.customConfig.style === "heart" ? "Ly tim cao cấp" : "Cốc quai tiện dụng"}
                        </span></div>
                        <div>• Size cốc: <span className="text-[#1C1917]">{item.customConfig.size}</span></div>
                        <div>• Chất liệu: <span className="text-[#1C1917]">{item.customConfig.materialType}</span></div>
                        <div>• Màu nền ly: <span className="text-[#1C1917] font-mono">{item.customConfig.cupColor}</span></div>
                        {item.customConfig.promptUsed && (
                          <div className="line-clamp-2 mt-0.5">• Trí tuệ nhân tạo (AI Prompt): <span className="italic text-primary">&quot;{item.customConfig.promptUsed}&quot;</span></div>
                        )}
                      </div>
                    )}

                    <div className="text-xs font-semibold text-[#7A6F68] flex items-center gap-2">
                      <span>Đơn giá: {formatCurrency(item.price)}</span>
                      <span>•</span>
                      <span>Đơn vị: {item.unit}</span>
                    </div>

                    {/* Quantity selectors */}
                    <div className="pt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-[#E6DFD9] bg-white overflow-hidden shadow-xs">
                        <button
                          type="button"
                          className="px-2.5 py-1.5 hover:bg-[#FAF8F6] text-[#7A6F68] transition-colors border-r border-[#E6DFD9] active:scale-95"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-10 text-center text-xs font-extrabold text-[#1C1917]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1.5 hover:bg-[#FAF8F6] text-[#7A6F68] transition-colors border-l border-[#E6DFD9] active:scale-95"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
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
                      onClick={() => removeItem(item.productId)}
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

      {/* Right Column: Checkout Summary Card */}
      {items.length > 0 && (
        <div className="flex flex-col gap-4 sticky top-24">
          <Card className="border-[#E6DFD9] bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#FAF8F6] border-b border-[#E6DFD9]/60 py-4 px-6">
              <CardTitle className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider">
                Hóa đơn tạm tính B2B
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-xs space-y-2.5">
                <div className="flex justify-between text-[#7A6F68]">
                  <span>Tổng tiền hàng sỉ:</span>
                  <span className="font-bold text-[#1C1917]">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#7A6F68]">
                  <span>Cước xe vận chuyển:</span>
                  <span className={`font-bold ${totals.shippingFee === 0 ? "text-emerald-600" : "text-[#1C1917]"}`}>
                    {totals.shippingFee === 0 ? "Miễn phí" : formatCurrency(totals.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-[#7A6F68]">
                  <span>Thuế VAT dự kiến (8%):</span>
                  <span className="font-bold text-[#1C1917]">{formatCurrency(totals.tax)}</span>
                </div>
                
                <hr className="border-[#E6DFD9]/60" />
                
                <div className="flex justify-between text-sm items-baseline">
                  <span className="font-bold text-[#5C3D2E]">Tổng thanh toán:</span>
                  <span className="text-lg font-black text-primary">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>

              <Link href="/checkout" className="block pt-2">
                <Button className="w-full bg-primary hover:bg-[#4A2E22] text-white py-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                  Tiến hành thanh toán <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Customer assurance */}
          <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-4 flex items-start gap-3">
            <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#7A6F68] leading-relaxed">
              <strong>PBVM B2B Assurance:</strong> Quy trình sản xuất tự động khép kín. Hỗ trợ thiết kế và sửa đổi logo cho đến khi hoàn toàn ưng ý trước khi xuất bản khuôn in.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
