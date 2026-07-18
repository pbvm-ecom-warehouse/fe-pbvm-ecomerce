import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import type { CartItem } from "@/types/api";
import { useCartStore } from "@/stores/cart-store";

import type { CheckoutInput } from "../schemas/checkout.schema";

export type CreateOrderPayload = CheckoutInput & {
  items: Array<{
    productId: string;
    quantity: number;
    fulfillmentType: CartItem["fulfillmentType"];
    designId?: string;
    designFile?: CartItem["designFile"];
  }>;
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
    quantity: item.quantity,
    fulfillmentType: item.fulfillmentType,
    designId: item.designId,
    designFile: item.designFile,
  }));
}

export async function createOrder(payload: CreateOrderPayload) {
  type CreateOrderResponse = {
    orderId: string;
    paymentUrl?: string;
    offline?: boolean;
  };

  try {
    // Ensure the cart is synchronized to the server
    try {
      await useCartStore.getState().fetchAndSyncCart();
    } catch (syncErr) {
      console.error("Failed to sync cart before checkout:", syncErr);
    }

    // 1. Fetch user's saved addresses
    const addresses = await getAddresses();
    let addressId = "";

    // Find if there is any matching address
    const matching = addresses.find(
      (addr) =>
        addr.line === payload.address &&
        addr.recipientName === payload.customerName &&
        addr.phone === payload.phone,
    );

    if (matching) {
      addressId = matching.id;
    } else {
      // Create a new address on the backend
      const newAddresses = await addAddress({
        label: `Địa chỉ giao hàng ${addresses.length + 1}`,
        recipientName: payload.customerName,
        phone: payload.phone,
        line: payload.address,
        ward: "N/A",
        district: "N/A",
        province: "N/A",
        isDefault: addresses.length === 0,
      });
      // The last added address might be the default or matching one
      const created = newAddresses.find(
        (addr) =>
          addr.line === payload.address &&
          addr.recipientName === payload.customerName &&
          addr.phone === payload.phone,
      );
      addressId = created?.id || newAddresses[newAddresses.length - 1]?.id || "";
    }

    if (!addressId) {
      throw new Error("Cannot get or create delivery address");
    }

    // 2. Call backend orders checkout
    // Map paymentProvider to paymentMethod (ONLINE or COD)
    const paymentMethod =
      payload.paymentProvider === "COD" ? "COD" : "ONLINE";

    const checkoutResponse = await apiClient.post<any>(
      "/orders/checkout",
      {
        addressId,
        paymentMethod,
      },
    );

    const orderData = unwrapApiData(checkoutResponse.data);
    const orderId = orderData.id || orderData._id;

    // 3. If online payment, generate PayOS URL
    let paymentUrl: string | undefined = undefined;
    if (paymentMethod === "ONLINE") {
      try {
        const payUrlRes = await apiClient.get<any>(
          `/payment/payos/create-url/${orderId}`,
        );
        const payUrlData = unwrapApiData(payUrlRes.data);
        paymentUrl = payUrlData.payUrl;
      } catch (payErr) {
        console.error("Failed to create PayOS URL:", payErr);
        throw payErr;
      }
    }

    return {
      orderId: orderData.code || orderId,
      paymentUrl,
      offline: false,
    };
  } catch (error) {
    console.error("Create order failed:", error);
    throw error;
  }
}

