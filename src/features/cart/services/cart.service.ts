import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";

export type CartItemResponse = {
  sku: string;
  quantity: number;
  isPrintItem: boolean;
  designId: string | null;
  designFile: string | null;
  unitPrice: number;
};

export type CartResponse = {
  id: string;
  customerId: string;
  status: string;
  items: CartItemResponse[];
};

export async function getCart() {
  const response = await apiClient.get<ApiEnvelope<CartResponse> | CartResponse>(
    "/cart",
  );
  return unwrapApiData(response.data);
}

export async function addCartItem(input: {
  sku: string;
  quantity: number;
  designId?: string;
  designFile?: string;
}) {
  const response = await apiClient.post<ApiEnvelope<CartResponse> | CartResponse>(
    "/cart/items",
    input,
  );
  return unwrapApiData(response.data);
}

export async function updateCartItem(sku: string, quantity: number) {
  const response = await apiClient.put<ApiEnvelope<CartResponse> | CartResponse>(
    `/cart/items/${encodeURIComponent(sku)}`,
    { quantity },
  );
  return unwrapApiData(response.data);
}

export async function removeCartItem(sku: string) {
  const response = await apiClient.delete<ApiEnvelope<CartResponse> | CartResponse>(
    `/cart/items/${encodeURIComponent(sku)}`,
  );
  return unwrapApiData(response.data);
}

export async function clearBackendCart() {
  const response = await apiClient.delete<ApiEnvelope<CartResponse> | CartResponse>(
    "/cart",
  );
  return unwrapApiData(response.data);
}
