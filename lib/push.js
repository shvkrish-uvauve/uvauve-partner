// lib/push.js
import { getFirebaseApp } from "./firebase";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

async function getFirebaseSWRegistration() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers not supported");
  }

  // Try to get existing registration
  let reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");

  // If not found, register explicitly
  if (!reg) {
    reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  }

  return reg;
}

export async function enablePartnerPush() {
  const ok = await isSupported();
  if (!ok) throw new Error("FCM not supported on this device.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  // ✅ DO NOT wait for serviceWorker.ready
  const registration = await getFirebaseSWRegistration();

  const messaging = getMessaging(getFirebaseApp());

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) throw new Error("FCM token not generated");

  return token;
}
