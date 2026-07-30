import type { CartItem } from "@/types/api";

export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const bulkBoxDiscount = totalQuantity >= 3 ? totalQuantity * 20_000 : 0;
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

function getCartItemSku(item: CartItem) {
  return item.productRefId || item.productId;
}

function isPrintCartItem(item: CartItem) {
  return item.fulfillmentType === "CUSTOM_PRINT" || Boolean(item.designFile || item.designId);
}

export function findPrintAndBlankSelectionConflict(items: CartItem[]) {
  const selectedItems = items.filter((item) => item.selected !== false);
  const selectionBySku = new Map<string, number>();

  for (const item of selectedItems) {
    const sku = getCartItemSku(item);
    if (!sku) continue;
    selectionBySku.set(sku, (selectionBySku.get(sku) || 0) + 1);
  }

  for (const [sku, count] of selectionBySku) {
    if (count > 1) return sku;
  }

  return null;
}

export function wouldSelectPrintAndBlankConflict(items: CartItem[], cartItemId: string) {
  const item = items.find((candidate) => candidate.cartItemId === cartItemId);
  if (!item || item.selected !== false) return null;

  return findPrintAndBlankSelectionConflict(
    items.map((candidate) =>
      candidate.cartItemId === cartItemId ? { ...candidate, selected: true } : candidate,
    ),
  );
}
