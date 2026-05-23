import { CheckoutForm } from "@/features/checkout/components/checkout-form";

export default function CheckoutPage() {
  return (
    <main className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Xác nhận thông tin giao hàng, thanh toán và nhóm khách B2B/B2C.
        </p>
      </div>
      <CheckoutForm />
    </main>
  );
}
