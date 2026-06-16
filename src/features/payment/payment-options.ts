import { isCodAllowedForCart } from "@/features/cart/utils/cart";
import type { CartItem } from "@/types/api";

export const paymentOptions = [
  { value: "COD", label: "Thanh toán khi nhận hàng" },
  { value: "VNPAY", label: "VNPay" },
  { value: "MOMO", label: "MoMo" },
  { value: "ZALOPAY", label: "ZaloPay" },
] as const;

export type PaymentProvider = (typeof paymentOptions)[number]["value"];

export function getAvailablePaymentOptions(items: CartItem[]) {
  if (isCodAllowedForCart(items)) {
    return paymentOptions;
  }

  return paymentOptions.filter((option) => option.value !== "COD");
}

export function isPaymentProviderAllowed(
  provider: PaymentProvider,
  items: CartItem[],
) {
  return getAvailablePaymentOptions(items).some(
    (option) => option.value === provider,
  );
}
