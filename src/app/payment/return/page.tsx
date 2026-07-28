"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderDetailClient } from "@/features/order/components/order-detail-client";
import { getOrder, listOrders } from "@/features/order/services/order.service";
import { PaymentCancelContent } from "@/features/payment/components/payment-cancel-content";
import { useCartStore } from "@/stores/cart-store";

const paymentStatusRank: Record<string, number> = {
  UNPAID: 0,
  DEPOSIT_PAID: 1,
  PROGRESS_PAID: 2,
  PAID: 3,
};

const isObjectId = (value?: string | null) =>
  Boolean(value && /^[0-9a-fA-F]{24}$/.test(value));

function normalizeOrderKey(value?: string | null) {
  return value ? String(value).replace(/[^0-9a-zA-Z]/g, "").toUpperCase() : "";
}

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearSelectedItems = useCartStore((state) => state.clearSelectedItems);

  const code = searchParams.get("code");
  const status = searchParams.get("status");
  const cancel = searchParams.get("cancel");
  const orderCodeParam = searchParams.get("orderCode") || searchParams.get("orderId");

  const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(null);
  const [isResolvingOrder, setIsResolvingOrder] = useState(true);
  const [resolveError, setResolveError] = useState("");
  const [hasClearedPaidCartItems, setHasClearedPaidCartItems] = useState(false);

  const isCancelled = cancel === "true" || status === "CANCELLED" || code === "CANCELLED";
  const isGatewaySuccess =
    !isCancelled &&
    (code === "00" ||
      status === "PAID" ||
      status === "success" ||
      status === "SUCCESS" ||
      (code === null && status === null));

  const identifierKeys = useMemo(() => {
    const keys = new Set<string>();

    if (orderCodeParam) {
      keys.add(normalizeOrderKey(orderCodeParam));
      keys.add(normalizeOrderKey(orderCodeParam.replace(/[^0-9]/g, "")));
    }

    if (typeof window !== "undefined") {
      const savedId = sessionStorage.getItem("lastCreatedOrderId");
      const savedCode = sessionStorage.getItem("lastCreatedOrderCode");
      if (savedId) {
        keys.add(normalizeOrderKey(savedId));
        keys.add(normalizeOrderKey(savedId.replace(/[^0-9]/g, "")));
      }
      if (savedCode) {
        keys.add(normalizeOrderKey(savedCode));
        keys.add(normalizeOrderKey(savedCode.replace(/[^0-9]/g, "")));
      }
    }

    return keys;
  }, [orderCodeParam]);

  useEffect(() => {
    if (isCancelled) return;

    let isMounted = true;

    const matchesOrder = (order: any) => {
      if (!order || identifierKeys.size === 0) return false;
      const keys = [
        order.id,
        order._id,
        order.orderId,
        order.code,
        order.orderCode,
        order.code ? String(order.code).replace(/[^0-9]/g, "") : null,
        order.orderCode ? String(order.orderCode).replace(/[^0-9]/g, "") : null,
      ].map(normalizeOrderKey);

      return keys.some((key) => key && identifierKeys.has(key));
    };

    async function resolveOrderId() {
      setIsResolvingOrder(true);
      setResolveError("");

      try {
        if (isObjectId(orderCodeParam)) {
          const order = await getOrder(String(orderCodeParam));
          if (!isMounted) return;
          setResolvedOrderId(order?.id || order?._id || String(orderCodeParam));
          return;
        }

        if (typeof window !== "undefined") {
          const savedId = sessionStorage.getItem("lastCreatedOrderId");
          if (isObjectId(savedId)) {
            const order = await getOrder(String(savedId));
            if (!isMounted) return;
            setResolvedOrderId(order?.id || order?._id || String(savedId));
            return;
          }
        }

        const candidates: any[] = [];
        const collectOrders = async (paymentStatus?: string) => {
          try {
            const response = await listOrders(paymentStatus ? { paymentStatus } : undefined);
            const orders = Array.isArray(response) ? response : response?.data || [];
            candidates.push(...orders);
          } catch {
            // The detail page will show an API error if the order cannot be loaded later.
          }
        };

        await collectOrders();
        if (isGatewaySuccess) {
          await collectOrders("DEPOSIT_PAID");
          await collectOrders("PROGRESS_PAID");
          await collectOrders("PAID");
        }

        const matchedOrder = candidates
          .filter(matchesOrder)
          .sort(
            (a, b) =>
              (paymentStatusRank[String(b?.paymentStatus || "UNPAID")] ?? 0) -
              (paymentStatusRank[String(a?.paymentStatus || "UNPAID")] ?? 0),
          )[0];

        if (!isMounted) return;

        if (matchedOrder) {
          setResolvedOrderId(matchedOrder.id || matchedOrder._id);
        } else {
          setResolveError("Không tìm thấy đơn hàng tương ứng với dữ liệu PayOS trả về.");
        }
      } catch {
        if (isMounted) {
          setResolveError("Không tải được thông tin đơn hàng từ API.");
        }
      } finally {
        if (isMounted) {
          setIsResolvingOrder(false);
        }
      }
    }

    resolveOrderId();

    return () => {
      isMounted = false;
    };
  }, [identifierKeys, isCancelled, isGatewaySuccess, orderCodeParam]);

  useEffect(() => {
    if (!isGatewaySuccess || !resolvedOrderId || hasClearedPaidCartItems) return;

    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const orderId = resolvedOrderId;

    const startedPaymentStatus =
      typeof window !== "undefined"
        ? sessionStorage.getItem("lastPaymentStartedStatus") || "UNPAID"
        : "UNPAID";
    const startedPaymentRank = paymentStatusRank[startedPaymentStatus] ?? 0;

    async function clearCartWhenPaymentConfirmed() {
      try {
        const order = await getOrder(orderId);
        if (!isMounted) return;

        const currentPaymentRank =
          paymentStatusRank[String(order?.paymentStatus || "UNPAID")] ?? 0;
        const isConfirmedPaid =
          currentPaymentRank > startedPaymentRank || order?.paymentStatus === "PAID";

        if (isConfirmedPaid) {
          await clearSelectedItems();
          if (!isMounted) return;
          setHasClearedPaidCartItems(true);

          if (typeof window !== "undefined") {
            sessionStorage.removeItem("lastCreatedOrderId");
            sessionStorage.removeItem("lastCreatedOrderCode");
            sessionStorage.removeItem("lastPaymentStartedStatus");
            sessionStorage.removeItem("pendingCartBackup");
          }
          return;
        }
      } catch {
        // Keep polling; OrderDetailClient also refetches and displays the real API state.
      }

      if (isMounted) {
        timeoutId = setTimeout(clearCartWhenPaymentConfirmed, 2000);
      }
    }

    clearCartWhenPaymentConfirmed();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    clearSelectedItems,
    hasClearedPaidCartItems,
    isGatewaySuccess,
    resolvedOrderId,
  ]);

  if (isCancelled) {
    return <PaymentCancelContent />;
  }

  if (isResolvingOrder) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-muted-foreground">
            Đang mở chi tiết đơn hàng...
          </p>
        </div>
      </main>
    );
  }

  if (!resolvedOrderId) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-6">
        <div className="max-w-md space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-center">
          <p className="text-base font-black text-amber-900">
            Chưa mở được chi tiết đơn hàng
          </p>
          <p className="text-sm leading-6 text-amber-800">
            {resolveError || "FE chưa tìm được mã đơn hàng từ dữ liệu PayOS trả về."}
          </p>
          <Button
            type="button"
            onClick={() => router.push("/orders")}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="size-4" />
            Về danh sách đơn hàng
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <OrderDetailClient
        orderId={resolvedOrderId}
        onBack={() => router.push("/orders")}
      />
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
