import type { CartItem } from "@/types/api";

export const paymentOptions = [
  { value: "COD", label: "Cọc online, còn lại COD" },
  { value: "PAYOS", label: "Thanh toán online theo đợt" },
] as const;

export type PaymentProvider = (typeof paymentOptions)[number]["value"];

export function cartRequiresOnlinePayment(items: CartItem[]) {
  return items.some((item) => item.fulfillmentType === "CUSTOM_PRINT");
}

export function getPaymentOptionsForCart(_items: CartItem[]) {
  return paymentOptions;
}

export function isPaymentAllowedForCart(
  paymentProvider: PaymentProvider,
  items: CartItem[],
) {
  return getPaymentOptionsForCart(items).some(
    (option) => option.value === paymentProvider,
  );
}
