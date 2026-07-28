"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  FileText,
  CreditCard,
  HelpCircle,
  Bell,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getOrder, listOrders } from "@/features/order/services/order.service";
import { useCartStore } from "@/stores/cart-store";
import { apiClient } from "@/lib/api-client";
import { unwrapApiData } from "@/lib/api-contract";
import { formatCurrency } from "@/utils/format-currency";

export function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const cartItems = useCartStore((state) => state.items);
  const restoreItems = useCartStore((state) => state.restoreItems);

  // Extract search parameters
  const code = searchParams.get("code");
  const orderCodeParam = searchParams.get("orderCode") || searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [isRepaying, setIsRepaying] = useState(false);

  // Ensure checkout items are retained in cart when payment is cancelled.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const backupStr = sessionStorage.getItem("pendingCartBackup");
      const restoredKey = `restoredCancelledCart:${orderCodeParam || "latest"}`;
      if (backupStr && sessionStorage.getItem(restoredKey) !== "true") {
        try {
          const parsed = JSON.parse(backupStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            restoreItems(parsed);
            sessionStorage.setItem(restoredKey, "true");
          }
        } catch {
          // ignore
        }
      }
    }
  }, [orderCodeParam, restoreItems]);

  // Robustly load order details
  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
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
            if (!foundOrder) {
              foundOrder = list[0];
            }
          }
        } catch {
          // ignore
        }
      }

      if (isMounted && foundOrder) {
        setOrder(foundOrder);
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderCodeParam]);

  const targetOrderId = order?.id || order?._id || orderCodeParam;
  const displayOrderCode =
    order?.code ||
    (orderCodeParam ? (orderCodeParam.startsWith("ORD-") ? orderCodeParam : `ORD-${orderCodeParam}`) : null);

  const findRetryPaymentOrderId = async () => {
    const directId = order?.id || order?._id;
    if (directId && /^[0-9a-fA-F]{24}$/.test(String(directId))) {
      return String(directId);
    }

    if (typeof window !== "undefined") {
      const savedId = sessionStorage.getItem("lastCreatedOrderId");
      if (savedId && /^[0-9a-fA-F]{24}$/.test(savedId)) {
        return savedId;
      }
    }

    const lookupCode =
      order?.code ||
      orderCodeParam ||
      (typeof window !== "undefined" ? sessionStorage.getItem("lastCreatedOrderCode") : null);
    if (!lookupCode) return null;

    const cleanCode = String(lookupCode).replace(/[^0-9]/g, "");
    const res = await listOrders();
    const list = Array.isArray(res) ? res : res?.data || [];
    const matchedOrder = list.find(
      (item: any) =>
        item.id === lookupCode ||
        item._id === lookupCode ||
        String(item.code) === String(lookupCode) ||
        String(item.orderCode) === String(lookupCode) ||
        (item.code && String(item.code).replace(/[^0-9]/g, "") === cleanCode) ||
        (item.orderCode && String(item.orderCode).replace(/[^0-9]/g, "") === cleanCode),
    );

    const matchedId = matchedOrder?.id || matchedOrder?._id;
    return matchedId && /^[0-9a-fA-F]{24}$/.test(String(matchedId))
      ? String(matchedId)
      : null;
  };

  const handleRetryPayment = async () => {
    if (!targetOrderId) {
      toast.error("Không tìm thấy thông tin đơn hàng để thanh toán lại.");
      router.push("/orders");
      return;
    }

    try {
      setIsRepaying(true);
      toast.loading("Đang khởi tạo lại liên kết thanh toán PayOS...");
      const retryOrderId = await findRetryPaymentOrderId();
      if (!retryOrderId) {
        toast.error("Không tìm thấy thông tin đơn hàng để thanh toán lại.");
        router.push("/orders");
        return;
      }

      const payUrlRes = await apiClient.get<any>(
        `/payment/payos/create-url/${retryOrderId}`,
      );
      const payUrlData = unwrapApiData(payUrlRes.data);
      if (payUrlData.payUrl) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("lastCreatedOrderId", retryOrderId);
          if (displayOrderCode) {
            sessionStorage.setItem("lastCreatedOrderCode", String(displayOrderCode));
          }
          sessionStorage.setItem("lastPaymentStartedStatus", order?.paymentStatus || "UNPAID");
        }
        toast.success("Đang chuyển hướng sang PayOS...");
        window.location.href = payUrlData.payUrl;
      } else {
        toast.error("Không tạo được liên kết thanh toán mới.");
      }
    } catch (err: any) {
      console.error("Retry payment error:", err);
      toast.error(`Có lỗi khi tạo link thanh toán: ${err.message || "Vui lòng thử lại sau"}`);
    } finally {
      setIsRepaying(false);
    }
  };

  const handleGoToNotifications = () => {
    toast.info("Đã chuyển về trang thông báo. Các sản phẩm của bạn vẫn được lưu giữ trong giỏ hàng.");
    const query = new URLSearchParams();
    query.set("type", "payment_cancelled");
    if (displayOrderCode) query.set("orderCode", String(displayOrderCode));
    if (targetOrderId) query.set("orderId", String(targetOrderId));
    router.push(`/notifications?${query.toString()}`);
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-amber-50/40 via-background to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 text-center"
        >
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">
              Thanh Toán Đã Bị Hủy
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto">
              Bạn đã dừng giao dịch thanh toán trực tuyến. Các sản phẩm của bạn <strong className="text-amber-800 font-bold">vẫn được lưu giữ trong giỏ hàng</strong> để bạn dễ dàng xem lại hoặc mua sau.
            </p>
          </div>

          {/* Details Card */}
          <Card className="text-left border-amber-200/80 shadow-lg shadow-amber-500/5 dark:border-amber-900/30">
            <CardHeader className="border-b bg-amber-50/40 dark:bg-amber-950/20 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <CreditCard className="h-5 w-5 text-amber-600" /> Trạng thái giao dịch
                </CardTitle>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  Chưa thanh toán
                </Badge>
              </div>
              <CardDescription>
                Mã phản hồi từ cổng thanh toán: <span className="font-mono text-amber-700 font-semibold">{code || "CANCELLED"}</span>
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

                <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> Cổng thanh toán
                  </span>
                  <p className="font-medium text-foreground">
                    PayOS QR / Internet Banking
                  </p>
                </div>
              </div>

              {/* Order summary if available */}
              {order && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tổng số tiền đơn hàng:</span>
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(order.totalAmount || order.total || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Helpful message */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3 border border-amber-200/60">
                <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Lựa chọn của bạn:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-400">
                    <li>Bấm <strong>&quot;Hủy &amp; Về trang thông báo&quot;</strong> để chuyển đến trung tâm thông báo đơn hàng.</li>
                    <li>Bấm <strong>&quot;Xem giỏ hàng&quot;</strong> để kiểm tra lại các sản phẩm vẫn còn nguyên trong giỏ.</li>
                    <li>Bấm <strong>&quot;Thanh toán lại&quot;</strong> để lấy mã QR PayOS mới.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white gap-2 font-semibold shadow-lg shadow-amber-600/20"
              onClick={handleGoToNotifications}
            >
              <Bell className="h-4 w-4" />
              Hủy &amp; Về trang thông báo
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold"
              onClick={() => router.push("/cart")}
            >
              <ShoppingBag className="h-4 w-4" /> Xem giỏ hàng ({cartItems.length})
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2"
              onClick={handleRetryPayment}
              disabled={isRepaying}
            >
              <RefreshCw className={`h-4 w-4 ${isRepaying ? "animate-spin" : ""}`} />
              {isRepaying ? "Đang tạo mã QR..." : "Thanh toán lại"}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => router.push(targetOrderId ? `/orders?id=${targetOrderId}` : "/orders")}
            >
              <FileText className="h-4 w-4" /> Đơn hàng của tôi
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
