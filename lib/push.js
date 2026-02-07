// lib/push.js
import { getFirebaseApp } from "./firebase";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

export async function enablePartnerPush() {
  const ok = await isSupported();
  if (!ok) throw new Error("FCM not supported on this browser/device.");

  if (!("Notification" in window)) throw new Error("Notifications not available.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission not granted.");

  const messaging = getMessaging(getFirebaseApp());

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  });

  if (!token) throw new Error("FCM token not generated.");

  return token;
}
