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
  restoreItems: (items: CartItem[]) => Promise<void>;
  toggleSelectItem: (cartItemId: string) => void;
  toggleSelectAll: (selected: boolean) => void;
  clearSelectedItems: () => void;
};

function isLoggedIn() {
  const user = useAuthStore.getState().user;
  return Boolean(user && user.type !== "admin");
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
              designFile: JSON.stringify(designFile),
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

      restoreItems: async (newItems) => {
        set((state) => {
          state.items = newItems;
        });
        if (isLoggedIn()) {
          try {
            await clearBackendCart();
            for (const item of newItems) {
              const sku = item.productRefId || item.productId;
              await addCartItem({
                sku,
                quantity: item.quantity,
                designId: item.designId,
                designFile: item.designFile ? JSON.stringify(item.designFile) : undefined,
              });
            }
          } catch (err) {
            console.error("Failed to restore backend cart:", err);
          }
        }
      },

      toggleSelectItem: (cartItemId) =>
        set((state) => {
          const item = state.items.find((i) => i.cartItemId === cartItemId);
          if (item) {
            item.selected = item.selected === false ? true : false;
          }
        }),

      toggleSelectAll: (selected) =>
        set((state) => {
          state.items.forEach((item) => {
            item.selected = selected;
          });
        }),

      clearSelectedItems: () =>
        set((state) => {
          const unselected = state.items.filter((i) => i.selected === false);
          const selected = state.items.filter((i) => i.selected !== false);
          state.items = unselected;
          if (isLoggedIn() && selected.length > 0) {
            for (const item of selected) {
              const sku = item.productRefId || item.productId;
              removeCartItem(sku).catch(console.error);
            }
          }
        }),

      fetchAndSyncCart: async () => {
        if (!isLoggedIn()) return;
        try {
          const localItems = useCartStore.getState().items;
          const backendCart = await getCart();

          // Upload any local items to server if they are not already in the server cart
          if (localItems.length > 0) {
            for (const item of localItems) {
              const sku = item.productRefId || item.productId;
              const existsOnBackend = backendCart?.items?.some((bi) => bi.sku === sku);
              if (!existsOnBackend) {
                await addCartItem({
                  sku,
                  quantity: item.quantity,
                  designId: item.designId,
                  designFile: item.designFile ? JSON.stringify(item.designFile) : undefined,
                }).catch(console.error);
              }
            }
          }

          const updatedCart = await getCart();
          if (!updatedCart?.items?.length) return;

          set((state) => {
            state.items = updatedCart.items.map((item) => {
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
