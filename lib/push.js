// lib/push.js
import { getFirebaseApp } from "./firebase";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

async function getMainSWRegistration() {
  if (!("serviceWorker" in navigator)) throw new Error("Service worker not supported");

  // Get the registration that controls this origin (your /sw.js)
  let reg = await navigator.serviceWorker.getRegistration();

  // If not found yet, register /sw.js explicitly
  if (!reg) {
    reg = await navigator.serviceWorker.register("/sw.js");
  }
  return reg;
}

export async function enablePartnerPush() {
  const ok = await isSupported();
  if (!ok) throw new Error("FCM not supported");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission denied");

  const reg = await getMainSWRegistration();

  const messaging = getMessaging(getFirebaseApp());
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: reg,
  });

  if (!token) throw new Error("FCM token not generated");

  return token;
}
