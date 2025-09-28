"use client";
import { useMemo, useState } from "react";

export default function VotingPanel({ me, players, onVote, disabled }) {
  const [targetId, setTargetId] = useState("");
  const [pending, setPending] = useState(false);
  const [votedFor, setVotedFor] = useState(null);

  // Only alive others
  const aliveOthers = useMemo(
    () => (players || []).filter((p) => p.isActive && p.id !== me?.id),
    [players, me?.id]
  );

  const submit = async () => {
    if (!targetId || pending || disabled) return;
    setPending(true);
    try {
      await onVote(targetId);
      const t = aliveOthers.find((p) => p.id === targetId);
      setVotedFor(t?.name || "Unknown");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="border rounded p-3 space-y-2">
      <div className="font-medium">Day Vote</div>
      <label className="text-sm">Select a player</label>
      <select
        className="w-full border rounded p-2"
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        disabled={pending || disabled || !!votedFor}
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
        disabled={!targetId || pending || disabled || !!votedFor}
        className={`w-full rounded p-2 ${
          !targetId || pending || disabled || votedFor
            ? "bg-gray-300"
            : "bg-black text-white"
        }`}
      >
        {pending ? "Submitting…" : votedFor ? "Submitted" : "Submit"}
      </button>
      {votedFor && (
        <div className="text-xs text-gray-600">
          You voted for <b>{votedFor}</b>.
        </div>
      )}
    </div>
  );
}
