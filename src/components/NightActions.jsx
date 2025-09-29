"use client";
import { useMemo, useState } from "react";
import { Skull, Search, ShieldCheck } from "lucide-react"; // icons

const ROLE_STYLES = {
  fraudster: {
    label: "Eliminate",
    ring: "ring-role-fraudster/30",
    glow: "shadow-[0_0_25px_-5px_rgba(239,68,68,0.35)]",
    chip: "bg-role-fraudster/20 text-role-fraudster",
    Icon: Skull,
  },
  auditor: {
    label: "Audit",
    ring: "ring-role-auditor/30",
    glow: "shadow-[0_0_25px_-5px_rgba(139,92,246,0.35)]",
    chip: "bg-role-auditor/20 text-role-auditor",
    Icon: Search,
  },
  controller: {
    label: "Protect",
    ring: "ring-role-controller/30",
    glow: "shadow-[0_0_25px_-5px_rgba(16,185,129,0.35)]",
    chip: "bg-role-controller/20 text-role-controller",
    Icon: ShieldCheck,
  },
};

export default function NightActions({ me, players, onAct, fraudTally }) {
  const [targetId, setTargetId] = useState("");
  const [submittedFor, setSubmittedFor] = useState(null);
  const [pending, setPending] = useState(false);

  const aliveOthers = useMemo(
    () => players.filter((p) => p.isActive && p.id !== me.id),
    [players, me.id]
  );

  const style = ROLE_STYLES[me.role] || {};
  const { Icon } = style;

  const actionType =
    me.role === "fraudster"
      ? "fraudster_target"
      : me.role === "auditor"
      ? "audit_check"
      : me.role === "controller"
      ? "protect_employee"
      : null;

  const label =
    me.role === "fraudster"
      ? "Choose a target to eliminate"
      : me.role === "auditor"
      ? "Choose a player to audit"
      : me.role === "controller"
      ? "Choose a player to protect"
      : "";

  const submit = async () => {
    if (!actionType || !targetId || pending) return;
    setPending(true);
    try {
      await onAct(actionType, targetId);
      const p = players.find((x) => x.id === targetId);
      setSubmittedFor(p?.name || "Unknown");
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-800/95",
        "p-5 text-white ring-1",
        style.ring,
        style.glow,
      ].join(" ")}
    >
      {actionType ? (
        <>
          {/* Header with role icon */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`grid place-items-center w-9 h-9 rounded-xl ${style.chip}`}
            >
              {Icon ? <Icon className="w-5 h-5" /> : <span>🌙</span>}
            </div>
            <h3 className="font-semibold text-lg">Night Actions</h3>
          </div>

          <label className="block text-sm mb-2">{label}</label>
          <select
            className="w-full rounded-xl bg-ink-900/50 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">-- Select player --</option>
            {aliveOthers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={submit}
            disabled={pending || !targetId}
            className={`mt-4 w-full rounded-xl py-2.5 font-medium transition-colors ${
              pending || !targetId
                ? "bg-white/10 text-white/50 cursor-not-allowed"
                : "bg-accent-gold text-ink-900 hover:bg-yellow-400"
            }`}
          >
            {pending ? "Submitting…" : "Submit Action"}
          </button>

          {me?.role === "auditor" && (
            <p className="mt-3 text-xs text-white/60">
              Your audit result appears in the morning.
            </p>
          )}

          {me.role === "fraudster" && fraudTally && (
            <div className="mt-4 text-xs text-white/70">
              <div className="font-medium mb-1">
                Fraudster vote tally (private):
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {Object.entries(fraudTally).map(([tid, count]) => {
                  const player = players.find((p) => p.id === tid);
                  return (
                    <li key={tid}>
                      {player?.name || tid}: {count}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {submittedFor && (
            <p className="mt-3 text-xs text-accent-gold">
              ✅ You submitted your action for {submittedFor}.
            </p>
          )}
        </>
      ) : (
        <div className="text-sm text-white/60">
          Accountants rest during night.
        </div>
      )}
    </section>
  );
}
