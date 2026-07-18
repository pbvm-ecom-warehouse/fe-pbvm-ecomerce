import type { CartItem } from "@/types/api";

export const paymentOptions = [
  { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
  { value: "PAYOS", label: "Thanh toán online (PayOS)" },
] as const;

export type PaymentProvider = (typeof paymentOptions)[number]["value"];

export function cartRequiresOnlinePayment(items: CartItem[]) {
  return items.some((item) => item.fulfillmentType === "CUSTOM_PRINT");
}

export function getPaymentOptionsForCart(items: CartItem[]) {
  if (!cartRequiresOnlinePayment(items)) {
    return paymentOptions;
  }

  return paymentOptions.filter((option) => option.value !== "COD");
}

export function isPaymentAllowedForCart(
  paymentProvider: PaymentProvider,
  items: CartItem[],
) {
  return getPaymentOptionsForCart(items).some(
    (option) => option.value === paymentProvider,
  );
}
