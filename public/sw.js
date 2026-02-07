/* public/sw.js */

/* Firebase (compat) */
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

/* 🔹 Firebase config */
firebase.initializeApp({
  apiKey: "AIzaSyAbaBrCwiKNRgLC1UV3b4142oJim0UpgK8",
  authDomain: "cooking-partner-42761.firebaseapp.com",
  projectId: "cooking-partner-42761",
  messagingSenderId: "1080753701035",
  appId: "1:1080753701035:web:9fa7e471a35e79ceab37ee",
});

const messaging = firebase.messaging();

/* 🔔 Background push handler */
messaging.onBackgroundMessage((payload) => {
  const data = payload?.data || {};
  const orderId = data.orderId || "";

  self.registration.showNotification(
    data.title || "New Order",
    {
      body: data.body || `Order #${orderId}`,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: orderId ? `order:${orderId}` : "order:new",
      renotify: true,
      silent: false,
      vibrate: [200, 100, 200, 100, 400],
      data: { orderId },
    }
  );
});

/* Notification click */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const orderId = event.notification?.data?.orderId;
  const url = orderId
    ? `/partner/orders?focus=${orderId}`
    : `/partner/orders`;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const c of clientsArr) {
        if (c.url.includes("/partner/orders") && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
