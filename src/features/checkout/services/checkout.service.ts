import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";

import type { CheckoutInput } from "../schemas/checkout.schema";

export type CreateOrderPayload = CheckoutInput & {
  items: Array<{
    productId: string;
    quantity: number;
    isPrintItem?: boolean;
    designId?: string;
    designFile?: unknown;
  }>;
  promotionCode?: string;
};

export async function createOrder(payload: CreateOrderPayload) {
  type CreateOrderResponse = {
    orderId: string;
    paymentUrl?: string;
    offline?: boolean;
  };

  try {
    const response = await apiClient.post<
      ApiEnvelope<CreateOrderResponse> | CreateOrderResponse
    >("/orders", payload);
    return unwrapApiData(response.data);
  } catch {
    return {
      orderId: `local-${Date.now()}`,
      offline: true,
    };
  }
}
