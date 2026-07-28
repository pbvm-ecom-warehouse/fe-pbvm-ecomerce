"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Package,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Bell
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listOrders } from "@/features/order/services/order.service";
import { formatCurrency } from "@/utils/format-currency";
import { formatDateTime } from "@/utils/format-date";

import { cn } from "@/lib/utils";

type StatusTabType =
  | "PROCESSING"
  | "UNPAID"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REFUND";

export function OrderListClient({
  selectedOrderId,
  onSelectOrder,
}: {
  selectedOrderId?: string;
  onSelectOrder?: (id: string) => void;
}) {
  const searchParams = useSearchParams();
  const notificationParam = searchParams?.get("notification");

  const [activeTab, setActiveTab] = useState<StatusTabType>(
    notificationParam === "payment_cancelled" ? "UNPAID" : "PROCESSING"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, activeTab]);

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      const orders = Array.isArray(data) ? data : (data?.data ?? []);
      return orders.some(
        (order: any) =>
          ["UNPAID", "DEPOSIT_PAID", "PROGRESS_PAID"].includes(order.paymentStatus) &&
          order.status !== "CANCELLED",
      )
        ? 5000
        : false;
    },
  });

  const orders: any[] = Array.isArray(ordersQuery.data)
    ? ordersQuery.data
    : (ordersQuery.data?.data ?? []);

  // Tab counters
  const countUnpaid = orders.filter(
    (o: any) => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED"
  ).length;
  const countProcessing = orders.filter(
    (o: any) => (o.status === "PLACED" || o.status === "CONFIRMED") && o.status !== "CANCELLED"
  ).length;
  const countPaid = orders.filter(
    (o: any) => o.paymentStatus === "PAID" && o.status !== "CANCELLED"
  ).length;
  const countCompleted = orders.filter(
    (o: any) =>
      o.status === "COMPLETED" ||
      o.status === "CLOSED" ||
      o.fulfillmentStatus === "DELIVERED"
  ).length;
  const countCancelled = orders.filter((o: any) => o.status === "CANCELLED").length;
  const countReturnRefund = orders.filter(
    (o: any) =>
      o.paymentStatus === "REFUND_PENDING" ||
      o.paymentStatus === "REFUNDED" ||
      o.fulfillmentStatus === "RETURNED"
  ).length;

  // Filtered orders
  const filteredOrders = orders.filter((o: any) => {
    if (activeTab === "UNPAID") return o.paymentStatus === "UNPAID" && o.status !== "CANCELLED";
    if (activeTab === "PROCESSING") return (o.status === "PLACED" || o.status === "CONFIRMED") && o.status !== "CANCELLED";
    if (activeTab === "PAID") return o.paymentStatus === "PAID" && o.status !== "CANCELLED";
    if (activeTab === "COMPLETED") {
      return (
        o.status === "COMPLETED" ||
        o.status === "CLOSED" ||
        o.fulfillmentStatus === "DELIVERED"
      );
    }
    if (activeTab === "CANCELLED") return o.status === "CANCELLED";
    if (activeTab === "RETURN_REFUND") {
      return (
        o.paymentStatus === "REFUND_PENDING" ||
        o.paymentStatus === "REFUNDED" ||
        o.fulfillmentStatus === "RETURNED"
      );
    }
    return (o.status === "PLACED" || o.status === "CONFIRMED") && o.status !== "CANCELLED"; // PROCESSING
  });

  // Pagination math
  const totalFilteredOrders = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredOrders / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFilteredOrders);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Helper styles for status badges
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PLACED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">Chá» xá»­ lĂ½</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100">ÄĂ£ xĂ¡c nháº­n</Badge>;
      case "COMPLETED":
      case "CLOSED":
        return <Badge className="bg-emerald-600 text-white border-transparent hover:bg-emerald-600">HoĂ n thĂ nh</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100">ÄĂ£ há»§y</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">ÄĂ£ thanh toĂ¡n</Badge>;
      case "DEPOSIT_PAID":
        return <Badge className="bg-lime-100 text-lime-800 border-lime-200 hover:bg-lime-100">Đã cọc</Badge>;
      case "PROGRESS_PAID":
        return <Badge className="bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100">Da thanh toan tien do</Badge>;
      case "UNPAID":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Chá» thanh toĂ¡n</Badge>;
      case "REFUND_PENDING":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Chá» hoĂ n tiá»n</Badge>;
      case "REFUNDED":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">ÄĂ£ hoĂ n tiá»n</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFulfillmentStatusBadge = (status: string) => {
    switch (status) {
      case "NONE":
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100">Chá» xuáº¥t kho</Badge>;
      case "PRINTING":
      case "AWAITING_PRINT":
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-100">Äang in ly</Badge>;
      case "SHIPPED":
      case "READY_TO_PICK":
      case "ISSUED":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Äang giao</Badge>;
      case "DELIVERED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">ÄĂ£ giao</Badge>;
      case "RETURNED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100">ÄĂ£ tráº£ hĂ ng</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden bg-white">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-xl text-primary">
            <Package size={22} />
          </div>
          <div>
            <CardTitle className="text-base font-black text-[#253D4E] uppercase tracking-wider">
              ÄÆ¡n hĂ ng cá»§a tĂ´i
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      {/* Status Filter Tabs */}
      <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: "PROCESSING", label: "Chá» xá»­ lĂ½", count: countProcessing },
          { id: "UNPAID", label: "Chá» thanh toĂ¡n", count: countUnpaid },
          { id: "PAID", label: "ÄĂ£ thanh toĂ¡n", count: countPaid },
          { id: "COMPLETED", label: "ÄĂ£ hoĂ n thĂ nh", count: countCompleted },
          { id: "CANCELLED", label: "ÄĂ£ há»§y", count: countCancelled },
          { id: "RETURN_REFUND", label: "Tráº£ hĂ ng / HoĂ n tiá»n", count: countReturnRefund },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as StatusTabType);
              setCurrentPage(1);
            }}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === tab.id
                ? "bg-primary text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/80 text-slate-600"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <CardContent className="p-6 space-y-4">
        {notificationParam === "payment_cancelled" && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <Bell className="size-4 text-amber-600" />
              ThĂ´ng bĂ¡o thanh toĂ¡n
            </div>
            <p className="text-amber-800 leading-relaxed">
              Báº¡n vá»«a dá»«ng giao dá»‹ch thanh toĂ¡n trá»±c tuyáº¿n. ÄÆ¡n hĂ ng cá»§a báº¡n Ä‘Ă£ Ä‘Æ°á»£c giá»¯ láº¡i á»Ÿ tráº¡ng thĂ¡i <strong>Chá» thanh toĂ¡n</strong>. CĂ¡c sáº£n pháº©m cá»§a báº¡n váº«n náº±m nguyĂªn trong giá» hĂ ng.
            </p>
          </div>
        )}

        {ordersQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-sm text-slate-400">
            <div className="size-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <p className="font-semibold">Äang táº£i lá»‹ch sá»­ Ä‘Æ¡n hĂ ng...</p>
          </div>
        ) : null}

        {ordersQuery.isError ? (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/30 p-6 text-center text-xs font-semibold text-rose-700 flex flex-col items-center justify-center gap-2">
            <AlertCircle size={28} className="text-rose-500" />
            <p>KhĂ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mĂ¡y chá»§ Ecommerce API hoáº·c phiĂªn lĂ m viá»‡c Ä‘Ă£ háº¿t háº¡n.</p>
          </div>
        ) : null}

        {!ordersQuery.isLoading && !ordersQuery.isError && filteredOrders.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-100 py-16 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2 bg-slate-50/20">
            <Package size={32} className="text-slate-300" />
            <p>KhĂ´ng cĂ³ Ä‘Æ¡n hĂ ng nĂ o thuá»™c tráº¡ng thĂ¡i nĂ y.</p>
          </div>
        ) : null}

        <div className="space-y-3.5">
          {paginatedOrders.map((order: any) => {
            const orderId = order.id || order._id;
            const isSelected = selectedOrderId === orderId;
            return (
              <div
                key={orderId}
                onClick={() => onSelectOrder?.(orderId)}
                className={cn(
                  "group block rounded-xl border p-5 transition-all cursor-pointer select-none",
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/20 shadow-xs"
                    : "border-slate-100 hover:border-emerald-100 hover:shadow-xs bg-white hover:bg-slate-50/30"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "font-black text-sm transition-colors",
                        isSelected ? "text-primary" : "text-[#253D4E] group-hover:text-primary"
                      )}>
                        #{order.code || orderId}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getOrderStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.paymentStatus)}
                        {getFulfillmentStatusBadge(order.fulfillmentStatus)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDateTime(order.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={12} />
                        {order.paymentMethod === "ONLINE" ? "Cá»•ng PayOS" : "Tiá»n máº·t (COD)"}
                      </span>
                      {order.warehouseName && (
                        <span className="flex items-center gap-1">
                          <TrendingUp size={12} />
                          Kho: {order.warehouseName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-50 pt-3 sm:border-t-0 sm:pt-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tá»•ng tiá»n thanh toĂ¡n</p>
                      <p className="font-black text-primary text-base sm:text-lg mt-0.5">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                    <div className={cn(
                      "size-8 rounded-full flex items-center justify-center transition-colors shrink-0",
                      isSelected ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-primary"
                    )}>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Toolbar */}
        {!ordersQuery.isLoading && totalFilteredOrders > 0 && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground font-medium text-center sm:text-left">
              Hiá»ƒn thá»‹ <strong className="text-foreground">{startIndex + 1} - {endIndex}</strong> trong tá»•ng sá»‘ <strong className="text-foreground">{totalFilteredOrders}</strong> Ä‘Æ¡n hĂ ng
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Trang trÆ°á»›c"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={validCurrentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "size-8 p-0 rounded-lg text-xs font-bold",
                      validCurrentPage === pageNum
                        ? "bg-primary text-white hover:bg-[#2F9A68]"
                        : "text-slate-600"
                    )}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Trang sau"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
