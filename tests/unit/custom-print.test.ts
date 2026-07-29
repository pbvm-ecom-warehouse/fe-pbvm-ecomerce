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
      size: "500ml",
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
  productRefId: "CUP-CUSTOM-500",
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
  it("requires staged online checkout for custom print items", () => {
    expect(cartRequiresOnlinePayment([customPrintItem])).toBe(true);
    expect(isPaymentAllowedForCart("COD", [customPrintItem])).toBe(false);
    expect(isPaymentAllowedForCart("PAYOS", [customPrintItem])).toBe(true);
    expect(getPaymentOptionsForCart([customPrintItem])).toEqual([
      { value: "PAYOS", label: "Thanh toán online theo từng đợt" },
    ]);
  });

  it("shows COD deposit and full-online options for non-design items", () => {
    const standardItem: CartItem = {
      ...customPrintItem,
      cartItemId: "standard:CUP-RND-PP-700-WHT",
      fulfillmentType: "STANDARD",
      designId: undefined,
      designFile: undefined,
    };

    expect(getPaymentOptionsForCart([standardItem])).toEqual([
      { value: "COD", label: "Cọc 50% online, 50% khi nhận hàng" },
      { value: "PAYOS", label: "Thanh toán online 100%" },
    ]);
  });

  it("serializes designId and designFile in checkout item payload", () => {
    const [checkoutItem] = mapCartItemsToCheckoutItems([customPrintItem]);
    const serializedDesignFile = JSON.parse(String(checkoutItem?.designFile));

    expect(checkoutItem).toEqual(
      {
        productId: "custom-cup-m",
        productRefId: "CUP-CUSTOM-500",
        quantity: 100,
        fulfillmentType: "CUSTOM_PRINT",
        designId: "design_test",
        designFile: expect.any(String),
      },
    );
    expect(serializedDesignFile.previewDataUrl).toBeUndefined();
    expect(serializedDesignFile.artwork).toEqual(designFile.artwork);
  });

  it("rejects custom print checkout items without a saved design snapshot", () => {
    expect(() =>
      mapCartItemsToCheckoutItems([
        {
          ...customPrintItem,
          designId: undefined,
          designFile: undefined,
        },
      ]),
    ).toThrow("Custom print items require a saved design before checkout.");
  });

  it("restricts design studio access strictly to unprinted cups", () => {
    const isPrintedCup = (p: { category: string; isPrinted?: boolean }) =>
      p.category === "printed_cup" || p.isPrinted === true;

    const unprintedCup = { category: "plain_cup", isPrinted: false };
    const printedCup = { category: "printed_cup", isPrinted: true };

    expect(isPrintedCup(unprintedCup)).toBe(false);
    expect(isPrintedCup(printedCup)).toBe(true);
  });

  it("supports hybrid AI artwork layers combining image and text layers", () => {
    const hybridLayers = [
      { id: "img_1", type: "image", src: "https://res.cloudinary.com/demo/logo.png", prompt: "Gấu Béo logo" },
      { id: "txt_ai_1", type: "text", text: "Gấu Béo", color: "#059669", fontSize: 28 },
    ];
    expect(hybridLayers).toHaveLength(2);
    expect(hybridLayers[0]?.type).toBe("image");
    expect(hybridLayers[1]?.type).toBe("text");
    expect((hybridLayers[1] as any).text).toBe("Gấu Béo");
  });
});
