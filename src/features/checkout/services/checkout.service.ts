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
  const response = await apiClient.post<{
    orderId: string;
    paymentUrl?: string;
  }>("/orders", payload);

  return response.data;
}
