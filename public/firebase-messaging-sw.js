/* public/firebase-messaging-sw.js */
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");


firebase.initializeApp({
  apiKey: "AIzaSyAbaBrCwiKNRgLC1UV3b4142oJim0UpgK8",
  authDomain: "cooking-partner-42761.firebaseapp.com",
  projectId: "cooking-partner-42761",
  messagingSenderId: "1080753701035",
  appId: "1:1080753701035:web:9fa7e471a35e79ceab37ee",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload?.data || {};
  const orderId = data.orderId || "";
  const title = data.title || "New Order";
  const body = data.body || (orderId ? `Order #${orderId}` : "You have a new order");

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: orderId ? `order:${orderId}` : "order:new", // prevents duplicates
    renotify: true,
    silent: false,
    data: { orderId },
    vibrate: [200, 100, 200, 100, 400],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const orderId = event.notification?.data?.orderId;
  const url = orderId ? `/partner/orders?focus=${encodeURIComponent(orderId)}` : "/partner/orders";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
