import { CartPageClient } from "@/features/cart/components/cart-page-client";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <CartPageClient />
      </div>
    </main>
  );
}
