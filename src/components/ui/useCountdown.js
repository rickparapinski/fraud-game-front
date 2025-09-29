"use client";
import { useEffect, useState } from "react";

export function useCountdown(deadline) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadline]);

  const total = Math.max(0, (deadline || 0) - now); // ms left
  const seconds = Math.ceil(total / 1000);
  return { msLeft: total, secondsLeft: seconds };
}
