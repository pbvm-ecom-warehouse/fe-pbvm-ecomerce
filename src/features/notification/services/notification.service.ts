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
  | "FULFILLMENT_ALERT"
  | "PRINT_COMPLETED"
  | "SHIPMENT_SHIPPED";

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

export const NOTIFICATION_INBOX_ENABLED = true;

const CUSTOMER_INBOX_KEY = "pbvm:fcm-notifications:customer";
const ADMIN_INBOX_KEY = "pbvm:fcm-notifications:admin";
export const NOTIFICATIONS_CHANGED_EVENT = "pbvm:notifications-changed";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getInboxKey(scope: "customer" | "admin") {
  return scope === "admin" ? ADMIN_INBOX_KEY : CUSTOMER_INBOX_KEY;
}

function readInbox(scope: "customer" | "admin") {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(getInboxKey(scope));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(mapRawToNotification) : [];
  } catch {
    return [];
  }
}

function writeInbox(scope: "customer" | "admin", notifications: Notification[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    getInboxKey(scope),
    JSON.stringify(notifications.slice(0, 100)),
  );
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_CHANGED_EVENT, { detail: { scope } }),
  );
}

function listFromInbox(
  scope: "customer" | "admin",
  params?: { page?: number; pageSize?: number; status?: NotificationStatus },
): NotificationListResponse {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const all = readInbox(scope)
    .filter((n) => {
      if (params?.status === "READ") return n.isRead;
      if (params?.status === "UNREAD") return !n.isRead;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const start = (page - 1) * pageSize;
  const data = all.slice(start, start + pageSize);

  return {
    data,
    meta: {
      page,
      pageSize,
      total: all.length,
      unreadCount: readInbox(scope).filter((n) => !n.isRead).length,
    },
  };
}

export function mapRawToNotification(raw: any): Notification {
  return {
    id: raw.id ?? raw._id ?? `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: (raw.type ?? raw.notificationType ?? "SYSTEM") as NotificationType,
    title: raw.title ?? raw.subject ?? "Thông báo",
    description: raw.description ?? raw.body ?? raw.message ?? "",
    isRead: raw.isRead ?? raw.read ?? raw.is_read ?? false,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.timestamp ?? new Date().toISOString(),
    link: raw.link ?? raw.url ?? raw.deepLink ?? undefined,
    metadata: raw.metadata ?? raw.data ?? undefined,
  };
}

export function addNotificationToInbox(
  scope: "customer" | "admin",
  raw: Partial<Notification> & Record<string, unknown>,
) {
  const next = mapRawToNotification({
    ...raw,
    id: raw.id ?? `fcm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    isRead: false,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  });
  const current = readInbox(scope).filter((item) => item.id !== next.id);
  writeInbox(scope, [next, ...current]);
  return next;
}

export async function listNotifications(params?: {
  page?: number;
  pageSize?: number;
  status?: NotificationStatus;
}): Promise<NotificationListResponse> {
  return listFromInbox("customer", params);
}

export async function markNotificationRead(id: string): Promise<void> {
  writeInbox(
    "customer",
    readInbox("customer").map((n) => (n.id === id ? { ...n, isRead: true } : n)),
  );
}

export async function markAllNotificationsRead(): Promise<void> {
  writeInbox("customer", readInbox("customer").map((n) => ({ ...n, isRead: true })));
}

export async function getUnreadCount(): Promise<number> {
  return readInbox("customer").filter((n) => !n.isRead).length;
}

export async function listAdminNotifications(params?: {
  page?: number;
  pageSize?: number;
  status?: NotificationStatus;
}): Promise<NotificationListResponse> {
  return listFromInbox("admin", params);
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  writeInbox(
    "admin",
    readInbox("admin").map((n) => (n.id === id ? { ...n, isRead: true } : n)),
  );
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  writeInbox("admin", readInbox("admin").map((n) => ({ ...n, isRead: true })));
}

export async function getAdminUnreadCount(): Promise<number> {
  return readInbox("admin").filter((n) => !n.isRead).length;
}
