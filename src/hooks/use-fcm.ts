"use client";

/**
 * useFCM Hook
 *
 * Tự động:
 * 1. Lấy FCM token khi user đăng nhập
 * 2. Gửi token lên backend (POST /auth/fcm-token)
 * 3. Xóa token khi user đăng xuất (DELETE /auth/fcm-token)
 * 4. Lắng nghe foreground notifications và hiển thị toast
 * 5. Refresh token định kỳ nếu cần
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import {
  getFCMToken,
  registerFCMToken,
  unregisterFCMToken,
  onForegroundMessage,
} from "@/lib/fcm";
import { isFirebaseConfigured } from "@/lib/firebase";

export function useFCM() {
  const user = useAuthStore((state) => state.user);
  const fcmTokenRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let cancelled = false;

    async function initFCM() {
      if (!user) {
        // Người dùng đăng xuất → xóa token khỏi backend
        if (fcmTokenRef.current) {
          await unregisterFCMToken(fcmTokenRef.current);
          fcmTokenRef.current = null;
        }
        // Hủy lắng nghe foreground messages
        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
        return;
      }

      // Người dùng đã đăng nhập → lấy token và đăng ký
      const token = await getFCMToken();
      if (cancelled || !token) return;

      // Nếu token mới khác token cũ → đăng ký lại
      if (token !== fcmTokenRef.current) {
        if (fcmTokenRef.current) {
          // Xóa token cũ nếu có
          await unregisterFCMToken(fcmTokenRef.current);
        }
        fcmTokenRef.current = token;
        await registerFCMToken(token);
      }

      // Lắng nghe foreground messages (khi app đang mở)
      if (!unsubscribeRef.current) {
        unsubscribeRef.current = onForegroundMessage((payload) => {
          if (cancelled) return;

          const title =
            payload.notification?.title ||
            (payload.data as any)?.title ||
            "Thông báo mới";

          const body =
            payload.notification?.body ||
            (payload.data as any)?.body ||
            (payload.data as any)?.description ||
            "";

          const link =
            (payload.data as any)?.link ||
            (payload.data as any)?.url ||
            "/notifications";

          toast(title, {
            description: body,
            duration: 6000,
            action: {
              label: "Xem",
              onClick: () => {
                window.location.href = link;
              },
            },
          });
        });
      }
    }

    initFCM().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [user?.id]); // Chạy lại khi user thay đổi (login/logout)

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
    };
  }, []);
}
