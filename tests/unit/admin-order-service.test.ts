import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: apiClientMock,
}));

import {
  adminAdvanceOrderPaymentProgress,
  adminCanAdvanceOrderPaymentProgress,
  calculateManualPaymentAdvanceAmount,
  getAdminPaymentAdvanceLabel,
  adminListOrders,
} from "@/features/order/services/admin-order.service";

describe("admin order service", () => {
  beforeEach(() => {
    apiClientMock.get.mockReset();
    apiClientMock.post.mockReset();
    apiClientMock.patch.mockReset();
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

  it("advances order payment progress through the admin backup endpoint", async () => {
    apiClientMock.patch.mockResolvedValueOnce({
      data: {
        data: {
          _id: "66b222222222222222222222",
          orderStatus: "CONFIRMED",
          paymentStatus: "PROGRESS_PAID",
          fulfillmentStatus: "AWAITING_PRINT",
        },
        meta: {},
      },
    });

    const result = await adminAdvanceOrderPaymentProgress({
      id: "66b222222222222222222222",
      total: 100_000,
      paymentMethod: "ONLINE",
      paymentStatus: "DEPOSIT_PAID",
      hasPrintItems: true,
    });

    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/admin/orders/66b222222222222222222222/manual-payment",
      expect.objectContaining({
        amount: 30_000,
        providerTxnId: expect.stringContaining(
          "MANUAL_ADMIN_66b222222222222222222222",
        ),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: "66b222222222222222222222",
        status: "CONFIRMED",
        paymentStatus: "PROGRESS_PAID",
        fulfillmentStatus: "AWAITING_PRINT",
      }),
    );
  });

  it("calculates the next manual payment amount using backend payment phases", () => {
    expect(
      calculateManualPaymentAdvanceAmount({
        total: 100_000,
        paymentStatus: "UNPAID",
        paymentMethod: "ONLINE",
        hasPrintItems: true,
      }),
    ).toBe(30_000);
    expect(
      calculateManualPaymentAdvanceAmount({
        total: 100_000,
        paymentStatus: "PROGRESS_PAID",
        paymentMethod: "ONLINE",
        hasPrintItems: true,
      }),
    ).toBe(40_000);
    expect(
      calculateManualPaymentAdvanceAmount({
        total: 100_000,
        paymentStatus: "UNPAID",
        paymentMethod: "ONLINE",
        hasPrintItems: false,
      }),
    ).toBe(100_000);
    expect(
      calculateManualPaymentAdvanceAmount({
        total: 100_000,
        paymentStatus: "UNPAID",
        paymentMethod: "COD",
        hasPrintItems: false,
      }),
    ).toBe(50_000);
  });

  it("only enables admin progress advance for active unpaid or partial-payment orders", () => {
    expect(
      adminCanAdvanceOrderPaymentProgress({
        orderStatus: "CONFIRMED",
        paymentStatus: "DEPOSIT_PAID",
        fulfillmentStatus: "AWAITING_PRINT",
        hasPrintItems: true,
      }),
    ).toBe(true);
    expect(
      adminCanAdvanceOrderPaymentProgress({
        orderStatus: "CONFIRMED",
        paymentStatus: "DEPOSIT_PAID",
        paymentMethod: "COD",
        fulfillmentStatus: "READY_TO_PICK",
        hasPrintItems: false,
      }),
    ).toBe(false);
    expect(
      adminCanAdvanceOrderPaymentProgress({
        orderStatus: "CONFIRMED",
        paymentStatus: "PROGRESS_PAID",
        paymentMethod: "COD",
        fulfillmentStatus: "AWAITING_PRINT",
        hasPrintItems: true,
      }),
    ).toBe(false);
    expect(
      adminCanAdvanceOrderPaymentProgress({
        status: "CANCELLED",
        paymentStatus: "UNPAID",
        fulfillmentStatus: "NONE",
      }),
    ).toBe(false);
    expect(
      adminCanAdvanceOrderPaymentProgress({
        orderStatus: "CONFIRMED",
        paymentStatus: "PAID",
        fulfillmentStatus: "ISSUED",
      }),
    ).toBe(false);
  });

  it("labels the next admin payment action by order type and payment method", () => {
    expect(
      getAdminPaymentAdvanceLabel({
        paymentStatus: "UNPAID",
        paymentMethod: "COD",
        hasPrintItems: false,
      }),
    ).toBe("Xác nhận cọc 50%");
    expect(
      getAdminPaymentAdvanceLabel({
        paymentStatus: "UNPAID",
        paymentMethod: "ONLINE",
        hasPrintItems: false,
      }),
    ).toBe("Xác nhận thanh toán 100%");
    expect(
      getAdminPaymentAdvanceLabel({
        paymentStatus: "DEPOSIT_PAID",
        paymentMethod: "ONLINE",
        hasPrintItems: true,
      }),
    ).toBe("Xác nhận thanh toán 60%");
  });
});
