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
    selectedSize?: string;
    selectedMaterial?: string;
    selectedStyle?: string;
    attributes?: Record<string, string>;
  }) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  fetchAndSyncCart: () => Promise<void>;
  restoreItems: (items: CartItem[]) => Promise<void>;
  removeItemsBySkus: (skus: string[]) => Promise<void>;
  toggleSelectItem: (cartItemId: string) => void;
  toggleSelectAll: (selected: boolean) => void;
  clearSelectedItems: () => Promise<void>;
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

function canSyncCartItemToBackend(item: CartItem) {
  return item.fulfillmentType !== "CUSTOM_PRINT" || Boolean(item.designFile);
}

function canSyncProductAddToBackend(product: CatalogProduct) {
  return product.fulfillmentType !== "CUSTOM_PRINT";
}

function isPrintCartItem(item: CartItem) {
  return item.fulfillmentType === "CUSTOM_PRINT" || Boolean(item.designId || item.designFile);
}

function removePrintCartItems(items: CartItem[]) {
  return items.filter((item) => !isPrintCartItem(item));
}

function serializeBackendDesignFile(designFile: DesignFileSnapshot) {
  return JSON.stringify({
    snapshotVersion: designFile.snapshotVersion,
    designId: designFile.designId,
    name: designFile.name,
    fileUrl: designFile.fileUrl,
    thumbnailUrl: designFile.thumbnailUrl || (designFile.previewDataUrl?.startsWith("data:") ? undefined : designFile.previewDataUrl),
    artwork: designFile.artwork,
    exportedAt: designFile.exportedAt,
  });
}

function resolveCartLineKey(item: CartItem) {
  const sku = item.productRefId || item.productId;
  const designKey = item.designId || item.designFile?.designId;
  const isCustomPrint =
    item.fulfillmentType === "CUSTOM_PRINT" || Boolean(designKey || item.designFile);

  if (isCustomPrint) {
    return `custom:${sku}:${designKey || "no-design"}`;
  }

  return `standard:${sku}`;
}

function coalesceCartItems(items: CartItem[]) {
  const mergedByKey = new Map<string, CartItem>();

  items.forEach((item) => {
    const key = resolveCartLineKey(item);
    const existing = mergedByKey.get(key);

    if (!existing) {
      mergedByKey.set(key, item);
      return;
    }

    mergedByKey.set(key, {
      ...existing,
      ...item,
      cartItemId: existing.cartItemId,
      quantity: existing.quantity + item.quantity,
      selected: existing.selected === false && item.selected === false ? false : (item.selected ?? existing.selected),
    });
  });

  return Array.from(mergedByKey.values());
}

function mergeRestoredCartItems(currentItems: CartItem[], restoredItems: CartItem[]) {
  const mergedByKey = new Map<string, CartItem>();

  coalesceCartItems(removePrintCartItems(currentItems)).forEach((item) => {
    mergedByKey.set(resolveCartLineKey(item), item);
  });

  coalesceCartItems(removePrintCartItems(restoredItems)).forEach((item) => {
    const key = resolveCartLineKey(item);
    const existing = mergedByKey.get(key);
    mergedByKey.set(key, {
      ...existing,
      ...item,
      selected: item.selected ?? existing?.selected,
    });
  });

  return ensureUniqueCartItemIds(Array.from(mergedByKey.values()));
}

function findSplitLocalCartLines(localItems: CartItem[], sku: string) {
  const matches = coalesceCartItems(removePrintCartItems(localItems)).filter((item) => {
    const itemSku = item.productRefId || item.productId;
    return itemSku === sku || item.slug === sku || item.cartItemId.includes(sku);
  });

  if (matches.length <= 1) return [];

  const uniqueLineKeys = new Set(matches.map(resolveCartLineKey));
  return uniqueLineKeys.size > 1 ? ensureUniqueCartItemIds(matches) : [];
}

function ensureUniqueCartItemIds(items: CartItem[]) {
  const seen = new Map<string, number>();

  return items.map((item) => {
    const baseId = item.cartItemId || resolveCartLineKey(item);
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);

    if (count === 0) return item;

    return {
      ...item,
      cartItemId: `${baseId}:line-${count}`,
    };
  });
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

function resolveCartStockSnapshot(product: CatalogProduct, options?: AddProductOptions) {
  const variant = resolveCartVariant(product, options);
  return Math.max(0, Number(variant?.availableQty ?? product.stockSnapshot ?? 0));
}

