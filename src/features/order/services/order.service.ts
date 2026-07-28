import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import type { ApiListResponse, OrderSummary } from "@/types/api";

function normalizePaymentStatus(order: any) {
  const raw =
    order?.paymentStatus ??
    order?.payment?.paymentStatus ??
    order?.payment?.status ??
    order?.payStatus ??
    order?.paymentState;
  const status = raw ? String(raw).toUpperCase() : "";

  if (["DEPOSIT_PAID", "PROGRESS_PAID", "REFUND_PENDING", "REFUNDED"].includes(status)) {
    return status;
  }

  if (["PAID", "SUCCESS", "SUCCEEDED", "COMPLETED", "SETTLED"].includes(status)) {
    return "PAID";
  }

  if (order?.paidAt && !status) {
    return "PAID";
  }

  return status || "UNPAID";
}

/**
 * Hàm map ảo (Virtual mapper) để đồng bộ thuộc tính dữ liệu từ BE sang FE
 */
export function mapOrderToSummary(order: any): OrderSummary & Record<string, any> {
  if (!order) return order;
  const mappedId = order.id || order._id;
  const paymentStatus = normalizePaymentStatus(order);

  return {
    ...order,
    id: mappedId,
    // status: Ánh xạ từ orderStatus (đơn hàng)
    status: order.orderStatus || order.status || "PLACED",
    // paymentStatus: Khởi tạo giá trị mặc định nếu thiếu
    paymentStatus,
    // fulfillmentStatus: Khởi tạo giá trị mặc định nếu thiếu
    fulfillmentStatus: order.fulfillmentStatus || "NONE",
    // totalAmount: Ánh xạ từ total (tổng tiền)
    totalAmount: order.total !== undefined ? order.total : (order.totalAmount ?? 0),
    // createdAt: Ánh xạ từ placedAt hoặc createdAt (ngày đặt)
    createdAt: order.placedAt || order.createdAt || order.updatedAt,
    // warehouseName: Ánh xạ từ fulfillWarehouseId (Nếu khác null, trả về "Kho trung tâm")
    warehouseName: order.fulfillWarehouseId ? "Kho trung tâm" : (order.warehouseName || ""),
  };
}

export async function listOrders(filter?: {
  orderStatus?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
}) {
  const response =
    await apiClient.get<ApiEnvelope<any[]> | ApiListResponse<any>>(
      "/orders",
      filter ? { params: filter } : undefined,
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

export async function requestOrderReturn(orderId: string) {
  const response = await apiClient.post<ApiEnvelope<any> | any>(
    `/orders/${orderId}/return`,
  );
  const data = unwrapApiData(response.data) as any;
  return mapOrderToSummary(data);
}
