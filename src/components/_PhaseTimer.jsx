"use client";
import { useEffect, useState } from "react";

export default function PhaseTimer({ deadline }) {
  const [left, setLeft] = useState(deadline ? deadline - Date.now() : 0);

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(
      () => setLeft(Math.max(0, deadline - Date.now())),
      200
    );
    return () => clearInterval(id);
  }, [deadline]);

  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  return (
    <div className="text-sm px-3 py-1 rounded border">
      {mm}:{ss}
    </div>
  );
}
