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

export function adminCanAdvanceOrderPaymentProgress(order: any) {
  const orderStatus = order?.orderStatus || order?.status;
  const paymentStatus = order?.paymentStatus;
  const fulfillmentStatus = order?.fulfillmentStatus;
  const paymentMethod = order?.paymentMethod;

  if (!order) return false;
  if (["CANCELLED", "CLOSED", "COMPLETED"].includes(orderStatus)) return false;
  if (["PAID", "REFUND_PENDING", "REFUNDED"].includes(paymentStatus)) return false;
  if (["ISSUED", "SHIPPED", "DELIVERED", "RETURNED"].includes(fulfillmentStatus)) {
    return false;
  }

  if (adminOrderHasPrintItems(order)) {
    if (paymentStatus === "PROGRESS_PAID" && paymentMethod === "COD") {
      return false;
    }
    return ["UNPAID", "DEPOSIT_PAID", "PROGRESS_PAID"].includes(paymentStatus);
  }

  return paymentStatus === "UNPAID";
}

export function adminOrderHasPrintItems(order: any) {
  if (typeof order?.hasPrintItems === "boolean") return order.hasPrintItems;
  return Boolean(
    order?.items?.some(
      (item: any) =>
        item?.isPrintItem ||
        item?.fulfillmentType === "CUSTOM_PRINT" ||
        item?.designId ||
        item?.designFile,
    ),
  );
}

export function calculateManualPaymentAdvanceAmount(order: any) {
  const total = Number(order?.total ?? order?.totalAmount ?? 0);
  if (!Number.isFinite(total) || total <= 0) return 0;

  const paymentStatus = order?.paymentStatus;
  const paymentMethod = order?.paymentMethod;

  if (adminOrderHasPrintItems(order)) {
    if (paymentStatus === "UNPAID") return Math.round(total * 0.3);
    if (paymentStatus === "DEPOSIT_PAID") return Math.round(total * 0.3);
    if (paymentStatus === "PROGRESS_PAID" && paymentMethod !== "COD") {
      return Math.round(total * 0.4);
    }
    return 0;
  }

  if (paymentStatus === "UNPAID") {
    return Math.round(paymentMethod === "ONLINE" ? total : total * 0.5);
  }

  return 0;
}

export function getAdminPaymentAdvanceLabel(order: any) {
  const paymentStatus = order?.paymentStatus;
  const paymentMethod = order?.paymentMethod;
  const hasPrintItems = adminOrderHasPrintItems(order);

  if (hasPrintItems) {
    if (paymentStatus === "UNPAID") return "Xác nhận cọc 30%";
    if (paymentStatus === "DEPOSIT_PAID") return "Xác nhận thanh toán 60%";
    if (paymentStatus === "PROGRESS_PAID" && paymentMethod !== "COD") {
      return "Xác nhận đủ 100%";
    }
  }

  if (paymentStatus === "UNPAID") {
    return paymentMethod === "ONLINE" ? "Xác nhận thanh toán 100%" : "Xác nhận cọc 50%";
  }

  return "Đẩy bước tiếp theo";
}

export async function adminAdvanceOrderPaymentProgress(order: any) {
  const orderId = typeof order === "string" ? order : order?.id || order?._id;
  const amount = typeof order === "string" ? 1 : calculateManualPaymentAdvanceAmount(order);
  const response = await apiClient.patch<ApiEnvelope<any> | any>(
    `/admin/orders/${orderId}/manual-payment`,
    {
      amount,
      providerTxnId: `MANUAL_ADMIN_${orderId}_${Date.now()}`,
    },
  );
  const data = unwrapApiData(response.data);
  return mapOrderToSummary(data);
}

