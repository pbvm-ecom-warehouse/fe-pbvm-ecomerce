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
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListResponse {
  data: Notification[];
  meta: {
    page?: number;
    pageSize?: number;
    total?: number;
    unreadCount?: number;
    [key: string]: unknown;
  };
}

export const NOTIFICATION_INBOX_ENABLED = false;

const EMPTY_NOTIFICATION_LIST: NotificationListResponse = {
  data: [],
  meta: {},
};

export function mapRawToNotification(raw: any): Notification {
  return {
    id: raw.id ?? raw._id ?? String(Math.random()),
    type: raw.type ?? raw.notificationType ?? "SYSTEM",
    title: raw.title ?? raw.subject ?? "Thong bao",
    description: raw.description ?? raw.body ?? raw.message ?? "",
    isRead: raw.isRead ?? raw.read ?? raw.is_read ?? false,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.timestamp ?? new Date().toISOString(),
    link: raw.link ?? raw.url ?? raw.deepLink ?? undefined,
    metadata: raw.metadata ?? raw.data ?? undefined,
  };
}

export async function listNotifications(_params?: {
  page?: number;
  pageSize?: number;
  status?: NotificationStatus;
}): Promise<NotificationListResponse> {
  return EMPTY_NOTIFICATION_LIST;
}

export async function markNotificationRead(_id: string): Promise<void> {}

export async function markAllNotificationsRead(): Promise<void> {}

export async function getUnreadCount(): Promise<number> {
  return 0;
}

export async function listAdminNotifications(_params?: {
  page?: number;
  pageSize?: number;
  status?: NotificationStatus;
}): Promise<NotificationListResponse> {
  return EMPTY_NOTIFICATION_LIST;
}

export async function markAdminNotificationRead(_id: string): Promise<void> {}

export async function markAllAdminNotificationsRead(): Promise<void> {}

export async function getAdminUnreadCount(): Promise<number> {
  return 0;
}
