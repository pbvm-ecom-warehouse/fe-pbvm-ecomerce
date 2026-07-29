import { describe, expect, it } from "vitest";

import {
  findPrintAndBlankSelectionConflict,
  wouldSelectPrintAndBlankConflict,
} from "@/features/cart/utils/cart";
import type { CartItem } from "@/types/api";

const blankCup: CartItem = {
  cartItemId: "standard:CUP-RND-PP-700-WHT:0",
  productId: "product-1",
  productRefId: "CUP-RND-PP-700-WHT",
  name: "Phoi ly",
  slug: "phoi-ly",
  price: 2000,
  quantity: 10,
  unit: "cai",
  imageUrl: "/cup.png",
  fulfillmentType: "STANDARD",
};

const printedCup: CartItem = {
  ...blankCup,
  cartItemId: "custom:CUP-RND-PP-700-WHT:design-1:1",
  fulfillmentType: "CUSTOM_PRINT",
  designId: "design-1",
};

describe("cart selection conflicts", () => {
  it("detects selected print and blank cup lines with the same SKU", () => {
    expect(findPrintAndBlankSelectionConflict([blankCup, printedCup])).toBe(
      "CUP-RND-PP-700-WHT",
    );
  });

  it("allows selecting print and blank cup lines with different SKUs", () => {
    expect(
      findPrintAndBlankSelectionConflict([
        blankCup,
        { ...printedCup, productRefId: "CUP-RND-PP-500-CLR" },
      ]),
    ).toBeNull();
  });

  it("blocks selecting the opposite line when one line with the same SKU is already selected", () => {
    expect(
      wouldSelectPrintAndBlankConflict(
        [blankCup, { ...printedCup, selected: false }],
        printedCup.cartItemId,
      ),
    ).toBe("CUP-RND-PP-700-WHT");
  });

  it("blocks selecting two different custom designs that use the same blank cup SKU", () => {
    expect(
      findPrintAndBlankSelectionConflict([
        printedCup,
        {
          ...printedCup,
          cartItemId: "custom:CUP-RND-PP-700-WHT:design-2:2",
          designId: "design-2",
        },
      ]),
    ).toBe("CUP-RND-PP-700-WHT");
  });
});
