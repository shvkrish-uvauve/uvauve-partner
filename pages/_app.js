// pages/_app.js
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Keep your existing SW (sw.js) and add FCM SW (firebase-messaging-sw.js)
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {});
    });
  }, []);

  return (
    <>
      <Toaster position="top-center" />
      <Component {...pageProps} />
    </>
  );
}
