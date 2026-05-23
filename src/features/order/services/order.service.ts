import { apiClient } from "@/lib/api-client";
import type { ApiListResponse, OrderSummary } from "@/types/api";

export async function listOrders() {
  const response =
    await apiClient.get<ApiListResponse<OrderSummary>>("/orders");
  return response.data;
}

export async function getOrder(orderId: string) {
  const response = await apiClient.get<OrderSummary>(`/orders/${orderId}`);
  return response.data;
}
