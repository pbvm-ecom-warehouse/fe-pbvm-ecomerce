"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Package, 
  ChevronRight, 
  Calendar, 
  CreditCard, 
  TrendingUp,
  AlertCircle
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { listOrders } from "@/features/order/services/order.service";
import { formatCurrency } from "@/utils/format-currency";
import { formatDateTime } from "@/utils/format-date";

import { cn } from "@/lib/utils";

export function OrderListClient({
  selectedOrderId,
  onSelectOrder,
}: {
  selectedOrderId?: string;
  onSelectOrder?: (id: string) => void;
}) {
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
  });

  const orders = ordersQuery.data?.data ?? [];

  // Helper styles for status badges
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PLACED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">Chờ xử lý</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100">Đã xác nhận</Badge>;
      case "COMPLETED":
        return <Badge className="bg-emerald-600 text-white border-transparent hover:bg-emerald-600">Đã hoàn thành</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Đã thanh toán</Badge>;
      case "UNPAID":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Chờ thanh toán</Badge>;
      case "REFUND_PENDING":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Chờ hoàn tiền</Badge>;
      case "REFUNDED":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">Đã hoàn tiền</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFulfillmentStatusBadge = (status: string) => {
    switch (status) {
      case "NONE":
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100">Chờ xuất kho</Badge>;
      case "PRINTING":
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-100">Đang in ly</Badge>;
      case "SHIPPED":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Đang giao</Badge>;
      case "DELIVERED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Đã giao</Badge>;
      case "RETURNED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100">Đã trả hàng</Badge>;
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
              Lịch sử mua hàng sỉ B2B
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
              Quản lý, xem hành trình in ấn & giao nhận và thanh toán của các đơn hàng.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {ordersQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-sm text-slate-400">
            <div className="size-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <p className="font-semibold">Đang tải lịch sử đơn hàng...</p>
          </div>
        ) : null}

        {ordersQuery.isError ? (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/30 p-6 text-center text-xs font-semibold text-rose-700 flex flex-col items-center justify-center gap-2">
            <AlertCircle size={28} className="text-rose-500" />
            <p>Không thể kết nối đến máy chủ Ecommerce API hoặc phiên làm việc đã hết hạn.</p>
          </div>
        ) : null}

        {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-100 py-16 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2 bg-slate-50/20">
            <Package size={32} className="text-slate-300" />
            <p>Tài khoản sỉ của bạn chưa phát sinh đơn hàng nào.</p>
          </div>
        ) : null}

        <div className="space-y-3.5">
          {orders.map((order: any) => {
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
                        {order.paymentMethod === "ONLINE" ? "Cổng PayOS" : "Tiền mặt (COD)"}
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
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng tiền thanh toán</p>
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
      </CardContent>
    </Card>
  );
}
