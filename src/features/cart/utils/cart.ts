import type { CartItem } from "@/types/api";

export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const bulkBoxDiscount = Math.floor(totalQuantity / 3) * 20_000;
  const shippingFee = 0;
  const tax = 0;
  const grandTotal = Math.max(0, subtotal - bulkBoxDiscount);

  return {
    subtotal,
    bulkBoxDiscount,
    shippingFee,
    tax,
    grandTotal,
  };
}

export function countCartItems(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function hasCustomPrintItems(items: CartItem[]) {
  return items.some((item) => item.fulfillmentType === "CUSTOM_PRINT");
}
