"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  checkoutSchema,
  type CheckoutInput,
} from "@/features/checkout/schemas/checkout.schema";

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const totals = calculateCartTotals(items);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reqVAT, setReqVAT] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("VNPAY");

  const {
    register,
    handleSubmit,
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

  const onSubmit = (data: CheckoutInput) => {
    // Mock API call
    setIsSubmitted(true);
    toast.success("Đặt hàng thành công!");
  };

  const handleOrderFinish = () => {
    clearCart();
    window.location.href = "/";
  };

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center animate-in fade-in duration-300">
        <Card className="border-[#E6DFD9] bg-white shadow-xl p-8 rounded-3xl">
          <CardContent className="flex flex-col items-center gap-6 pt-6">
            <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="size-10" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-[#1C1917]">Đặt Hàng Thành Công!</h2>
              <p className="text-xs text-[#7A6F68] mt-1.5 leading-relaxed">
                Cảm ơn bạn đã lựa chọn PBVM. Mã đơn hàng của bạn là <span className="font-bold text-primary">#PBVM-{Math.floor(100000 + Math.random() * 900000)}</span>.
              </p>
            </div>

            {selectedPayment === "COD" ? (
              <div className="w-full rounded-2xl bg-[#FAF8F6] p-4 text-left border border-[#E6DFD9]/60 text-xs space-y-1.5">
                <div className="font-bold text-[#5C3D2E] uppercase tracking-wider text-[10px] mb-1">Phương thức thanh toán: COD</div>
                <p className="text-[#7A6F68] leading-relaxed">Bạn sẽ thanh toán số tiền tổng cộng bằng tiền mặt cho nhân viên giao hàng chành xe hoặc bưu tá khi nhận sản phẩm.</p>
              </div>
            ) : (
              <div className="w-full rounded-2xl bg-[#FAF8F6] p-5 text-left border border-[#E6DFD9]/60 text-xs space-y-3">
                <div className="font-bold text-[#5C3D2E] uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-[#E6DFD9] pb-2">
                  <Landmark className="size-4" /> Hướng dẫn chuyển khoản ngân hàng
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-[#7A6F68]">Ngân hàng:</span>
                  <span className="col-span-2 font-bold text-[#1C1917]">Techcombank (TCB)</span>
                  
                  <span className="text-[#7A6F68]">Số tài khoản:</span>
                  <span className="col-span-2 font-bold text-primary text-sm">19035678901234</span>
                  
                  <span className="text-[#7A6F68]">Chủ tài khoản:</span>
                  <span className="col-span-2 font-bold text-[#1C1917]">CONG TY CP IN AN BAO BI PBVM</span>
                  
                  <span className="text-[#7A6F68]">Số tiền:</span>
                  <span className="col-span-2 font-black text-primary text-sm">{formatCurrency(totals.grandTotal)}</span>
                  
                  <span className="text-[#7A6F68]">Nội dung CK:</span>
                  <span className="col-span-2 font-mono font-bold bg-[#EADEC9]/30 text-primary px-2 py-0.5 rounded text-[10px] w-fit">
                    PBVM {Math.floor(100000 + Math.random() * 900000)}
                  </span>
                </div>
                <p className="text-[10px] text-[#7A6F68] leading-relaxed italic border-t border-[#E6DFD9]/60 pt-2">
                  * Vui lòng chuyển đúng số tiền và nội dung chuyển khoản để hệ thống tự động xác nhận đơn hàng trong 1-3 phút.
                </p>
              </div>
            )}

            <Button onClick={handleOrderFinish} className="w-full bg-primary hover:bg-[#4A2E22] text-white py-6 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md">
              Quay lại Trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <Card className="border-[#E6DFD9] p-8 rounded-3xl">
          <CardContent className="flex flex-col items-center gap-6 pt-6">
            <div className="size-16 rounded-full bg-[#FAF8F6] flex items-center justify-center text-[#7A6F68]">
              <ShoppingBag className="size-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1C1917]">Giỏ hàng của bạn đang trống</h2>
              <p className="text-xs text-[#7A6F68] mt-1">
                Vui lòng chọn sản phẩm trước khi tiến hành thanh toán đơn hàng.
              </p>
            </div>
            <Link href="/products" className="w-full">
              <Button className="w-full bg-primary hover:bg-[#4A2E22] text-white py-5 rounded-xl font-bold">
                Khám phá sản phẩm sỉ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Form Details */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <Card className="border-[#E6DFD9] bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#FAF8F6] border-b border-[#E6DFD9]/60 py-4 px-6">
            <CardTitle className="text-sm font-bold text-[#5C3D2E] uppercase tracking-wider flex items-center gap-2">
              <Truck className="size-4 text-primary" /> Thông tin giao nhận hàng hóa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Nhóm Khách Hàng */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-bold text-[#5C3D2E]">Phân loại tài khoản</Label>
              <Select
                defaultValue="B2B"
                onValueChange={(value) =>
                  setValue("customerType", value as CheckoutInput["customerType"])
                }
              >
                <SelectTrigger className="border-[#E6DFD9] focus:ring-primary focus:border-primary rounded-xl h-11 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#E6DFD9] rounded-xl">
                  <SelectItem value="B2B">Doanh nghiệp sỉ / Quán trà sữa kinh doanh</SelectItem>
                  <SelectItem value="B2C">Khách hàng mua lẻ trải nghiệm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Người nhận & SĐT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="customerName" className="text-xs font-bold text-[#5C3D2E]">Tên người nhận hàng</Label>
                <Input
                  id="customerName"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary rounded-xl h-11 bg-white"
                  {...register("customerName")}
                />
                {errors.customerName && (
                  <p className="text-[10px] text-destructive font-bold">{errors.customerName.message}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-[#5C3D2E]">Số điện thoại liên hệ</Label>
                <Input
                  id="phone"
                  placeholder="Ví dụ: 0987654321"
                  className="border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary rounded-xl h-11 bg-white"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-[10px] text-destructive font-bold">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Địa Chỉ */}
            <div className="grid gap-1.5">
              <Label htmlFor="address" className="text-xs font-bold text-[#5C3D2E]">Địa chỉ nhận hàng chi tiết</Label>
              <Input
                id="address"
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh thành..."
                className="border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary rounded-xl h-11 bg-white"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-[10px] text-destructive font-bold">{errors.address.message}</p>
              )}
            </div>

            {/* Phương Thức Vận Chuyển B2B */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-bold text-[#5C3D2E]">Phương thức giao hàng sỉ</Label>
              <Select
                defaultValue="TRUCK"
                onValueChange={(value) => setValue("shippingMethod", value)}
              >
                <SelectTrigger className="border-[#E6DFD9] focus:ring-primary focus:border-primary rounded-xl h-11 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#E6DFD9] rounded-xl">
                  <SelectItem value="TRUCK">Giao chành xe / Gửi xe tải liên tỉnh (Rẻ nhất cho hàng nặng)</SelectItem>
                  <SelectItem value="EXPRESS">Giao hàng hỏa tốc nội thành (Lalamove/Grab xe tải)</SelectItem>
                  <SelectItem value="STANDARD">Bưu điện bưu cục tiêu chuẩn (Viettel Post/GHTK)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ghi chú */}
            <div className="grid gap-1.5">
              <Label htmlFor="note" className="text-xs font-bold text-[#5C3D2E]">Ghi chú giao hàng (Không bắt buộc)</Label>
              <Textarea
                id="note"
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao, hoặc thông tin nhà xe chành xe..."
                className="border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary rounded-xl min-h-[80px] bg-white text-xs"
                {...register("note")}
              />
            </div>
          </CardContent>
        </Card>

        {/* VAT Red Invoice Section */}
        <Card className="border-[#E6DFD9] bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-[#5C3D2E] flex items-center gap-1.5">
                  <Receipt className="size-4 text-primary" /> Yêu cầu xuất hóa đơn đỏ (VAT 8% - 10%)
                </Label>
                <p className="text-[10px] text-[#7A6F68] leading-normal">
                  PBVM sẽ xuất hóa đơn điện tử gửi về email doanh nghiệp của bạn.
                </p>
              </div>
              <Switch
                checked={reqVAT}
                onCheckedChange={(checked) => {
                  setReqVAT(checked);
                  setValue("reqVAT", checked);
                }}
              />
            </div>

            {reqVAT && (
              <div className="mt-4 pt-4 border-t border-[#E6DFD9]/60 grid gap-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid gap-1.5">
                  <Label htmlFor="companyName" className="text-[10px] font-bold text-[#7A6F68] uppercase">Tên doanh nghiệp / Công ty</Label>
                  <Input
                    id="companyName"
                    placeholder="Ví dụ: Công ty TNHH Thương mại F&B Việt Nam"
                    className="border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary rounded-lg h-9 bg-white text-xs"
                    {...register("companyName")}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1 grid gap-1.5">
                    <Label htmlFor="companyTaxId" className="text-[10px] font-bold text-[#7A6F68] uppercase">Mã số thuế</Label>
                    <Input
                      id="companyTaxId"
                      placeholder="Mã số thuế 10 hoặc 13 số"
                      className="border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary rounded-lg h-9 bg-white text-xs"
                      {...register("companyTaxId")}
                    />
                  </div>

                  <div className="sm:col-span-2 grid gap-1.5">
                    <Label htmlFor="companyAddress" className="text-[10px] font-bold text-[#7A6F68] uppercase">Địa chỉ đăng ký doanh nghiệp</Label>
                    <Input
                      id="companyAddress"
                      placeholder="Địa chỉ ghi trên giấy phép đăng ký kinh doanh..."
                      className="border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary rounded-lg h-9 bg-white text-xs"
                      {...register("companyAddress")}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border-[#E6DFD9] bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#FAF8F6] border-b border-[#E6DFD9]/60 py-4 px-6">
            <CardTitle className="text-sm font-bold text-[#5C3D2E] uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="size-4 text-primary" /> Lựa chọn thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedPayment("VNPAY");
                  setValue("paymentProvider", "VNPAY");
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPayment === "VNPAY"
                    ? "border-primary bg-[#FAF8F6] text-primary"
                    : "border-[#E6DFD9] bg-white text-[#7A6F68] hover:border-[#D2B48C]"
                }`}
              >
                <div className="size-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                  <CreditCard className="size-5 text-sky-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-[#1C1917]">Chuyển khoản / VNPAY</span>
                  <span className="text-[9px] text-[#7A6F68]">Chuyển khoản Techcombank hoặc quét mã QR nhanh</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPayment("COD");
                  setValue("paymentProvider", "COD");
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPayment === "COD"
                    ? "border-primary bg-[#FAF8F6] text-primary"
                    : "border-[#E6DFD9] bg-white text-[#7A6F68] hover:border-[#D2B48C]"
                }`}
              >
                <div className="size-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Truck className="size-5 text-amber-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-[#1C1917]">Giao hàng thu tiền (COD)</span>
                  <span className="text-[9px] text-[#7A6F68]">Thanh toán mặt cho nhà xe chành xe khi nhận</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Order items summary */}
      <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
        <Card className="border-[#E6DFD9] bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#FAF8F6] border-b border-[#E6DFD9]/60 py-4 px-6">
            <CardTitle className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider flex items-center justify-between">
              <span>Đơn hàng của bạn ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
              <Link href="/cart" className="text-primary hover:underline lowercase normal-case text-[11px] font-bold">Sửa giỏ hàng</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-4">
            {/* List of items */}
            <div className="divide-y divide-[#E6DFD9]/40 max-h-[300px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 py-3 items-start first:pt-0 last:pb-0">
                  {/* Thumbnail */}
                  <div className="relative size-12 rounded-lg border border-[#E6DFD9]/60 bg-[#FAF8F6] shrink-0 overflow-hidden flex items-center justify-center">
                    {item.imageUrl && item.imageUrl.startsWith("data:") ? (
                      <img src={item.imageUrl} alt={item.name} className="size-10 object-contain p-1" />
                    ) : item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <span className="text-[8px] text-[#7A6F68]">No img</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#1C1917] truncate leading-tight">{item.name}</h4>
                    {item.customConfig ? (
                      <p className="text-[9px] text-primary font-bold mt-0.5">
                        In Logo 3D • Size {item.customConfig.size} ({item.customConfig.style})
                      </p>
                    ) : (
                      <p className="text-[9px] text-[#7A6F68] font-medium mt-0.5">Quy cách tiêu chuẩn • {item.unit}</p>
                    )}
                    <div className="flex items-center justify-between mt-1 text-[11px] text-[#7A6F68] font-medium">
                      <span>{formatCurrency(item.price)} x {item.quantity}</span>
                      <span className="font-bold text-[#1C1917]">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-[#E6DFD9]/60" />

            {/* Calculations summary */}
            <div className="text-xs space-y-2.5">
              <div className="flex justify-between text-[#7A6F68]">
                <span>Tạm tính hàng hóa:</span>
                <span className="font-bold text-[#1C1917]">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#7A6F68]">
                <span>Cước xe vận chuyển:</span>
                <span className="font-bold text-[#1C1917]">{formatCurrency(totals.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-[#7A6F68]">
                <span>Thuế giá trị gia tăng (VAT 8%):</span>
                <span className="font-bold text-[#1C1917]">{formatCurrency(totals.tax)}</span>
              </div>
              <hr className="border-[#E6DFD9]/40" />
              <div className="flex justify-between text-sm items-baseline">
                <span className="font-bold text-[#5C3D2E]">Tổng cộng thanh toán:</span>
                <span className="text-xl font-black text-primary">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-[#4A2E22] text-white py-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2"
            >
              XÁC NHẬN ĐẶT HÀNG <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
