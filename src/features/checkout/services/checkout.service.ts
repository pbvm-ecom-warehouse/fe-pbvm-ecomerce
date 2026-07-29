import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import type { CartItem } from "@/types/api";

import type { CheckoutInput } from "../schemas/checkout.schema";

export type CreateOrderPayload = CheckoutInput & {
  addressId?: string;
  items: Array<{
    productId: string;
    productRefId?: string;
    quantity: number;
    fulfillmentType: CartItem["fulfillmentType"];
    designId?: string;
    designFile?: CartItem["designFile"] | string;
  }>;
  directItem?: {
    sku: string;
    quantity: number;
    designId?: string;
    designFile?: CartItem["designFile"] | string;
  };
  promotionCode?: string;
};

export type AddressResponse = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
};

export async function getAddresses(): Promise<AddressResponse[]> {
  const response = await apiClient.get<ApiEnvelope<AddressResponse[]> | AddressResponse[]>(
    "/auth/addresses",
  );
  return unwrapApiData(response.data);
}

export async function addAddress(address: {
  label: string;
  recipientName: string;
  phone: string;
  line: string;
  ward: string;
  district: string;
  province: string;
  isDefault?: boolean;
}): Promise<AddressResponse[]> {
  const response = await apiClient.post<ApiEnvelope<AddressResponse[]> | AddressResponse[]>(
    "/auth/addresses",
    address,
  );
  return unwrapApiData(response.data);
}

export async function deleteAddress(id: string): Promise<AddressResponse[]> {
  const response = await apiClient.delete<ApiEnvelope<AddressResponse[]> | AddressResponse[]>(
    `/auth/addresses/${id}`,
  );
  return unwrapApiData(response.data);
}

export async function setDefaultAddress(id: string): Promise<AddressResponse[]> {
  const response = await apiClient.post<ApiEnvelope<AddressResponse[]> | AddressResponse[]>(
    `/auth/addresses/${id}/default`,
  );
  return unwrapApiData(response.data);
}

export async function updateAddress(
  id: string,
  address: Partial<{
    label: string;
    recipientName: string;
    phone: string;
    line: string;
    ward: string;
    district: string;
    province: string;
    isDefault?: boolean;
  }>
): Promise<AddressResponse[]> {
  const response = await apiClient.patch<ApiEnvelope<AddressResponse[]> | AddressResponse[]>(
    `/auth/addresses/${id}`,
    address,
  );
  return unwrapApiData(response.data);
}

export function mapCartItemsToCheckoutItems(items: CartItem[]) {
  return items.map((item) => ({
    productId: item.productId,
    productRefId: item.productRefId,
    quantity: item.quantity,
    fulfillmentType: item.fulfillmentType,
    designId: item.designId,
    designFile: normalizeCheckoutDesignFile(item),
  }));
}

function normalizeCheckoutDesignFile(item: {
  fulfillmentType: CartItem["fulfillmentType"];
  designId?: string;
  designFile?: CartItem["designFile"] | string;
}) {
  if (item.fulfillmentType !== "CUSTOM_PRINT") return undefined;
  if (!item.designId || !item.designFile) {
    throw new Error("Custom print items require a saved design before checkout.");
  }
  return serializeBackendDesignFile(item.designFile);
}

function assertCustomPrintItemsHaveSavedDesigns(items: CreateOrderPayload["items"]) {
  items.forEach((item) => normalizeCheckoutDesignFile(item));
}

function normalizeDirectCheckoutItem(item: CreateOrderPayload["directItem"]) {
  if (!item) return undefined;
  if (!item.sku) {
    throw new Error("Direct checkout item is missing a valid SKU.");
  }
  if (!item.designId || !item.designFile) {
    throw new Error("Custom print items require a saved design before checkout.");
  }

  return {
    sku: item.sku,
    quantity: item.quantity,
    designId: item.designId,
    designFile: serializeBackendDesignFile(item.designFile),
  };
}

