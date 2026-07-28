import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

const cartStoreMock = vi.hoisted(() => ({
  fetchAndSyncCart: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: apiClientMock,
}));

vi.mock("@/stores/cart-store", () => ({
  useCartStore: {
    getState: () => cartStoreMock,
  },
}));

import { createOrder } from "@/features/checkout/services/checkout.service";

describe("checkout service", () => {
  beforeEach(() => {
    apiClientMock.get.mockReset();
    apiClientMock.post.mockReset();
    cartStoreMock.fetchAndSyncCart.mockReset();
    cartStoreMock.fetchAndSyncCart.mockResolvedValue(undefined);
  });

  it("uses the selected saved address id and does not auto-create duplicate addresses", async () => {
    apiClientMock.post.mockResolvedValueOnce({
      data: { data: { id: "order-1", code: "ORD-1" } },
    });

    await createOrder({
      addressId: "address-1",
      customerName: "Vuong Hoai Bao",
      customerType: "B2B",
      phone: "0367672997",
      address: "78/4/9 Nguyen Thi Tu, Phuong Binh Hung Hoa B, Quan Binh Tan, Thanh pho Ho Chi Minh",
      paymentProvider: "COD",
      items: [],
    });

    expect(apiClientMock.post).toHaveBeenCalledTimes(1);
    expect(apiClientMock.post).toHaveBeenCalledWith("/orders/checkout", {
      addressId: "address-1",
      paymentMethod: "COD",
    });
  });
});
