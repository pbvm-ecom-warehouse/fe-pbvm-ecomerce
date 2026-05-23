import { apiClient } from "@/lib/api-client";

import type { CheckoutInput } from "../schemas/checkout.schema";

export type CreateOrderPayload = CheckoutInput & {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  promotionCode?: string;
};

export async function createOrder(payload: CreateOrderPayload) {
  const response = await apiClient.post<{
    orderId: string;
    paymentUrl?: string;
  }>("/orders", payload);

  return response.data;
}
