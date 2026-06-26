import type { CartItem } from "@/types/api";

export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shippingFee = subtotal >= 5_000_000 || subtotal === 0 ? 0 : 45_000;
  const tax = 0;

  return {
    subtotal,
    shippingFee,
    tax,
    grandTotal: subtotal + shippingFee,
  };
}

export function countCartItems(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function hasCustomPrintItems(items: CartItem[]) {
  return items.some((item) => item.fulfillmentType === "CUSTOM_PRINT");
}
