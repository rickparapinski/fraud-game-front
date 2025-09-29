"use client";
import { Users, Moon, Sun, Trophy, Check } from "lucide-react";

/** fixed to your PHASES */
const PHASES = [
  { id: "lobby", label: "Lobby", icon: Users },
  { id: "night_review", label: "Night", icon: Moon },
  { id: "morning_meeting", label: "Day", icon: Sun },
  { id: "audit_complete", label: "Complete", icon: Trophy },
];

export default function CompactPhaseStepper({ current }) {
  const idx = Math.max(
    0,
    PHASES.findIndex((p) => p.id === current)
  );

  return (
    <ol className="flex items-center gap-2">
      {PHASES.map((p, i) => {
        const Icon = p.icon;
        const state = i < idx ? "done" : i === idx ? "active" : "todo";
        const base =
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs";
        const cls =
          state === "active"
            ? "bg-accent-gold text-ink-800 border-accent-gold font-semibold"
            : state === "done"
            ? "bg-white/10 text-white/80 border-ink-700"
            : "bg-transparent text-white/60 border-ink-700";
        return (
          <li key={p.id} className={`${base} ${cls}`}>
            {state === "done" ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{p.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
