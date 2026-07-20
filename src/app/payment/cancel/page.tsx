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
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getOrder, listOrders } from "@/features/order/services/order.service";
import { apiClient } from "@/lib/api-client";
import { unwrapApiData } from "@/lib/api-contract";
import { formatCurrency } from "@/utils/format-currency";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract search parameters
  const code = searchParams.get("code");
  const orderCodeParam = searchParams.get("orderCode") || searchParams.get("orderId");
  const paymentLinkId = searchParams.get("id");

  const [order, setOrder] = useState<any>(null);
  const [isRepaying, setIsRepaying] = useState(false);

  // Robustly load order details
  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
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

  const handleRetryPayment = async () => {
    if (!targetOrderId) {
      toast.error("Không tìm thấy thông tin đơn hàng để thanh toán lại.");
      router.push("/orders");
      return;
    }

    try {
      setIsRepaying(true);
      toast.loading("Đang khởi tạo lại liên kết thanh toán PayOS...");
      const payUrlRes = await apiClient.get<any>(
        `/payment/payos/create-url/${targetOrderId}`,
      );
      const payUrlData = unwrapApiData(payUrlRes.data);
      if (payUrlData.payUrl) {
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

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-amber-50/40 via-background to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 text-center"
        >
          {/* Cancel Icon */}
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
            >
              <XCircle className="h-14 w-14" />
            </motion.div>
          </div>

          {/* Title & Badge */}
          <div className="space-y-2">
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle className="mr-1 h-3.5 w-3.5 text-amber-600" /> Thanh toán bị dừng
            </Badge>
            <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">
              Thanh Toán Đã Bị Hủy
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto">
              Bạn đã hủy phiên giao dịch hoặc đóng cửa sổ thanh toán PayOS. Đơn hàng của bạn vẫn được lưu giữ và chưa bị xóa.
            </p>
          </div>

          {/* Details Card */}
          <Card className="mt-8 text-left border-amber-200/80 shadow-lg shadow-amber-500/5 dark:border-amber-900/30">
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
                Mã trạng thái phản hồi: <span className="font-mono text-amber-700 font-semibold">{code || "CANCELLED"}</span>
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
                    PayOS QR / ATM / Internet Banking
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
                  <p className="font-semibold">Bạn có thể làm gì tiếp theo?</p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-400">
                    <li>Bấm <strong>&quot;Thử thanh toán lại&quot;</strong> để nhận mã QR / liên kết PayOS mới.</li>
                    <li>Vào mục <strong>&quot;Quản lý đơn hàng&quot;</strong> để xem chi tiết hoặc thay đổi phương thức thanh toán.</li>
                    <li>Quay về giỏ hàng nếu muốn chọn lại sản phẩm khác.</li>
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
              onClick={handleRetryPayment}
              disabled={isRepaying}
            >
              <RefreshCw className={`h-4 w-4 ${isRepaying ? "animate-spin" : ""}`} />
              {isRepaying ? "Đang xử lý..." : "Thử thanh toán lại"}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2"
              onClick={() => router.push(targetOrderId ? `/orders?id=${targetOrderId}` : "/orders")}
            >
              <FileText className="h-4 w-4" /> Quản lý đơn hàng
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/cart")}
            >
              <ShoppingBag className="h-4 w-4" /> Quay lại giỏ hàng
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Đang tải thông tin trang...</p>
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
