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
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, CreditCard, Truck, Receipt, ArrowRight, ShoppingBag, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { calculateCartTotals } from "@/features/cart/utils/cart";
import { formatCurrency } from "@/utils/format-currency";
import {
  calculateCartTotals,
  isCustomPrintCartItem,
} from "@/features/cart/utils/cart";
import {
  checkoutSchema,
  type CheckoutInput,
} from "@/features/checkout/schemas/checkout.schema";
import { createOrder } from "@/features/checkout/services/checkout.service";
import {
  getAvailablePaymentOptions,
  isPaymentProviderAllowed,
} from "@/features/payment/payment-options";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/utils/format-currency";

type SubmittedOrder = {
  orderId: string;
  offline?: boolean;
  total: number;
  paymentProvider: CheckoutInput["paymentProvider"];
};

const paymentIconMap: Record<CheckoutInput["paymentProvider"], typeof CreditCard> =
  {
    COD: Truck,
    VNPAY: Landmark,
    MOMO: CreditCard,
    ZALOPAY: CreditCard,
  };

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const totals = calculateCartTotals(items);
  const hasCustomPrint = items.some(isCustomPrintCartItem);
  const availablePaymentOptions = getAvailablePaymentOptions(items);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrder | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerType: "B2B",
      paymentProvider: "VNPAY",
      reqVAT: false,
      shippingMethod: "TRUCK",
    },
  });
  const selectedPayment = useWatch({ control, name: "paymentProvider" });

  if (submittedOrder) {
    return (
      <Card className="mx-auto max-w-xl rounded-2xl border-[#E6DFD9] bg-white p-0 text-center shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-9" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-normal">
              Đã tạo đơn hàng
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#7A6F68]">
              Mã đơn:{" "}
              <span className="font-black text-primary">
                {submittedOrder.orderId}
              </span>
              .{" "}
              {submittedOrder.offline
                ? "Đơn đã được lưu tạm để xử lý lại."
                : "Đơn đã được hệ thống tiếp nhận."}
            </p>
          </div>
          <div className="w-full rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#7A6F68]">Thanh toán</span>
              <span className="font-black text-[#1C1917]">
                {submittedOrder.paymentProvider}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span className="text-[#7A6F68]">Tổng</span>
              <span className="font-black text-primary">
                {formatCurrency(submittedOrder.total)}
              </span>
            </div>
          </div>
          <Button
            asChild
            className="h-11 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
          >
            <Link href="/products">Tiếp tục mua hàng</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="mx-auto max-w-md rounded-2xl border-[#E6DFD9] bg-white p-0 text-center shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#FAF8F6] text-[#7A6F68]">
            <ShoppingBag className="size-8" />
          </div>
          <div>
            <h2 className="text-lg font-black">Giỏ hàng đang trống</h2>
            <p className="mt-1 text-sm text-[#7A6F68]">
              Chọn sản phẩm trước khi tạo đơn checkout.
            </p>
          </div>
          <Button
            asChild
            className="h-11 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
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
        if (!isPaymentProviderAllowed(values.paymentProvider, items)) {
          toast.error("Đơn ly-in cần thanh toán online trước khi in");
          return;
        }

        setSubmitting(true);
        try {
          const order = await createOrder({
            ...values,
            items: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              isPrintItem: item.isPrintItem,
              designId: item.designId,
              designFile: item.designFile,
            })),
          });
          setSubmittedOrder({
            orderId: order.orderId,
            offline: order.offline,
            total: totals.grandTotal,
            paymentProvider: values.paymentProvider,
          });
          clearCart();
          toast.success(
            order.offline
              ? "Đã lưu đơn tạm trong chế độ fallback"
              : "Đã tạo đơn hàng",
          );
        } finally {
          setSubmitting(false);
        }
      })}
    >
      <div className="space-y-5">
        <Card className="overflow-hidden rounded-2xl border-[#E6DFD9] bg-white p-0 shadow-sm">
          <CardHeader className="border-b border-[#E6DFD9]/70 bg-[#FAF8F6] px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-primary">
              <Truck className="size-4" />
              Thông tin giao nhận
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            {hasCustomPrint ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-6 text-[#7A6F68]">
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
                className="h-11 rounded-xl border-[#E6DFD9] bg-white"
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
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#E6DFD9] bg-white">
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
                  className="h-11 rounded-xl border-[#E6DFD9] bg-white"
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
                className="h-11 rounded-xl border-[#E6DFD9] bg-white"
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
                className="min-h-24 rounded-xl border-[#E6DFD9] bg-white text-sm"
                {...register("note")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-[#E6DFD9] bg-white p-0 shadow-sm">
          <CardHeader className="border-b border-[#E6DFD9]/70 bg-[#FAF8F6] px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-primary">
              <CreditCard className="size-4" />
              Thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
            {availablePaymentOptions.map((option) => {
              const Icon = paymentIconMap[option.value];
              const active = selectedPayment === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`flex min-h-24 items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                    active
                      ? "border-primary bg-[#FAF8F6]"
                      : "border-[#E6DFD9] bg-white hover:border-[#D2B48C]"
                  }`}
                  onClick={() =>
                    setValue("paymentProvider", option.value, {
                      shouldValidate: true,
                    })
                  }
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#1C1917]">
                      {option.label}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-[#7A6F68]">
                      {option.value === "COD"
                        ? "Chỉ dùng cho hàng sẵn, không áp dụng ly-in custom."
                        : "Thanh toán online trước khi xác nhận đơn."}
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-36">
        <Card className="overflow-hidden rounded-2xl border-[#E6DFD9] bg-white p-0 shadow-sm">
          <CardHeader className="border-b border-[#E6DFD9]/70 bg-[#FAF8F6] px-6 py-4">
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
          <CardContent className="space-y-4 p-6">
            <div className="max-h-[320px] divide-y divide-[#E6DFD9]/70 overflow-y-auto pr-1">
              {items.map((item) => {
                const itemKey = item.cartItemId ?? item.productId;
                const previewSrc = item.designFile?.previewDataUrl || item.imageUrl;
                const isCustomPrint = isCustomPrintCartItem(item);

                return (
                  <div key={itemKey} className="flex gap-3 py-3 first:pt-0">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-[#E6DFD9] bg-[#FAF8F6]">
                      {previewSrc ? (
                        <Image
                          src={previewSrc}
                          alt={item.name}
                          fill
                          unoptimized={previewSrc.startsWith("data:")}
                          className="object-contain p-1.5"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black">
                        {item.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#7A6F68]">
                        {isCustomPrint ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Paintbrush className="size-3" />
                            {item.designFile?.name ?? "Custom print"}
                          </span>
                        ) : (
                          <span>{item.unit}</span>
                        )}
                        <span>•</span>
                        <span>
                          {formatCurrency(item.price)} x {item.quantity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs font-black text-[#1C1917]">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2.5 border-t border-[#E6DFD9] pt-4 text-sm">
              <div className="flex justify-between gap-4 text-[#7A6F68]">
                <span>Tạm tính</span>
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
              <div className="flex items-baseline justify-between gap-4 border-t border-[#E6DFD9] pt-4">
                <span className="font-black text-primary">Tổng</span>
                <span className="text-xl font-black text-primary">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
            >
              {submitting ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
