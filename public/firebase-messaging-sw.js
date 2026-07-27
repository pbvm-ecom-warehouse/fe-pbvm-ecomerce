/**
 * Firebase Cloud Messaging Service Worker
 *
 * File này phải nằm ở /public/firebase-messaging-sw.js
 * Xử lý background push notifications khi tab bị đóng hoặc ở background.
 */

// eslint-disable-next-line no-undef
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
// eslint-disable-next-line no-undef
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Lấy config từ query params khi service worker được đăng ký
// Hoặc hardcode config (không chứa secret)
const firebaseConfig = {
  apiKey: "AIzaSyCXfAeL0zQU4xP8cR0xAoCkCDBG-Kuy1O4",
  authDomain: "wms-ecom.firebaseapp.com",
  projectId: "wms-ecom",
  storageBucket: "wms-ecom.firebasestorage.app",
  messagingSenderId: "1019136306988",
  appId: "1:1019136306988:web:72ccc739a9f53d216d4689",
};

// eslint-disable-next-line no-undef
firebase.initializeApp(firebaseConfig);

// eslint-disable-next-line no-undef
const messaging = firebase.messaging();

/**
 * Nhận thông báo background (khi tab bị ẩn hoặc đóng).
 * Firebase tự động hiển thị notification nếu payload có `notification` field.
 * Handler này dùng để custom notification hoặc xử lý data-only messages.
 */
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Received background message:", payload);

  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    "Thông báo mới";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      payload.data?.description ||
      "",
    icon: payload.notification?.icon || "/images/logo.png",
    badge: "/images/logo.png",
    tag: payload.data?.type || "notification",
    data: {
      url: payload.data?.link || payload.data?.url || "/notifications",
      ...payload.data,
    },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  // eslint-disable-next-line no-restricted-globals
  self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Xử lý khi user click vào notification.
 * Mở tab hoặc focus tab đã có, rồi điều hướng đến URL tương ứng.
 */
// eslint-disable-next-line no-restricted-globals
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/notifications";

  event.waitUntil(
    // eslint-disable-next-line no-restricted-globals
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Nếu đã có tab mở, focus vào
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Nếu chưa có tab, mở tab mới
        // eslint-disable-next-line no-restricted-globals
        if (clients.openWindow) {
          // eslint-disable-next-line no-restricted-globals
          return clients.openWindow(targetUrl);
        }
      }),
  );
});
