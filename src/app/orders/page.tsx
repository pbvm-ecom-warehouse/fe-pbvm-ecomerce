"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense } from "react";
import { OrderListClient } from "@/features/order/components/order-list-client";
import { OrderDetailClient } from "@/features/order/components/order-detail-client";

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedOrderId = searchParams.get("id") || undefined;

  const handleSelectOrder = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearSelection = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      {selectedOrderId ? (
        <OrderDetailClient
          orderId={selectedOrderId}
          onBack={handleClearSelection}
        />
      ) : (
        <OrderListClient
          selectedOrderId={selectedOrderId}
          onSelectOrder={handleSelectOrder}
        />
      )}
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