function clampCartQuantity(quantity: number, stockSnapshot?: number) {
  const requested = Math.max(quantity, 1);
  if (stockSnapshot === undefined) return requested;
  const stock = Math.max(0, Number(stockSnapshot) || 0);
  return Math.min(requested, stock);
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
    immer((set, get) => ({
      items: [],

      addProduct: (product, quantity = 1, options) =>
        set((state) => {
          const stockSnapshot = resolveCartStockSnapshot(product, options);
          if (quantity <= 0 || stockSnapshot <= 0) return;

          const cartSku = resolveCartSku(product, options);
          const sizeKey = options?.selectedSize || options?.attributes?.size || "default";
          const cartItemId = `standard:${cartSku}${sizeKey === "default" ? "" : `:${sizeKey}`}`;
          const existing = state.items.find(
            (item) =>
              item.cartItemId === cartItemId &&
              item.fulfillmentType !== "CUSTOM_PRINT",
          );

          if (existing) {
            existing.stockSnapshot = stockSnapshot;
            existing.quantity = clampCartQuantity(existing.quantity + quantity, stockSnapshot);
            if (options?.selectedSize) existing.selectedSize = options.selectedSize;
            if (options?.selectedMaterial) existing.selectedMaterial = options.selectedMaterial;
            if (options?.selectedStyle) existing.selectedStyle = options.selectedStyle;
            if (options?.attributes) existing.attributes = { ...existing.attributes, ...options.attributes };

            if (isLoggedIn() && canSyncProductAddToBackend(product)) {
              updateCartItem(cartSku, existing.quantity).catch((err) => safeWarn("updateCartItem", err));
            }
            return;
          }

          const safeQuantity = clampCartQuantity(quantity, stockSnapshot);

          state.items.push({
            cartItemId,
            productId: product.id,
            productRefId: cartSku,
            name: cleanProductName(product.name, product.productRefId || product.id),
            slug: product.slug,
            price: product.price,
            quantity: safeQuantity,
            stockSnapshot,
            unit: product.unit,
            imageUrl: product.imageUrl,
            fulfillmentType: product.fulfillmentType ?? "STANDARD",
            selectedSize: options?.selectedSize,
            selectedMaterial: options?.selectedMaterial,
            selectedStyle: options?.selectedStyle,
            attributes: options?.attributes,
          });

          if (isLoggedIn() && canSyncProductAddToBackend(product)) {
            addCartItem({ sku: cartSku, quantity: safeQuantity }).catch((err) => safeWarn("addCartItem", err));
          }
        }),

      addCustomPrintItem: async ({
        product,
        quantity,
        designId,
        designFile,
        selectedSize,
        selectedMaterial,
        selectedStyle,
        attributes,
      }) => {
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
            selectedSize: selectedSize || attributes?.capacity || attributes?.size || designFile.artwork?.cup?.size,
            selectedMaterial: selectedMaterial || attributes?.material || designFile.artwork?.cup?.materialType,
            selectedStyle: selectedStyle || attributes?.style || designFile.artwork?.cup?.style,
            attributes,
          });
        });

        if (isLoggedIn()) {
          const sku = product.productRefId || product.id;
          try {
            await addCartItem({
              sku,
              quantity,
              designId,
              designFile: serializeBackendDesignFile(designFile),
            });
          } catch (err) {
            safeWarn("addCustomPrintItem", err);
            throw err;
          }
        }
      },

      updateQuantity: (cartItemId, quantity) =>
        set((state) => {
          const item = state.items.find((i) => i.cartItemId === cartItemId);
          if (!item) return;
          item.quantity = clampCartQuantity(quantity, item.stockSnapshot);

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
        const restoredItems = mergeRestoredCartItems(get().items, removePrintCartItems(newItems));
        set((state) => {
          state.items = ensureUniqueCartItemIds(coalesceCartItems(removePrintCartItems(restoredItems)));
        });
        if (isLoggedIn()) {
          try {
            await clearBackendCart();
            for (const item of restoredItems) {
              if (!canSyncCartItemToBackend(item)) continue;
              const sku = item.productRefId || item.productId;
              await addCartItem({
                sku,
                quantity: item.quantity,
                designId: item.designId,
                designFile: item.designFile ? serializeBackendDesignFile(item.designFile) : undefined,
              });
            }
          } catch (err) {
            safeWarn("restoreItems", err);
          }
        }
      },

      removeItemsBySkus: async (skus) => {
        const skuSet = new Set(skus.filter(Boolean));
        if (skuSet.size === 0) return;

        set((state) => {
          state.items = state.items.filter((item) => {
            const sku = item.productRefId || item.productId;
            return !skuSet.has(sku);
          });
        });

        if (isLoggedIn()) {
          await Promise.all(
            Array.from(skuSet).map((sku) =>
              removeCartItem(sku).catch((err) => safeWarn("removePaidOrderCartItem", err)),
            ),
          );
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

      clearSelectedItems: async () => {
        const selected = get().items.filter((item) => item.selected !== false);

        set((state) => {
          state.items = state.items.filter((item) => item.selected === false);
        });

        if (isLoggedIn() && selected.length > 0) {
          await Promise.all(
            selected.map((item) => {
              const sku = item.productRefId || item.productId;
              return removeCartItem(sku).catch((err) => safeWarn("removeSelectedCartItem", err));
            }),
          );
        }
      },

      fetchAndSyncCart: async () => {
        if (!isLoggedIn()) return;
        try {
          const localItems = removePrintCartItems(useCartStore.getState().items);
          const backendCart = await getCart();
          const invalidCartItemIds = new Set<string>();

          // Upload any local items to server if they are not already in the server cart
          if (localItems.length > 0) {
            for (const item of localItems) {
              if (!canSyncCartItemToBackend(item)) continue;
              const sku = item.productRefId || item.productId;
              const existsOnBackend = backendCart?.items?.some((bi) => bi.sku === sku);
              if (!existsOnBackend) {
                try {
                  await addCartItem({
                    sku,
                    quantity: item.quantity,
                    designId: item.designId,
                    designFile: item.designFile ? serializeBackendDesignFile(item.designFile) : undefined,
                  });
                } catch (err: any) {
                  let syncSuccess = false;
                  // Fallback: If 400 Bad Request because designId wasn't found in DB, try without designId
                  if (err?.response?.status === 400 && item.designId && item.designFile) {
                    try {
                    await addCartItem({
                        sku,
                        quantity: item.quantity,
                        designFile: serializeBackendDesignFile(item.designFile),
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

            const currentLocalItems = removePrintCartItems(useCartStore.getState().items);

            set((state) => {
              state.items = updatedCart.items.flatMap((item, backendIndex) => {
                if (item.isPrintItem || item.designId || item.designFile) {
                  return [];
                }
                const splitLocalLines = findSplitLocalCartLines(currentLocalItems, item.sku);
                if (splitLocalLines.length > 0) {
                  return splitLocalLines;
                }

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
                const skuMatchesLocalItem = (li: CartItem) =>
                  li.productRefId === item.sku ||
                  li.productId === item.sku ||
                  li.slug === item.sku ||
                  li.cartItemId.includes(item.sku);
                const localMatch =
                  currentLocalItems.find(
                    (li) =>
                      skuMatchesLocalItem(li) &&
                      (!isCustom || !item.designId || li.designId === item.designId),
                  ) || currentLocalItems.find(skuMatchesLocalItem);
                const localDesignMatch =
                  currentLocalItems.find(
                    (li) =>
                      skuMatchesLocalItem(li) &&
                      Boolean(li.designFile || li.designId),
                  ) || localMatch;
                const shouldPreserveLocalDesign = Boolean(
                  localDesignMatch?.designFile || localDesignMatch?.designId,
                );

                if (!designFileSnapshot && shouldPreserveLocalDesign) {
                  designFileSnapshot = localDesignMatch?.designFile;
                }

                // 2. Find product in catalogList matching SKU or variant SKU
                const catalogMatch = catalogList.find((p) => {
                  if (p.productRefId === item.sku || p.id === item.sku || p.slug === item.sku) return true;
                  if (Array.isArray(p.variants) && p.variants.some((v: any) => v.sku === item.sku)) return true;
                  return false;
                });
                const catalogVariant = resolveCatalogVariant(catalogMatch, item.sku);
                const resolvedAttributes =
                  localMatch?.attributes ||
                  catalogVariant?.attributes ||
                  undefined;

                // Resolve product name
                let resolvedName =
                  isCustom && designFileSnapshot?.name
                    ? designFileSnapshot.name
                    : localMatch?.name;
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
                  cartItemId: (isCustom || shouldPreserveLocalDesign)
                    ? `custom:${item.sku}:${item.designId || localDesignMatch?.designId || ""}:${backendIndex}`
                    : `standard:${item.sku}:${backendIndex}`,
                  productId: catalogMatch?.id || localMatch?.productId || item.sku,
                  productRefId: item.sku,
                  name: cleanProductName(resolvedName, item.sku),
                  slug: resolvedSlug,
                  price: latestPrice,
                  quantity: item.quantity,
                  unit: resolvedUnit,
                  imageUrl: resolvedImage,
                  fulfillmentType: (isCustom || shouldPreserveLocalDesign) ? "CUSTOM_PRINT" : (catalogMatch?.fulfillmentType || localMatch?.fulfillmentType || "STANDARD"),
                  designId: item.designId ?? localDesignMatch?.designId ?? undefined,
                  designFile: designFileSnapshot,
                  selectedSize: localMatch?.selectedSize || resolvedAttributes?.capacity || resolvedAttributes?.size || designFileSnapshot?.artwork?.cup?.size,
                  selectedMaterial: localMatch?.selectedMaterial || resolvedAttributes?.material || designFileSnapshot?.artwork?.cup?.materialType,
                  selectedStyle: localMatch?.selectedStyle || resolvedAttributes?.style || designFileSnapshot?.artwork?.cup?.style,
                  attributes: resolvedAttributes,
                  selected: localMatch?.selected,
                } satisfies CartItem;
              });
              state.items = ensureUniqueCartItemIds(coalesceCartItems(removePrintCartItems(state.items)));
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
          state.items = ensureUniqueCartItemIds(coalesceCartItems(removePrintCartItems(state.items)));
          state.items.forEach((item) => {
            item.name = cleanProductName(item.name, item.productRefId || item.productId);
          });
        }
      },
    },
  ),
);
