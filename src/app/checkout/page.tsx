import { CheckoutForm } from "@/features/checkout/components/checkout-form";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <div>
          <h1 className="mt-2 text-3xl font-black tracking-normal">
            Thanh toán
          </h1>
          <p className="mt-2 text-sm text-[#7A6F68]">
            Xác nhận thông tin giao hàng, thanh toán.
          </p>
        </div>
        <CheckoutForm />
      </div>
    </main>
  );
}
