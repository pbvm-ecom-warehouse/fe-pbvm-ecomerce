import type { CartItem } from "@/types/api";

export const paymentOptions = [
  { value: "COD", label: "Cọc 50% online, 50% khi nhận hàng" },
  { value: "PAYOS", label: "Thanh toán online 100%" },
] as const;

export type PaymentProvider = (typeof paymentOptions)[number]["value"];

export function cartRequiresOnlinePayment(items: CartItem[]) {
  return items.some((item) => item.fulfillmentType === "CUSTOM_PRINT");
}

export function getPaymentOptionsForCart(items: CartItem[]) {
  if (cartRequiresOnlinePayment(items)) {
    return [{ value: "PAYOS", label: "Thanh toán online theo từng đợt" }] as const;
  }

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
