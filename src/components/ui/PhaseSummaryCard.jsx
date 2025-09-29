// components/ui/PhaseSummaryCard.jsx
"use client";
import { useEffect } from "react";
import { Sun, Moon, Shield, UserX } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

/**
 * Props:
 * - phase: "night_review" | "morning_meeting"
 * - eliminatedName?: string
 * - protectedName?: string
 * - eliminatedRole?: string
 * - ephemeral?: boolean        // default true: auto-hide after 6s
 * - onDismiss?: () => void     // called when auto-hidden or close clicked
 * - showAvatars?: boolean      // default false; uses Avatar seeded by name
 */
export default function PhaseSummaryCard({
  phase,
  eliminatedName,
  protectedName,
  eliminatedRole,
  ephemeral = true,
  onDismiss,
  showAvatars = false,
}) {
  const isNight = phase === "night_review";
  const Icon = isNight ? Moon : Sun;

  // auto-dismiss (ephemeral)
  useEffect(() => {
    if (!ephemeral || !onDismiss) return;
    const id = setTimeout(onDismiss, 6000);
    return () => clearTimeout(id);
  }, [ephemeral, onDismiss, phase]);

  const wrap = isNight
    ? "bg-indigo-900/25 border-indigo-600/30 ring-1 ring-indigo-400/10"
    : "bg-amber-900/25 border-amber-600/30 ring-1 ring-amber-400/10";

  return (
    <section
      className={[
        "relative overflow-hidden rounded-xl border p-4 text-white",
        "backdrop-blur-sm shadow-sm",
        "animate-[fadeIn_200ms_ease-out]",
        wrap,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      {/* header */}
      <header className="flex items-center gap-3 mb-2">
        <div className="grid place-items-center w-9 h-9 rounded-lg bg-white/10">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-base font-semibold">
          {isNight ? "Night Results" : "Day Results"}
        </h3>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="ml-auto text-white/60 hover:text-white/90"
          >
            ✕
          </button>
        )}
      </header>

      {/* content */}
      <div className="space-y-1 text-sm">
        {eliminatedName ? (
          <div className="flex items-center gap-2">
            {showAvatars && (
              <Avatar seed={eliminatedName} label={eliminatedName} size="xs" />
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10">
              <UserX className="w-3.5 h-3.5" />
              <b className="font-semibold">{eliminatedName}</b>
            </span>
            <span>was eliminated</span>
            {eliminatedRole && (
              <span className="text-white/70">
                — Role: {String(eliminatedRole).toUpperCase()}
              </span>
            )}
          </div>
        ) : (
          <div>No one was eliminated.</div>
        )}

        {protectedName && (
          <div className="flex items-center gap-2 text-emerald-300/90">
            <Shield className="w-3.5 h-3.5" />
            <span>Protected: {protectedName}</span>
          </div>
        )}
      </div>
    </section>
  );
}

/* Tailwind keyframes (optional): add once in your globals if you want the fade-in)
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
*/
