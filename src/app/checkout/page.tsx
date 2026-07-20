import { CheckoutForm } from "@/features/checkout/components/checkout-form";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <CheckoutForm />
      </div>
    </main>
  );
}
