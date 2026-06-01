"use client";
import { useEffect, useMemo, useState } from "react";
import { Gavel } from "lucide-react";

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

  // Reset on new day
  useEffect(() => {
    if (phase === "day") {
      setTargetId("");
      setPending(false);
      setVotedFor(null);
    }
  }, [phase]);

  const aliveOthers = useMemo(
    () => (players || []).filter((p) => p.isActive && p.id !== me?.id),
    [players, me?.id],
  );

  const hasVoted = hasVotedDay || !!votedFor;
  const isLocked = pending || disabled || phase !== "day" || hasVoted;
  const canSubmit = !!targetId && !isLocked && aliveOthers.length > 0;

  const submit = async () => {
    if (!canSubmit) return;
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
    <div className="font-mono text-sm">
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-1 mb-3 border-b border-gray-400">
        <Gavel className="w-4 h-4 text-red-800" />
        <span className="font-bold text-red-900 uppercase">
          TERMINATION_REQUEST
        </span>
      </div>

      {aliveOthers.length === 0 ? (
        <div className="py-2 text-xs italic text-center text-gray-500">
          NO STAFF REMAINING
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
              Select Employee to Fire:
            </label>
            <select
              className="w-full p-1 text-lg text-black bg-white border-2 border-gray-600 font-retro focus:outline-none focus:bg-red-50"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={isLocked}
            >
              <option value="">-- SELECT --</option>
              {aliveOthers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full py-2 text-xs font-bold text-red-900 bg-red-100 border-2 border-black retro-btn hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
          >
            {pending ? "PROCESSING..." : hasVoted ? "VOTE FILED" : "SUBMIT TERMINATION"}
          </button>
        </div>
      )}

      {/* STATUS STAMP */}
      <div className="mt-4 min-h-[24px]">
        {votedFor ? (
          <div className="inline-block px-2 py-1 text-xs font-bold text-red-600 transform border-2 border-red-600 border-double -rotate-3">
            TERMINATION PENDING: {votedFor}
          </div>
        ) : hasVotedDay ? (
          // Use this if we know they voted but don't have the name locally (e.g. page refresh)
          <div className="text-xs italic text-center text-gray-500">
            (Vote Filed - Select new target to change)
          </div>
        ) : null}
      </div>
    </div>
  );
}
