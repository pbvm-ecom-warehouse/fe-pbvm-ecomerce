import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import type { ApiListResponse, OrderSummary } from "@/types/api";

/**
 * Hàm map ảo (Virtual mapper) để đồng bộ thuộc tính dữ liệu từ BE sang FE
 */
export function mapOrderToSummary(order: any): OrderSummary & Record<string, any> {
  if (!order) return order;
  return {
    ...order,
    id: order.id || order._id,
    // status: Ánh xạ từ orderStatus (đơn hàng)
    status: order.orderStatus || order.status,
    // totalAmount: Ánh xạ từ total (tổng tiền)
    totalAmount: order.total !== undefined ? order.total : order.totalAmount,
    // createdAt: Ánh xạ từ placedAt hoặc createdAt (ngày đặt)
    createdAt: order.placedAt || order.createdAt,
    // warehouseName: Ánh xạ từ fulfillWarehouseId (Nếu khác null, trả về "Kho trung tâm")
    warehouseName: order.fulfillWarehouseId ? "Kho trung tâm" : (order.warehouseName || ""),
  };
}

export async function listOrders() {
  const response =
    await apiClient.get<ApiEnvelope<any[]> | ApiListResponse<any>>(
      "/orders",
    );
  const payload = unwrapApiData(response.data) as any;

  if (Array.isArray(payload)) {
    const mapped = payload.map(mapOrderToSummary);
    return {
      data: mapped,
      meta: { pagination: { page: 1, pageSize: mapped.length, total: mapped.length } },
    };
  }

  if (payload && Array.isArray(payload.data)) {
    return {
      ...payload,
      data: payload.data.map(mapOrderToSummary),
    };
  }

  return payload;
}

export async function getOrder(orderId: string) {
  const response = await apiClient.get<ApiEnvelope<any> | any>(
    `/orders/${orderId}`,
  );
  const data = unwrapApiData(response.data) as any;
  return mapOrderToSummary(data);
}

export async function cancelOrder(orderId: string, reason = "Hủy đơn phục hồi giỏ hàng") {
  const response = await apiClient.post<any>(
    `/orders/${orderId}/cancel`,
    { reason }
  );
  return unwrapApiData(response.data);
}
