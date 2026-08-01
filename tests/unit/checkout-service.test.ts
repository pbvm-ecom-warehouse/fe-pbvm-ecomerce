import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
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
import type { DesignFileSnapshot } from "@/types/api";

function expectBackendDesignFile(value: unknown, designFile: DesignFileSnapshot) {
  const parsed = JSON.parse(String(value));
  expect(parsed).toMatchObject({
    snapshotVersion: designFile.snapshotVersion,
    designId: designFile.designId,
    name: designFile.name,
    artwork: designFile.artwork,
    exportedAt: designFile.exportedAt,
  });
  expect(parsed.previewDataUrl).toBeUndefined();
}

describe("checkout service", () => {
  beforeEach(() => {
    apiClientMock.get.mockReset();
    apiClientMock.post.mockReset();
    apiClientMock.put.mockReset();
    apiClientMock.delete.mockReset();
    apiClientMock.put.mockResolvedValue({ data: { data: { items: [] } } });
    apiClientMock.delete.mockResolvedValue({ data: { data: { items: [] } } });
    cartStoreMock.fetchAndSyncCart.mockReset();
    cartStoreMock.fetchAndSyncCart.mockResolvedValue(undefined);
  });

  it("uses the selected saved address id and creates a PayOS deposit link for COD orders", async () => {
    apiClientMock.post
      .mockResolvedValueOnce({ data: { data: { items: [] } } })
      .mockResolvedValueOnce({
        data: { data: { id: "order-1", code: "ORD-1" } },
      });
    apiClientMock.get
      .mockResolvedValueOnce({ data: { data: { items: [] } } })
      .mockResolvedValueOnce({
        data: { data: { payUrl: "https://checkout.payos.vn/pay/order-1" } },
      });

    const order = await createOrder({
      addressId: "address-1",
      customerName: "Vuong Hoai Bao",
      customerType: "B2B",
      phone: "0367672997",
      address: "78/4/9 Nguyen Thi Tu, Phuong Binh Hung Hoa B, Quan Binh Tan, Thanh pho Ho Chi Minh",
      paymentProvider: "COD",
      items: [
        {
          productId: "product-1",
          productRefId: "CUP-HRT-PET-500-CLR",
          quantity: 2,
          fulfillmentType: "STANDARD",
        },
      ],
    });

    expect(apiClientMock.delete).not.toHaveBeenCalledWith("/cart");
    expect(apiClientMock.post).toHaveBeenNthCalledWith(1, "/cart/items", {
      sku: "CUP-HRT-PET-500-CLR",
      quantity: 2,
      designId: undefined,
      designFile: undefined,
    });
    expect(apiClientMock.post).toHaveBeenNthCalledWith(2, "/orders/checkout", {
      addressId: "address-1",
      paymentMethod: "COD",
      items: [{ sku: "CUP-HRT-PET-500-CLR", designId: undefined, designFile: undefined }],
    });
    expect(apiClientMock.get).toHaveBeenCalledWith("/payment/payos/create-url/order-1");
    expect(order.paymentUrl).toBe("https://checkout.payos.vn/pay/order-1");
  });

  it("updates existing standard backend cart items instead of clearing and recreating the cart", async () => {
    apiClientMock.post.mockResolvedValueOnce({
      data: { data: { id: "order-standard", code: "ORD-STANDARD" } },
    });
    apiClientMock.get
      .mockResolvedValueOnce({
        data: {
          data: {
            items: [
              { sku: "CUP-HRT-PET-500-CLR", quantity: 1 },
              { sku: "UNSELECTED-SKU", quantity: 3 },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: { data: { payUrl: "https://checkout.payos.vn/pay/order-standard" } },
      });

    await createOrder({
      addressId: "address-1",
      customerName: "Vuong Hoai Bao",
      customerType: "B2B",
      phone: "0367672997",
      address: "78/4/9 Nguyen Thi Tu, Phuong Binh Hung Hoa B, Quan Binh Tan, Thanh pho Ho Chi Minh",
      paymentProvider: "COD",
      items: [
        {
          productId: "product-1",
          productRefId: "CUP-HRT-PET-500-CLR",
          quantity: 2,
          fulfillmentType: "STANDARD",
        },
      ],
    });

    expect(apiClientMock.delete).not.toHaveBeenCalledWith("/cart");
    expect(apiClientMock.delete).toHaveBeenCalledWith("/cart/items/UNSELECTED-SKU");
    expect(apiClientMock.put).toHaveBeenCalledWith("/cart/items/CUP-HRT-PET-500-CLR", { quantity: 2 });
    expect(apiClientMock.post).toHaveBeenCalledWith("/orders/checkout", {
      addressId: "address-1",
      paymentMethod: "COD",
      items: [{ sku: "CUP-HRT-PET-500-CLR", designId: undefined, designFile: undefined }],
    });
    expect(apiClientMock.post).toHaveBeenCalledWith("/cart/items", {
      sku: "UNSELECTED-SKU",
      quantity: 3,
      designId: undefined,
      designFile: undefined,
    });
  });

  it("restores temporarily removed unselected backend cart items when checkout fails", async () => {
    apiClientMock.post.mockRejectedValueOnce(new Error("checkout failed"));
    apiClientMock.get.mockResolvedValueOnce({
      data: {
        data: {
          items: [
            { sku: "SELECTED-SKU", quantity: 2 },
            { sku: "UNSELECTED-SKU", quantity: 3 },
          ],
        },
      },
    });

    await expect(
      createOrder({
        addressId: "address-1",
        customerName: "Vuong Hoai Bao",
        customerType: "B2B",
        phone: "0367672997",
        address: "78/4/9 Nguyen Thi Tu, Phuong Binh Hung Hoa B, Quan Binh Tan, Thanh pho Ho Chi Minh",
        paymentProvider: "COD",
        items: [
          {
            productId: "product-1",
            productRefId: "SELECTED-SKU",
            quantity: 2,
            fulfillmentType: "STANDARD",
          },
        ],
      }),
    ).rejects.toThrow("checkout failed");

    expect(apiClientMock.delete).toHaveBeenCalledWith("/cart/items/UNSELECTED-SKU");
    expect(apiClientMock.post).toHaveBeenCalledWith("/cart/items", {
      sku: "UNSELECTED-SKU",
      quantity: 3,
      designId: undefined,
      designFile: undefined,
    });
  });

  it("blocks custom print checkout when the saved design snapshot is missing", async () => {
    await expect(
      createOrder({
        addressId: "address-1",
        customerName: "Vuong Hoai Bao",
        customerType: "B2B",
        phone: "0367672997",
        address: "78/4/9 Nguyen Thi Tu, Phuong Binh Hung Hoa B, Quan Binh Tan, Thanh pho Ho Chi Minh",
        paymentProvider: "PAYOS",
        items: [
          {
            productId: "custom-cup-m",
            quantity: 100,
            fulfillmentType: "CUSTOM_PRINT",
          },
        ],
      }),
    ).rejects.toThrow("Custom print items require a saved design before checkout.");

    expect(cartStoreMock.fetchAndSyncCart).not.toHaveBeenCalled();
    expect(apiClientMock.post).not.toHaveBeenCalled();
  });

  it("syncs selected custom print items to the backend cart before checkout", async () => {
    const designFile: DesignFileSnapshot = {
      snapshotVersion: 1 as const,
      designId: "design-1",
      name: "Logo in ly",
      previewDataUrl: "data:image/png;base64,logo",
      artwork: {
        artboard: { width: 400, height: 250, printHeightPercent: 70 },
        cup: { size: "500ml", style: "straight", materialType: "clear", cupColor: "#ffffff" },
        layers: [],
      },
      exportedAt: "2026-07-29T00:00:00.000Z",
    };
    apiClientMock.post
      .mockResolvedValueOnce({ data: { data: { items: [] } } })
      .mockResolvedValueOnce({ data: { data: { id: "order-2", code: "ORD-2" } } });
    apiClientMock.get
      .mockResolvedValueOnce({ data: { data: { items: [] } } })
      .mockResolvedValueOnce({
        data: { data: { payUrl: "https://checkout.payos.vn/pay/order-2" } },
      });

    await createOrder({
      addressId: "address-1",
      customerName: "Vuong Hoai Bao",
      customerType: "B2B",
      phone: "0367672997",
      address: "78/4/9 Nguyen Thi Tu, Phuong Binh Hung Hoa B, Quan Binh Tan, Thanh pho Ho Chi Minh",
      paymentProvider: "PAYOS",
      items: [
        {
          productId: "product-custom",
          productRefId: "CUP-CUSTOM-500",
          quantity: 100,
          fulfillmentType: "CUSTOM_PRINT",
          designId: "design-1",
          designFile,
        },
      ],
    });

    expect(apiClientMock.delete).not.toHaveBeenCalled();
    expect(apiClientMock.post).toHaveBeenNthCalledWith(1, "/cart/items", {
      sku: "CUP-CUSTOM-500",
      quantity: 100,
      designId: "design-1",
      designFile: expect.any(String),
    });
    expectBackendDesignFile(apiClientMock.post.mock.calls[0][1].designFile, designFile);
    expect(apiClientMock.post).toHaveBeenNthCalledWith(2, "/orders/checkout", {
      addressId: "address-1",
      paymentMethod: "ONLINE",
      items: [{ sku: "CUP-CUSTOM-500", designId: "design-1", designFile: expect.any(String) }],
    });
  });

  it("checks out a direct custom print item without adding it to the backend cart", async () => {
    const designFile: DesignFileSnapshot = {
      snapshotVersion: 1 as const,
      designId: "design-direct-1",
      name: "Logo mua ngay",
      previewDataUrl: "data:image/png;base64,direct-logo",
      artwork: {
        artboard: { width: 400, height: 250, printHeightPercent: 70 },
        cup: { size: "700ml", style: "straight", materialType: "clear", cupColor: "#ffffff" },
        layers: [],
      },
      exportedAt: "2026-07-29T00:00:00.000Z",
    };
    apiClientMock.post.mockResolvedValueOnce({
      data: { data: { id: "order-direct", code: "ORD-DIRECT" } },
    });
    apiClientMock.get.mockResolvedValueOnce({
      data: { data: { payUrl: "https://checkout.payos.vn/pay/order-direct" } },
    });

    await createOrder({
      addressId: "address-1",
      customerName: "Vuong Hoai Bao",
      customerType: "B2B",
      phone: "0367672997",
      address: "78/4/9 Nguyen Thi Tu, Phuong Binh Hung Hoa B, Quan Binh Tan, Thanh pho Ho Chi Minh",
      paymentProvider: "PAYOS",
      items: [],
      directItem: {
        sku: "CUP-RND-PP-700-WHT",
        quantity: 100,
        designId: "design-direct-1",
        designFile,
      },
    });

    expect(apiClientMock.delete).not.toHaveBeenCalled();
    expect(apiClientMock.put).not.toHaveBeenCalled();
    expect(apiClientMock.get).not.toHaveBeenCalledWith("/cart");
    expect(apiClientMock.post).toHaveBeenCalledTimes(1);
    expect(apiClientMock.post).toHaveBeenCalledWith("/orders/checkout", {
      addressId: "address-1",
      paymentMethod: "ONLINE",
      directItem: {
        sku: "CUP-RND-PP-700-WHT",
        quantity: 100,
        designId: "design-direct-1",
        designFile: expect.any(String),
      },
    });
    expectBackendDesignFile(apiClientMock.post.mock.calls[0][1].directItem.designFile, designFile);
  });

  it("does not recreate custom print cart items that already exist on the backend", async () => {
    const designFile: DesignFileSnapshot = {
      snapshotVersion: 1 as const,
      designId: "design-1",
      name: "Logo in ly",
      previewDataUrl: "data:image/png;base64,logo",
      artwork: {
        artboard: { width: 400, height: 250, printHeightPercent: 70 },
        cup: { size: "500ml", style: "straight", materialType: "clear", cupColor: "#ffffff" },
        layers: [],
      },
      exportedAt: "2026-07-29T00:00:00.000Z",
    };
    apiClientMock.post.mockResolvedValueOnce({
      data: { data: { id: "order-4", code: "ORD-4" } },
    });
    apiClientMock.get
      .mockResolvedValueOnce({
        data: {
          data: {
            items: [{ sku: "CUP-CUSTOM-500", quantity: 100, designId: "design-1", designFile: "stored-design" }],
          },
        },
      })
      .mockResolvedValueOnce({
        data: { data: { payUrl: "https://checkout.payos.vn/pay/order-4" } },
      });

    await createOrder({
      addressId: "address-1",
      customerName: "Vuong Hoai Bao",
      customerType: "B2B",
      phone: "0367672997",
      address: "78/4/9 Nguyen Thi Tu, Phuong Binh Hung Hoa B, Quan Binh Tan, Thanh pho Ho Chi Minh",
      paymentProvider: "PAYOS",
      items: [
        {
          productId: "product-custom",
          productRefId: "CUP-CUSTOM-500",
          quantity: 100,
          fulfillmentType: "CUSTOM_PRINT",
          designId: "design-1",
          designFile,
        },
      ],
    });

    expect(apiClientMock.delete).not.toHaveBeenCalled();
    expect(apiClientMock.post).toHaveBeenCalledTimes(1);
    expect(apiClientMock.post).toHaveBeenCalledWith("/orders/checkout", {
      addressId: "address-1",
      paymentMethod: "ONLINE",
      items: [{ sku: "CUP-CUSTOM-500", designId: "design-1", designFile: expect.any(String) }],
    });
  });

  it("does not call checkout when selected cart sync fails", async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: { items: [] } } });
    apiClientMock.post.mockRejectedValueOnce(new Error("cart sync failed"));

    await expect(
      createOrder({
        addressId: "address-1",
        customerName: "Vuong Hoai Bao",
        customerType: "B2B",
        phone: "0367672997",
        address: "78/4/9 Nguyen Thi Tu, Phuong Binh Hung Hoa B, Quan Binh Tan, Thanh pho Ho Chi Minh",
        paymentProvider: "PAYOS",
        items: [
          {
            productId: "product-1",
            productRefId: "CUP-HRT-PET-500-CLR",
            quantity: 2,
            fulfillmentType: "STANDARD",
          },
        ],
      }),
    ).rejects.toThrow("cart sync failed");

    expect(apiClientMock.post).toHaveBeenCalledTimes(1);
    expect(apiClientMock.post).not.toHaveBeenCalledWith(
      "/orders/checkout",
      expect.anything(),
    );
  });

  it("retries custom print cart sync without designId when the saved design id is stale", async () => {
    const designFile: DesignFileSnapshot = {
      snapshotVersion: 1 as const,
      designId: "local-design-1",
      name: "Mau cu",
      previewDataUrl: "data:image/png;base64,logo",
      artwork: {
        artboard: { width: 400, height: 250, printHeightPercent: 70 },
        cup: { size: "500ml", style: "straight", materialType: "clear", cupColor: "#ffffff" },
        layers: [],
      },
      exportedAt: "2026-07-29T00:00:00.000Z",
    };

    apiClientMock.post
      .mockRejectedValueOnce(new Error("design not found"))
      .mockResolvedValueOnce({ data: { data: { items: [] } } })
      .mockResolvedValueOnce({ data: { data: { id: "order-3", code: "ORD-3" } } });
    apiClientMock.get
      .mockResolvedValueOnce({ data: { data: { items: [] } } })
      .mockResolvedValueOnce({
        data: { data: { payUrl: "https://checkout.payos.vn/pay/order-3" } },
      });

    await createOrder({
      addressId: "address-1",
      customerName: "Vuong Hoai Bao",
      customerType: "B2B",
      phone: "0367672997",
      address: "78/4/9 Nguyen Thi Tu, Phuong Binh Hung Hoa B, Quan Binh Tan, Thanh pho Ho Chi Minh",
      paymentProvider: "PAYOS",
      items: [
        {
          productId: "product-custom",
          productRefId: "CUP-CUSTOM-500",
          quantity: 100,
          fulfillmentType: "CUSTOM_PRINT",
          designId: "local-design-1",
          designFile,
        },
      ],
    });

    expect(apiClientMock.post).toHaveBeenNthCalledWith(1, "/cart/items", {
      sku: "CUP-CUSTOM-500",
      quantity: 100,
      designId: "local-design-1",
      designFile: expect.any(String),
    });
    expect(apiClientMock.post).toHaveBeenNthCalledWith(2, "/cart/items", {
      sku: "CUP-CUSTOM-500",
      quantity: 100,
      designFile: expect.any(String),
    });
    expectBackendDesignFile(apiClientMock.post.mock.calls[0][1].designFile, designFile);
    expectBackendDesignFile(apiClientMock.post.mock.calls[1][1].designFile, designFile);
    expect(apiClientMock.post).toHaveBeenNthCalledWith(3, "/orders/checkout", {
      addressId: "address-1",
      paymentMethod: "ONLINE",
      items: [{ sku: "CUP-CUSTOM-500", designId: "local-design-1", designFile: expect.any(String) }],
    });
  });
});
