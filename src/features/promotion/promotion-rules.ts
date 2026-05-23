export function applyPromotion(subtotal: number, code?: string) {
  if (!code) {
    return 0;
  }

  if (code.toUpperCase() === "B2BSTART") {
    return Math.min(subtotal * 0.05, 500_000);
  }

  return 0;
}
