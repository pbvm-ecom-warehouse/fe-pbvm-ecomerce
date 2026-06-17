import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

import type { CartItem, CatalogProduct, DesignFileSnapshot } from "@/types/api";

type CartState = {
  items: CartItem[];
  addProduct: (product: CatalogProduct, quantity?: number) => void;
  addCustomPrintItem: (input: {
    product: CatalogProduct;
    quantity: number;
    designId: string;
    designFile: DesignFileSnapshot;
  }) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
};

function createStandardCartItemId(productId: string) {
  return `standard:${productId}`;
}

function createCustomCartItemId(productId: string, designId: string) {
  return `custom:${productId}:${designId}:${Date.now()}`;
}

export const useCartStore = create<CartState>()(
  persist(
    immer((set) => ({
      items: [],
      addProduct: (product, quantity = 1) =>
        set((state) => {
          const cartItemId = createStandardCartItemId(product.id);
          const existing = state.items.find(
            (item) =>
              item.cartItemId === cartItemId &&
              item.fulfillmentType !== "CUSTOM_PRINT",
          );

          if (existing) {
            existing.quantity += quantity;
            return;
          }

          state.items.push({
            cartItemId,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            quantity,
            unit: product.unit,
            imageUrl: product.imageUrl,
            fulfillmentType: product.fulfillmentType ?? "STANDARD",
          });
        }),
      addCustomPrintItem: ({ product, quantity, designId, designFile }) =>
        set((state) => {
          state.items.push({
            cartItemId: createCustomCartItemId(product.id, designId),
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            quantity,
            unit: product.unit,
            imageUrl: designFile.previewDataUrl || product.imageUrl,
            fulfillmentType: "CUSTOM_PRINT",
            designId,
            designFile,
          });
        }),
      updateQuantity: (cartItemId, quantity) =>
        set((state) => {
          const item = state.items.find(
            (cartItem) => cartItem.cartItemId === cartItemId,
          );

          if (!item) {
            return;
          }

          item.quantity = Math.max(quantity, 1);
        }),
      removeItem: (cartItemId) =>
        set((state) => {
          state.items = state.items.filter(
            (item) => item.cartItemId !== cartItemId,
          );
        }),
      clearCart: () =>
        set((state) => {
          state.items = [];
        }),
    })),
    {
      name: "pbvm-shop-cart",
    },
  ),
);
