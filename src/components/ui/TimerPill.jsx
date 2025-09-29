"use client";
import { useMemo } from "react";
import { useCountdown } from "./useCountdown";

function fmtFromMs(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function TimerPill({
  deadline,
  durationMs,
  label = "Time left",
}) {
  const { msLeft } = useCountdown(deadline);
  const clampedLeft = Math.max(0, Math.min(durationMs || 0, msLeft || 0));

  const pct = useMemo(() => {
    if (!durationMs) return 0;
    const used = durationMs - clampedLeft;
    return Math.round((used / durationMs) * 100);
  }, [clampedLeft, durationMs]);

  const timeText = fmtFromMs(clampedLeft);

  return (
    <div className="flex items-center gap-3 justify-center">
      {/* pill progress bar */}
      <div className="relative w-40 h-4 rounded-full bg-white/10 border border-ink-700 overflow-hidden">
        <div
          className="h-full bg-accent-gold/80 transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* text outside */}
      <div className="flex flex-col items-start text-white/90">
        <span className="text-xs uppercase tracking-wide">{label}</span>
        <span className="text-lg font-extrabold tabular-nums">{timeText}</span>
      </div>
    </div>
  );
}
