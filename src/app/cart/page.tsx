import { CartPageClient } from "@/features/cart/components/cart-page-client";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F6] px-4 py-8 text-[#1C1917] lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            B2B cart
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-normal">
            Giỏ hàng
          </h1>
          <p className="mt-2 text-sm text-[#7A6F68]">
            Kiểm tra số lượng, phí giao hàng và VAT dự kiến trước checkout.
          </p>
        </div>
        <CartPageClient />
      </div>
    </main>
  );
}
