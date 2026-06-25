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

  it("calculates subtotal, shipping, tax and grand total", () => {
    expect(calculateCartTotals(items)).toEqual({
      subtotal: 200_000,
      shippingFee: 45_000,
      tax: 0,
      grandTotal: 245_000,
    });
  });
});
