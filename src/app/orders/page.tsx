import { OrderListClient } from "@/features/order/components/order-list-client";

export default function OrdersPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <OrderListClient />
    </main>
  );
}
