/**
 * FCM (Firebase Cloud Messaging) token registration helpers.
 *
 * - registerFCMToken  → POST /api/shop/auth/fcm-token
 * - unregisterFCMToken → DELETE /api/shop/auth/fcm-token
 * - getFCMToken       → lấy token từ Firebase (xin quyền notification nếu cần)
 */

import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { messaging, isFirebaseConfigured } from "@/lib/firebase";
import { apiClient } from "@/lib/api-client";

// VAPID key từ Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
// Nếu không có VAPID key, FCM vẫn hoạt động nhưng kém bảo mật hơn
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// ─── Lấy FCM token từ Firebase ────────────────────────────────────────────────

/**
 * Yêu cầu quyền notification và lấy FCM registration token.
 * Trả về token string hoặc null nếu bị từ chối hoặc lỗi.
 */
export async function getFCMToken(): Promise<string | null> {
  if (!isFirebaseConfigured || !messaging) return null;

  try {
    // Kiểm tra và xin quyền notification
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.info("[FCM] Notification permission denied");
      return null;
    }

    // Đảm bảo service worker đã được đăng ký
    let swRegistration: ServiceWorkerRegistration | undefined;
    try {
      swRegistration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" },
      );
    } catch (swErr) {
      console.warn("[FCM] Service worker registration failed:", swErr);
    }

    const tokenOptions: Parameters<typeof getToken>[1] = {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    };

    const token = await getToken(messaging, tokenOptions);
    if (token) {
      console.info("[FCM] Token obtained:", token.slice(0, 20) + "...");
      return token;
    }

    console.warn("[FCM] No registration token available");
    return null;
  } catch (err) {
    console.error("[FCM] Failed to get token:", err);
    return null;
  }
}

// ─── API: Gửi token lên backend ───────────────────────────────────────────────

/**
 * POST /api/shop/auth/fcm-token
 * Lưu hoặc cập nhật FCM Token của thiết bị lên server.
 */
export async function registerFCMToken(token: string): Promise<void> {
  try {
    await apiClient.post("/auth/fcm-token", { token });
    console.info("[FCM] Token registered with backend");
  } catch (err) {
    console.warn("[FCM] Failed to register token with backend:", err);
  }
}

/**
 * DELETE /api/shop/auth/fcm-token
 * Xóa FCM Token khi đăng xuất.
 */
export async function unregisterFCMToken(token: string): Promise<void> {
  try {
    await apiClient.delete("/auth/fcm-token", { data: { token } });
    console.info("[FCM] Token unregistered from backend");
  } catch (err) {
    console.warn("[FCM] Failed to unregister token:", err);
  }
}

// ─── Lắng nghe thông báo foreground ──────────────────────────────────────────

/**
 * Đăng ký listener nhận thông báo khi app đang mở (foreground).
 * Trả về hàm unsubscribe để dọn dẹp.
 */
export function onForegroundMessage(
  handler: (payload: MessagePayload) => void,
): () => void {
  if (!isFirebaseConfigured || !messaging) return () => {};

  return onMessage(messaging, handler);
}
