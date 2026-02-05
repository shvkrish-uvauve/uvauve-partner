import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Toaster position="bottom-right" />
      <Component {...pageProps} />
    </>
  );
}
