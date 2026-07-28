import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import { mapOrderToSummary } from "./order.service";

export async function adminListOrders(filter?: {
  orderStatus?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
}) {
  const response = await apiClient.get<ApiEnvelope<any[]> | any>(
    "/admin/orders",
    filter ? { params: filter } : undefined,
  );
  const data = unwrapApiData(response.data);
  if (Array.isArray(data)) {
    return data.map(mapOrderToSummary);
  }
  return data;
}

export async function adminGetOrder(orderId: string) {
  const response = await apiClient.get<ApiEnvelope<any> | any>(
    `/admin/orders/${orderId}`,
  );
  const data = unwrapApiData(response.data);
  return mapOrderToSummary(data);
}

