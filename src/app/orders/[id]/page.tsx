import { OrderDetailClient } from "@/features/order/components/order-detail-client";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <OrderDetailClient orderId={id} />
    </main>
  );
}
