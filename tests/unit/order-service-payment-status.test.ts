import { describe, expect, it } from "vitest";

import { mapOrderToSummary } from "@/features/order/services/order.service";

describe("order payment status mapping", () => {
  it("keeps unpaid orders unpaid when the API returns UNPAID", () => {
    const order = mapOrderToSummary({
      _id: "66b111111111111111111111",
      code: "ORD-20260728-001",
      paymentStatus: "UNPAID",
    });

    expect(order.paymentStatus).toBe("UNPAID");
  });

  it("shows an order as paid only when the API returns PAID", () => {
    const order = mapOrderToSummary({
      _id: "66b111111111111111111111",
      code: "ORD-20260728-001",
      paymentMethod: "ONLINE",
      paymentStatus: "PAID",
      paidAt: "2026-07-28T08:00:00.000Z",
    });

    expect(order.paymentStatus).toBe("PAID");
    expect(order.paidAt).toBe("2026-07-28T08:00:00.000Z");
  });
});
