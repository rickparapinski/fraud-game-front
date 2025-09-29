"use client";
import { useEffect, useMemo, useState } from "react";
import { Gavel } from "lucide-react";

/**
 * Props:
 * - me: { id, ... }
 * - players: [{ id, name, isActive }]
 * - onVote: (targetId) => Promise
 * - disabled: boolean  // extra guard from parent (e.g., gameOver)
 * - phase: "morning_meeting" | "night_review" | ...
 * - hasVotedDay?: boolean // from parent, resets to false at new day
 */
export default function VotingPanel({
  me,
  players,
  onVote,
  disabled,
  phase,
  hasVotedDay = false,
}) {
  const [targetId, setTargetId] = useState("");
  const [pending, setPending] = useState(false);
  const [votedFor, setVotedFor] = useState(null);

  // Reset local state whenever a new Day starts
  useEffect(() => {
    if (phase === "morning_meeting") {
      setTargetId("");
      setPending(false);
      setVotedFor(null);
    }
  }, [phase]);

  // Only alive others
  const aliveOthers = useMemo(
    () => (players || []).filter((p) => p.isActive && p.id !== me?.id),
    [players, me?.id]
  );
  const noTargets = aliveOthers.length === 0;

  const isLocked =
    pending || disabled || hasVotedDay || phase !== "morning_meeting";
  const canSubmit = !!targetId && !isLocked && !noTargets;

  const submit = async () => {
    if (!canSubmit) return;
    setPending(true);
    try {
      await onVote(targetId);
      const t = aliveOthers.find((p) => p.id === targetId);
      setVotedFor(t?.name || "Unknown");
      // parent should set hasVotedDay=true on success, but we reflect locally too
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-800/95 p-5 text-white",
        "ring-1 ring-role-accountant/30 shadow-[0_0_25px_-5px_rgba(59,130,246,0.35)]",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-role-accountant/20 text-role-accountant">
          <Gavel className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-lg">Day Vote</h3>
      </div>

      {/* Label + Select */}
      <label className="block text-sm font-medium mb-2">
        Select who to{" "}
        <span className="text-accent-gold font-semibold">fire</span>:
      </label>

      {noTargets ? (
        <p className="text-sm text-white/60 italic">No one left to fire.</p>
      ) : (
        <select
          className="w-full rounded-xl bg-ink-900/50 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          disabled={isLocked || !!votedFor}
        >
          <option value="">-- Choose a player --</option>
          {aliveOthers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={!canSubmit}
        className={`mt-4 w-full rounded-xl py-2.5 font-medium transition-colors ${
          canSubmit
            ? "bg-accent-gold text-ink-900 hover:bg-yellow-400"
            : "bg-white/10 text-white/50 cursor-not-allowed"
        }`}
      >
        {pending ? "Submitting…" : votedFor ? "Submitted" : "Submit Vote"}
      </button>

      {/* Status / hints */}
      {votedFor && (
        <p className="mt-3 text-xs text-white/70">
          ✅ You voted to fire <b className="text-white">{votedFor}</b>.
        </p>
      )}
      {phase !== "morning_meeting" && !votedFor && (
        <p className="mt-3 text-xs text-white/60">
          Voting opens during the Day phase.
        </p>
      )}
      {hasVotedDay && !votedFor && (
        <p className="mt-3 text-xs text-white/60">
          You’ve already voted today.
        </p>
      )}
    </section>
  );
}
