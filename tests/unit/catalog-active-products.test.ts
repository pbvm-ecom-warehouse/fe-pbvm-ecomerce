import { beforeEach, describe, expect, it, vi } from "vitest";

const publicApiFetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/public-api", () => ({
  publicApiFetch: publicApiFetchMock,
}));

import { listCatalogProducts } from "@/features/catalog/services/catalog.service";

describe("shop catalog active products", () => {
  beforeEach(() => {
    publicApiFetchMock.mockReset();
  });

  it("loads the shop product list from the active-products endpoint", async () => {
    publicApiFetchMock
      .mockResolvedValueOnce([
        {
          id: "product-active",
          name: "San pham da duyet",
          slug: "san-pham-da-duyet",
          status: "ACTIVE",
          variants: [],
        },
      ])
      .mockResolvedValueOnce([])
      .mockRejectedValue(new Error("variant detail not needed for this test"));

    const result = await listCatalogProducts();

    expect(publicApiFetchMock).toHaveBeenNthCalledWith(
      1,
      "/catalog/products/active",
    );
    expect(result.data).toEqual([
      expect.objectContaining({
        id: "product-active",
        name: "San pham da duyet",
      }),
    ]);
  });

  it("unwraps paginated active-products payloads from the shop API", async () => {
    publicApiFetchMock
      .mockResolvedValueOnce({
        data: [
          {
            id: "product-active",
            name: "San pham da duyet",
            slug: "san-pham-da-duyet",
            status: "ACTIVE",
            variants: [],
          },
        ],
        meta: { pagination: { total: 1 } },
      })
      .mockResolvedValueOnce([])
      .mockRejectedValue(new Error("variant detail not needed for this test"));

    const result = await listCatalogProducts();

    expect(publicApiFetchMock).toHaveBeenNthCalledWith(
      1,
      "/catalog/products/active",
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        id: "product-active",
        name: "San pham da duyet",
      }),
    );
  });
});
