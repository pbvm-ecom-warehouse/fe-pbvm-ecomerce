import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClientMock = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: apiClientMock,
}));

import { requestOrderReturn } from "@/features/order/services/order.service";

describe("order service API", () => {
  beforeEach(() => {
    apiClientMock.post.mockReset();
  });

  it("requests an order return through the backend return endpoint", async () => {
    apiClientMock.post.mockResolvedValueOnce({
      data: {
        data: {
          _id: "66b111111111111111111111",
          code: "ORD-20260728-001",
          orderStatus: "CONFIRMED",
          paymentStatus: "PAID",
        },
        meta: {},
      },
    });

    const result = await requestOrderReturn("66b111111111111111111111");

    expect(apiClientMock.post).toHaveBeenCalledWith(
      "/orders/66b111111111111111111111/return",
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: "66b111111111111111111111",
        status: "CONFIRMED",
        paymentStatus: "PAID",
      }),
    );
  });
});
