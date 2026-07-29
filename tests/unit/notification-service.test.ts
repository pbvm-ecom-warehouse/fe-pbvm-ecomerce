import { beforeEach, describe, expect, test } from "vitest";

import {
  addNotificationToInbox,
  getAdminUnreadCount,
  getUnreadCount,
  listAdminNotifications,
  listNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_INBOX_ENABLED,
} from "@/features/notification/services/notification.service";

describe("notification service", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("stores customer FCM notifications in a local inbox", async () => {
    expect(NOTIFICATION_INBOX_ENABLED).toBe(true);

    const saved = addNotificationToInbox("customer", {
      type: "PAYMENT_SUCCESS",
      title: "Thanh toán thành công",
      description: "Đơn hàng ORD-1 đã thanh toán.",
      link: "/orders/ORD-1",
      metadata: { orderId: "ORD-1" },
    });

    await expect(getUnreadCount()).resolves.toBe(1);
    await expect(listNotifications()).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: saved.id,
          type: "PAYMENT_SUCCESS",
          title: "Thanh toán thành công",
          isRead: false,
        }),
      ],
      meta: expect.objectContaining({ total: 1, unreadCount: 1 }),
    });

    await markNotificationRead(saved.id);
    await expect(getUnreadCount()).resolves.toBe(0);
  });

  test("stores admin FCM notifications separately from customer notifications", async () => {
    addNotificationToInbox("customer", {
      type: "PAYMENT_SUCCESS",
      title: "User notification",
    });
    const admin = addNotificationToInbox("admin", {
      type: "NEW_ORDER",
      title: "Đơn hàng mới",
      link: "/admin/orders",
    });

    await expect(getUnreadCount()).resolves.toBe(1);
    await expect(getAdminUnreadCount()).resolves.toBe(1);
    await expect(listAdminNotifications()).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: admin.id,
          title: "Đơn hàng mới",
          isRead: false,
        }),
      ],
      meta: expect.objectContaining({ total: 1, unreadCount: 1 }),
    });

    await markAdminNotificationRead(admin.id);
    await expect(getAdminUnreadCount()).resolves.toBe(0);

    await markAllNotificationsRead();
    await markAllAdminNotificationsRead();
    await expect(getUnreadCount()).resolves.toBe(0);
    await expect(getAdminUnreadCount()).resolves.toBe(0);
  });
});
