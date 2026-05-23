import { CartPageClient } from "@/features/cart/components/cart-page-client";

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Giỏ hàng</h1>
        <p className="text-sm text-muted-foreground">
          Kiểm tra số lượng, phí giao hàng và VAT dự kiến trước checkout.
        </p>
      </div>
      <CartPageClient />
    </main>
  );
}
