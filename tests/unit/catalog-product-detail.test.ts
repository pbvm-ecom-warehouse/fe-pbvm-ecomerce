import { beforeEach, describe, expect, it, vi } from "vitest";

const publicApiFetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/public-api", () => ({
  publicApiFetch: publicApiFetchMock,
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: {},
}));

import { getCatalogProductBySlug } from "@/features/catalog/services/catalog.service";

describe("catalog product detail", () => {
  beforeEach(() => {
    publicApiFetchMock.mockReset();
  });

  it("uses fresh variant price and stock from the product variants endpoint", async () => {
    publicApiFetchMock
      .mockResolvedValueOnce({
        id: "product-1",
        name: "Sản phẩm kho - CUP_BLANK",
        slug: "san-pham-kho-cup_blank",
        categoryId: "category-1",
        price: 0,
        variants: [
          {
            id: "variant-1",
            sku: "CUP-HRT-PET-500-CLR",
            price: 0,
            availableQty: 0,
            attributes: { "500": "500ml", hrt: "Trái tim", pet: "Nhựa PET" },
          },
        ],
      })
      .mockResolvedValueOnce([
        {
          id: "variant-1",
          sku: "CUP-HRT-PET-500-CLR",
          price: 25000,
          availableQty: 8,
          attributes: { "500": "500ml", hrt: "Trái tim", pet: "Nhựa PET" },
        },
      ]);

    const product = await getCatalogProductBySlug("san-pham-kho-cup_blank");

    expect(publicApiFetchMock).toHaveBeenNthCalledWith(
      2,
      "/catalog/products/product-1/variants",
    );
    expect(product?.price).toBe(25000);
    expect(product?.variants?.[0]?.price).toBe(25000);
    expect(product?.stockSnapshot).toBe(8);
  });

  it("keeps raw variant attributes from the public product variants endpoint without inferring", async () => {
    publicApiFetchMock
      .mockResolvedValueOnce({
        id: "product-1",
        name: "Sản phẩm kho - CUP_BLANK",
        slug: "san-pham-kho-cup_blank",
        categoryId: "category-1",
        price: 0,
        variants: [],
      })
      .mockResolvedValueOnce([
        {
          id: "variant-1",
          sku: "CUP-HRT-PET-500-CLR",
          productId: "product-1",
          price: 10000,
          availableQty: 4,
          attributes: {
            "500": "500ml",
            hrt: "Trái tim",
            pet: "Nhựa PET",
            clr: "Trong suốt",
          },
        },
      ]);

    const product = await getCatalogProductBySlug("san-pham-kho-cup_blank");

    expect(product?.variants?.[0]?.attributes).toEqual(
      expect.objectContaining({
        "500": "500ml",
        hrt: "Trái tim",
        pet: "Nhựa PET",
        clr: "Trong suốt",
        capacity: "",
        style: "",
        material: "",
        color: "",
      }),
    );
  });

  it("falls back to the product slug variants endpoint and unwraps response data", async () => {
    publicApiFetchMock
      .mockResolvedValueOnce({
        id: "6a66df2e2ebc2c57c2817e66",
        name: "Phôi ly",
        slug: "san-pham-kho-cup-blank",
        categoryId: "category-1",
        price: 0,
        variants: [],
      })
      .mockRejectedValueOnce(new Error("product id variants endpoint not found"))
      .mockResolvedValueOnce({
        data: [
          {
            id: "variant-1",
            sku: "CUP-RND-PP-700-WHT",
            productId: "6a66df2e2ebc2c57c2817e66",
            price: 100000,
            availableQty: 6,
            attributes: {
              capacity: "700ml",
              style: "Trụ tròn",
              material: "Nhựa PP",
              color: "Trắng sữa",
            },
          },
        ],
      });

    const product = await getCatalogProductBySlug("san-pham-kho-cup-blank");

    expect(publicApiFetchMock).toHaveBeenNthCalledWith(
      2,
      "/catalog/products/6a66df2e2ebc2c57c2817e66/variants",
    );
    expect(publicApiFetchMock).toHaveBeenNthCalledWith(
      3,
      "/catalog/products/san-pham-kho-cup-blank/variants",
    );
    expect(product?.price).toBe(100000);
    expect(product?.stockSnapshot).toBe(6);
    expect(product?.variants?.[0]?.attributes).toEqual(
      expect.objectContaining({
        capacity: "700ml",
        style: "Trụ tròn",
        material: "Nhựa PP",
        color: "Trắng sữa",
      }),
    );
  });

  it("reads variants from the shop product detail payload when they are nested in data", async () => {
    publicApiFetchMock
      .mockResolvedValueOnce({
        data: {
          id: "6a66df2e2ebc2c57c2817e66",
          name: "Phôi ly",
          slug: "san-pham-kho-cup-blank",
          categoryId: "category-1",
          price: 0,
          variants: [
            {
              id: "variant-1",
              sku: "CUP-RND-PP-700-WHT",
              productId: "6a66df2e2ebc2c57c2817e66",
              price: 100000,
              availableQty: 6,
              attributes: {
                capacity: "700ml",
                style: "Trụ tròn",
                material: "Nhựa PP",
                color: "Trắng sữa",
              },
            },
          ],
        },
      });

    const product = await getCatalogProductBySlug("san-pham-kho-cup-blank");

    expect(product?.price).toBe(100000);
    expect(product?.stockSnapshot).toBe(6);
    expect(product?.variants?.[0]?.attributes).toEqual(
      expect.objectContaining({
        capacity: "700ml",
        style: "Trụ tròn",
        material: "Nhựa PP",
        color: "Trắng sữa",
      }),
    );
  });

  it("maps BE shop detail envelope variants into the product detail model", async () => {
    publicApiFetchMock
      .mockResolvedValueOnce({
        data: {
          id: "product-1",
          name: "Phôi ly",
          slug: "phoi-ly",
          description: "",
          images: [],
          categoryId: "category-1",
          status: "ACTIVE",
          price: 0,
          inStock: true,
          variants: [
            {
              id: "variant-1",
              sku: "CUP-RND-PP-700-WHT",
              productId: "product-1",
              attributes: {
                capacity: "700ml",
                style: "Trụ tròn",
                material: "Nhựa PP",
                color: "Trắng sữa",
              },
              price: 100000,
              availableQty: 6,
              fulfillmentType: "STANDARD",
              isActive: true,
            },
          ],
        },
        meta: {},
      })
      .mockResolvedValueOnce([]);

    const product = await getCatalogProductBySlug("phoi-ly");

    expect(product?.price).toBe(100000);
    expect(product?.stockSnapshot).toBe(6);
    expect(product?.productRefId).toBe("");
    expect(product?.variants).toHaveLength(1);
    expect(product?.variants?.[0]).toEqual(
      expect.objectContaining({
        sku: "CUP-RND-PP-700-WHT",
        price: 100000,
        availableQty: 6,
        attributes: expect.objectContaining({
          capacity: "700ml",
          style: "Trụ tròn",
          material: "Nhựa PP",
          color: "Trắng sữa",
        }),
      }),
    );
  });

  it("keeps variants from the shop product detail when the variants endpoint returns empty", async () => {
    publicApiFetchMock
      .mockResolvedValueOnce({
        id: "6a66df2e2ebc2c57c2817e66",
        name: "Phôi ly",
        slug: "san-pham-kho-cup-blank",
        categoryId: "category-1",
        price: 0,
        variants: [
          {
            id: "variant-1",
            sku: "CUP-RND-PP-700-WHT",
            productId: "6a66df2e2ebc2c57c2817e66",
            price: 100000,
            availableQty: 6,
            attributes: {
              capacity: "700ml",
              style: "Trụ tròn",
              material: "Nhựa PP",
              color: "Trắng sữa",
            },
          },
        ],
      })
      .mockResolvedValueOnce([]);

    const product = await getCatalogProductBySlug("san-pham-kho-cup-blank");

    expect(product?.price).toBe(100000);
    expect(product?.stockSnapshot).toBe(6);
    expect(product?.variants).toHaveLength(1);
    expect(product?.variants?.[0]?.attributes).toEqual(
      expect.objectContaining({
        capacity: "700ml",
        style: "Trụ tròn",
        material: "Nhựa PP",
        color: "Trắng sữa",
      }),
    );
  });
});
