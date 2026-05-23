import type { CatalogProduct, CustomerType } from "@/types/api";

export function getDisplayPrice(
  product: CatalogProduct,
  customerType: CustomerType,
) {
  return customerType === "B2B" ? product.b2bPrice : product.price;
}
