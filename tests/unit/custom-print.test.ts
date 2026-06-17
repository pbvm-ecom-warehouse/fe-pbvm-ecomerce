import { describe, expect, it } from "vitest";

import { mapCartItemsToCheckoutItems } from "@/features/checkout/services/checkout.service";
import {
  cartRequiresOnlinePayment,
  getPaymentOptionsForCart,
  isPaymentAllowedForCart,
} from "@/features/payment/payment-options";
import type { CartItem, DesignFileSnapshot } from "@/types/api";

const designFile: DesignFileSnapshot = {
  snapshotVersion: 1,
  designId: "design_test",
  name: "PBVM test design",
  previewDataUrl: "data:image/png;base64,test",
  exportedAt: "2026-06-17T00:00:00.000Z",
  artwork: {
    artboard: {
      width: 690,
      height: 482,
      printHeightPercent: 70,
    },
    cup: {
      size: "M",
      style: "straight",
      materialType: "frosted",
      cupColor: "#F8F4EC",
    },
    layers: [
      {
        id: "text_1",
        type: "text",
        text: "TEA HOUSE",
        x: 100,
        y: 120,
        color: "#5C3D2E",
        fontSize: 38,
      },
    ],
  },
};

const customPrintItem: CartItem = {
  cartItemId: "custom:cup:design_test",
  productId: "custom-cup-m",
  name: "Ly in theo thiet ke size M",
  slug: "ly-in-theo-thiet-ke",
  price: 1_500,
  quantity: 100,
  unit: "cai",
  imageUrl: designFile.previewDataUrl,
  fulfillmentType: "CUSTOM_PRINT",
  designId: designFile.designId,
  designFile,
};

describe("custom print checkout contract", () => {
  it("blocks COD when a cart contains custom print items", () => {
    expect(cartRequiresOnlinePayment([customPrintItem])).toBe(true);
    expect(isPaymentAllowedForCart("COD", [customPrintItem])).toBe(false);
    expect(getPaymentOptionsForCart([customPrintItem]).map((item) => item.value)).toEqual([
      "VNPAY",
      "MOMO",
      "ZALOPAY",
    ]);
  });

  it("keeps designId and designFile in checkout item payload", () => {
    expect(mapCartItemsToCheckoutItems([customPrintItem])).toEqual([
      {
        productId: "custom-cup-m",
        quantity: 100,
        fulfillmentType: "CUSTOM_PRINT",
        designId: "design_test",
        designFile,
      },
    ]);
  });
});
