import type { CartItem } from "@/types/api";

export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shippingFee = subtotal >= 5_000_000 || subtotal === 0 ? 0 : 45_000;
  const tax = Math.round(subtotal * 0.08);

  return {
    subtotal,
    shippingFee,
    tax,
    grandTotal: subtotal + shippingFee + tax,
  };
}

export function countCartItems(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function isCustomPrintCartItem(item: CartItem) {
  return item.fulfillmentType === "CUSTOM_PRINT" || item.isPrintItem === true;
}

export function hasCustomPrintItems(items: CartItem[]) {
  return items.some(isCustomPrintCartItem);
}

export function isCodAllowedForCart(items: CartItem[]) {
  return !hasCustomPrintItems(items);
}
