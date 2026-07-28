import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
}));

const publicApiFetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiClient: apiClientMock,
}));

vi.mock("@/lib/public-api", () => ({
  publicApiFetch: publicApiFetchMock,
}));

vi.mock("@/features/catalog/services/wms-stock.service", () => ({
  listWmsItems: vi.fn(),
}));

import {
  adminActivateVariant,
  adminCreateCategory,
  adminUpdateProduct,
  adminListProducts,
  adminListInactiveProducts,
  adminListInactiveVariants,
  adminGetProductVariants,
  adminListHiddenCategories,
  adminRestoreCategory,
  adminPublishProductWithVariants,
  adminActivateProductVariants,
  isApprovedCatalogProduct,
} from "@/features/catalog/services/admin-catalog.service";
import { buildSyncItemsFromCatalogProducts } from "@/features/catalog/components/wms-sync-to-ecom-modal";

describe("admin catalog variant activation API", () => {
  beforeEach(() => {
    apiClientMock.get.mockReset();
    apiClientMock.post.mockReset();
    apiClientMock.patch.mockReset();
    apiClientMock.put.mockReset();
    publicApiFetchMock.mockReset();
    window.localStorage.clear();
  });

  it("keeps draft products out of approved category product lists", () => {
    expect(isApprovedCatalogProduct({ status: "ACTIVE" })).toBe(true);
    expect(isApprovedCatalogProduct({ status: "ACTIVE", isActive: false })).toBe(false);
    expect(isApprovedCatalogProduct({ status: "DRAFT", isActive: false })).toBe(false);
    expect(isApprovedCatalogProduct({ status: "INACTIVE" })).toBe(false);
  });

  it("publishes a product and activates all inactive variants from the admin API", async () => {
    apiClientMock.put.mockResolvedValueOnce({
      data: { data: { id: "product-1", slug: "cup-1", status: "ACTIVE" }, meta: {} },
    });
    apiClientMock.get
      .mockResolvedValueOnce({
        data: {
          data: [
            { id: "variant-1", sku: "CUP-1", isActive: false },
            { id: "variant-2", sku: "CUP-2", isActive: true },
          ],
          meta: {},
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            { id: "variant-1", sku: "CUP-1", isActive: true },
            { id: "variant-2", sku: "CUP-2", isActive: true },
          ],
          meta: {},
        },
      });
    apiClientMock.patch.mockResolvedValueOnce({
      data: { data: { id: "variant-1", isActive: true } },
    });

    await expect(adminPublishProductWithVariants("product-1")).resolves.toEqual({
      product: { id: "product-1", slug: "cup-1", status: "ACTIVE" },
      variants: [
        { id: "variant-1", sku: "CUP-1", isActive: true },
        { id: "variant-2", sku: "CUP-2", isActive: true },
      ],
    });
    expect(apiClientMock.put).toHaveBeenCalledWith(
      "/admin/catalog/products/product-1/publish",
    );
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/admin/catalog/products/product-1/variants",
    );
    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/admin/catalog/variants/variant-1/activate",
    );
    expect(apiClientMock.patch).not.toHaveBeenCalledWith(
      "/admin/catalog/variants/variant-2/activate",
    );
  });

  it("repairs inactive variants for an already active product without publishing again", async () => {
    apiClientMock.get
      .mockResolvedValueOnce({
        data: {
          data: [
            { id: "variant-1", sku: "CUP-1", isActive: false },
            { id: "variant-2", sku: "CUP-2", isActive: false },
          ],
          meta: {},
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            { id: "variant-1", sku: "CUP-1", isActive: true },
            { id: "variant-2", sku: "CUP-2", isActive: true },
          ],
          meta: {},
        },
      });
    apiClientMock.patch
      .mockResolvedValueOnce({ data: { data: { id: "variant-1", isActive: true }, meta: {} } })
      .mockResolvedValueOnce({ data: { data: { id: "variant-2", isActive: true }, meta: {} } });

    await expect(adminActivateProductVariants("product-1")).resolves.toEqual([
      { id: "variant-1", sku: "CUP-1", isActive: true },
      { id: "variant-2", sku: "CUP-2", isActive: true },
    ]);
    expect(apiClientMock.put).not.toHaveBeenCalled();
    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/admin/catalog/variants/variant-1/activate",
    );
    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/admin/catalog/variants/variant-2/activate",
    );
  });

  it("lists inactive variants from the admin Swagger endpoint", async () => {
    const inactiveVariants = [
      {
        id: "variant-1",
        sku: "CUP-500",
        price: 12000,
        attributes: { capacity: "500ml" },
        isActive: false,
      },
    ];
    apiClientMock.get.mockResolvedValueOnce({
      data: { data: inactiveVariants, meta: {} },
    });

    await expect(adminListInactiveVariants()).resolves.toEqual(inactiveVariants);
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/admin/catalog/variants/inactive",
    );
  });

  it("lists product variants from the admin product variants endpoint", async () => {
    const variants = [
      {
        id: "variant-1",
        sku: "CUP-HRT-PET-500-CLR",
        productId: "product-1",
        price: 10000,
        availableQty: 0,
        attributes: { capacity: "500ml" },
        isActive: true,
      },
    ];
    apiClientMock.get.mockResolvedValueOnce({
      data: { data: variants, meta: {} },
    });

    await expect(adminGetProductVariants("product-1")).resolves.toEqual(variants);
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/admin/catalog/products/product-1/variants",
    );
    expect(publicApiFetchMock).not.toHaveBeenCalledWith(
      "/catalog/products/product-1/variants",
    );
  });

  it("lists products only from the public catalog DB payload", async () => {
    publicApiFetchMock.mockResolvedValueOnce({
      data: [
        {
          id: "product-db",
          name: "San pham DB",
          status: "ACTIVE",
          isActive: true,
          categoryId: "category-1",
          variants: [],
        },
      ],
      meta: {},
    });
    window.localStorage.setItem(
      "ecom_local_drafts",
      JSON.stringify([
        {
          id: "product-1",
          name: "Da duyet",
          status: "ACTIVE",
          isActive: true,
          categoryId: "category-1",
          variants: [],
        },
        {
          id: "product-2",
          name: "Chua duyet",
          status: "DRAFT",
          isActive: false,
          categoryId: "category-1",
          variants: [],
        },
      ]),
    );

    await expect(adminListProducts()).resolves.toEqual([
      expect.objectContaining({ id: "product-db", categoryId: "category-1" }),
    ]);
    expect(publicApiFetchMock).toHaveBeenCalledWith("/catalog/products");
    expect(apiClientMock.get).not.toHaveBeenCalledWith(
      "/admin/catalog/products",
      expect.anything(),
    );
  });

  it("lists inactive products from available catalog payload without calling a missing admin list endpoint", async () => {
    const products = [
      {
        id: "product-1",
        name: "San pham kho - CUP_BLANK",
        status: "DRAFT",
        isActive: false,
        categoryId: "category-1",
        variants: [
          {
            id: "variant-1",
            sku: "CUP-RND-PP-700-WHT",
            productId: "product-1",
            isActive: true,
          },
        ],
      },
      {
        id: "product-2",
        name: "Dang ban",
        status: "ACTIVE",
        isActive: true,
        variants: [],
      },
    ];
    publicApiFetchMock.mockResolvedValueOnce(products);

    await expect(adminListInactiveProducts()).resolves.toEqual([
      products[0],
    ]);
    expect(apiClientMock.get).not.toHaveBeenCalledWith(
      "/admin/catalog/products",
      expect.anything(),
    );
  });

  it("activates a variant through the admin Swagger endpoint", async () => {
    const activatedVariant = {
      id: "variant-1",
      sku: "CUP-500",
      price: 12000,
      attributes: { capacity: "500ml" },
      isActive: true,
    };
    apiClientMock.patch.mockResolvedValueOnce({
      data: { data: activatedVariant, meta: {} },
    });

    await expect(adminActivateVariant("variant-1")).resolves.toEqual(
      activatedVariant,
    );
    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/admin/catalog/variants/variant-1/activate",
    );
  });

  it("lists soft-deleted categories from the admin deleted endpoint", async () => {
    const deletedCategories = [
      {
        id: "cat-1",
        name: "Ly da an",
        slug: "ly-da-an",
        deletedAt: "2026-07-28T00:00:00.000Z",
      },
    ];
    apiClientMock.get.mockResolvedValueOnce({
      data: { data: deletedCategories, meta: {} },
    });

    await expect(adminListHiddenCategories()).resolves.toEqual(deletedCategories);
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/admin/catalog/categories/deleted",
    );
  });

  it("restores a soft-deleted category through the admin restore endpoint", async () => {
    const restoredCategory = {
      id: "cat-1",
      name: "Ly da an",
      slug: "ly-da-an",
      isDeleted: false,
    };
    apiClientMock.patch.mockResolvedValueOnce({
      data: { data: restoredCategory, meta: {} },
    });

    await expect(adminRestoreCategory("cat-1")).resolves.toEqual(restoredCategory);
    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/admin/catalog/categories/cat-1/restore",
    );
  });

  it("notifies the storefront after creating a category", async () => {
    const listener = vi.fn();
    window.addEventListener("ecom_products_updated", listener);
    apiClientMock.post.mockResolvedValueOnce({
      data: {
        data: {
          id: "cat-1",
          name: "Ly chưa in",
          slug: "ly-chua-in",
        },
        meta: {},
      },
    });

    try {
      await adminCreateCategory({
        name: "Ly chưa in",
        slug: "ly-chua-in",
        position: 1,
      });
    } finally {
      window.removeEventListener("ecom_products_updated", listener);
    }

    expect(apiClientMock.post).toHaveBeenCalledWith("/admin/catalog/categories", {
      name: "Ly chưa in",
      slug: "ly-chua-in",
      position: 1,
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps approved catalog products visible in the sync item list", () => {
    const activeProduct = {
      id: "product-active",
      name: "Da len ke",
      slug: "san-pham-kho-cup-blank",
      description: "Mo ta tu DB",
      images: ["https://cdn.example.com/product.png"],
      status: "ACTIVE",
      categoryId: "category-1",
      variants: [
        {
          id: "variant-1",
          sku: "CUP-RND-PP-700-WHT",
          price: 100000,
          availableQty: 6,
          attributes: { capacity: "700ml" },
        },
      ],
    };

    expect(buildSyncItemsFromCatalogProducts([activeProduct], [])).toEqual([
      expect.objectContaining({
        productId: "product-active",
        sku: "CUP-RND-PP-700-WHT",
        slug: "san-pham-kho-cup-blank",
        description: "Mo ta tu DB",
        images: ["https://cdn.example.com/product.png"],
        source: "CATALOG",
        isActive: true,
      }),
    ]);
  });

  it("does not duplicate a product when it appears in active and inactive payloads", () => {
    const activeProduct = {
      id: "product-1",
      name: "Da len ke",
      status: "ACTIVE",
      variants: [{ sku: "CUP-700", price: 100000 }],
    };
    const inactiveProduct = {
      id: "product-1",
      name: "Cho duyet",
      status: "DRAFT",
      variants: [{ sku: "CUP-700", price: 10000 }],
    };

    const items = buildSyncItemsFromCatalogProducts([activeProduct], [inactiveProduct]);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(
      expect.objectContaining({
        productId: "product-1",
        source: "CATALOG",
        price: 100000,
      }),
    );
  });

  it("extracts category object ids before syncing existing products", () => {
    const product = {
      id: "6a66df2e2ebc2c57c2817e66",
      name: "Da len ke",
      status: "ACTIVE",
      categoryId: { _id: "6b66df2e2ebc2c57c2817e77", name: "Ly" },
      variants: [{ sku: "CUP-700", price: 100000 }],
    };

    const items = buildSyncItemsFromCatalogProducts([product], []);

    expect(items[0]).toEqual(
      expect.objectContaining({
        productId: "6a66df2e2ebc2c57c2817e66",
        categoryId: "6b66df2e2ebc2c57c2817e77",
      }),
    );
  });

  it("keeps product-only PATCH payload compatible with the Swagger DTO", async () => {
    apiClientMock.patch.mockResolvedValueOnce({
      data: {
        data: {
          id: "product-1",
          categoryId: "category-1",
          status: "ACTIVE",
        },
        meta: {},
      },
    });

    await expect(
      adminUpdateProduct("6a66df2e2ebc2c57c2817e66", {
        name: "Da duyet",
        categoryId: "category-1",
        status: "ACTIVE",
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "product-1",
        status: "ACTIVE",
      }),
    );

    expect(apiClientMock.patch).toHaveBeenCalledTimes(1);
    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/admin/catalog/products/6a66df2e2ebc2c57c2817e66",
      {
        name: "Da duyet",
        categoryId: "category-1",
        status: "ACTIVE",
      },
    );
  });

  it("keeps variant-only fields out of the product PATCH payload", async () => {
    apiClientMock.patch.mockResolvedValueOnce({
      data: {
        data: {
          id: "product-1",
          categoryId: "category-1",
          status: "ACTIVE",
        },
        meta: {},
      },
    });

    await adminUpdateProduct("6a66df2e2ebc2c57c2817e66", {
      categoryId: "category-1",
      status: "ACTIVE",
      price: 12000,
      variants: [{ id: "variant-1" }],
    });

    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/admin/catalog/products/6a66df2e2ebc2c57c2817e66",
      {
        categoryId: "category-1",
        status: "ACTIVE",
      },
    );
  });

  it("sanitizes product slug before PATCH to match the Swagger pattern", async () => {
    apiClientMock.patch.mockResolvedValueOnce({
      data: {
        data: {
          id: "product-1",
          slug: "ly-nhua-nap-tim-500ml",
        },
        meta: {},
      },
    });

    await adminUpdateProduct("6a66df2e2ebc2c57c2817e66", {
      name: "Ly nhựa nắp tim 500ml",
      slug: "Ly nhựa nắp tim 500ml",
    });

    expect(apiClientMock.patch).toHaveBeenCalledWith(
      "/admin/catalog/products/6a66df2e2ebc2c57c2817e66",
      {
        name: "Ly nhựa nắp tim 500ml",
        slug: "ly-nhua-nap-tim-500ml",
      },
    );
  });
});
