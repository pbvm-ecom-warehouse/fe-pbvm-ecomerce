"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const availablePaymentOptions = getAvailablePaymentOptions(items);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerType: "B2B",
      paymentProvider: "VNPAY",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin checkout</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
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
          {items.some((item) => item.isPrintItem) ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              Đơn ly-in cần thanh toán online trước khi mở lệnh in.
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="customerName">Người nhận</Label>
            <Input id="customerName" {...register("customerName")} />
            {errors.customerName ? (
              <p className="text-xs text-destructive">
                {errors.customerName.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nhóm khách</Label>
              <Select
                defaultValue="B2B"
                onValueChange={(value) =>
                  setValue(
                    "customerType",
                    value as CheckoutInput["customerType"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2B">B2B - shop trà sữa</SelectItem>
                  <SelectItem value="B2C">B2C - khách lẻ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone ? (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Địa chỉ giao hàng</Label>
            <Input id="address" {...register("address")} />
            {errors.address ? (
              <p className="text-xs text-destructive">
                {errors.address.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label>Thanh toán</Label>
            <Select
              defaultValue="VNPAY"
              onValueChange={(value) =>
                setValue(
                  "paymentProvider",
                  value as CheckoutInput["paymentProvider"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePaymentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea id="note" {...register("note")} />
          </div>
          <Button type="submit" disabled={submitting || items.length === 0}>
            {submitting ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
