"use client";
import { useEffect, useMemo, useRef } from "react";
import { Sun, Moon, Gavel, Info } from "lucide-react";

/**
 * Themed GameLog with icons, chips, and autoscroll.
 * Props: { logs }
 */
export default function GameLog({ logs }) {
  const scrollerRef = useRef(null);

  // --- your original formatting logic (unchanged) ---
  const formatEntry = (e) => {
    if (!e) return "";
    const num = typeof e.number === "number" ? e.number : "";
    if (e.type === "day-results") {
      const { eliminatedId, eliminatedName, tally } = e.data || {};
      if (eliminatedId) {
        let votes = null;
        if (Array.isArray(tally)) {
          const hit = tally.find((t) => t.targetId === eliminatedId);
          votes = hit?.votes ?? null;
        }
        return `Day ${num}: ${eliminatedName} was eliminated${
          votes != null ? ` with ${votes} vote(s)` : ""
        }.`;
      }
      return `Day ${num}: No elimination.`;
    }
    if (e.type === "night-results") {
      const { eliminatedName, protectedName } = e.data || {};
      if (eliminatedName) {
        return `Night ${num}: ${eliminatedName} was eliminated.${
          protectedName ? ` (Protected: ${protectedName})` : ""
        }`;
      }
      if (protectedName) {
        return `Night ${num}: No one eliminated (protected: ${protectedName}).`;
      }
      return `Night ${num}: No one was eliminated.`;
    }
    return String(e.text || "").replace(/\s+\([A-Z_]+\)/g, "");
  };

  // autoscroll to newest on change
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  // simple per-entry style hints
  const getVisual = (e) => {
    if (!e)
      return { Icon: Info, chip: "bg-white/10 text-white/70", label: "Log" };
    if (e.type === "day-results")
      return {
        Icon: Sun,
        chip: "bg-role-accountant/20 text-role-accountant",
        label: "Day",
      };
    if (e.type === "night-results")
      return {
        Icon: Moon,
        chip: "bg-role-auditor/20 text-role-auditor",
        label: "Night",
      };
    return { Icon: Info, chip: "bg-white/10 text-white/70", label: "Log" };
  };

  if (!logs?.length) {
    return (
      <div className="rounded-2xl border border-ink-700 bg-ink-800/95 p-5 text-sm text-white/70">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-white/60" />
          <span>No logs yet. They’ll appear here as the game progresses.</span>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-ink-700 bg-ink-800/95">
      <header className="px-5 py-3 border-b border-ink-700 flex items-center gap-2 text-white">
        <Gavel className="w-4 h-4 text-role-accountant" />
        <h3 className="font-semibold">Game Log</h3>
      </header>

      <div
        ref={scrollerRef}
        className="h-64 overflow-auto p-4 space-y-3 text-sm text-white/90"
      >
        {logs.map((e) => {
          const key = e.id || `${e.ts}-${Math.random()}`;
          const t = e.ts ? new Date(e.ts).toLocaleTimeString() : "";
          const { Icon, chip, label } = getVisual(e);
          const isDay = e?.type === "day-results";
          const isNight = e?.type === "night-results";

          return (
            <div
              key={key}
              className="rounded-xl bg-white/5 border border-white/10 p-3"
            >
              <div className="flex items-start gap-3">
                {/* icon chip */}
                <div
                  className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 ${chip}`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{formatEntry(e)}</span>
                    {/* tiny phase label */}
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${chip}`}
                    >
                      {label}
                    </span>
                    {/* time */}
                    {t && (
                      <span className="text-[11px] text-white/50">{t}</span>
                    )}
                  </div>

                  {/* keep vote breakdown */}
                  {isDay &&
                    Array.isArray(e.data?.tally) &&
                    e.data.tally.length > 0 && (
                      <div className="mt-1 text-[12px] text-white/70">
                        Votes:{" "}
                        {e.data.tally.map((tally, i) => (
                          <span key={`${tally.targetId}-${i}`}>
                            {tally.targetName} ({tally.votes})
                            {i < e.data.tally.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* small flavor line for night saves */}
                  {isNight &&
                    e.data?.protectedName &&
                    !e.data?.eliminatedName && (
                      <div className="mt-1 text-[12px] text-emerald-300/80">
                        Shielded: {e.data.protectedName}
                      </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
