import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: apiClientMock,
}));

import { adminListOrders } from "@/features/order/services/admin-order.service";

describe("admin order service", () => {
  beforeEach(() => {
    apiClientMock.get.mockReset();
  });

  it("passes supported backend filters to the admin orders endpoint", async () => {
    apiClientMock.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: "66b111111111111111111111",
            orderStatus: "CONFIRMED",
            paymentStatus: "DEPOSIT_PAID",
            fulfillmentStatus: "AWAITING_PRINT",
          },
        ],
        meta: {},
      },
    });

    const result = await adminListOrders({
      orderStatus: "CONFIRMED",
      paymentStatus: "DEPOSIT_PAID",
      fulfillmentStatus: "AWAITING_PRINT",
    });

    expect(apiClientMock.get).toHaveBeenCalledWith("/admin/orders", {
      params: {
        orderStatus: "CONFIRMED",
        paymentStatus: "DEPOSIT_PAID",
        fulfillmentStatus: "AWAITING_PRINT",
      },
    });
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: "66b111111111111111111111",
        status: "CONFIRMED",
        paymentStatus: "DEPOSIT_PAID",
        fulfillmentStatus: "AWAITING_PRINT",
      }),
    );
  });
});
