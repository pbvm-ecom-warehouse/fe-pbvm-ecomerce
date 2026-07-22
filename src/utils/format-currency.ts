export function formatCurrency(value?: number | null) {
  const amount = typeof value === "number" && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

