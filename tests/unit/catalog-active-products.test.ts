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

  it("does not fetch product variants with a slug identifier", async () => {
    publicApiFetchMock
      .mockResolvedValueOnce([
        {
          id: "san-pham-kho-packaging",
          name: "Bao bi san pham",
          slug: "san-pham-kho-packaging",
          status: "ACTIVE",
          variants: [],
        },
      ])
      .mockResolvedValueOnce([]);

    await listCatalogProducts();

    expect(publicApiFetchMock).not.toHaveBeenCalledWith(
      "/catalog/products/san-pham-kho-packaging/variants",
    );
  });

  it("filters out products with status DRAFT or isActive false from the shop list", async () => {
    publicApiFetchMock
      .mockResolvedValueOnce([
        {
          id: "product-draft",
          name: "San pham nhap",
          slug: "san-pham-nhap",
          status: "DRAFT",
          variants: [],
        },
        {
          id: "product-active",
          name: "San pham da duyet",
          slug: "san-pham-da-duyet",
          status: "ACTIVE",
          variants: [],
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await listCatalogProducts();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe("product-active");
  });
});
