"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Package, 
  XCircle, 
  Printer, 
  MapPin, 
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  QrCode,
  ShoppingCart,
  Banknote,
  PackageCheck,
  CircleDot,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getOrder, cancelOrder } from "@/features/order/services/order.service";
import { cleanProductName } from "@/features/catalog/services/catalog.service";
import { useCartStore } from "@/stores/cart-store";
import { CupConfigDetails } from "@/features/cart/components/cup-config-details";
import {
  canPayNextOnlineStage,
  getNextPaymentButtonLabel,
  getPaymentStageBreakdown,
} from "@/features/order/utils/payment-flow";
import { formatCurrency } from "@/utils/format-currency";
import { formatDateTime } from "@/utils/format-date";
import { apiClient } from "@/lib/api-client";
import { unwrapApiData } from "@/lib/api-contract";

export function OrderDetailClient({ orderId, onBack }: { orderId: string; onBack?: () => void }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const restoreItems = useCartStore((state) => state.restoreItems);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState("");
  const [selectedReason, setSelectedReason] = useState("Tôi muốn đổi phương thức thanh toán");

  const CANCEL_REASONS = [
    "Tôi muốn đổi phương thức thanh toán",
    "Tôi muốn thêm/bớt hoặc đổi sản phẩm",
    "Nhập sai thông tin giao nhận hàng",
    "Tôi tìm được nhà cung cấp khác tốt hơn",
    "Không còn nhu cầu mua nữa",
    "Lý do khác"
  ];

  const orderQuery = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId),
    enabled: /^[0-9a-fA-F]{24}$/.test(orderId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return ["UNPAID", "DEPOSIT_PAID", "PROGRESS_PAID"].includes(data?.paymentStatus)
        ? 5000
        : false;
    },
  });

  const order = orderQuery.data as any;
  const canPayNextStage = canPayNextOnlineStage(order);
  const paymentStages = getPaymentStageBreakdown(order);
  const currentPaymentStageStatus = order?.paymentStatus || "UNPAID";
  const printItems = Array.isArray(order?.items)
    ? order.items.filter((item: any) => item?.isPrintItem)
    : [];
  const sampleProofImages: string[] = printItems
    .map((item: any) => item?.sampleProofImage)
    .filter((url: any): url is string => typeof url === "string" && url.trim().length > 0);
  const showPrintApprovalFlow = Boolean(order?.hasPrintItems) && !["CANCELLED", "COMPLETED"].includes(order?.status);

  const handleConfirmCancel = async () => {
    try {
      setIsCancelling(true);
      const reason = selectedReason === "Lý do khác"
        ? (cancelReasonText.trim() || "Lý do khác")
        : selectedReason;

      const isUnpaidOnline = order?.paymentStatus === "UNPAID" && order?.paymentMethod === "ONLINE";
      await cancelOrder(orderId, reason);

      if (isUnpaidOnline && order?.items?.length) {
        const cartItems = order.items.map((item: any) => {
          const isCustom = item.isPrintItem;
          let designFileSnapshot: any = undefined;
          if (item.designFile) {
            try {
              designFileSnapshot = typeof item.designFile === 'string'
                ? JSON.parse(item.designFile)
                : item.designFile;
            } catch {
              // ignore
            }
          }
          return {
            cartItemId: isCustom
              ? `custom:${item.sku}:${item.designId || ""}:${Date.now()}`
              : `standard:${item.sku}`,
            productId: item.sku,
            productRefId: item.sku,
            name: item.name || item.sku,
            slug: item.sku,
            price: item.unitPrice,
            quantity: item.quantity,
            unit: "cái",
            imageUrl: designFileSnapshot?.previewDataUrl || "/images/product-placeholder.svg",
            fulfillmentType: isCustom ? "CUSTOM_PRINT" : "STANDARD",
            designId: item.designId ?? undefined,
            designFile: designFileSnapshot,
          };
        });
        await restoreItems(cartItems);
        toast.success("Đã hủy thanh toán và chuyển các sản phẩm về giỏ hàng!");
        setShowCancelDialog(false);
        router.push("/cart");
      } else {
        toast.success("Đã hủy đơn hàng thành công!");
        setShowCancelDialog(false);
        setSelectedReason("Tôi muốn đổi phương thức thanh toán");
        setCancelReasonText("");
        queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      }
    } catch (err: any) {
      toast.error(`Hủy đơn hàng thất bại: ${err.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRepay = async () => {
    try {
      setIsRepaying(true);
      const payUrlRes = await apiClient.get<any>(
        `/payment/payos/create-url/${orderId || order._id}`,
      );
      const payUrlData = unwrapApiData(payUrlRes.data);
      if (payUrlData.payUrl) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("lastCreatedOrderId", orderId || order._id);
          if (order.code) {
            sessionStorage.setItem("lastCreatedOrderCode", String(order.code));
          }
          sessionStorage.setItem("lastPaymentStartedStatus", order.paymentStatus || "UNPAID");
        }
        toast.success("Đang chuyển hướng sang cổng thanh toán PayOS...");
        window.location.href = payUrlData.payUrl;
      } else {
        toast.error("Không tạo được link thanh toán.");
      }
    } catch (err: any) {
      toast.error(`Có lỗi xảy ra: ${err.message}`);
    } finally {
      setIsRepaying(false);
    }
  };

  if (orderQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <Card className="rounded-2xl border-rose-100 bg-rose-50/50 p-6 text-center max-w-lg mx-auto mt-10">
        <CardContent className="space-y-4 pt-4">
          <XCircle className="size-12 text-rose-500 mx-auto" />
          <h3 className="font-black text-rose-950 text-base">Không tìm thấy đơn hàng</h3>
          <p className="text-xs text-rose-700/80 leading-relaxed">
            Mã đơn hàng không hợp lệ hoặc bạn không có quyền xem chi tiết đơn hàng này.
          </p>
          {onBack ? (
            <Button onClick={onBack} variant="outline" className="rounded-xl border-rose-200 text-rose-800 hover:bg-rose-100">
              Quay lại danh sách
            </Button>
          ) : (
            <Button asChild variant="outline" className="rounded-xl border-rose-200 text-rose-800 hover:bg-rose-100">
              <Link href="/orders">Quay lại danh sách</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Determine helper colors & text for status axes
  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã thanh toán</Badge>;
      case "DEPOSIT_PAID":
        return <Badge className="bg-lime-100 text-lime-800 border-lime-200">Đã cọc</Badge>;
      case "PROGRESS_PAID":
        return <Badge className="bg-teal-100 text-teal-800 border-teal-200">Đã thanh toán tiến độ</Badge>;
      case "UNPAID":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Chờ thanh toán</Badge>;
      case "REFUND_PENDING":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Chờ hoàn tiền</Badge>;
      case "REFUNDED":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Đã hoàn tiền</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PLACED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100">Chờ xử lý</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Đã xác nhận</Badge>;
      case "COMPLETED":
        return <Badge className="bg-emerald-600 text-white border-transparent">Hoàn thành</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFulfillmentBadge = (status: string) => {
    switch (status) {
      case "NONE":
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200">Chờ xuất kho</Badge>;
      case "AWAITING_PRINT":
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">Kho đang in</Badge>;
      case "SAMPLE_PRINTED":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Chờ duyệt mẫu</Badge>;
      case "READY_TO_PICK":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Chờ xuất kho</Badge>;
      case "ISSUED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Đã xuất kho</Badge>;
      case "PRINTING":
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">Đang in ly</Badge>;
      case "SHIPPED":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Đang vận chuyển</Badge>;
      case "DELIVERED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã giao hàng</Badge>;
      case "RETURNED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Đã trả hàng</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Build timeline steps
  type StepStatus = "done" | "active" | "pending" | "cancelled";
  type TimelineStep = {
    id: string;
    label: string;
    desc: string;
    icon: React.ReactNode;
    status: StepStatus;
    timestamp?: string;
  };

  const buildTimeline = (): TimelineStep[] => {
    const isCancelled = order.orderStatus === "CANCELLED" || order.status === "CANCELLED";
    const orderStatus  = order.orderStatus || order.status;
    const payStatus    = order.paymentStatus;
    const fulfillment  = order.fulfillmentStatus;

    const isPaid      = payStatus === "PAID";
    const hasPaymentProgress = ["DEPOSIT_PAID", "PROGRESS_PAID", "PAID"].includes(payStatus);
    const isConfirmed = orderStatus === "CONFIRMED" || orderStatus === "COMPLETED";
    const isCompleted = orderStatus === "COMPLETED";
    const isShipped   = fulfillment === "SHIPPED" || fulfillment === "DELIVERED";
    const isDelivered = fulfillment === "DELIVERED";

    const steps: TimelineStep[] = [];

    // Step 1 - Đặt đơn
    steps.push({
      id: "placed",
      label: "Đặt đơn",
      desc: "Đơn hàng đã được tạo",
      icon: <ShoppingCart className="size-4" />,
      status: isCancelled ? "cancelled" : "done",
      timestamp: order.createdAt,
    });

    // Step 2 - Thanh toán
    const payDone = isPaid;
    steps.push({
      id: "payment",
      label: "Thanh toán",
      desc: isPaid
        ? `Đã thanh toán qua ${order.paymentMethod}`
        : order.paymentMethod === "COD"
          ? "COD - Trả khi nhận hàng"
          : "Đang chờ thanh toán online",
      icon: <Banknote className="size-4" />,
      status: isCancelled
        ? "cancelled"
        : payDone
          ? "done"
          : "active",
      timestamp: order.paidAt,
    });

    // Step 3 - Xác nhận
    steps.push({
      id: "confirmed",
      label: "Xác nhận",
      desc: isConfirmed ? "Shop đã xác nhận đơn" : "Chờ shop xác nhận",
      icon: <PackageCheck className="size-4" />,
      status: isCancelled
        ? "cancelled"
        : isConfirmed
          ? "done"
          : (payDone || hasPaymentProgress) ? "active" : "pending",
    });

    // Step 4 - Sản xuất
    if (order.hasPrintItems) {
      const isPrinted =
        fulfillment !== "NONE" &&
        fulfillment !== "PRINTING" &&
        fulfillment !== "PENDING" &&
        fulfillment !== undefined;
      const isPrinting = fulfillment === "PRINTING";
      steps.push({
        id: "printing",
        label: "Sản xuất",
        desc: isPrinted
          ? "In ly hoàn thành"
          : isPrinting
            ? "Đang tiến hành in"
            : "Chờ in ly custom",
        icon: <Printer className="size-4" />,
        status: isCancelled
          ? "cancelled"
          : isPrinted
            ? "done"
            : isPrinting
              ? "active"
              : "pending",
      });
    }

    // Step 5 - Vận chuyển
    steps.push({
      id: "shipping",
      label: isDelivered ? "Đã nhận" : "Vận chuyển",
      desc: isDelivered
        ? "Đơn hàng đã được giao"
        : isShipped
          ? "Đang giao hàng"
          : "Chưa xuất kho",
      icon: <Truck className="size-4" />,
      status: isCancelled
        ? "cancelled"
        : isDelivered
          ? "done"
          : isShipped
            ? "active"
            : "pending",
      timestamp: order.deliveredAt,
    });

    // Step 6 - Hoàn thành
    steps.push({
      id: "completed",
      label: "Hoàn thành",
      desc: isCompleted ? "Đơn hàng hoàn tất" : "Chưa hoàn thành",
      icon: <CheckCircle2 className="size-4" />,
      status: isCancelled
        ? "cancelled"
        : isCompleted
          ? "done"
          : "pending",
      timestamp: order.completedAt,
    });

    return steps;
  };

  const timelineSteps = buildTimeline();
  const isCancelledOrder = order.orderStatus === "CANCELLED" || order.status === "CANCELLED";

  const renderPrintApprovalPanel = () => {
    if (!showPrintApprovalFlow) return null;

    const paymentStatus = order.paymentStatus;
    const fulfillmentStatus = order.fulfillmentStatus;

    let title = "Luồng in ly theo thiết kế";
    let description = "Đơn ly in sẽ đi theo 3 đợt thanh toán: cọc 30%, duyệt mẫu in thử và thanh toán 30%, duyệt bản in thật và thanh toán 40% còn lại.";
    let tone = "border-slate-200 bg-slate-50/70 text-slate-700";
    let icon = <Printer className="size-5 text-slate-500" />;

    if (paymentStatus === "DEPOSIT_PAID" && fulfillmentStatus === "AWAITING_PRINT") {
      title = "Kho đang in thử";
      description = "Kho đã nhận lệnh in thử sau khi bạn thanh toán đợt 1. Khi kho gửi ảnh mẫu về, bạn sẽ kiểm tra mẫu rồi thanh toán đợt 2 để bắt đầu in thật.";
      tone = "border-cyan-200 bg-cyan-50/70 text-cyan-900";
      icon = <Clock className="size-5 text-cyan-600" />;
    } else if (paymentStatus === "DEPOSIT_PAID" && fulfillmentStatus === "SAMPLE_PRINTED") {
      title = "Mẫu in thử đã sẵn sàng";
      description = "Vui lòng kiểm tra ảnh mẫu kho gửi về. Nếu mẫu đúng yêu cầu, bấm thanh toán đợt 2 để xác nhận duyệt mẫu và phát lệnh in thật cho kho.";
      tone = "border-amber-200 bg-amber-50/80 text-amber-950";
      icon = <CheckCircle2 className="size-5 text-amber-600" />;
    } else if (paymentStatus === "PROGRESS_PAID" && fulfillmentStatus === "AWAITING_PRINT") {
      title = "Kho đang in thật";
      description = "Kho đã nhận lệnh in thật sau khi bạn thanh toán đợt 2. Khi in xong, trạng thái sẽ chuyển sang chờ duyệt bản in để bạn thanh toán đợt 3.";
      tone = "border-cyan-200 bg-cyan-50/70 text-cyan-900";
      icon = <Printer className="size-5 text-cyan-600" />;
    } else if (paymentStatus === "PROGRESS_PAID" && fulfillmentStatus === "READY_TO_PICK") {
      title = "Bản in thật đã hoàn tất";
      description = "Kho đã hoàn tất in thật. Nếu bản in đã đúng, bấm thanh toán đợt 3 để kho nhận lệnh xuất kho và chuyển hàng đi.";
      tone = "border-amber-200 bg-amber-50/80 text-amber-950";
      icon = <PackageCheck className="size-5 text-amber-600" />;
    } else if (paymentStatus === "PAID" && ["READY_TO_PICK", "ISSUED", "SHIPPED", "DELIVERED"].includes(fulfillmentStatus)) {
      title = "Đã thanh toán đủ";
      description = "Kho đã nhận đủ thanh toán và đang xử lý xuất kho hoặc vận chuyển đơn hàng.";
      tone = "border-emerald-200 bg-emerald-50/80 text-emerald-950";
      icon = <CheckCircle2 className="size-5 text-emerald-600" />;
    }

    return (
      <div className={`rounded-2xl border p-5 ${tone}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-2xs">
              {icon}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-wider">{title}</p>
              <p className="max-w-3xl text-xs font-semibold leading-relaxed opacity-90">{description}</p>
            </div>
          </div>

          {canPayNextStage ? (
            <Button
              onClick={handleRepay}
              disabled={isRepaying}
              className="shrink-0 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700"
            >
              <QrCode className="mr-1.5 size-4" />
              {isRepaying ? "Đang tạo mã QR..." : getNextPaymentButtonLabel(order)}
            </Button>
          ) : null}
        </div>

        {sampleProofImages.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sampleProofImages.map((url, index) => (
              <a
                key={`${url}-${index}`}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-xl border border-white/80 bg-white shadow-2xs"
              >
                <img
                  src={url}
                  alt={`Ảnh mẫu in thử ${index + 1}`}
                  className="h-44 w-full object-contain bg-white transition-transform group-hover:scale-[1.02]"
                />
                <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-600">
                  <span>Ảnh mẫu in thử {index + 1}</span>
                  <ExternalLink className="size-3.5" />
                </div>
              </a>
            ))}
          </div>
        ) : fulfillmentStatus === "SAMPLE_PRINTED" ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-white/70 p-3 text-xs font-semibold text-amber-800">
            Kho đã báo in thử xong nhưng đơn hàng chưa có link ảnh mẫu. Vui lòng tải lại sau hoặc liên hệ quản lý/kho để cập nhật ảnh mẫu.
          </p>
        ) : null}
      </div>
    );
  };
  const printApprovalPanel = renderPrintApprovalPanel();

  // Helper: color classes per status
  const stepColors = {
    done:      { dot: "bg-emerald-500 ring-emerald-100",      text: "text-emerald-700",  line: "bg-emerald-400" },
    active:    { dot: "bg-amber-500 ring-amber-100 animate-pulse", text: "text-amber-700", line: "bg-slate-200" },
    pending:   { dot: "bg-slate-200 ring-slate-50",           text: "text-slate-400",  line: "bg-slate-200" },
    cancelled: { dot: "bg-rose-300 ring-rose-100",            text: "text-rose-400",   line: "bg-rose-200" },
  };


  return (
    <div className="w-full space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-2">
        {onBack ? (
          <Button onClick={onBack} variant="ghost" className="h-9 px-3 rounded-lg text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4 mr-1.5" />
            Trở lại danh sách
          </Button>
        ) : (
          <Button asChild variant="ghost" className="h-9 px-3 rounded-lg text-muted-foreground hover:text-foreground">
            <Link href="/orders">
              <ArrowLeft className="size-4 mr-1.5" />
              Trở lại danh sách
            </Link>
          </Button>
        )}
        <ChevronRight className="size-3.5 text-slate-300" />
        <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">Đơn hàng #{order.code || orderId}</span>
      </div>

      <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden w-full">
        {/* Unified Header */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-primary">
              <Package size={20} />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-[#253D4E] uppercase tracking-wider">
                Chi tiết đơn hàng #{order.code || orderId}
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                Đặt ngày {formatDateTime(order.createdAt)} - Kho xuất: {order.warehouseName || "Kho trung tâm"}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {getOrderStatusBadge(order.status)}
            {getPaymentBadge(order.paymentStatus)}
            {getFulfillmentBadge(order.fulfillmentStatus)}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5 divide-y divide-slate-100">
          {/* SECTION 1: TIMELINE & SHIPPING ADDRESS */}
          <div className="grid gap-4 md:grid-cols-2 pb-1">
            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Truck className="size-3.5 text-slate-500" />
                Hành trình đơn hàng
              </h3>

              {isCancelledOrder ? (
                // Cancelled state
                <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-50/30 p-5 flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                    <XCircle className="size-5 text-rose-600" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-black text-rose-900 text-sm">Đơn hàng đã bị hủy</p>
                    <p className="text-rose-700 leading-relaxed">
                      Lý do: <span className="font-semibold">{order.cancelReason || "Người dùng hoặc hệ thống tự động hủy."}</span>
                    </p>
                    {order.cancelledAt && (
                      <p className="text-rose-400 font-mono text-[10px]">
                        {formatDateTime(order.cancelledAt)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // Stepper
                <div className="relative">
                  {/* Mobile: vertical stepper */}
                  <div className="flex flex-col gap-0 md:hidden">
                    {timelineSteps.map((step, idx) => {
                      const col = stepColors[step.status];
                      const isLast = idx === timelineSteps.length - 1;
                      return (
                        <div key={step.id} className="flex gap-4 relative">
                          {/* Left dot + line */}
                          <div className="flex flex-col items-center">
                            <div className={`size-8 rounded-full flex items-center justify-center ring-4 shrink-0 z-10 ${col.dot}`}>
                              <span className={step.status === "done" ? "text-white" : step.status === "active" ? "text-white" : "text-slate-400"}>
                                {step.icon}
                              </span>
                            </div>
                            {!isLast && (
                              <div className={`w-0.5 flex-1 min-h-[28px] mt-1 ${col.line}`} />
                            )}
                          </div>
                          {/* Content */}
                          <div className={`pb-6 pt-1 ${isLast ? "" : ""}`}>
                            <p className={`text-xs font-black ${col.text}`}>{step.label}</p>
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{step.desc}</p>
                            {step.timestamp && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDateTime(step.timestamp)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop: horizontal stepper */}
                  <div className="hidden md:flex items-start">
                    {timelineSteps.map((step, idx) => {
                      const col = stepColors[step.status];
                      const isLast = idx === timelineSteps.length - 1;
                      return (
                        <div key={step.id} className="flex-1 flex flex-col items-center relative">
                          {/* Connector line (left side, skip first) */}
                          {idx > 0 && (
                            <div
                              className={`absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 ${
                                timelineSteps[idx - 1].status === "done" ? "bg-emerald-400" : "bg-slate-200"
                              }`}
                            />
                          )}

                          {/* Dot */}
                          <div className={`size-8 rounded-full flex items-center justify-center ring-4 z-10 shrink-0 ${col.dot}`}>
                            <span className={step.status === "done" || step.status === "active" ? "text-white" : "text-slate-400"}>
                              {step.icon}
                            </span>
                          </div>

                          {/* Label */}
                          <div className="text-center mt-2 px-1">
                            <p className={`text-[11px] font-black leading-tight ${col.text}`}>{step.label}</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 max-w-[90px] mx-auto">{step.desc}</p>
                            {step.timestamp && (
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{formatDateTime(step.timestamp)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MapPin className="size-3.5 text-slate-500" />
                Địa chỉ giao hàng
              </h3>
              {order.shippingAddress ? (
                <div className="grid gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-400">Người nhận hàng</p>
                    <p className="text-sm font-extrabold text-[#253D4E]">{order.shippingAddress.recipientName}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-400">Số điện thoại</p>
                    <p className="text-sm font-extrabold text-[#253D4E]">{order.shippingAddress.phone}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-400">Địa chỉ chi tiết</p>
                    <p className="text-slate-600 font-semibold leading-relaxed">
                      {order.shippingAddress.line}
                      {order.shippingAddress.ward && order.shippingAddress.ward !== "N/A" ? `, Phường ${order.shippingAddress.ward}` : ""}
                      {order.shippingAddress.district && order.shippingAddress.district !== "N/A" ? `, ${order.shippingAddress.district}` : ""}
                      {order.shippingAddress.province && order.shippingAddress.province !== "N/A" ? `, ${order.shippingAddress.province}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs">Chưa có thông tin địa chỉ.</p>
              )}
            </div>
          </div>

          {printApprovalPanel ? (
            <div className="pt-5">
              {printApprovalPanel}
            </div>
          ) : null}

          {/* SECTION 2: PRODUCT LIST */}
          <div className="pt-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Package className="size-3.5 text-slate-500" />
              Sản phẩm đã đặt mua
            </h3>
            
            <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/20">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <p className="font-extrabold text-sm text-[#253D4E] truncate">{cleanProductName(item.name, item.sku)}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">SKU: {item.sku}</p>
                    <CupConfigDetails item={item} />
                    {item.isPrintItem && item.designId && (
                      <div className="mt-1.5 rounded-lg bg-white border border-slate-100 p-2.5 text-[10px] font-semibold text-slate-500 max-w-sm shadow-2xs">
                        <p className="text-primary font-black uppercase text-[9px] mb-1 flex items-center gap-1">
                          <Printer className="size-3" /> Bản in Custom:
                        </p>
                        <p>• Mã thiết kế: <span className="font-mono text-slate-700">{item.designId}</span></p>
                      </div>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0.5 justify-between w-full sm:w-auto text-xs shrink-0 pl-2">
                    <span className="font-bold text-slate-400">{formatCurrency(item.unitPrice)} x {item.quantity}</span>
                    <span className="font-black text-primary text-sm sm:text-base">{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: INVOICE & ACTIONS */}
          <div className="pt-5 space-y-4">
            {/* Warning / Deadline Info (Payment Method) on top */}
            <div className="w-full">
              {order.paymentStatus === "UNPAID" && order.paymentMethod === "ONLINE" && order.paymentDeadline ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs leading-relaxed text-[#253D4E] font-medium flex gap-3 shadow-2xs">
                  <Clock className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-800">Thời hạn thanh toán trực tuyến</p>
                    <p>
                      Đơn hàng của bạn sẽ bị hệ thống tự động hủy và hoàn trả tồn kho nếu không hoàn tất thanh toán trước ngày:
                    </p>
                    <p className="font-extrabold text-primary text-sm mt-1">{formatDateTime(order.paymentDeadline)}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs leading-relaxed text-slate-500 font-semibold flex gap-3">
                  <CreditCard className="size-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-700">Phương thức thanh toán đã chọn</p>
                    <p>
                      {order.paymentMethod === "ONLINE" 
                        ? "Thanh toán trực tuyến qua cổng PayOS"
                        : "Thanh toán mặt cho nhà xe/chành xe (COD) khi nhận hàng"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bill Summary and action buttons on bottom */}
            <div className="border border-slate-100 rounded-xl p-6 bg-slate-50/30 space-y-6 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Tóm tắt chi phí đơn hàng
                </h3>
                
                {/* Action buttons inside the header on desktop */}
                <div className="flex gap-2 flex-wrap sm:flex-nowrap shrink-0">
                  {/* Repay online if unpaid */}
                  {canPayNextStage && (
                    <Button
                      onClick={handleRepay}
                      disabled={isRepaying}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md text-xs cursor-pointer select-none"
                    >
                      <QrCode className="size-4" />
                      {isRepaying ? "Đang tạo mã QR..." : getNextPaymentButtonLabel(order)}
                    </Button>
                  )}

                  {/* Cancel Placed Order */}
                  {order.status === "PLACED" && (
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      disabled={isCancelling}
                      variant="outline"
                      className="text-rose-600 border-rose-100 hover:bg-rose-50 hover:border-rose-200 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer select-none"
                    >
                      <XCircle className="size-4" />
                      Hủy đơn hàng
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs pt-2">
                <div className="space-y-1">
                  <p className="font-bold text-slate-400">Tạm tính</p>
                  <p className="text-sm font-extrabold text-[#253D4E]">{formatCurrency(order.subtotal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-400">Phí vận chuyển</p>
                  <p className="text-sm font-extrabold text-[#253D4E]">
                    {order.shippingFee === 0 ? "Miễn phí" : formatCurrency(order.shippingFee)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wide">Tổng cộng thanh toán</p>
                  <p className="text-base font-black text-primary">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>

              {paymentStages.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 border-t border-slate-200/60 pt-4 sm:grid-cols-3">
                  {paymentStages.map((stage, index) => {
                    const isCurrent = stage.status === currentPaymentStageStatus;
                    const statusOrder = ["UNPAID", "DEPOSIT_PAID", "PROGRESS_PAID", "PAID"];
                    const isDone =
                      statusOrder.indexOf(currentPaymentStageStatus) >
                      statusOrder.indexOf(stage.status);

                    return (
                      <div
                        key={`${stage.status}-${index}`}
                        className={[
                          "rounded-xl border px-4 py-3 text-xs",
                          isCurrent
                            ? "border-amber-200 bg-amber-50"
                            : isDone
                              ? "border-emerald-100 bg-emerald-50/70"
                              : "border-slate-100 bg-white",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-black text-slate-600">{stage.label}</p>
                          {isDone ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Đã xong
                            </span>
                          ) : isCurrent ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              Đang cần thanh toán
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-base font-black text-primary">
                          {formatCurrency(stage.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-slate-200">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-sm font-black text-rose-950 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-600 animate-bounce" />
              Xác nhận hủy đơn hàng
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này sẽ giải phóng toàn bộ số lượng tồn kho đã được giữ cho đơn hàng của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Label className="text-xs font-bold text-slate-500 tracking-wide">
              Chọn lý do hủy đơn
            </Label>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {CANCEL_REASONS.map((reason) => {
                const checked = selectedReason === reason;
                return (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all ${
                      checked 
                        ? "border-rose-500 bg-rose-50/20 text-rose-950 font-bold" 
                        : "border-slate-100 bg-slate-50/50 text-slate-600 hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={checked}
                      onChange={() => {
                        setSelectedReason(reason);
                        if (reason !== "Lý do khác") {
                          setCancelReasonText("");
                        }
                      }}
                      className="size-3.5 text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer accent-rose-600"
                    />
                    <span>{reason}</span>
                  </label>
                );
              })}
            </div>

            {selectedReason === "Lý do khác" && (
              <div className="space-y-1.5 pt-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="cancelReasonInput" className="text-[10px] font-bold text-[#78858F] tracking-wide">
                  Chi tiết lý do khác
                </Label>
                <Textarea
                  id="cancelReasonInput"
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  placeholder="Vui lòng nhập lý do hủy đơn cụ thể tại đây..."
                  className="min-h-16 rounded-xl border border-slate-200 bg-white text-xs p-3 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:outline-none"
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={isCancelling}
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReasonText("");
              }}
              className="rounded-xl font-bold text-xs h-10 text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 font-bold text-xs h-10 cursor-pointer shadow-md select-none border-0"
            >
              {isCancelling ? "Đang xử lý..." : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
