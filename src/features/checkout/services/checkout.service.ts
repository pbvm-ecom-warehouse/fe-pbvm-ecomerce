import { apiClient } from "@/lib/api-client";
import type { CartItem } from "@/types/api";

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
