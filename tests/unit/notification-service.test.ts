import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from "@/lib/api-client";
import {
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
  test("keeps notification inbox API disabled because notifications are delivered by FCM", async () => {
    expect(NOTIFICATION_INBOX_ENABLED).toBe(false);
    await expect(listNotifications()).resolves.toEqual({ data: [], meta: {} });
    await expect(listAdminNotifications()).resolves.toEqual({ data: [], meta: {} });
    await expect(getUnreadCount()).resolves.toBe(0);
    await expect(getAdminUnreadCount()).resolves.toBe(0);

    await markNotificationRead("notification-id");
    await markAllNotificationsRead();
    await markAdminNotificationRead("notification-id");
    await markAllAdminNotificationsRead();

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(apiClient.patch).not.toHaveBeenCalled();
  });
});
