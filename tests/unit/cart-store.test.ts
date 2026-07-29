import { beforeEach, describe, expect, it, vi } from "vitest";

const cartServiceMock = vi.hoisted(() => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearBackendCart: vi.fn(),
}));

const authStoreState = vi.hoisted(() => ({
  user: {
    id: "user-1",
    name: "Customer",
    email: "customer@example.com",
    type: "customer",
    tenantId: "demo-tenant",
  },
}));

const catalogServiceMock = vi.hoisted(() => ({
  cleanProductName: (name: string, fallback?: string) => name || fallback || "",
  listCatalogProducts: vi.fn(),
}));

vi.mock("@/features/cart/services/cart.service", () => cartServiceMock);

vi.mock("@/features/catalog/services/catalog.service", () => catalogServiceMock);

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: {
    getState: () => authStoreState,
  },
}));

import { useCartStore } from "@/stores/cart-store";
import type { CartItem, CatalogProduct, DesignFileSnapshot } from "@/types/api";

const productWithVariant = {
  id: "product-1",
  productRefId: "product-ref",
  slug: "ly-500ml",
  name: "Ly 500ml",
  category: "plain_cup",
  price: 25_000,
  b2bPrice: 25_000,
  unit: "cái",
  stockSnapshot: 8,
  imageUrl: "/image.png",
  updatedAt: "2026-07-28T00:00:00.000Z",
  variants: [
    {
      id: "variant-1",
      sku: "CUP-HRT-PET-500-CLR",
      productId: "product-1",
      attributes: { capacity: "500ml" },
      price: 25_000,
      availableQty: 8,
      fulfillmentType: "STANDARD",
      isActive: true,
    },
  ],
} satisfies CatalogProduct;

