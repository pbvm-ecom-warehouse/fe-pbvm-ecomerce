import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import type { ApiListResponse, OrderSummary } from "@/types/api";

export async function listOrders() {
  const response =
    await apiClient.get<ApiEnvelope<OrderSummary[]> | ApiListResponse<OrderSummary>>(
      "/orders",
    );
  const payload = unwrapApiData(response.data);

  return Array.isArray(payload)
    ? {
        data: payload,
        meta: { pagination: { page: 1, pageSize: payload.length, total: payload.length } },
      }
    : payload;
}

export async function getOrder(orderId: string) {
  const response = await apiClient.get<ApiEnvelope<OrderSummary> | OrderSummary>(
    `/orders/${orderId}`,
  );
  return unwrapApiData(response.data);
}