function serializeBackendDesignFile(designFile: NonNullable<CreateOrderPayload["items"][number]["designFile"]>) {
  if (typeof designFile === "string") {
    return stripInlinePreviewFromSerializedDesign(designFile);
  }

  return JSON.stringify({
    snapshotVersion: designFile.snapshotVersion,
    designId: designFile.designId,
    name: designFile.name,
    fileUrl: designFile.fileUrl,
    thumbnailUrl: designFile.thumbnailUrl || designFile.previewDataUrl,
    artwork: designFile.artwork,
    exportedAt: designFile.exportedAt,
  });
}

function stripInlinePreviewFromSerializedDesign(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && typeof parsed.previewDataUrl === "string") {
      const { previewDataUrl, ...rest } = parsed;
      return JSON.stringify({
        ...rest,
        thumbnailUrl:
          typeof parsed.thumbnailUrl === "string"
            ? parsed.thumbnailUrl
            : previewDataUrl.startsWith("data:")
              ? undefined
              : previewDataUrl,
      });
    }
  } catch {
    // Plain URL or storage key, keep it as-is.
  }

  return value;
}

type BackendCartItemSnapshot = {
  sku?: string;
  quantity?: number;
  designId?: string | null;
  designFile?: string | null;
};

async function restoreBackendCartItems(items: BackendCartItemSnapshot[]) {
  for (const item of items) {
    if (!item.sku || !item.quantity) continue;
    await apiClient.post("/cart/items", {
      sku: item.sku,
      quantity: item.quantity,
      designId: item.designId ?? undefined,
      designFile: item.designFile ?? undefined,
    });
  }
}

async function syncSelectedItemsToBackendCart(items: CreateOrderPayload["items"]) {
  if (items.length === 0) {
    throw new Error("Cart is empty. Please add products before checkout.");
  }

  const backendCartResponse = await apiClient.get<any>("/cart");
  const backendCartPayload = unwrapApiData(backendCartResponse.data) as any;
  const backendCart = (backendCartPayload?.data ?? backendCartPayload) as {
    items?: Array<{ sku?: string; quantity?: number; designId?: string | null; designFile?: string | null }>;
  } | null;
  const backendItems = Array.isArray(backendCart?.items) ? backendCart.items : [];
  const selectedSkus = new Set(items.map((item) => item.productRefId || item.productId).filter(Boolean));
  const temporarilyRemovedItems: BackendCartItemSnapshot[] = [];

  try {
    for (const backendItem of backendItems) {
      if (backendItem.sku && !selectedSkus.has(backendItem.sku)) {
        temporarilyRemovedItems.push({ ...backendItem });
        await apiClient.delete(`/cart/items/${encodeURIComponent(backendItem.sku)}`);
      }
    }

    for (const item of items) {
      const sku = item.productRefId || item.productId;
      if (!sku) {
        throw new Error("Custom print item is missing a valid SKU. Please reselect the cup blank and save the design again.");
      }

      const existingBackendItem = backendItems.find((backendItem) => backendItem.sku === sku);
      if (existingBackendItem && existingBackendItem.quantity === item.quantity) {
        continue;
      }
      if (existingBackendItem && item.fulfillmentType !== "CUSTOM_PRINT") {
        await apiClient.put(`/cart/items/${encodeURIComponent(sku)}`, { quantity: item.quantity });
        continue;
      }
      if (existingBackendItem && item.fulfillmentType === "CUSTOM_PRINT") {
        continue;
      }

      const designFile = normalizeCheckoutDesignFile(item);
      const cartItemPayload = {
        sku,
        quantity: item.quantity,
        designId: item.designId,
        designFile,
      };

      try {
        await apiClient.post("/cart/items", cartItemPayload);
      } catch (error) {
        if (item.fulfillmentType !== "CUSTOM_PRINT" || !item.designId || !designFile) {
          throw enrichCartSyncError(error, { sku, quantity: item.quantity, hasDesignFile: Boolean(designFile) });
        }

        try {
          await apiClient.post("/cart/items", {
            sku,
            quantity: item.quantity,
            designFile,
          });
        } catch (fallbackError) {
          throw enrichCartSyncError(fallbackError, { sku, quantity: item.quantity, hasDesignFile: true });
        }
      }
    }

    return temporarilyRemovedItems;
  } catch (error) {
    await restoreBackendCartItems(temporarilyRemovedItems);
    throw error;
  }
}

