import { describe, expect, it } from "vitest";

import { checkoutSchema } from "@/features/checkout/schemas/checkout.schema";

describe("checkout schema", () => {
  it("accepts a valid B2B checkout payload", () => {
    expect(
      checkoutSchema.safeParse({
        customerName: "Bao Milk Tea",
        customerType: "B2B",
        phone: "0900000000",
        address: "123 Nguyen Van Linh, Quan 7, TP.HCM",
        paymentProvider: "VNPAY",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid phone numbers", () => {
    expect(
      checkoutSchema.safeParse({
        customerName: "Bao",
        customerType: "B2C",
        phone: "123",
        address: "123 Nguyen Van Linh, Quan 7, TP.HCM",
        paymentProvider: "COD",
      }).success,
    ).toBe(false);
  });
});
