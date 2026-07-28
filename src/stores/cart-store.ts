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
import { listCatalogProducts, cleanProductName } from "@/features/catalog/services/catalog.service";
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

function resolveCartVariant(product: CatalogProduct, options?: AddProductOptions) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) return null;

  const optionSize = options?.selectedSize || options?.attributes?.size || options?.attributes?.capacity;
  const matchingVariant = optionSize
    ? variants.find((variant) => {
        const attrs = variant.attributes || {};
        return (
          attrs.size === optionSize ||
          attrs.capacity === optionSize ||
          variant.sku === product.productRefId
        );
      })
    : null;

  return (
    matchingVariant ||
    variants.find((variant) => variant.isActive !== false && (variant.availableQty ?? 0) > 0) ||
    variants.find((variant) => variant.isActive !== false) ||
    variants[0] ||
    null
  );
}

function resolveCartSku(product: CatalogProduct, options?: AddProductOptions) {
  return resolveCartVariant(product, options)?.sku || product.productRefId || product.id;
}

function resolveCatalogVariant(product: CatalogProduct | undefined, sku: string) {
  if (!product || !Array.isArray(product.variants)) return null;
  return product.variants.find((variant) => variant.sku === sku) || null;
}

function resolveLatestCartPrice(input: {
  sku: string;
  backendUnitPrice: number;
  catalogProduct?: CatalogProduct;
  localItem?: CartItem;
}) {
  const catalogVariant = resolveCatalogVariant(input.catalogProduct, input.sku);
  const latestPrice =
    catalogVariant?.price ??
    input.catalogProduct?.b2bPrice ??
    input.catalogProduct?.price ??
    input.backendUnitPrice ??
    input.localItem?.price;

  return Number(latestPrice) || 0;
}

export const useCartStore = create<CartState>()(
  persist(
    immer((set) => ({
      items: [],

      addProduct: (product, quantity = 1, options) =>
        set((state) => {
          if (quantity <= 0 || product.stockSnapshot <= 0) return;

          const cartSku = resolveCartSku(product, options);
          const sizeKey = options?.selectedSize || options?.attributes?.size || "default";
          const cartItemId = `standard:${cartSku}${sizeKey === "default" ? "" : `:${sizeKey}`}`;
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
              updateCartItem(cartSku, existing.quantity).catch((err) => safeWarn("updateCartItem", err));
            }
            return;
          }

          state.items.push({
            cartItemId,
            productId: product.id,
            productRefId: cartSku,
            name: cleanProductName(product.name, product.productRefId || product.id),
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
            addCartItem({ sku: cartSku, quantity }).catch((err) => safeWarn("addCartItem", err));
          }
        }),

      addCustomPrintItem: ({ product, quantity, designId, designFile }) =>
        set((state) => {
          const cartItemId = `custom:${product.id}:${designId}:${Date.now()}`;
          state.items.push({
            cartItemId,
            productId: product.id,
            productRefId: product.productRefId,
            name: cleanProductName(product.name, product.productRefId || product.id),
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
            let catalogList: CatalogProduct[] = [];
            try {
              const catRes = await listCatalogProducts();
              catalogList = catRes?.data || [];
            } catch {
              catalogList = [];
            }

            const currentLocalItems = useCartStore.getState().items;

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

                // 1. Find existing item in current local items
                const localMatch = currentLocalItems.find(
                  (li) => li.productRefId === item.sku || li.productId === item.sku || li.slug === item.sku || li.cartItemId.includes(item.sku)
                );

                // 2. Find product in catalogList matching SKU or variant SKU
                const catalogMatch = catalogList.find((p) => {
                  if (p.productRefId === item.sku || p.id === item.sku || p.slug === item.sku) return true;
                  if (Array.isArray(p.variants) && p.variants.some((v: any) => v.sku === item.sku)) return true;
                  return false;
                });

                // Resolve product name
                let resolvedName = localMatch?.name;
                if (!resolvedName || resolvedName === item.sku) {
                  resolvedName = catalogMatch?.name || (item as any).name;
                }
                if (!resolvedName || resolvedName === item.sku) {
                  if (designFileSnapshot?.artwork?.cup?.size) {
                    resolvedName = `Ly In Custom ${designFileSnapshot.artwork.cup.size}`;
                  } else if (item.sku.includes("CUP") || item.sku.includes("HRT") || item.sku.includes("LY")) {
                    const sizeMatch = item.sku.match(/(\d{3,4})/);
                    const size = sizeMatch ? `${sizeMatch[1]}ml` : "";
                    resolvedName = `Ly Nhựa Nắp Tim ${size}`.trim();
                  } else {
                    resolvedName = item.sku;
                  }
                }

                const latestPrice = resolveLatestCartPrice({
                  sku: item.sku,
                  backendUnitPrice: item.unitPrice,
                  catalogProduct: catalogMatch,
                  localItem: localMatch,
                });
                const resolvedSlug = catalogMatch?.slug || localMatch?.slug || item.sku;
                const resolvedImage = designFileSnapshot?.previewDataUrl || localMatch?.imageUrl || catalogMatch?.imageUrl || "/images/product-placeholder.svg";
                const resolvedUnit = localMatch?.unit || catalogMatch?.unit || "cái";

                return {
                  cartItemId: isCustom
                    ? `custom:${item.sku}:${item.designId || ""}:${Date.now()}`
                    : `standard:${item.sku}`,
                  productId: catalogMatch?.id || localMatch?.productId || item.sku,
                  productRefId: item.sku,
                  name: cleanProductName(resolvedName, item.sku),
                  slug: resolvedSlug,
                  price: latestPrice,
                  quantity: item.quantity,
                  unit: resolvedUnit,
                  imageUrl: resolvedImage,
                  fulfillmentType: isCustom ? "CUSTOM_PRINT" : (catalogMatch?.fulfillmentType || localMatch?.fulfillmentType || "STANDARD"),
                  designId: item.designId ?? undefined,
                  designFile: designFileSnapshot,
                  selectedSize: localMatch?.selectedSize || designFileSnapshot?.artwork?.cup?.size,
                  selectedMaterial: localMatch?.selectedMaterial || designFileSnapshot?.artwork?.cup?.materialType,
                  selectedStyle: localMatch?.selectedStyle || designFileSnapshot?.artwork?.cup?.style,
                } satisfies CartItem;
              });
            });
          }
        } catch (error) {
          safeWarn("fetchAndSyncCart", error);
        }
      },
    })),
    {
      name: "pbvm-shop-cart",
      onRehydrateStorage: () => (state) => {
        if (state?.items && Array.isArray(state.items)) {
          state.items.forEach((item) => {
            item.name = cleanProductName(item.name, item.productRefId || item.productId);
          });
        }
      },
    },
  ),
);
