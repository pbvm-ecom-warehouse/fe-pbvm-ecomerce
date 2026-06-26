import { CartPageClient } from "@/features/cart/components/cart-page-client";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div>
          <h1 className="mt-2 text-3xl font-black tracking-normal">
            Giỏ hàng
          </h1>
          <p className="mt-2 text-sm text-[#7A6F68]">
            Kiểm tra số lượng, phí giao hàng trước khi checkout.
          </p>
        </div>
        <CartPageClient />
      </div>
    </main>
  );
}
