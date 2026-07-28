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
import { PaymentCancelContent } from "@/features/payment/components/payment-cancel-content";

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
  const [hasClearedPaidCartItems, setHasClearedPaidCartItems] = useState(false);

  // Determine if payment is cancelled or failed
  const isCancelled = cancel === "true" || status === "CANCELLED" || code === "CANCELLED";

  if (isCancelled) {
    return <PaymentCancelContent />;
  }

  // Gateway success is not enough; final paid state must come from the order API/DB.
  const isGatewaySuccess =
    !isCancelled &&
    (code === "00" ||
      status === "PAID" ||
      status === "success" ||
      status === "SUCCESS" ||
      (code === null && status === null));
  const isConfirmedPaid = order?.paymentStatus === "PAID";
  const isPendingPaymentConfirmation =
    isGatewaySuccess && !isLoadingOrder && !isConfirmedPaid;

  useEffect(() => {
    if (isConfirmedPaid && !hasClearedPaidCartItems) {
      let isMounted = true;
      async function clearPaidCartItems() {
        await clearSelectedItems();
        if (!isMounted) return;
        setHasClearedPaidCartItems(true);

        if (typeof window !== "undefined") {
          sessionStorage.removeItem("lastCreatedOrderId");
          sessionStorage.removeItem("pendingCartBackup");
        }
      }

      clearPaidCartItems();

      return () => {
        isMounted = false;
      };
    }
  }, [isConfirmedPaid, hasClearedPaidCartItems, clearSelectedItems]);

  // Robustly load order details from the real API/DB state.
  useEffect(() => {
    let isMounted = true;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    async function findOrderFromApi() {
      let foundOrder: any = null;

      if (orderCodeParam && /^[0-9a-fA-F]{24}$/.test(orderCodeParam)) {
        try {
          foundOrder = await getOrder(orderCodeParam);
        } catch {
          // ignore
        }
      }

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
            if (!foundOrder && !isGatewaySuccess) {
              foundOrder = list[0]; // fallback to latest order
            }
          }
        } catch {
          // ignore
        }
      }

      return foundOrder;
    }

    async function loadOrder() {
      setIsLoadingOrder(true);
      let foundOrder: any = null;
      const attempts = isGatewaySuccess ? 8 : 1;

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        foundOrder = await findOrderFromApi();
        if (!isMounted) return;
        if (!isGatewaySuccess || foundOrder?.paymentStatus === "PAID") break;
        await wait(1500);
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
  }, [orderCodeParam, isGatewaySuccess]);

  const displayOrderCode =
    order?.code ||
    (orderCodeParam ? (orderCodeParam.startsWith("ORD-") ? orderCodeParam : `ORD-${orderCodeParam}`) : null);

  const displayOrderId = order?.id || order?._id || orderCodeParam;
  const unresolvedPaymentBadge = isLoadingOrder
    ? "Đang kiểm tra thanh toán"
    : isPendingPaymentConfirmation
      ? "Chờ xác nhận từ hệ thống"
      : "Giao dịch chưa hoàn tất";
  const unresolvedPaymentTitle = isLoadingOrder
    ? "Đang Xác Minh Thanh Toán"
    : isPendingPaymentConfirmation
      ? "Chưa Xác Nhận Đã Thanh Toán"
      : "Thanh Toán Chưa Thành Công";
  const unresolvedPaymentDescription = isLoadingOrder
    ? "FE đang gọi API đơn hàng để lấy trạng thái thanh toán thật từ hệ thống."
    : isPendingPaymentConfirmation
      ? "Cổng thanh toán đã trả về thành công, nhưng API đơn hàng chưa trả paymentStatus=PAID. Vui lòng kiểm tra lại sau vài giây."
      : `Giao dịch chưa hoàn tất hoặc PayOS trả mã lỗi ${code || status || "UNKNOWN"}.`;
  const unresolvedPaymentNote = isPendingPaymentConfirmation
    ? "Đơn hàng vẫn được giữ nguyên. FE chưa xóa hàng khỏi giỏ cho đến khi API trả paymentStatus=PAID."
    : "Đơn hàng của bạn vẫn được giữ trên hệ thống. Bạn có thể kiểm tra lại trạng thái đơn hàng hoặc thực hiện thanh toán lại.";

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-emerald-50/50 via-background to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 text-center"
        >
          {isConfirmedPaid ? (
            <>
              {/* Title & Description */}
              <div className="space-y-2">
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
                {isLoadingOrder ? (
                  <RefreshCw className="h-10 w-10 animate-spin" />
                ) : (
                  <AlertTriangle className="h-10 w-10" />
                )}
              </div>

              <div className="space-y-2">
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                  {unresolvedPaymentBadge}
                </Badge>
                <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  {unresolvedPaymentTitle}
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {unresolvedPaymentDescription}
                </p>
              </div>

              <div className="hidden">
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
                      {unresolvedPaymentNote}
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
