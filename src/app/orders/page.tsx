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
      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* List column */}
        <div
          className={`${
            selectedOrderId ? "hidden md:block md:col-span-5" : "col-span-12"
          }`}
        >
          <OrderListClient
            selectedOrderId={selectedOrderId}
            onSelectOrder={handleSelectOrder}
          />
        </div>

        {/* Detail column */}
        {selectedOrderId && (
          <div className="col-span-12 md:col-span-7">
            <OrderDetailClient
              orderId={selectedOrderId}
              onBack={handleClearSelection}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}

