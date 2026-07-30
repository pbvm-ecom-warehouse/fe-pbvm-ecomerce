import { describe, expect, it } from "vitest";

import { canPayNextOnlineStage } from "@/features/order/utils/payment-flow";

describe("multi-stage payment flow", () => {
  it("does not allow COD payment flow for print orders", () => {
    expect(
      canPayNextOnlineStage({
        paymentStatus: "UNPAID",
        paymentMethod: "COD",
        hasPrintItems: true,
        status: "PLACED",
        fulfillmentStatus: "NONE",
      }),
    ).toBe(false);
  });

  it("allows the first online payment for print and non-print COD deposit orders", () => {
    expect(
      canPayNextOnlineStage({
        paymentStatus: "UNPAID",
        paymentMethod: "ONLINE",
        hasPrintItems: true,
        status: "PLACED",
        fulfillmentStatus: "NONE",
      }),
    ).toBe(true);
    expect(
      canPayNextOnlineStage({
        paymentStatus: "UNPAID",
        paymentMethod: "COD",
        hasPrintItems: false,
        status: "PLACED",
        fulfillmentStatus: "NONE",
      }),
    ).toBe(true);
  });

  it("allows print orders to pay stage 2 only after sample print is ready", () => {
    expect(
      canPayNextOnlineStage({
        paymentStatus: "DEPOSIT_PAID",
        paymentMethod: "ONLINE",
        hasPrintItems: true,
        status: "CONFIRMED",
        fulfillmentStatus: "SAMPLE_PRINTED",
      }),
    ).toBe(true);
    expect(
      canPayNextOnlineStage({
        paymentStatus: "DEPOSIT_PAID",
        paymentMethod: "ONLINE",
        hasPrintItems: true,
        status: "CONFIRMED",
        fulfillmentStatus: "AWAITING_PRINT",
      }),
    ).toBe(false);
  });

  it("allows the final online payment for print orders only after official print is ready", () => {
    expect(
      canPayNextOnlineStage({
        paymentStatus: "PROGRESS_PAID",
        paymentMethod: "ONLINE",
        hasPrintItems: true,
        status: "CONFIRMED",
        fulfillmentStatus: "READY_TO_PICK",
      }),
    ).toBe(true);
    expect(
      canPayNextOnlineStage({
        paymentStatus: "PROGRESS_PAID",
        paymentMethod: "ONLINE",
        hasPrintItems: true,
        status: "CONFIRMED",
        fulfillmentStatus: "AWAITING_PRINT",
      }),
    ).toBe(false);
  });

  it("does not show online final-payment buttons for COD final collection stages", () => {
    expect(
      canPayNextOnlineStage({
        paymentStatus: "PROGRESS_PAID",
        paymentMethod: "COD",
        hasPrintItems: true,
        status: "CONFIRMED",
        fulfillmentStatus: "READY_TO_PICK",
      }),
    ).toBe(false);
    expect(
      canPayNextOnlineStage({
        paymentStatus: "DEPOSIT_PAID",
        paymentMethod: "COD",
        hasPrintItems: false,
        status: "CONFIRMED",
        fulfillmentStatus: "READY_TO_PICK",
      }),
    ).toBe(false);
  });

  it("does not show a second PayOS stage for non-print full-online orders", () => {
    expect(
      canPayNextOnlineStage({
        paymentStatus: "DEPOSIT_PAID",
        paymentMethod: "ONLINE",
        hasPrintItems: false,
        status: "CONFIRMED",
        fulfillmentStatus: "READY_TO_PICK",
      }),
    ).toBe(false);
  });

  it("does not show a second PayOS stage for non-print orders before ready to pick", () => {
    expect(
      canPayNextOnlineStage({
        paymentStatus: "DEPOSIT_PAID",
        paymentMethod: "ONLINE",
        hasPrintItems: false,
        status: "CONFIRMED",
        fulfillmentStatus: "NONE",
      }),
    ).toBe(false);
  });
});
