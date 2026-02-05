import { useEffect, useRef, useState } from "react";

export function useRinger(url = "/sounds/order.mp3") {
  const audioRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio(url);
    a.loop = true;
    a.preload = "auto";
    audioRef.current = a;
    return () => { try { a.pause(); } catch {} };
  }, [url]);

  async function enableSound() {
    try {
      const a = audioRef.current;
      if (!a) return;
      await a.play();   // unlock autoplay
      a.pause();
      a.currentTime = 0;
      setEnabled(true);
    } catch {
      setEnabled(false);
    }
  }

  async function start() {
    if (!enabled) return;
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    await a.play();
    setRinging(true);
  }

  function stop() {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setRinging(false);
  }

  return { enabled, ringing, enableSound, start, stop };
}
