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
  const [selectedReason, setSelectedReason] = useState("TĂ´i muá»‘n Ä‘á»•i phÆ°Æ¡ng thá»©c thanh toĂ¡n");

  const CANCEL_REASONS = [
    "TĂ´i muá»‘n Ä‘á»•i phÆ°Æ¡ng thá»©c thanh toĂ¡n",
    "TĂ´i muá»‘n thĂªm/bá»›t hoáº·c Ä‘á»•i sáº£n pháº©m",
    "Nháº­p sai thĂ´ng tin giao nháº­n hĂ ng",
    "TĂ´i tĂ¬m Ä‘Æ°á»£c nhĂ  cung cáº¥p khĂ¡c tá»‘t hÆ¡n",
    "KhĂ´ng cĂ²n nhu cáº§u mua ná»¯a",
    "LĂ½ do khĂ¡c"
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
  const payableStatuses = ["UNPAID", "DEPOSIT_PAID", "PROGRESS_PAID"];
  const canPayNextOnlineStage =
    order &&
    payableStatuses.includes(order.paymentStatus) &&
    order.status !== "CANCELLED" &&
    !(order.paymentMethod === "COD" && order.paymentStatus === "PROGRESS_PAID") &&
    !(order.paymentMethod === "COD" && !order.hasPrintItems && order.paymentStatus === "DEPOSIT_PAID");

  const getNextPaymentButtonLabel = () => {
    if (!order) return "Thanh toan";
    if (order.paymentStatus === "UNPAID") return "Thanh toan coc";
    if (order.paymentStatus === "DEPOSIT_PAID") {
      return order.hasPrintItems ? "Thanh toan dot 2" : "Thanh toan phan con lai";
    }
    if (order.paymentStatus === "PROGRESS_PAID") return "Thanh toan phan con lai";
    return "Thanh toan";
  };

  const handleConfirmCancel = async () => {
    try {
      setIsCancelling(true);
      const reason = selectedReason === "LĂ½ do khĂ¡c"
        ? (cancelReasonText.trim() || "LĂ½ do khĂ¡c")
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
            unit: "cĂ¡i",
            imageUrl: designFileSnapshot?.previewDataUrl || "/images/product-placeholder.svg",
            fulfillmentType: isCustom ? "CUSTOM_PRINT" : "STANDARD",
            designId: item.designId ?? undefined,
            designFile: designFileSnapshot,
          };
        });
        await restoreItems(cartItems);
        toast.success("ÄĂ£ há»§y thanh toĂ¡n vĂ  chuyá»ƒn cĂ¡c sáº£n pháº©m vá» giá» hĂ ng!");
        setShowCancelDialog(false);
        router.push("/cart");
      } else {
        toast.success("ÄĂ£ há»§y Ä‘Æ¡n hĂ ng thĂ nh cĂ´ng!");
        setShowCancelDialog(false);
        setSelectedReason("TĂ´i muá»‘n Ä‘á»•i phÆ°Æ¡ng thá»©c thanh toĂ¡n");
        setCancelReasonText("");
        queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      }
    } catch (err: any) {
      toast.error(`Há»§y Ä‘Æ¡n hĂ ng tháº¥t báº¡i: ${err.message}`);
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
        toast.success("Äang chuyá»ƒn hÆ°á»›ng sang cá»•ng thanh toĂ¡n PayOS...");
        window.location.href = payUrlData.payUrl;
      } else {
        toast.error("KhĂ´ng táº¡o Ä‘Æ°á»£c link thanh toĂ¡n.");
      }
    } catch (err: any) {
      toast.error(`CĂ³ lá»—i xáº£y ra: ${err.message}`);
    } finally {
      setIsRepaying(false);
    }
  };

  if (orderQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Äang táº£i chi tiáº¿t Ä‘Æ¡n hĂ ng...</p>
      </div>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <Card className="rounded-2xl border-rose-100 bg-rose-50/50 p-6 text-center max-w-lg mx-auto mt-10">
        <CardContent className="space-y-4 pt-4">
          <XCircle className="size-12 text-rose-500 mx-auto" />
          <h3 className="font-black text-rose-950 text-base">KhĂ´ng tĂ¬m tháº¥y Ä‘Æ¡n hĂ ng</h3>
          <p className="text-xs text-rose-700/80 leading-relaxed">
            MĂ£ Ä‘Æ¡n hĂ ng khĂ´ng há»£p lá»‡ hoáº·c báº¡n khĂ´ng cĂ³ quyá»n xem chi tiáº¿t Ä‘Æ¡n hĂ ng nĂ y.
          </p>
          {onBack ? (
            <Button onClick={onBack} variant="outline" className="rounded-xl border-rose-200 text-rose-800 hover:bg-rose-100">
              Quay láº¡i danh sĂ¡ch
            </Button>
          ) : (
            <Button asChild variant="outline" className="rounded-xl border-rose-200 text-rose-800 hover:bg-rose-100">
              <Link href="/orders">Quay láº¡i danh sĂ¡ch</Link>
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
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">ÄĂ£ thanh toĂ¡n</Badge>;
      case "DEPOSIT_PAID":
        return <Badge className="bg-lime-100 text-lime-800 border-lime-200">Da coc</Badge>;
      case "PROGRESS_PAID":
        return <Badge className="bg-teal-100 text-teal-800 border-teal-200">Da thanh toan tien do</Badge>;
      case "UNPAID":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Chá» thanh toĂ¡n</Badge>;
      case "REFUND_PENDING":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Chá» hoĂ n tiá»n</Badge>;
      case "REFUNDED":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">ÄĂ£ hoĂ n tiá»n</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PLACED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100">Chá» xá»­ lĂ½</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">ÄĂ£ xĂ¡c nháº­n</Badge>;
      case "COMPLETED":
        return <Badge className="bg-emerald-600 text-white border-transparent">HoĂ n thĂ nh</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">ÄĂ£ há»§y</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFulfillmentBadge = (status: string) => {
    switch (status) {
      case "NONE":
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200">Chá» xuáº¥t kho</Badge>;
      case "PRINTING":
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">Äang in ly</Badge>;
      case "SHIPPED":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Äang váº­n chuyá»ƒn</Badge>;
      case "DELIVERED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">ÄĂ£ giao hĂ ng</Badge>;
      case "RETURNED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">ÄĂ£ tráº£ hĂ ng</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // â”€â”€â”€ Build timeline steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // Step 1 â€” Äáº·t Ä‘Æ¡n
    steps.push({
      id: "placed",
      label: "Äáº·t Ä‘Æ¡n",
      desc: "ÄÆ¡n hĂ ng Ä‘Ă£ Ä‘Æ°á»£c táº¡o",
      icon: <ShoppingCart className="size-4" />,
      status: isCancelled ? "cancelled" : "done",
      timestamp: order.createdAt,
    });

    // Step 2 â€” Thanh toĂ¡n
    const payDone = isPaid;
    steps.push({
      id: "payment",
      label: "Thanh toĂ¡n",
      desc: isPaid
        ? `ÄĂ£ thanh toĂ¡n qua ${order.paymentMethod}`
        : order.paymentMethod === "COD"
          ? "COD â€” Tráº£ khi nháº­n hĂ ng"
          : "Äang chá» thanh toĂ¡n online",
      icon: <Banknote className="size-4" />,
      status: isCancelled
        ? "cancelled"
        : payDone
          ? "done"
          : "active",
      timestamp: order.paidAt,
    });

    // Step 3 â€” XĂ¡c nháº­n (Ä‘iá»u kiá»‡n: Ä‘Ă£ thanh toĂ¡n hoáº·c COD)
    steps.push({
      id: "confirmed",
      label: "XĂ¡c nháº­n",
      desc: isConfirmed ? "Shop Ä‘Ă£ xĂ¡c nháº­n Ä‘Æ¡n" : "Chá» shop xĂ¡c nháº­n",
      icon: <PackageCheck className="size-4" />,
      status: isCancelled
        ? "cancelled"
        : isConfirmed
          ? "done"
          : (payDone || hasPaymentProgress) ? "active" : "pending",
    });

    // Step 4 â€” Sáº£n xuáº¥t (chá»‰ khi cĂ³ Ä‘Æ¡n in)
    if (order.hasPrintItems) {
      const isPrinted =
        fulfillment !== "NONE" &&
        fulfillment !== "PRINTING" &&
        fulfillment !== "PENDING" &&
        fulfillment !== undefined;
      const isPrinting = fulfillment === "PRINTING";
      steps.push({
        id: "printing",
        label: "Sáº£n xuáº¥t",
        desc: isPrinted
          ? "In ly hoĂ n thĂ nh"
          : isPrinting
            ? "Äang tiáº¿n hĂ nh in"
            : "Chá» in ly custom",
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

    // Step 5 â€” Váº­n chuyá»ƒn
    steps.push({
      id: "shipping",
      label: isDelivered ? "ÄĂ£ nháº­n" : "Váº­n chuyá»ƒn",
      desc: isDelivered
        ? "ÄÆ¡n hĂ ng Ä‘Ă£ Ä‘Æ°á»£c giao"
        : isShipped
          ? "Äang giao hĂ ng"
          : "ChÆ°a xuáº¥t kho",
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

    // Step 6 â€” HoĂ n thĂ nh
    steps.push({
      id: "completed",
      label: "HoĂ n thĂ nh",
      desc: isCompleted ? "ÄÆ¡n hĂ ng hoĂ n táº¥t" : "ChÆ°a hoĂ n thĂ nh",
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
            Trá»Ÿ láº¡i danh sĂ¡ch
          </Button>
        ) : (
          <Button asChild variant="ghost" className="h-9 px-3 rounded-lg text-muted-foreground hover:text-foreground">
            <Link href="/orders">
              <ArrowLeft className="size-4 mr-1.5" />
              Trá»Ÿ láº¡i danh sĂ¡ch
            </Link>
          </Button>
        )}
        <ChevronRight className="size-3.5 text-slate-300" />
        <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">ÄÆ¡n hĂ ng #{order.code || orderId}</span>
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
                Chi tiáº¿t Ä‘Æ¡n hĂ ng #{order.code || orderId}
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                Äáº·t ngĂ y {formatDateTime(order.createdAt)} Â· Kho xuáº¥t: {order.warehouseName || "Kho trung tĂ¢m"}
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
            {/* â”€â”€ Timeline â€” Horizontal Stepper â”€â”€ */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Truck className="size-3.5 text-slate-500" />
                HĂ nh trĂ¬nh Ä‘Æ¡n hĂ ng
              </h3>

              {isCancelledOrder ? (
                // â”€ CANCELLED STATE â”€
                <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-50/30 p-5 flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                    <XCircle className="size-5 text-rose-600" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-black text-rose-900 text-sm">ÄÆ¡n hĂ ng Ä‘Ă£ bá»‹ há»§y</p>
                    <p className="text-rose-700 leading-relaxed">
                      LĂ½ do: <span className="font-semibold">{order.cancelReason || "NgÆ°á»i dĂ¹ng hoáº·c há»‡ thá»‘ng tá»± Ä‘á»™ng há»§y."}</span>
                    </p>
                    {order.cancelledAt && (
                      <p className="text-rose-400 font-mono text-[10px]">
                        {formatDateTime(order.cancelledAt)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // â”€ STEPPER â”€
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
                Äá»‹a chá»‰ giao hĂ ng
              </h3>
              {order.shippingAddress ? (
                <div className="grid gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-400">NgÆ°á»i nháº­n hĂ ng</p>
                    <p className="text-sm font-extrabold text-[#253D4E]">{order.shippingAddress.recipientName}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-400">Sá»‘ Ä‘iá»‡n thoáº¡i</p>
                    <p className="text-sm font-extrabold text-[#253D4E]">{order.shippingAddress.phone}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-400">Äá»‹a chá»‰ chi tiáº¿t</p>
                    <p className="text-slate-600 font-semibold leading-relaxed">
                      {order.shippingAddress.line}
                      {order.shippingAddress.ward && order.shippingAddress.ward !== "N/A" ? `, PhÆ°á»ng ${order.shippingAddress.ward}` : ""}
                      {order.shippingAddress.district && order.shippingAddress.district !== "N/A" ? `, ${order.shippingAddress.district}` : ""}
                      {order.shippingAddress.province && order.shippingAddress.province !== "N/A" ? `, ${order.shippingAddress.province}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs">ChÆ°a cĂ³ thĂ´ng tin Ä‘á»‹a chá»‰.</p>
              )}
            </div>
          </div>

          {/* SECTION 2: PRODUCT LIST */}
          <div className="pt-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Package className="size-3.5 text-slate-500" />
              Sáº£n pháº©m Ä‘Ă£ Ä‘áº·t mua
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
                          <Printer className="size-3" /> Báº£n in Custom:
                        </p>
                        <p>â€¢ MĂ£ thiáº¿t káº¿: <span className="font-mono text-slate-700">{item.designId}</span></p>
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
                    <p className="font-bold text-amber-800">Thá»i háº¡n thanh toĂ¡n trá»±c tuyáº¿n</p>
                    <p>
                      ÄÆ¡n hĂ ng cá»§a báº¡n sáº½ bá»‹ há»‡ thá»‘ng tá»± Ä‘á»™ng há»§y vĂ  hoĂ n tráº£ tá»“n kho náº¿u khĂ´ng hoĂ n táº¥t thanh toĂ¡n trÆ°á»›c ngĂ y:
                    </p>
                    <p className="font-extrabold text-primary text-sm mt-1">{formatDateTime(order.paymentDeadline)}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs leading-relaxed text-slate-500 font-semibold flex gap-3">
                  <CreditCard className="size-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-700">PhÆ°Æ¡ng thá»©c thanh toĂ¡n Ä‘Ă£ chá»n</p>
                    <p>
                      {order.paymentMethod === "ONLINE" 
                        ? "Thanh toĂ¡n trá»±c tuyáº¿n qua cá»•ng PayOS" 
                        : "Thanh toĂ¡n máº·t cho nhĂ  xe/chĂ nh xe (COD) khi nháº­n hĂ ng"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bill Summary and action buttons on bottom */}
            <div className="border border-slate-100 rounded-xl p-6 bg-slate-50/30 space-y-6 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  TĂ³m táº¯t chi phĂ­ Ä‘Æ¡n hĂ ng
                </h3>
                
                {/* Action buttons inside the header on desktop */}
                <div className="flex gap-2 flex-wrap sm:flex-nowrap shrink-0">
                  {/* Repay online if unpaid */}
                  {canPayNextOnlineStage && (
                    <Button
                      onClick={handleRepay}
                      disabled={isRepaying}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md text-xs cursor-pointer select-none"
                    >
                      <QrCode className="size-4" />
                      {isRepaying ? "Đang tạo mã QR..." : getNextPaymentButtonLabel()}
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
                      Há»§y Ä‘Æ¡n hĂ ng
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs pt-2">
                <div className="space-y-1">
                  <p className="font-bold text-slate-400">Táº¡m tĂ­nh</p>
                  <p className="text-sm font-extrabold text-[#253D4E]">{formatCurrency(order.subtotal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-400">PhĂ­ váº­n chuyá»ƒn</p>
                  <p className="text-sm font-extrabold text-[#253D4E]">
                    {order.shippingFee === 0 ? "Miá»…n phĂ­" : formatCurrency(order.shippingFee)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wide">Tá»•ng cá»™ng thanh toĂ¡n</p>
                  <p className="text-base font-black text-primary">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>
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
              XĂ¡c nháº­n há»§y Ä‘Æ¡n hĂ ng
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n há»§y Ä‘Æ¡n hĂ ng nĂ y? Thao tĂ¡c nĂ y sáº½ giáº£i phĂ³ng toĂ n bá»™ sá»‘ lÆ°á»£ng tá»“n kho Ä‘Ă£ Ä‘Æ°á»£c giá»¯ cho Ä‘Æ¡n hĂ ng cá»§a báº¡n.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Label className="text-xs font-bold text-slate-500 tracking-wide">
              Chá»n lĂ½ do há»§y Ä‘Æ¡n
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
                        if (reason !== "LĂ½ do khĂ¡c") {
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

            {selectedReason === "LĂ½ do khĂ¡c" && (
              <div className="space-y-1.5 pt-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="cancelReasonInput" className="text-[10px] font-bold text-[#78858F] tracking-wide">
                  Chi tiáº¿t lĂ½ do khĂ¡c
                </Label>
                <Textarea
                  id="cancelReasonInput"
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  placeholder="Vui lĂ²ng nháº­p lĂ½ do há»§y Ä‘Æ¡n cá»¥ thá»ƒ táº¡i Ä‘Ă¢y..."
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
              Quay láº¡i
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 font-bold text-xs h-10 cursor-pointer shadow-md select-none border-0"
            >
              {isCancelling ? "Äang xá»­ lĂ½..." : "XĂ¡c nháº­n há»§y"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
