"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  CreditCard,
  Package,
  ArrowRight,
  Info,
  Clock,
  RefreshCw,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartStore } from "@/stores/cart-store";

function NotificationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = searchParams.get("type");
  const orderCode = searchParams.get("orderCode");
  const orderId = searchParams.get("orderId");

  const cartItems = useCartStore((state) => state.items);

  const [notifications] = useState([
    {
      id: "notif-1",
      type: "PAYMENT_CANCELLED",
      title: "Giao dịch thanh toán trực tuyến chưa hoàn tất",
      description: orderCode
        ? `Thanh toán cho đơn hàng #${orderCode} đã bị ngắt kết nối hoặc hủy bởi người dùng.`
        : "Thanh toán trực tuyến bị hủy hoặc tạm dừng.",
      time: "Vừa xong",
      read: false,
      actionType: "REPAY",
      orderId: orderId || undefined,
      orderCode: orderCode || undefined,
    },
    {
      id: "notif-2",
      type: "CART_NOTICE",
      title: "Sản phẩm của bạn vẫn đang ở trong giỏ hàng",
      description: "Do giao dịch chưa thanh toán thành công, các mặt hàng đã chọn được giữ nguyên để bạn có thể xem lại hoặc mua lại.",
      time: "Vừa xong",
      read: false,
      actionType: "VIEW_CART",
    },
    {
      id: "notif-3",
      type: "SYSTEM",
      title: "Chào mừng bạn đến với PBVM Ecommerce",
      description: "Cảm ơn bạn đã lựa chọn sản phẩm bao bì & in ấn ly của PBVM. Đội ngũ chúng tôi sẵn sàng hỗ trợ 24/7.",
      time: "1 ngày trước",
      read: true,
    },
  ]);

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-slate-50 via-background to-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight sm:text-3xl">
                Thông Báo Của Tôi
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cập nhật thông tin đơn hàng, trạng thái thanh toán và thông báo hệ thống
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="w-fit rounded-xl gap-2 font-bold text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
            <Link href="/cart">
              <ShoppingBag className="h-4 w-4" /> Xem giỏ hàng ({cartItems.length})
            </Link>
          </Button>
        </div>

        {/* Featured Alert if redirected from Payment Cancel */}
        {type === "payment_cancelled" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-amber-300 bg-amber-50/90 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-600 text-white font-semibold text-xs">
                      <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Thông báo thanh toán
                    </Badge>
                    {orderCode && (
                      <span className="font-mono text-xs font-bold text-amber-900">
                        #{orderCode}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Vừa xong
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-amber-950 mt-2">
                  Bạn đã hủy phiên thanh toán PayOS
                </CardTitle>
                <CardDescription className="text-amber-800 text-xs leading-relaxed">
                  Đơn hàng {orderCode ? `#${orderCode}` : ""} đã được lưu ở trạng thái <strong className="font-bold">Chờ thanh toán</strong>. Toàn bộ các sản phẩm đã chọn <strong className="font-bold">vẫn còn nguyên vẹn trong giỏ hàng</strong> để bạn có thể xem lại hoặc tiếp tục đặt mua.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 rounded-lg shadow-sm"
                  onClick={() => router.push(orderId ? `/payment/cancel?orderId=${orderId}` : "/cart")}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Thanh toán lại đơn này
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-600 text-emerald-800 hover:bg-emerald-100 font-bold text-xs gap-1.5 rounded-lg"
                  onClick={() => router.push("/cart")}
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Xem hàng trong giỏ ({cartItems.length})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-amber-900 hover:bg-amber-100 font-bold text-xs gap-1.5 rounded-lg"
                  onClick={() => router.push("/orders")}
                >
                  <FileText className="h-3.5 w-3.5" /> Danh sách đơn hàng
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Notifications Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="all" className="rounded-lg text-xs font-bold">
              Tất cả thông báo
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg text-xs font-bold">
              Đơn hàng &amp; Thanh toán
            </TabsTrigger>
            <TabsTrigger value="system" className="rounded-lg text-xs font-bold">
              Hệ thống
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-3">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`transition-all border rounded-xl hover:shadow-md ${
                  n.type === "PAYMENT_CANCELLED"
                    ? "border-amber-200 bg-amber-50/30"
                    : n.type === "CART_NOTICE"
                    ? "border-emerald-200 bg-emerald-50/20"
                    : "border-slate-200 bg-white"
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      n.type === "PAYMENT_CANCELLED"
                        ? "bg-amber-100 text-amber-700"
                        : n.type === "CART_NOTICE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {n.type === "PAYMENT_CANCELLED" ? (
                      <CreditCard className="h-5 w-5" />
                    ) : n.type === "CART_NOTICE" ? (
                      <ShoppingBag className="h-5 w-5" />
                    ) : (
                      <Info className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {n.description}
                    </p>

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      {n.actionType === "REPAY" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold border-amber-600 text-amber-800 hover:bg-amber-50 rounded-lg gap-1"
                          onClick={() => router.push(n.orderId ? `/orders?id=${n.orderId}` : "/orders")}
                        >
                          <FileText className="h-3.5 w-3.5" /> Quản lý đơn hàng
                        </Button>
                      )}
                      {n.actionType === "VIEW_CART" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold border-emerald-600 text-emerald-800 hover:bg-emerald-50 rounded-lg gap-1"
                          onClick={() => router.push("/cart")}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Vào giỏ hàng
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="orders" className="mt-4 space-y-3">
            {notifications
              .filter((n) => n.type === "PAYMENT_CANCELLED" || n.type === "CART_NOTICE")
              .map((n) => (
                <Card key={n.id} className="border-amber-200 bg-amber-50/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{n.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="system" className="mt-4 space-y-3">
            {notifications
              .filter((n) => n.type === "SYSTEM")
              .map((n) => (
                <Card key={n.id} className="border-slate-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{n.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Đang tải trung tâm thông báo...</p>
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
