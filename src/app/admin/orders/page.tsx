"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, ClipboardList, Eye, RefreshCw, ShieldAlert, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminAdvanceOrderPaymentProgress,
  adminCanAdvanceOrderPaymentProgress,
  adminListOrders,
  adminOrderHasPrintItems,
  getAdminPaymentAdvanceLabel,
} from "@/features/order/services/admin-order.service";
import { formatCurrency } from "@/utils/format-currency";
import { formatDateTime } from "@/utils/format-date";

const ORDER_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "FULFILLING", label: "Đang xử lý" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [advancingOrderId, setAdvancingOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof ORDER_TABS)[number]["key"]>("ALL");

  const getOrderStatus = (order: any) => {
    const rawStatus = String(order?.orderStatus || order?.status || "PLACED").toUpperCase();
    if (rawStatus === "PLACED" || rawStatus === "PENDING" || rawStatus === "PENDING_PAYMENT") {
      return "PENDING";
    }
    if (rawStatus === "CLOSED") return "COMPLETED";
    return rawStatus;
  };

  const tabCounts = useMemo(() => {
    return ORDER_TABS.reduce<Record<string, number>>((counts, tab) => {
      counts[tab.key] =
        tab.key === "ALL"
          ? orders.length
          : orders.filter((order) => getOrderStatus(order) === tab.key).length;
      return counts;
    }, {});
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "ALL") return orders;
    return orders.filter((order) => getOrderStatus(order) === activeTab);
  }, [activeTab, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminListOrders();
      setOrders(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Lấy danh sách đơn hàng thất bại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAdvancePaymentProgress = async (order: any) => {
    const orderId = order.id || order._id;
    if (!orderId || !adminCanAdvanceOrderPaymentProgress(order)) return;

    setAdvancingOrderId(orderId);
    try {
      const updatedOrder = await adminAdvanceOrderPaymentProgress(order);
      setOrders((current) =>
        current.map((item) => ((item.id || item._id) === orderId ? updatedOrder : item)),
      );
      setSelectedOrder(updatedOrder);
      toast.success("Đã cập nhật tiến độ thanh toán đơn hàng.");
    } catch (error) {
      console.error(error);
      toast.error("Không thể đẩy tiến độ. Vui lòng thử lại sau.");
    } finally {
      setAdvancingOrderId(null);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500 text-white border-0 text-[10px] py-0.5 px-2 rounded-full font-bold">ĐÃ HOÀN THÀNH</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-500 text-white border-0 text-[10px] py-0.5 px-2 rounded-full font-bold">ĐÃ HỦY</Badge>;
      case "FULFILLING":
        return <Badge className="bg-indigo-500 text-white border-0 text-[10px] py-0.5 px-2 rounded-full font-bold">ĐANG XỬ LÝ</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-blue-500 text-white border-0 text-[10px] py-0.5 px-2 rounded-full font-bold">ĐÃ XÁC NHẬN</Badge>;
      default:
        return <Badge className="bg-slate-400 text-white border-0 text-[10px] py-0.5 px-2 rounded-full font-bold">CHỜ DUYỆT</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string, order?: any) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] py-0.5 px-2 rounded-full font-bold">ĐÃ THANH TOÁN 100%</Badge>;
      case "DEPOSIT_PAID":
        return (
          <Badge className="bg-lime-50 text-lime-700 border border-lime-200 text-[10px] py-0.5 px-2 rounded-full font-bold">
            {adminOrderHasPrintItems(order) ? "ĐÃ CỌC 30%" : "ĐÃ CỌC 50%"}
          </Badge>
        );
      case "PROGRESS_PAID":
        return <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] py-0.5 px-2 rounded-full font-bold">ĐÃ THANH TOÁN 60%</Badge>;
      case "REFUNDED":
        return <Badge className="bg-violet-50 text-violet-700 border border-violet-200 text-[10px] py-0.5 px-2 rounded-full font-bold">ĐÃ HOÀN TIỀN</Badge>;
      case "REFUND_PENDING":
        return <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] py-0.5 px-2 rounded-full font-bold">CHỜ HOÀN TIỀN</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] py-0.5 px-2 rounded-full font-bold">CHỜ THANH TOÁN</Badge>;
    }
  };

  const getFulfillmentStatusBadge = (status: string) => {
    switch (status) {
      case "NONE":
        return <Badge variant="outline" className="text-slate-500 border-slate-200 text-[10px] font-bold py-0.5 px-2 rounded-full bg-slate-50">CHỜ XUẤT KHO</Badge>;
      case "READY_TO_PICK":
        return <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px] font-bold py-0.5 px-2 rounded-full bg-amber-50">CHỜ ĐÓNG GÓI</Badge>;
      case "AWAITING_PRINT":
        return <Badge variant="outline" className="text-cyan-600 border-cyan-200 text-[10px] font-bold py-0.5 px-2 rounded-full bg-cyan-50">CHỜ IN LY</Badge>;
      case "ISSUED":
        return <Badge variant="outline" className="text-blue-600 border-blue-200 text-[10px] font-bold py-0.5 px-2 rounded-full bg-blue-50">ĐÃ XUẤT KHO</Badge>;
      case "SHIPPED":
        return <Badge variant="outline" className="text-indigo-600 border-indigo-200 text-[10px] font-bold py-0.5 px-2 rounded-full bg-indigo-50">ĐANG VẬN CHUYỂN</Badge>;
      case "DELIVERED":
        return <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-[10px] font-bold py-0.5 px-2 rounded-full bg-emerald-50">ĐÃ GIAO HÀNG</Badge>;
      case "RETURNED":
        return <Badge variant="outline" className="text-rose-600 border-rose-200 text-[10px] font-bold py-0.5 px-2 rounded-full bg-rose-50">ĐÃ TRẢ HÀNG</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-400 border-slate-100 text-[10px] font-bold py-0.5 px-2 rounded-full bg-slate-50/50">{status || "NONE"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-[#E9E3DD] shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-[#E9E3DD] bg-slate-50/50 p-0">
          <div className="flex flex-row items-center justify-between gap-4 px-5 py-4">
            <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Danh sách đơn hàng
            </CardTitle>
            <Button
              onClick={fetchOrders}
              variant="outline"
              className="h-9 rounded-xl border border-[#E9E3DD] bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer text-xs font-bold"
            >
              <RefreshCw className="size-3.5" />
              Làm mới
            </Button>
          </div>
          <div className="border-t border-[#E9E3DD]/70 px-5 py-3">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {ORDER_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={[
                      "flex h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors",
                      isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-[#E9E3DD] bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                    ].join(" ")}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={[
                        "rounded-full px-1.5 py-0.5 text-[10px]",
                        isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {tabCounts[tab.key] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                <div className="text-xs text-slate-400 font-medium">Đang tải dữ liệu đơn hàng...</div>
              </div>
            </div>
          ) : (
            <div className="max-h-[62vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10 border-b border-[#E9E3DD] bg-white hover:bg-white">
                  <TableHead className="font-bold text-slate-500 text-xs pl-6">Mã đơn</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">Thời gian đặt</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">Tổng tiền</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">Thanh toán</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">Trạng thái đơn</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">Vận chuyển</TableHead>
                  <TableHead className="text-right font-bold text-slate-500 text-xs pr-6">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-xs text-slate-400 font-medium">
                      Không có đơn hàng trong danh mục này.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const id = order.id || order._id;
                    return (
                      <TableRow key={id} className="border-b border-[#E9E3DD]/60 hover:bg-slate-50/30">
                        <TableCell className="pl-6 py-4 align-middle font-bold text-slate-700 text-xs font-mono">
                          {order.code}
                        </TableCell>
                        <TableCell className="align-middle text-xs text-slate-500">
                          {order.createdAt ? formatDateTime(order.createdAt) : "-"}
                        </TableCell>
                        <TableCell className="align-middle font-extrabold text-slate-800 text-xs">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex flex-col gap-0.5">
                            {getPaymentStatusBadge(order.paymentStatus, order)}
                            <span className="text-[9px] font-bold text-slate-400 ml-1">{order.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          {getOrderStatusBadge(getOrderStatus(order))}
                        </TableCell>
                        <TableCell className="align-middle">
                          {getFulfillmentStatusBadge(order.fulfillmentStatus)}
                        </TableCell>
                        <TableCell className="align-middle text-right pr-6">
                          <Button
                            onClick={() => setSelectedOrder(order)}
                            variant="outline"
                            className="h-8 rounded-lg border border-[#E9E3DD] text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Eye className="size-3" />
                            Xem
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E9E3DD] shadow-2xl p-6 relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <h3 className="text-base font-black text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E9E3DD] pb-3">
              <ClipboardList className="size-4 text-emerald-600" />
              Chi tiết đơn hàng: {selectedOrder.code}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-5 py-4">
              <div className="grid gap-4 sm:grid-cols-3 bg-[#FAF8F6] p-4 rounded-xl border border-[#E9E3DD]/60">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Phương thức thanh toán</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{selectedOrder.paymentMethod}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Trạng thái thanh toán</div>
                  <div className="mt-0.5">{getPaymentStatusBadge(selectedOrder.paymentStatus, selectedOrder)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Kho xử lý</div>
                  <div className="text-xs font-black text-emerald-600 mt-0.5">
                    {selectedOrder.fulfillWarehouseId || "Đang phân bổ..."}
                  </div>
                </div>
              </div>

              {adminCanAdvanceOrderPaymentProgress(selectedOrder) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-amber-900">
                          Luồng backup xử lý thanh toán
                        </div>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-amber-800">
                          Dùng khi khách thanh toán không thành công hoặc bỏ lỡ một đợt thanh toán theo tiến độ.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAdvancePaymentProgress(selectedOrder)}
                      disabled={advancingOrderId === (selectedOrder.id || selectedOrder._id)}
                      className="h-9 rounded-xl bg-amber-600 px-3 text-xs font-bold text-white hover:bg-amber-700"
                    >
                      {advancingOrderId === (selectedOrder.id || selectedOrder._id) ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="size-3.5" />
                      )}
                      {getAdminPaymentAdvanceLabel(selectedOrder)}
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Địa chỉ giao hàng</h4>
                <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/50 text-xs space-y-1">
                  <div className="font-bold text-slate-700">
                    {selectedOrder.shippingAddress?.recipientName} - {selectedOrder.shippingAddress?.phone}
                  </div>
                  <div className="text-slate-500">
                    {selectedOrder.shippingAddress?.line}, {selectedOrder.shippingAddress?.ward}, {selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.province}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Sản phẩm đặt mua</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-100 hover:bg-transparent">
                        <TableHead className="font-bold text-[10px] text-slate-500 py-2">Sản phẩm</TableHead>
                        <TableHead className="font-bold text-[10px] text-slate-500 py-2">Đơn giá</TableHead>
                        <TableHead className="font-bold text-[10px] text-slate-500 py-2 text-center">Số lượng</TableHead>
                        <TableHead className="font-bold text-[10px] text-slate-500 py-2 text-right pr-4">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <TableRow key={idx} className="border-b border-slate-100/60 hover:bg-slate-50/20">
                          <TableCell className="py-2.5">
                            <div className="font-bold text-slate-700 text-xs">{item.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5 flex gap-2">
                              <span>SKU: {item.sku}</span>
                              {item.fulfillmentType === "CUSTOM_PRINT" && (
                                <span className="text-rose-500 font-bold">CUSTOM PRINT</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs font-medium text-slate-600">
                            {formatCurrency(item.price ?? item.unitPrice ?? 0)}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-center font-bold text-slate-700">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs font-extrabold text-[#3BB77E] text-right pr-4">
                            {formatCurrency((item.price ?? item.unitPrice ?? 0) * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                <div className="flex justify-between w-64">
                  <span>Tạm tính:</span>
                  <span className="font-bold text-slate-700">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between w-64">
                  <span>Phí vận chuyển:</span>
                  <span className="font-bold text-slate-700">{formatCurrency(selectedOrder.shippingFee || 0)}</span>
                </div>
                <div className="flex justify-between w-64 border-t border-slate-100 pt-1.5 text-sm">
                  <span className="font-black text-slate-800">Tổng thanh toán:</span>
                  <span className="font-black text-emerald-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E9E3DD] pt-4 flex justify-end">
              <Button
                onClick={() => setSelectedOrder(null)}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer border-0"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
