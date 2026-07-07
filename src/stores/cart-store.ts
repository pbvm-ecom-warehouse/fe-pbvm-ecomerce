import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

import type { CartItem, CatalogProduct, DesignFileSnapshot } from "@/types/api";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearBackendCart,
} from "@/features/cart/services/cart.service";
import { useAuthStore } from "@/stores/auth-store";

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
  fetchAndSyncCart: () => Promise<void>;
};

function isLoggedIn() {
  return Boolean(useAuthStore.getState().user);
}

export const useCartStore = create<CartState>()(
  persist(
    immer((set) => ({
      items: [],

      addProduct: (product, quantity = 1) =>
        set((state) => {
          const cartItemId = `standard:${product.id}`;
          const existing = state.items.find(
            (item) =>
              item.cartItemId === cartItemId &&
              item.fulfillmentType !== "CUSTOM_PRINT",
          );

          if (existing) {
            existing.quantity += quantity;
            if (isLoggedIn()) {
              const sku = product.productRefId || product.id;
              updateCartItem(sku, existing.quantity).catch(console.error);
            }
            return;
          }

          state.items.push({
            cartItemId,
            productId: product.id,
            productRefId: product.productRefId,
            name: product.name,
            slug: product.slug,
            price: product.price,
            quantity,
            unit: product.unit,
            imageUrl: product.imageUrl,
            fulfillmentType: product.fulfillmentType ?? "STANDARD",
          });

          if (isLoggedIn()) {
            const sku = product.productRefId || product.id;
            addCartItem({ sku, quantity }).catch(console.error);
          }
        }),

      addCustomPrintItem: ({ product, quantity, designId, designFile }) =>
        set((state) => {
          const cartItemId = `custom:${product.id}:${designId}:${Date.now()}`;
          state.items.push({
            cartItemId,
            productId: product.id,
            productRefId: product.productRefId,
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

          if (isLoggedIn()) {
            const sku = product.productRefId || product.id;
            addCartItem({
              sku,
              quantity,
              designId,
            }).catch(console.error);
          }
        }),

      updateQuantity: (cartItemId, quantity) =>
        set((state) => {
          const item = state.items.find((i) => i.cartItemId === cartItemId);
          if (!item) return;
          item.quantity = Math.max(quantity, 1);

          if (isLoggedIn()) {
            const sku = item.productRefId || item.productId;
            updateCartItem(sku, item.quantity).catch(console.error);
          }
        }),

      removeItem: (cartItemId) =>
        set((state) => {
          const item = state.items.find((i) => i.cartItemId === cartItemId);
          state.items = state.items.filter((i) => i.cartItemId !== cartItemId);

          if (isLoggedIn() && item) {
            const sku = item.productRefId || item.productId;
            removeCartItem(sku).catch(console.error);
          }
        }),

      clearCart: () =>
        set((state) => {
          state.items = [];
          if (isLoggedIn()) {
            clearBackendCart().catch(console.error);
          }
        }),

      fetchAndSyncCart: async () => {
        if (!isLoggedIn()) return;
        try {
          const backendCart = await getCart();
          if (!backendCart?.items?.length) return;

          set((state) => {
            state.items = backendCart.items.map((item) => {
              const isCustom = item.isPrintItem;
              let designFileSnapshot: DesignFileSnapshot | undefined = undefined;
              if (item.designFile) {
                try {
                  designFileSnapshot = JSON.parse(item.designFile);
                } catch {
                  // not JSON
                }
              }

              return {
                cartItemId: isCustom
                  ? `custom:${item.sku}:${item.designId || ""}:${Date.now()}`
                  : `standard:${item.sku}`,
                productId: item.sku,
                productRefId: item.sku,
                name: item.sku,
                slug: item.sku,
                price: item.unitPrice,
                quantity: item.quantity,
                unit: "cái",
                imageUrl: designFileSnapshot?.previewDataUrl || "/images/product-placeholder.svg",
                fulfillmentType: isCustom ? "CUSTOM_PRINT" : "STANDARD",
                designId: item.designId ?? undefined,
                designFile: designFileSnapshot,
              } satisfies CartItem;
            });
          });
        } catch (error) {
          console.error("fetchAndSyncCart: failed to sync with backend:", error);
        }
      },
    })),
    { name: "pbvm-shop-cart" },
  ),
);
