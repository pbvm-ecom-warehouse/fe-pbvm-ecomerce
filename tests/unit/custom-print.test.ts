import { describe, expect, it } from "vitest";

import {
  hasCustomPrintItems,
  isCodAllowedForCart,
} from "@/features/cart/utils/cart";
import { createDesignFileSnapshot } from "@/features/cup-designer/utils/design-file";
import { getAvailablePaymentOptions } from "@/features/payment/payment-options";
import type { CartItem } from "@/types/api";

const customPrintItem: CartItem = {
  productId: "cup-blank-500",
  cartItemId: "cup-blank-500:design-1",
  name: "Ly 500ml custom",
  slug: "ly-500ml-custom",
  price: 1_500,
  quantity: 100,
  unit: "cai",
  imageUrl: "",
  fulfillmentType: "CUSTOM_PRINT",
  isPrintItem: true,
  designId: "design-1",
  designFile: createDesignFileSnapshot({
    designId: "design-1",
    name: "Logo Bao Milk Tea",
    previewDataUrl: "data:image/png;base64,abc",
    artwork: {
      text: "Bao Milk Tea",
      fill: "#0f766e",
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
    },
  }),
};

describe("custom print cart behavior", () => {
  it("stores designId and designFile snapshots on CUSTOM_PRINT cart items", () => {
    expect(customPrintItem.designId).toBe("design-1");
    expect(customPrintItem.designFile?.artwork.text).toBe("Bao Milk Tea");
    expect(customPrintItem.designFile?.snapshotVersion).toBe(1);
  });

  it("detects ly-in custom print items", () => {
    expect(hasCustomPrintItems([customPrintItem])).toBe(true);
  });

  it("blocks COD when cart contains custom print items", () => {
    expect(isCodAllowedForCart([customPrintItem])).toBe(false);
    expect(
      getAvailablePaymentOptions([customPrintItem]).some(
        (option) => option.value === "COD",
      ),
    ).toBe(false);
  });
});
