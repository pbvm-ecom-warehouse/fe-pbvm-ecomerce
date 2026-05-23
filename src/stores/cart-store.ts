import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

import type { CartItem, CatalogProduct } from "@/types/api";

type CartState = {
  items: CartItem[];
  addProduct: (product: CatalogProduct, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    immer((set) => ({
      items: [],
      addProduct: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === product.id,
          );

          if (existing) {
            existing.quantity += quantity;
            return;
          }

          state.items.push({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            quantity,
            unit: product.unit,
            imageUrl: product.imageUrl,
          });
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          const item = state.items.find(
            (cartItem) => cartItem.productId === productId,
          );

          if (!item) {
            return;
          }

          item.quantity = Math.max(quantity, 1);
        }),
      removeItem: (productId) =>
        set((state) => {
          state.items = state.items.filter(
            (item) => item.productId !== productId,
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
