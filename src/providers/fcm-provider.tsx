"use client";

/**
 * FCMProvider
 *
 * Mount hook useFCM vào component tree để tự động:
 * - Đăng ký FCM token khi user login
 * - Hủy token khi user logout
 * - Hiển thị toast notification khi nhận được tin nhắn foreground
 */

import { useFCM } from "@/hooks/use-fcm";

export function FCMProvider({ children }: { children: React.ReactNode }) {
  useFCM();
  return <>{children}</>;
}
