"use client";

import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Landmark,
  Paintbrush,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { calculateCartTotals } from "@/features/cart/utils/cart";
import {
  cartRequiresOnlinePayment,
  getPaymentOptionsForCart,
  isPaymentAllowedForCart,
} from "@/features/payment/payment-options";
import { formatCurrency } from "@/utils/format-currency";

import {
  checkoutSchema,
  type CheckoutInput,
} from "@/features/checkout/schemas/checkout.schema";
import { createOrder, mapCartItemsToCheckoutItems } from "@/features/checkout/services/checkout.service";

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const totals = calculateCartTotals(items);
  const availablePaymentOptions = getPaymentOptionsForCart(items);
  const requiresOnlinePayment = cartRequiresOnlinePayment(items);
  const hasCustomPrint = items.some((item) => item.fulfillmentType === "CUSTOM_PRINT");

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{
    orderId: string;
    offline?: boolean;
    paymentProvider: string;
  } | null>(null);

  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: user?.name || "",
      phone: user?.phone || "",
      customerType: user?.type || "B2B",
      paymentProvider: "VNPAY",
      shippingMethod: "TRUCK",
    },
  });

  useEffect(() => {
    if (user) {
      setValue("customerName", user.name || "");
      setValue("phone", user.phone || "");
      setValue("customerType", user.type || "B2B");
    }
  }, [user, setValue]);
  const selectedPayment = useWatch({ control, name: "paymentProvider" });

  const handleOrderFinish = () => {
    clearCart();
    window.location.href = "/";
  };

  if (isSubmitted && submittedOrder) {
    return (
      <Card className="mx-auto max-w-xl rounded-2xl border-border bg-white p-0 text-center shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-9" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-normal text-foreground">
              Đặt Hàng Thành Công!
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Cảm ơn bạn đã lựa chọn PBVM. Mã đơn hàng của bạn là{" "}
              <span className="font-black text-primary">
                #{submittedOrder.orderId}
              </span>
              .{" "}
              {submittedOrder.offline
                ? "Đơn đã được lưu tạm để xử lý lại."
                : "Đơn đã được hệ thống tiếp nhận."}
            </p>
          </div>

          {submittedOrder.paymentProvider === "COD" ? (
            <div className="w-full rounded-2xl bg-muted/40 p-4 text-left border border-border text-xs space-y-1.5">
              <div className="font-bold text-[#253D4E] uppercase tracking-wider text-[10px] mb-1">
                Phương thức thanh toán: COD
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Bạn sẽ thanh toán số tiền tổng cộng bằng tiền mặt cho nhân viên giao hàng chành xe hoặc bưu tá khi nhận sản phẩm.
              </p>
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-muted/40 p-5 text-left border border-border text-xs space-y-3">
              <div className="font-bold text-[#253D4E] uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-border pb-2">
                <Landmark className="size-4 text-primary" /> Hướng dẫn chuyển khoản ngân hàng
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Ngân hàng:</span>
                <span className="col-span-2 font-bold text-foreground">Techcombank (TCB)</span>

                <span className="text-muted-foreground">Số tài khoản:</span>
                <span className="col-span-2 font-bold text-primary text-sm">19035678901234</span>

                <span className="text-muted-foreground">Chủ tài khoản:</span>
                <span className="col-span-2 font-bold text-foreground">CONG TY CP IN AN BAO BI PBVM</span>

                <span className="text-muted-foreground">Số tiền:</span>
                <span className="col-span-2 font-black text-[#253D4E] text-sm">{formatCurrency(totals.grandTotal)}</span>

                <span className="text-muted-foreground">Nội dung CK:</span>
                <span className="col-span-2 font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] w-fit">
                  {submittedOrder.orderId}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic border-t border-border pt-2">
                * Vui lòng chuyển đúng số tiền và nội dung chuyển khoản để hệ thống tự động xác nhận đơn hàng trong 1-3 phút.
              </p>
            </div>
          )}

          <Button
            onClick={handleOrderFinish}
            className="w-full bg-primary hover:bg-[#2F9A68] text-white py-6 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md"
          >
            Quay lại Trang chủ
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="mx-auto max-w-md rounded-2xl border-border bg-white p-0 text-center shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag className="size-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Giỏ hàng đang trống</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn sản phẩm trước khi tạo đơn checkout.
            </p>
          </div>
          <Button
            asChild
            className="h-11 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#2FA36E]"
          >
            <Link href="/products">Khám phá catalog</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_430px]"
      onSubmit={handleSubmit(async (values) => {
        if (!isPaymentAllowedForCart(values.paymentProvider, items)) {
          toast.error("Đơn ly in cần thanh toán online trước khi sản xuất.");
          return;
        }

        try {
          const order = await createOrder({
            ...values,
            items: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              fulfillmentType: item.fulfillmentType,
              designId: item.designId,
              designFile: item.designFile,
            })),
          });
          if (order.paymentUrl) {
            toast.success("Đang chuyển hướng sang cổng thanh toán...");
            clearCart();
            window.location.href = order.paymentUrl;
            return;
          }
          setSubmittedOrder({
            orderId: order.orderId,
            offline: order.offline,
            paymentProvider: values.paymentProvider,
          });
          setIsSubmitted(true);
          clearCart();
          toast.success(
            order.offline
              ? "Đã lưu đơn tạm trong chế độ fallback"
              : "Đã tạo đơn hàng",
          );
        } catch (error) {
          toast.error("Có lỗi xảy ra khi tạo đơn hàng.");
        }
      })}
    >
      <div className="space-y-5">
        <Card className="overflow-hidden rounded-2xl border-border bg-white p-0 shadow-sm">
          <CardHeader className="border-b border-border/70 bg-muted/40 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-primary">
              <Truck className="size-4" />
              Thông tin giao nhận
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            {hasCustomPrint ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-6 text-muted-foreground">
                Đơn có ly-in custom nên COD bị ẩn. Mẫu thiết kế sẽ đi kèm từng
                sản phẩm in riêng.
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label
                htmlFor="customerName"
                className="text-xs font-black text-primary"
              >
                Người nhận
              </Label>
              <Input
                id="customerName"
                placeholder="Nguyễn Văn A"
                className="h-11 rounded-xl border-border bg-white"
                {...register("customerName")}
              />
              {errors.customerName ? (
                <p className="text-xs font-bold text-destructive">
                  {errors.customerName.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-xs font-black text-primary">
                  Nhóm khách
                </Label>
                <Select
                  defaultValue="B2B"
                  onValueChange={(value) =>
                    setValue(
                      "customerType",
                      value as CheckoutInput["customerType"],
                      { shouldValidate: true },
                    )
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-border bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B2B">B2B - shop trà sữa</SelectItem>
                    <SelectItem value="B2C">B2C - khách lẻ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="phone"
                  className="text-xs font-black text-primary"
                >
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  placeholder="0900000000"
                  className="h-11 rounded-xl border-border bg-white"
                  {...register("phone")}
                />
                {errors.phone ? (
                  <p className="text-xs font-bold text-destructive">
                    {errors.phone.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="address"
                className="text-xs font-black text-primary"
              >
                Địa chỉ giao hàng
              </Label>
              <Input
                id="address"
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                className="h-11 rounded-xl border-border bg-white"
                {...register("address")}
              />
              {errors.address ? (
                <p className="text-xs font-bold text-destructive">
                  {errors.address.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note" className="text-xs font-black text-primary">
                Ghi chú
              </Label>
              <Textarea
                id="note"
                placeholder="Giao giờ hành chính, gọi trước khi giao..."
                className="min-h-24 rounded-xl border-border bg-white text-sm"
                {...register("note")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border bg-white p-0 shadow-sm">
          <CardHeader className="border-b border-border/70 bg-muted/40 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-primary">
              <CreditCard className="size-4" />
              Thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {requiresOnlinePayment && (
              <div className="mb-4 rounded-xl border border-primary/20 bg-muted/40 p-3 text-[11px] font-semibold text-[#253D4E]">
                Giỏ có ly in CUSTOM_PRINT, cần thanh toán online trước khi xưởng mở lệnh in.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availablePaymentOptions.map((option) => {
                const isCod = option.value === "COD";
                const selected = selectedPayment === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setValue("paymentProvider", option.value);
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${selected
                        ? "border-primary bg-muted/40 text-primary"
                        : "border-border bg-white text-muted-foreground hover:border-primary"
                      }`}
                  >
                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${isCod ? "bg-amber-50" : "bg-sky-50"}`}>
                      {isCod ? (
                        <Truck className="size-5 text-amber-600" />
                      ) : (
                        <CreditCard className="size-5 text-sky-600" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-foreground">
                        {isCod ? "Giao hàng thu tiền (COD)" : option.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {isCod
                          ? "Thanh toán mặt cho nhà xe chành xe khi nhận"
                          : "Thanh toán online hoặc quét mã QR nhanh"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-36">
        <Card className="overflow-hidden rounded-2xl border-border bg-white p-0 shadow-sm">
          <CardHeader className="border-b border-border/70 bg-muted/40 px-6 py-4">
            <CardTitle className="flex items-center justify-between gap-4 text-xs font-black uppercase tracking-[0.14em] text-primary">
              <span>Đơn hàng ({items.length})</span>
              <Link
                href="/cart"
                className="normal-case tracking-normal hover:underline"
              >
                Sửa giỏ
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-4">
            {/* List of items */}
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.cartItemId} className="flex gap-3 py-3 items-start first:pt-0 last:pb-0">
                  {/* Thumbnail */}
                  <div className="relative size-12 rounded-lg border border-border bg-muted/40 shrink-0 overflow-hidden flex items-center justify-center">
                    {item.imageUrl && item.imageUrl.startsWith("data:") ? (
                      <img src={item.imageUrl} alt={item.name} className="size-10 object-contain p-1" />
                    ) : item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <span className="text-[8px] text-muted-foreground">No img</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate leading-tight">{item.name}</h4>
                    {item.fulfillmentType === "CUSTOM_PRINT" && item.designFile ? (
                      <p className="text-[9px] text-primary font-bold mt-0.5">
                        CUSTOM_PRINT • Size {item.designFile.artwork.cup.size} • {item.designFile.artwork.layers.length} layers
                      </p>
                    ) : (
                      <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Quy cách tiêu chuẩn • {item.unit}</p>
                    )}
                    <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground font-medium">
                      <span>{formatCurrency(item.price)} x {item.quantity}</span>
                      <span className="font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Tạm tính</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Giao hàng</span>
                <span className="font-bold text-foreground">
                  {totals.shippingFee === 0
                    ? "Miễn phí"
                    : formatCurrency(totals.shippingFee)}
                </span>
              </div>
               <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                 <span className="font-black text-[#253D4E]">Tổng</span>
                 <span className="text-xl font-black text-[#253D4E]">
                   {formatCurrency(totals.grandTotal)}
                 </span>
               </div>
            </div>

             <Button
               type="submit"
               disabled={isSubmitting}
               className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#2F9A68]"
             >
               {isSubmitting ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
               <ArrowRight data-icon="inline-start" />
            </Button>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
