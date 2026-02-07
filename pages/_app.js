import "../styles/globals.css";
import { useEffect } from "react";
function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(console.error);
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }, []);

  return (
    <>
      <Toaster position="top-center" />
      <Component {...pageProps} />
    </>
  );
}
