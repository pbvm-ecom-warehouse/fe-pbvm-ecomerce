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

type AddProductOptions = {
  selectedSize?: string;
  selectedMaterial?: string;
  selectedStyle?: string;
  attributes?: Record<string, string>;
};

type CartState = {
  items: CartItem[];
  addProduct: (
    product: CatalogProduct,
    quantity?: number,
    options?: AddProductOptions,
  ) => void;
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

function safeWarn(action: string, error: any) {
  const data = error?.response?.data;
  const msg = data?.message || data?.error || error?.message || String(error);
  console.warn(`[CartStore] ${action} failed:`, msg);
}

export const useCartStore = create<CartState>()(
  persist(
    immer((set) => ({
      items: [],

      addProduct: (product, quantity = 1, options) =>
        set((state) => {
          if (quantity <= 0 || product.stockSnapshot <= 0) return;

          const sizeKey = options?.selectedSize || options?.attributes?.size || "default";
          const cartItemId = `standard:${product.id}:${sizeKey}`;
          const existing = state.items.find(
            (item) =>
              item.cartItemId === cartItemId &&
              item.fulfillmentType !== "CUSTOM_PRINT",
          );

          if (existing) {
            existing.quantity += quantity;
            if (options?.selectedSize) existing.selectedSize = options.selectedSize;
            if (options?.selectedMaterial) existing.selectedMaterial = options.selectedMaterial;
            if (options?.selectedStyle) existing.selectedStyle = options.selectedStyle;
            if (options?.attributes) existing.attributes = { ...existing.attributes, ...options.attributes };

            if (isLoggedIn()) {
              const sku = product.productRefId || product.id;
              updateCartItem(sku, existing.quantity).catch((err) => safeWarn("updateCartItem", err));
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
            selectedSize: options?.selectedSize,
            selectedMaterial: options?.selectedMaterial,
            selectedStyle: options?.selectedStyle,
            attributes: options?.attributes,
          });

          if (isLoggedIn()) {
            const sku = product.productRefId || product.id;
            addCartItem({ sku, quantity }).catch((err) => safeWarn("addCartItem", err));
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
            selectedSize: designFile.artwork?.cup?.size,
            selectedMaterial: designFile.artwork?.cup?.materialType,
            selectedStyle: designFile.artwork?.cup?.style,
          });

          if (isLoggedIn()) {
            const sku = product.productRefId || product.id;
            addCartItem({
              sku,
              quantity,
              designId,
              designFile: JSON.stringify(designFile),
            }).catch((err) => safeWarn("addCustomPrintItem", err));
          }
        }),

      updateQuantity: (cartItemId, quantity) =>
        set((state) => {
          const item = state.items.find((i) => i.cartItemId === cartItemId);
          if (!item) return;
          item.quantity = Math.max(quantity, 1);

          if (isLoggedIn()) {
            const sku = item.productRefId || item.productId;
            updateCartItem(sku, item.quantity).catch((err) => safeWarn("updateQuantity", err));
          }
        }),

      removeItem: (cartItemId) =>
        set((state) => {
          const item = state.items.find((i) => i.cartItemId === cartItemId);
          state.items = state.items.filter((i) => i.cartItemId !== cartItemId);

          if (isLoggedIn() && item) {
            const sku = item.productRefId || item.productId;
            removeCartItem(sku).catch((err) => safeWarn("removeItem", err));
          }
        }),

      clearCart: () =>
        set((state) => {
          state.items = [];
          if (isLoggedIn()) {
            clearBackendCart().catch((err) => safeWarn("clearBackendCart", err));
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
            safeWarn("restoreItems", err);
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
              removeCartItem(sku).catch((err) => safeWarn("removeSelectedCartItem", err));
            }
          }
        }),

      fetchAndSyncCart: async () => {
        if (!isLoggedIn()) return;
        try {
          const localItems = useCartStore.getState().items;
          const backendCart = await getCart();
          const invalidCartItemIds = new Set<string>();

          // Upload any local items to server if they are not already in the server cart
          if (localItems.length > 0) {
            for (const item of localItems) {
              const sku = item.productRefId || item.productId;
              const existsOnBackend = backendCart?.items?.some((bi) => bi.sku === sku);
              if (!existsOnBackend) {
                try {
                  await addCartItem({
                    sku,
                    quantity: item.quantity,
                    designId: item.designId,
                    designFile: item.designFile ? JSON.stringify(item.designFile) : undefined,
                  });
                } catch (err: any) {
                  let syncSuccess = false;
                  // Fallback: If 400 Bad Request because designId wasn't found in DB, try without designId
                  if (err?.response?.status === 400 && item.designId && item.designFile) {
                    try {
                      await addCartItem({
                        sku,
                        quantity: item.quantity,
                        designFile: JSON.stringify(item.designFile),
                      });
                      syncSuccess = true;
                    } catch (fallbackErr: any) {
                      safeWarn(`syncItem (${sku})`, fallbackErr);
                    }
                  }

                  if (!syncSuccess) {
                    safeWarn(`syncItem (${sku})`, err);
                    const status = err?.response?.status;
                    const errCode = err?.response?.data?.code;
                    // If variant does not exist on backend (CART_VARIANT_NOT_AVAILABLE or 400/404), mark item to be auto-removed from cart
                    if (status === 400 || status === 404 || errCode === "CART_VARIANT_NOT_AVAILABLE") {
                      invalidCartItemIds.add(item.cartItemId);
                    }
                  }
                }
              }
            }
          }

          // Automatically purge invalid/non-existent items from local cart state
          if (invalidCartItemIds.size > 0) {
            set((state) => {
              state.items = state.items.filter((i) => !invalidCartItemIds.has(i.cartItemId));
            });
          }

          const updatedCart = await getCart();
          if (!updatedCart?.items) return;

          if (updatedCart.items.length > 0) {
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
          }
        } catch (error) {
          safeWarn("fetchAndSyncCart", error);
        }
      },
    })),
    { name: "pbvm-shop-cart" },
  ),
);
