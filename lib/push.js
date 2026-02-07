// lib/push.js
import { getFirebaseApp } from "./firebase";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

export async function enablePartnerPush() {
  const ok = await isSupported();
  if (!ok) throw new Error("FCM not supported");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(getFirebaseApp());

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) throw new Error("Token generation failed");

  return token;
}
