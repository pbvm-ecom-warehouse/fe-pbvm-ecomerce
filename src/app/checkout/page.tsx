import { CheckoutForm } from "@/features/checkout/components/checkout-form";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F6] px-4 py-8 text-[#1C1917] lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            Secure checkout
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-normal">
            Checkout
          </h1>
          <p className="mt-2 text-sm text-[#7A6F68]">
            Xác nhận thông tin giao hàng, thanh toán và nhóm khách B2B/B2C.
          </p>
        </div>
        <CheckoutForm />
      </div>
    </main>
  );
}
