"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  FileText,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Calendar,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getOrder, listOrders } from "@/features/order/services/order.service";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/utils/format-currency";
import { formatDateTime } from "@/utils/format-date";

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearSelectedItems = useCartStore((state) => state.clearSelectedItems);

  // Extract query parameters from PayOS / payment gateway
  const code = searchParams.get("code");
  const status = searchParams.get("status");
  const cancel = searchParams.get("cancel");
  const orderCodeParam = searchParams.get("orderCode") || searchParams.get("orderId");
  const paymentLinkId = searchParams.get("id");

  const [order, setOrder] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);

  // Determine if payment is successful
  // PayOS uses code === "00" or status === "PAID" for successful transactions
  const isSuccess =
    code === "00" ||
    status === "PAID" ||
    (code === null && status === null && cancel !== "true");

  useEffect(() => {
    if (isSuccess) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("lastCreatedOrderId");
      }
      clearSelectedItems();
    }
  }, [isSuccess, clearSelectedItems]);

  // Robustly load order details
  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
      setIsLoadingOrder(true);
      let foundOrder: any = null;

      // 1. Try fetching by 24-character ObjectId if orderCodeParam is valid ObjectId
      if (orderCodeParam && /^[0-9a-fA-F]{24}$/.test(orderCodeParam)) {
        try {
          foundOrder = await getOrder(orderCodeParam);
        } catch {
          // ignore
        }
      }

      // 2. Try fetching using sessionStorage saved lastCreatedOrderId
      if (!foundOrder && typeof window !== "undefined") {
        const savedId = sessionStorage.getItem("lastCreatedOrderId");
        if (savedId && /^[0-9a-fA-F]{24}$/.test(savedId)) {
          try {
            foundOrder = await getOrder(savedId);
          } catch {
            // ignore
          }
        }
      }

      // 3. Fallback: Search in user listOrders() matching code or orderCode
      if (!foundOrder) {
        try {
          const res = await listOrders();
          const list = Array.isArray(res) ? res : res?.data || [];
          if (list.length > 0) {
            if (orderCodeParam) {
              const cleanParam = String(orderCodeParam).replace(/[^0-9]/g, "");
              foundOrder = list.find(
                (o: any) =>
                  o.id === orderCodeParam ||
                  o._id === orderCodeParam ||
                  String(o.code) === String(orderCodeParam) ||
                  (o.code && String(o.code).replace(/[^0-9]/g, "") === cleanParam),
              );
            }
            if (!foundOrder) {
              foundOrder = list[0]; // fallback to latest order
            }
          }
        } catch {
          // ignore
        }
      }

      if (isMounted) {
        setOrder(foundOrder);
        setIsLoadingOrder(false);
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderCodeParam]);

  const displayOrderCode =
    order?.code ||
    (orderCodeParam ? (orderCodeParam.startsWith("ORD-") ? orderCodeParam : `ORD-${orderCodeParam}`) : null);

  const displayOrderId = order?.id || order?._id || orderCodeParam;

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-emerald-50/50 via-background to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 text-center"
        >
          {isSuccess ? (
            <>
              {/* Success Icon */}
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                >
                  <CheckCircle2 className="h-14 w-14" />
                </motion.div>
                <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/30 animate-ping" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Check className="mr-1 h-3 w-3" /> Giao dịch thành công
                </Badge>
                <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">
                  Thanh Toán Thành Công!
                </h1>
                <p className="text-base text-muted-foreground max-w-lg mx-auto">
                  Cảm ơn bạn đã hoàn tất thanh toán. Đơn hàng của bạn đã được hệ thống ghi nhận và đang chuyển tới bộ phận xử lý.
                </p>
              </div>

              {/* Details Card */}
              <Card className="mt-8 text-left border-emerald-100/80 shadow-xl shadow-emerald-500/5 dark:border-emerald-900/30">
                <CardHeader className="border-b bg-emerald-50/40 dark:bg-emerald-950/20 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <PackageCheck className="h-5 w-5 text-emerald-600" /> Thông tin giao dịch
                    </CardTitle>
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                      Đã thanh toán
                    </Badge>
                  </div>
                  <CardDescription>
                    Mã phản hồi từ PayOS: <span className="font-mono text-emerald-700 font-semibold dark:text-emerald-400">{code || "00"}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {displayOrderCode && (
                      <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Mã đơn hàng
                        </span>
                        <p className="font-mono font-bold text-base text-foreground">
                          #{displayOrderCode}
                        </p>
                      </div>
                    )}

                    {paymentLinkId && (
                      <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> Mã giao dịch PayOS
                        </span>
                        <p className="font-mono font-medium text-xs text-foreground truncate">
                          {paymentLinkId}
                        </p>
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> Phương thức
                      </span>
                      <p className="font-medium text-foreground">
                        Chuyển khoản / PayOS
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Thời gian
                      </span>
                      <p className="font-medium text-foreground">
                        {formatDateTime(new Date().toISOString())}
                      </p>
                    </div>
                  </div>

                  {/* Order Details Preview */}
                  {order && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">Tổng tiền thanh toán:</span>
                        <span className="text-lg font-extrabold text-emerald-600">
                          {formatCurrency(order.totalAmount || order.total || 0)}
                        </span>
                      </div>
                      {(order.recipientName || order.customerName) && (
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>Người nhận:</span>
                          <span className="font-medium text-foreground">
                            {order.recipientName || order.customerName} {order.phone ? `- ${order.phone}` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 border border-emerald-200/50">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Hóa đơn và thông báo xác nhận đơn hàng đã được cập nhật trên hệ thống. Chúng tôi sẽ sớm liên hệ và giao hàng tới bạn.
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* CTAs */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-lg shadow-emerald-600/20"
                  onClick={() => router.push(displayOrderId ? `/orders?id=${displayOrderId}` : "/orders")}
                >
                  <FileText className="h-4 w-4" /> Xem đơn hàng của tôi
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => router.push("/products")}
                >
                  <ShoppingBag className="h-4 w-4" /> Tiếp tục mua sắm
                </Button>
              </div>
            </>
          ) : (
            /* Error / Failed outcome */
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <AlertTriangle className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                  Giao dịch chưa hoàn tất
                </Badge>
                <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  Thanh Toán Chưa Thành Công
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Giao dịch của bạn bị ngắt kết nối hoặc phản hồi mã lỗi từ PayOS (<span className="font-mono font-bold text-amber-700">{code || "UNKNOWN"}</span>).
                </p>
              </div>

              <Card className="mt-6 text-left border-amber-200">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-sm space-y-2">
                    <p className="text-muted-foreground">
                      Đơn hàng của bạn vẫn được giữ trên hệ thống. Bạn có thể kiểm tra lại trạng thái đơn hàng hoặc thực hiện thanh toán lại.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white gap-2 font-semibold"
                  onClick={() => router.push(displayOrderId ? `/orders?id=${displayOrderId}` : "/orders")}
                >
                  <RefreshCw className="h-4 w-4" /> Kiểm tra & Thanh toán lại
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => router.push("/cart")}
                >
                  <ShoppingBag className="h-4 w-4" /> Xem giỏ hàng
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Đang xác minh kết quả thanh toán...</p>
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