describe("cart store", () => {
  beforeEach(() => {
    cartServiceMock.addCartItem.mockReset();
    cartServiceMock.updateCartItem.mockReset();
    cartServiceMock.getCart.mockReset();
    catalogServiceMock.listCatalogProducts.mockReset();
    cartServiceMock.addCartItem.mockResolvedValue({ items: [] });
    cartServiceMock.updateCartItem.mockResolvedValue({ items: [] });
    cartServiceMock.removeCartItem.mockResolvedValue({ items: [] });
    cartServiceMock.getCart.mockResolvedValue({ items: [] });
    catalogServiceMock.listCatalogProducts.mockResolvedValue({ data: [] });
    useCartStore.setState({ items: [] });
    window.localStorage.clear();
  });

  it("syncs product-card additions with the backend variant SKU", () => {
    useCartStore.getState().addProduct(productWithVariant, 2);

    expect(cartServiceMock.addCartItem).toHaveBeenCalledWith({
      sku: "CUP-HRT-PET-500-CLR",
      quantity: 2,
    });
    expect(useCartStore.getState().items[0]).toEqual(
      expect.objectContaining({
        productRefId: "CUP-HRT-PET-500-CLR",
        cartItemId: "standard:CUP-HRT-PET-500-CLR",
      }),
    );
  });

  it("caps repeated product additions by the available stock snapshot", () => {
    useCartStore.getState().addProduct(productWithVariant, 6);
    useCartStore.getState().addProduct(productWithVariant, 5);

    expect(useCartStore.getState().items[0]).toEqual(
      expect.objectContaining({
        quantity: 8,
        stockSnapshot: 8,
      }),
    );
    expect(cartServiceMock.updateCartItem).toHaveBeenLastCalledWith(
      "CUP-HRT-PET-500-CLR",
      8,
    );
  });

  it("caps cart quantity updates by the item stock snapshot", () => {
    useCartStore.getState().addProduct(productWithVariant, 2);

    useCartStore
      .getState()
      .updateQuantity("standard:CUP-HRT-PET-500-CLR", 99);

    expect(useCartStore.getState().items[0]).toEqual(
      expect.objectContaining({
        quantity: 8,
        stockSnapshot: 8,
      }),
    );
    expect(cartServiceMock.updateCartItem).toHaveBeenLastCalledWith(
      "CUP-HRT-PET-500-CLR",
      8,
    );
  });

  it("does not sync custom-print product additions without a design snapshot", () => {
    useCartStore.getState().addProduct(
      {
        ...productWithVariant,
        fulfillmentType: "CUSTOM_PRINT",
        productRefId: "CUP-RND-PP-700-WHT",
        variants: [
          {
            ...productWithVariant.variants[0],
            sku: "CUP-RND-PP-700-WHT",
            fulfillmentType: "CUSTOM_PRINT",
          },
        ],
      },
      1,
    );

    expect(cartServiceMock.addCartItem).not.toHaveBeenCalled();
    expect(useCartStore.getState().items[0]).toEqual(
      expect.objectContaining({
        productRefId: "CUP-RND-PP-700-WHT",
        fulfillmentType: "CUSTOM_PRINT",
      }),
    );
  });

  it("skips stale custom-print local items without design snapshots during backend sync", async () => {
    useCartStore.setState({
      items: [
        {
          cartItemId: "standard:CUP-RND-PP-700-WHT",
          productId: "product-custom-stale",
          productRefId: "CUP-RND-PP-700-WHT",
          name: "Ly in theo thiết kế CUP-RND-PP-700-WHT",
          slug: "CUP-RND-PP-700-WHT",
          price: 2_000,
          quantity: 1,
          unit: "cái",
          imageUrl: "/image.png",
          fulfillmentType: "CUSTOM_PRINT",
        },
      ],
    });
    cartServiceMock.getCart.mockResolvedValue({ items: [] });

    await useCartStore.getState().fetchAndSyncCart();

    expect(cartServiceMock.addCartItem).not.toHaveBeenCalled();
  });

  it("returns a promise when adding a custom print item so callers can wait for the real cart API", async () => {
    const designFile: DesignFileSnapshot = {
      snapshotVersion: 1,
      designId: "design-wait-1",
      name: "Ly custom wait",
      previewDataUrl: "data:image/png;base64,wait-preview",
      artwork: {
        artboard: {
          width: 740,
          height: 490,
          printHeightPercent: 70,
        },
        cup: {
          size: "700ml",
          style: "straight",
          materialType: "clear",
          cupColor: "#ffffff",
        },
        layers: [],
      },
      exportedAt: "2026-07-28T00:00:00.000Z",
    };

    const result = useCartStore.getState().addCustomPrintItem({
      product: {
        ...productWithVariant,
        id: "product-custom-1",
        productRefId: "CUP-RND-PP-700-WHT",
        slug: "CUP-RND-PP-700-WHT",
        name: "Ly in theo thiết kế CUP-RND-PP-700-WHT",
        price: 2_000,
        b2bPrice: 2_000,
        fulfillmentType: "CUSTOM_PRINT",
      },
      quantity: 1,
      designId: "design-wait-1",
      designFile,
      attributes: {
        capacity: "700ml",
        material: "Nhựa PP",
        style: "Trụ tròn",
        color: "Trắng sữa",
      },
    });

    expect(result).toBeInstanceOf(Promise);
    await result;
    expect(cartServiceMock.addCartItem).toHaveBeenCalledWith({
      sku: "CUP-RND-PP-700-WHT",
      quantity: 1,
      designId: "design-wait-1",
      designFile: expect.any(String),
    });
    const backendDesignFile = JSON.parse(cartServiceMock.addCartItem.mock.calls[0][0].designFile);
    expect(backendDesignFile.previewDataUrl).toBeUndefined();
    expect(backendDesignFile.artwork).toEqual(designFile.artwork);
    expect(useCartStore.getState().items[0]).toEqual(
      expect.objectContaining({
        attributes: {
          capacity: "700ml",
          material: "Nhựa PP",
          style: "Trụ tròn",
          color: "Trắng sữa",
        },
        selectedSize: "700ml",
        selectedMaterial: "Nhựa PP",
        selectedStyle: "Trụ tròn",
      }),
    );
  });

  it("merges restored checkout items back into the existing cart after payment cancel", async () => {
    const retainedBlankItem = {
      cartItemId: "standard:CUP-HRT-PET-500-CLR",
      productId: "product-1",
      productRefId: "CUP-HRT-PET-500-CLR",
      slug: "ly-500ml",
      name: "Ly 500ml",
      price: 25_000,
      quantity: 2,
      unit: "cái",
      imageUrl: "/image.png",
      fulfillmentType: "STANDARD",
      selected: false,
    } satisfies CartItem;

    const restoredDesignFile: DesignFileSnapshot = {
      snapshotVersion: 1,
      designId: "design-cancel-1",
      name: "Ly custom cancel",
      previewDataUrl: "data:image/png;base64,cancel-preview",
      artwork: {
        artboard: {
          width: 740,
          height: 490,
          printHeightPercent: 70,
        },
        cup: {
          size: "700ml",
          style: "straight",
          materialType: "clear",
          cupColor: "#ffffff",
        },
        layers: [],
      },
      exportedAt: "2026-07-28T00:00:00.000Z",
    };

    useCartStore.setState({
      items: [retainedBlankItem],
    });

    await useCartStore.getState().restoreItems([
      {
        cartItemId: "custom:CUP-RND-PP-700-WHT:design-cancel-1:1",
        productId: "product-custom-1",
        productRefId: "CUP-RND-PP-700-WHT",
        slug: "CUP-RND-PP-700-WHT",
        name: "Ly custom cancel",
        price: 2_000,
        quantity: 1,
        unit: "cái",
        imageUrl: restoredDesignFile.previewDataUrl,
        fulfillmentType: "CUSTOM_PRINT",
        designId: "design-cancel-1",
        designFile: restoredDesignFile,
      },
    ]);

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productRefId: "CUP-HRT-PET-500-CLR",
          quantity: 2,
          selected: false,
        }),
      ]),
    );
    expect(cartServiceMock.clearBackendCart).toHaveBeenCalled();
    expect(cartServiceMock.addCartItem).toHaveBeenCalledWith({
      sku: "CUP-HRT-PET-500-CLR",
      quantity: 2,
      designId: undefined,
      designFile: undefined,
    });
    expect(cartServiceMock.addCartItem).not.toHaveBeenCalledWith(
      expect.objectContaining({
        sku: "CUP-RND-PP-700-WHT",
      }),
    );
  });

  it("refreshes cart item prices from the latest catalog variant price", async () => {
    useCartStore.setState({
      items: [
        {
          cartItemId: "standard:CUP-HRT-PET-500-CLR",
          productId: "product-1",
          productRefId: "CUP-HRT-PET-500-CLR",
          slug: "ly-500ml",
          name: "Ly 500ml",
          price: 25_000,
          quantity: 2,
          unit: "cái",
          imageUrl: "/image.png",
          fulfillmentType: "STANDARD",
        },
      ],
    });
    cartServiceMock.getCart
      .mockResolvedValueOnce({
        items: [{ sku: "CUP-HRT-PET-500-CLR", quantity: 2, unitPrice: 25_000 }],
      })
      .mockResolvedValueOnce({
        items: [{ sku: "CUP-HRT-PET-500-CLR", quantity: 2, unitPrice: 25_000 }],
      });
    catalogServiceMock.listCatalogProducts.mockResolvedValue({
      data: [
        {
          ...productWithVariant,
          variants: [
            {
              ...productWithVariant.variants[0],
              price: 30_000,
            },
          ],
        },
      ],
    });

    await useCartStore.getState().fetchAndSyncCart();

    expect(useCartStore.getState().items[0]).toEqual(
      expect.objectContaining({
        price: 30_000,
        quantity: 2,
      }),
    );
  });

  it("keeps the local design snapshot when backend cart sync returns a custom item without designFile", async () => {
    const designFile: DesignFileSnapshot = {
      snapshotVersion: 1,
      designId: "design-db-1",
      name: "Ly custom test",
      previewDataUrl: "data:image/png;base64,designer-preview",
      artwork: {
        artboard: {
          width: 740,
          height: 490,
          printHeightPercent: 70,
        },
        cup: {
          size: "700ml",
          style: "straight",
          materialType: "clear",
          cupColor: "#ffffff",
        },
        layers: [
          {
            id: "text-1",
            type: "text",
            text: "PBVM",
            x: 120,
            y: 140,
            color: "#0f172a",
            fontSize: 42,
          },
        ],
      },
      exportedAt: "2026-07-28T00:00:00.000Z",
    };

    useCartStore.setState({
      items: [
        {
          cartItemId: "custom:CUP-RND-PP-700-WHT:design-db-1:1",
          productId: "product-1",
          productRefId: "CUP-RND-PP-700-WHT",
          slug: "CUP-RND-PP-700-WHT",
          name: "Phôi ly",
          price: 2_000,
          quantity: 1,
          unit: "cái",
          imageUrl: designFile.previewDataUrl,
          fulfillmentType: "CUSTOM_PRINT",
          designId: "design-db-1",
          designFile,
          attributes: {
            capacity: "700ml",
            material: "Nhựa PP",
            style: "Trụ tròn",
          },
          selectedSize: "700ml",
          selectedMaterial: "Nhựa PP",
          selectedStyle: "Trụ tròn",
        },
      ],
    });
    cartServiceMock.getCart
      .mockResolvedValueOnce({
        items: [
          {
            sku: "CUP-RND-PP-700-WHT",
            quantity: 1,
            unitPrice: 2_000,
            isPrintItem: true,
            designId: "design-db-1",
            designFile: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            sku: "CUP-RND-PP-700-WHT",
            quantity: 1,
            unitPrice: 2_000,
            isPrintItem: true,
            designId: "design-db-1",
            designFile: null,
          },
        ],
      });

    catalogServiceMock.listCatalogProducts.mockResolvedValue({
      data: [
        {
          ...productWithVariant,
          name: "Phôi ly",
          slug: "phoi-ly",
          variants: [
            {
              ...productWithVariant.variants[0],
              sku: "CUP-RND-PP-700-WHT",
              price: 2_000,
            },
          ],
        },
      ],
    });

    await useCartStore.getState().fetchAndSyncCart();

    expect(useCartStore.getState().items).toEqual([]);
  });

  it("keeps local design data when backend merges the same SKU into a non-print cart item", async () => {
    const designFile: DesignFileSnapshot = {
      snapshotVersion: 1,
      designId: "design-merged-sku-1",
      name: "Ly custom merged SKU",
      previewDataUrl: "data:image/png;base64,merged-design",
      artwork: {
        artboard: {
          width: 740,
          height: 490,
          printHeightPercent: 70,
        },
        cup: {
          size: "700ml",
          style: "straight",
          materialType: "clear",
          cupColor: "#ffffff",
        },
        layers: [],
      },
      exportedAt: "2026-07-28T00:00:00.000Z",
    };

    useCartStore.setState({
      items: [
        {
          cartItemId: "custom:CUP-HRT-PET-500-CLR:design-merged-sku-1:1",
          productId: "product-1",
          productRefId: "CUP-HRT-PET-500-CLR",
          slug: "CUP-HRT-PET-500-CLR",
          name: "Ly custom merged SKU",
          price: 25_000,
          quantity: 1,
          unit: "cái",
          imageUrl: designFile.previewDataUrl,
          fulfillmentType: "CUSTOM_PRINT",
          designId: "design-merged-sku-1",
          designFile,
          attributes: {
            capacity: "700ml",
            material: "Nhựa PP",
            style: "Trụ tròn",
          },
          selectedSize: "700ml",
          selectedMaterial: "Nhựa PP",
          selectedStyle: "Trụ tròn",
        },
      ],
    });
    cartServiceMock.getCart
      .mockResolvedValueOnce({
        items: [
          {
            sku: "CUP-HRT-PET-500-CLR",
            quantity: 2,
            unitPrice: 25_000,
            isPrintItem: false,
            designId: null,
            designFile: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            sku: "CUP-HRT-PET-500-CLR",
            quantity: 2,
            unitPrice: 25_000,
            isPrintItem: false,
            designId: null,
            designFile: null,
          },
        ],
      });

    await useCartStore.getState().fetchAndSyncCart();

    expect(useCartStore.getState().items[0]).toEqual(
      expect.objectContaining({
        quantity: 2,
        fulfillmentType: "STANDARD",
        designId: undefined,
        designFile: undefined,
      }),
    );
  });

  it("keeps custom print and standard lines split when backend returns one merged SKU line", async () => {
    const designFile: DesignFileSnapshot = {
      snapshotVersion: 1,
      designId: "design-split-1",
      name: "Ly custom split",
      previewDataUrl: "data:image/png;base64,split-design",
      artwork: {
        artboard: {
          width: 740,
          height: 490,
          printHeightPercent: 70,
        },
        cup: {
          size: "700ml",
          style: "straight",
          materialType: "clear",
          cupColor: "#ffffff",
        },
        layers: [],
      },
      exportedAt: "2026-07-28T00:00:00.000Z",
    };

    useCartStore.setState({
      items: [
        {
          cartItemId: "custom:CUP-RND-PP-700-WHT:design-split-1:1",
          productId: "product-1",
          productRefId: "CUP-RND-PP-700-WHT",
          slug: "CUP-RND-PP-700-WHT",
          name: "Ly custom split",
          price: 2_000,
          quantity: 1,
          unit: "cái",
          imageUrl: designFile.previewDataUrl,
          fulfillmentType: "CUSTOM_PRINT",
          designId: "design-split-1",
          designFile,
        },
        {
          cartItemId: "standard:CUP-RND-PP-700-WHT",
          productId: "product-1",
          productRefId: "CUP-RND-PP-700-WHT",
          slug: "CUP-RND-PP-700-WHT",
          name: "Phôi ly 700ml",
          price: 2_000,
          quantity: 1,
          unit: "cái",
          imageUrl: "/blank.png",
          fulfillmentType: "STANDARD",
        },
      ],
    });
    cartServiceMock.getCart
      .mockResolvedValueOnce({
        items: [
          {
            sku: "CUP-RND-PP-700-WHT",
            quantity: 2,
            unitPrice: 2_000,
            isPrintItem: false,
            designId: null,
            designFile: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            sku: "CUP-RND-PP-700-WHT",
            quantity: 2,
            unitPrice: 2_000,
            isPrintItem: false,
            designId: null,
            designFile: null,
          },
        ],
      });

    await useCartStore.getState().fetchAndSyncCart();

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({
        cartItemId: "standard:CUP-RND-PP-700-WHT:0",
        quantity: 2,
        fulfillmentType: "STANDARD",
      }),
    ]);
    expect(useCartStore.getState().items[0].designId).toBeUndefined();
  });

  it("deduplicates repeated local cart item ids during backend sync", async () => {
    useCartStore.setState({
      items: [
        {
          cartItemId: "standard:CUP-RND-PP-700-WHT:700ml",
          productId: "product-1",
          productRefId: "CUP-RND-PP-700-WHT",
          slug: "CUP-RND-PP-700-WHT",
          name: "Phôi ly 700ml",
          price: 2_000,
          quantity: 1,
          unit: "cái",
          imageUrl: "/blank.png",
          fulfillmentType: "STANDARD",
        },
        {
          cartItemId: "standard:CUP-RND-PP-700-WHT:700ml",
          productId: "product-1",
          productRefId: "CUP-RND-PP-700-WHT",
          slug: "CUP-RND-PP-700-WHT",
          name: "Phôi ly 700ml",
          price: 2_000,
          quantity: 1,
          unit: "cái",
          imageUrl: "/blank.png",
          fulfillmentType: "STANDARD",
        },
      ],
    });
    cartServiceMock.getCart
      .mockResolvedValueOnce({
        items: [
          { sku: "CUP-RND-PP-700-WHT", quantity: 2, unitPrice: 2_000 },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          { sku: "CUP-RND-PP-700-WHT", quantity: 2, unitPrice: 2_000 },
        ],
      });

    await useCartStore.getState().fetchAndSyncCart();

    const items = useCartStore.getState().items;
    const ids = items.map((item) => item.cartItemId);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(
      expect.objectContaining({
        productRefId: "CUP-RND-PP-700-WHT",
        quantity: 2,
        fulfillmentType: "STANDARD",
      }),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("coalesces duplicate backend custom lines for the same SKU and design", async () => {
    const designFile: DesignFileSnapshot = {
      snapshotVersion: 1,
      designId: "design-same-1",
      name: "Ly custom same design",
      previewDataUrl: "data:image/png;base64,same-design",
      artwork: {
        artboard: {
          width: 740,
          height: 490,
          printHeightPercent: 70,
        },
        cup: {
          size: "700ml",
          style: "straight",
          materialType: "clear",
          cupColor: "#ffffff",
        },
        layers: [],
      },
      exportedAt: "2026-07-28T00:00:00.000Z",
    };

    cartServiceMock.getCart
      .mockResolvedValueOnce({
        items: [
          {
            sku: "CUP-RND-PP-700-WHT",
            quantity: 1,
            unitPrice: 2_000,
            isPrintItem: true,
            designId: "design-same-1",
            designFile: JSON.stringify(designFile),
          },
          {
            sku: "CUP-RND-PP-700-WHT",
            quantity: 2,
            unitPrice: 2_000,
            isPrintItem: true,
            designId: "design-same-1",
            designFile: JSON.stringify(designFile),
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            sku: "CUP-RND-PP-700-WHT",
            quantity: 1,
            unitPrice: 2_000,
            isPrintItem: true,
            designId: "design-same-1",
            designFile: JSON.stringify(designFile),
          },
          {
            sku: "CUP-RND-PP-700-WHT",
            quantity: 2,
            unitPrice: 2_000,
            isPrintItem: true,
            designId: "design-same-1",
            designFile: JSON.stringify(designFile),
          },
        ],
      });

    await useCartStore.getState().fetchAndSyncCart();

    const ids = useCartStore.getState().items.map((item) => item.cartItemId);
    expect(ids).toHaveLength(0);
  });

  it("preserves unselected cart lines after backend cart sync", async () => {
    useCartStore.setState({
      items: [
        {
          cartItemId: "standard:CUP-HRT-PET-500-CLR:0",
          productId: "product-1",
          productRefId: "CUP-HRT-PET-500-CLR",
          slug: "CUP-HRT-PET-500-CLR",
          name: "Ly 500ml",
          price: 25_000,
          quantity: 2,
          unit: "cai",
          imageUrl: "/image.png",
          fulfillmentType: "STANDARD",
          selected: false,
        },
        {
          cartItemId: "standard:CUP-RND-PP-700-WHT:1",
          productId: "product-2",
          productRefId: "CUP-RND-PP-700-WHT",
          slug: "CUP-RND-PP-700-WHT",
          name: "Ly 700ml",
          price: 30_000,
          quantity: 1,
          unit: "cai",
          imageUrl: "/image-2.png",
          fulfillmentType: "STANDARD",
        },
      ],
    });
    cartServiceMock.getCart
      .mockResolvedValueOnce({
        items: [
          { sku: "CUP-HRT-PET-500-CLR", quantity: 2, unitPrice: 25_000 },
          { sku: "CUP-RND-PP-700-WHT", quantity: 1, unitPrice: 30_000 },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          { sku: "CUP-HRT-PET-500-CLR", quantity: 2, unitPrice: 25_000 },
          { sku: "CUP-RND-PP-700-WHT", quantity: 1, unitPrice: 30_000 },
        ],
      });

    await useCartStore.getState().fetchAndSyncCart();

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({
        productRefId: "CUP-HRT-PET-500-CLR",
        selected: false,
      }),
      expect.objectContaining({
        productRefId: "CUP-RND-PP-700-WHT",
        selected: undefined,
      }),
    ]);
  });

  it("removes progressed order skus from local and backend cart", async () => {
    useCartStore.setState({
      items: [
        {
          cartItemId: "standard:CUP-HRT-PET-500-CLR",
          productId: "product-1",
          productRefId: "CUP-HRT-PET-500-CLR",
          slug: "CUP-HRT-PET-500-CLR",
          name: "Ly 500ml",
          price: 25_000,
          quantity: 2,
          unit: "cai",
          imageUrl: "/image.png",
          fulfillmentType: "STANDARD",
        },
        {
          cartItemId: "standard:CUP-RND-PP-700-WHT",
          productId: "product-2",
          productRefId: "CUP-RND-PP-700-WHT",
          slug: "CUP-RND-PP-700-WHT",
          name: "Ly 700ml",
          price: 30_000,
          quantity: 1,
          unit: "cai",
          imageUrl: "/image-2.png",
          fulfillmentType: "STANDARD",
        },
      ],
    });

    await useCartStore.getState().removeItemsBySkus(["CUP-HRT-PET-500-CLR"]);

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({
        productRefId: "CUP-RND-PP-700-WHT",
      }),
    ]);
    expect(cartServiceMock.removeCartItem).toHaveBeenCalledWith("CUP-HRT-PET-500-CLR");
  });
});
