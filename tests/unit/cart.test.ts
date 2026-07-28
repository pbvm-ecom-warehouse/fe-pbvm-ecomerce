import { describe, expect, it } from "vitest";

import {
  calculateCartTotals,
  countCartItems,
} from "@/features/cart/utils/cart";
import type { CartItem } from "@/types/api";

const items: CartItem[] = [
  {
    cartItemId: "standard:cat-001",
    productId: "cat-001",
    name: "Bột sữa",
    slug: "bot-sua",
    price: 100_000,
    quantity: 2,
    unit: "Bao",
    imageUrl: "https://example.com/image.jpg",
    fulfillmentType: "STANDARD",
  },
];

describe("cart utilities", () => {
  it("counts total item quantities", () => {
    expect(countCartItems(items)).toBe(2);
  });

  it("calculates subtotal with zero shipping fee", () => {
    expect(calculateCartTotals(items)).toEqual({
      subtotal: 200_000,
      bulkBoxDiscount: 0,
      shippingFee: 0,
      tax: 0,
      grandTotal: 200_000,
    });
  });

  it("discounts 20,000 VND for each full box of 3 selected products", () => {
    expect(
      calculateCartTotals([
        {
          ...items[0],
          quantity: 7,
        },
      ]),
    ).toEqual({
      subtotal: 700_000,
      bulkBoxDiscount: 40_000,
      shippingFee: 0,
      tax: 0,
      grandTotal: 660_000,
    });
  });
});