function enrichCartSyncError(
  error: unknown,
  context: { sku: string; quantity: number; hasDesignFile: boolean },
) {
  const axiosError = error as {
    response?: { status?: number; data?: any };
    message?: string;
  };
  const responseData = axiosError.response?.data;
  const backendMessage =
    responseData?.message ||
    responseData?.error ||
    responseData?.code ||
    axiosError.message ||
    "Unknown cart sync error";

  console.error("[Checkout] Backend cart sync failed", {
    status: axiosError.response?.status,
    backendMessage,
    sku: context.sku,
    quantity: context.quantity,
    hasDesignFile: context.hasDesignFile,
  });

  return new Error(`Cannot sync cart item ${context.sku}: ${backendMessage}`);
}

export async function createOrder(payload: CreateOrderPayload) {
  type CreateOrderResponse = {
    id?: string;
    code?: string;
    orderId: string;
    paymentUrl?: string;
    offline?: boolean;
  };

  let temporarilyRemovedItems: BackendCartItemSnapshot[] = [];
  let restoredTemporaryItems = false;

  try {
    const directItem = normalizeDirectCheckoutItem(payload.directItem);
    assertCustomPrintItemsHaveSavedDesigns(payload.items);

    if (!directItem) {
      temporarilyRemovedItems = await syncSelectedItemsToBackendCart(payload.items);
    }

    const addressId = payload.addressId || "";

    if (!addressId) {
      throw new Error("Missing delivery address. Please choose or save an address before checkout.");
    }

    // 2. Call backend orders checkout
    // Map paymentProvider to paymentMethod (ONLINE or COD)
    const paymentMethod =
      payload.paymentProvider === "COD" ? "COD" : "ONLINE";

    const checkoutResponse = await apiClient.post<any>(
      "/orders/checkout",
      directItem
        ? {
            addressId,
            paymentMethod,
            directItem,
          }
        : {
            addressId,
            paymentMethod,
          },
    );

    const checkoutPayload = unwrapApiData(checkoutResponse.data) as any;
    const orderData = checkoutPayload?.data ?? checkoutPayload;
    const orderId = orderData.id || orderData._id;

    await restoreBackendCartItems(temporarilyRemovedItems);
    restoredTemporaryItems = true;

    // 3. Generate PayOS URL for the next payment stage.
    // Multi-stage COD orders still require an online deposit/progress payment.
    let paymentUrl: string | undefined = undefined;
    try {
      const payUrlRes = await apiClient.get<any>(
        `/payment/payos/create-url/${orderId}`,
      );
      const payUrlPayload = unwrapApiData(payUrlRes.data) as any;
      const payUrlData = payUrlPayload?.data ?? payUrlPayload;
      paymentUrl = payUrlData.payUrl;
    } catch (payErr) {
      console.error("Failed to create PayOS URL:", payErr);
      throw payErr;
    }

    return {
      id: orderId,
      code: orderData.code,
      orderId: orderData.code || orderId,
      paymentUrl,
      offline: false,
    };
  } catch (error) {
    if (!restoredTemporaryItems) {
      try {
        await restoreBackendCartItems(temporarilyRemovedItems);
      } catch (restoreError) {
        console.error("Restore temporary cart items failed:", restoreError);
      }
    }
    console.error("Create order failed:", error);
    throw error;
  }
}

