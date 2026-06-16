import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

import type { CartItem, CatalogProduct } from "@/types/api";

type AddProductOptions = {
  cartItemId?: string;
  isPrintItem?: boolean;
  designId?: string;
  designFile?: CartItem["designFile"];
};

type CartState = {
  items: CartItem[];
  addProduct: (
    product: CatalogProduct,
    quantity?: number,
    options?: AddProductOptions,
  ) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    immer((set) => ({
      items: [],
      addProduct: (product, quantity = 1, options = {}) =>
        set((state) => {
          const cartItemId =
            options.cartItemId ??
            (options.designId ? `${product.id}:${options.designId}` : product.id);
          const existing = state.items.find(
            (item) => (item.cartItemId ?? item.productId) === cartItemId,
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
            fulfillmentType: product.fulfillmentType,
            isPrintItem:
              options.isPrintItem ?? product.fulfillmentType === "CUSTOM_PRINT",
            designId: options.designId,
            designFile: options.designFile,
          });
        }),
      updateQuantity: (cartItemId, quantity) =>
        set((state) => {
          const item = state.items.find(
            (cartItem) =>
              (cartItem.cartItemId ?? cartItem.productId) === cartItemId,
          );

          if (!item) {
            return;
          }

          item.quantity = Math.max(quantity, 1);
        }),
      removeItem: (cartItemId) =>
        set((state) => {
          state.items = state.items.filter(
            (item) => (item.cartItemId ?? item.productId) !== cartItemId,
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
