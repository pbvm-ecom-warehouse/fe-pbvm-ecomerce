import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, type ApiMeta, unwrapApiData } from "@/lib/api-contract";

/** Trả về true nếu lỗi do endpoint chưa tồn tại trên BE (404) */
function isNotFound(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_FULFILLED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "PAYMENT_CANCELLED"
  | "SYSTEM"
  | "CART_NOTICE"
  | "DESIGN_SAVED"
  | "NEW_ORDER"
  | "ORDER_CANCELLED"
  | "LOW_STOCK"
  | "FULFILLMENT_ALERT";

export type NotificationStatus = "UNREAD" | "READ";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  /** Deep-link path, e.g. /orders/:id */
  link?: string;
  /** Extra metadata (orderId, orderCode, amount…) */
  metadata?: Record<string, unknown>;
}

export interface NotificationListResponse {
  data: Notification[];
  meta: ApiMeta & { unreadCount?: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a raw API row into the unified Notification shape.
 * Handles both snake_case and camelCase keys from the backend.
 */
export function mapRawToNotification(raw: any): Notification {
  return {
    id: raw.id ?? raw._id ?? String(Math.random()),
    type: raw.type ?? raw.notificationType ?? "SYSTEM",
    title: raw.title ?? raw.subject ?? "Thông báo",
    description: raw.description ?? raw.body ?? raw.message ?? "",
    isRead: raw.isRead ?? raw.read ?? raw.is_read ?? false,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.timestamp ?? new Date().toISOString(),
    link: raw.link ?? raw.url ?? raw.deepLink ?? undefined,
    metadata: raw.metadata ?? raw.data ?? undefined,
  };
}

function parseListResponse(payload: any): NotificationListResponse {
  // { data: [], meta: {} } envelope
  if (payload && Array.isArray(payload.data)) {
    return {
      data: payload.data.map(mapRawToNotification),
      meta: payload.meta ?? {},
    };
  }
  // bare array
  if (Array.isArray(payload)) {
    return {
      data: payload.map(mapRawToNotification),
      meta: {},
    };
  }
  return { data: [], meta: {} };
}

// ─── Customer API calls ───────────────────────────────────────────────────────

/**
 * GET /notifications — fetch the current customer's notifications.
 */
export async function listNotifications(params?: {
  page?: number;
  pageSize?: number;
  status?: NotificationStatus;
}): Promise<NotificationListResponse> {
  try {
    const response = await apiClient.get<ApiEnvelope<any[] | any> | any>(
      "/notifications",
      { params },
    );
    return parseListResponse(unwrapApiData(response.data));
  } catch (err) {
    if (isNotFound(err)) return { data: [], meta: {} };
    throw err;
  }
}

/**
 * PATCH /notifications/:id/read — mark a single notification as read (customer).
 */
export async function markNotificationRead(id: string): Promise<void> {
  try {
    await apiClient.patch(`/notifications/${id}/read`);
  } catch (err) {
    if (isNotFound(err)) return;
    throw err;
  }
}

/**
 * PATCH /notifications/read-all — mark all notifications as read (customer).
 */
export async function markAllNotificationsRead(): Promise<void> {
  try {
    await apiClient.patch("/notifications/read-all");
  } catch (err) {
    if (isNotFound(err)) return;
    throw err;
  }
}

/**
 * GET /notifications/unread-count — lightweight badge counter (customer).
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const response = await apiClient.get<ApiEnvelope<{ count: number }> | { count: number }>(
      "/notifications/unread-count",
    );
    const payload = unwrapApiData(response.data) as any;
    return payload?.count ?? 0;
  } catch {
    return 0;
  }
}

// ─── Admin API calls ──────────────────────────────────────────────────────────

/**
 * GET /admin/notifications — fetch admin/manager notifications.
 */
export async function listAdminNotifications(params?: {
  page?: number;
  pageSize?: number;
  status?: NotificationStatus;
}): Promise<NotificationListResponse> {
  const response = await apiClient.get<ApiEnvelope<any[] | any> | any>(
    "/admin/notifications",
    { params },
  );
  return parseListResponse(unwrapApiData(response.data));
}

/**
 * PATCH /admin/notifications/:id/read — mark a single admin notification as read.
 */
export async function markAdminNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/admin/notifications/${id}/read`);
}

/**
 * PATCH /admin/notifications/read-all — mark all admin notifications as read.
 */
export async function markAllAdminNotificationsRead(): Promise<void> {
  await apiClient.patch("/admin/notifications/read-all");
}

/**
 * GET /admin/notifications/unread-count — lightweight badge counter (admin).
 */
export async function getAdminUnreadCount(): Promise<number> {
  try {
    const response = await apiClient.get<ApiEnvelope<{ count: number }> | { count: number }>(
      "/admin/notifications/unread-count",
    );
    const payload = unwrapApiData(response.data) as any;
    return payload?.count ?? 0;
  } catch {
    return 0;
  }
}
