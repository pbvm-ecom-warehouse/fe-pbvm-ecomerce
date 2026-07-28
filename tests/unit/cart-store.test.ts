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
import type { CatalogProduct } from "@/types/api";

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
});
