"use client";
import { useMemo } from "react";
import { Gavel } from "lucide-react";

// Day votes are now cast directly on the STAFF_DIR.EXE cards; this panel
// shows the briefing and the filed-vote status.
export default function VotingPanel({
  me,
  players,
  onVote,
  disabled,
  phase,
  hasVotedDay = false,
}) {
  const aliveOthers = useMemo(
    () => (players || []).filter((p) => p.isActive && p.id !== me?.id),
    [players, me?.id],
  );

  return (
    <div className="font-retro text-lg">
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-1 mb-2 border-b border-gray-400">
        <Gavel className="w-4 h-4 text-red-800" />
        <span className="font-pixel text-[8px] text-red-900 uppercase">
          TERMINATION_REQUEST
        </span>
      </div>

      {aliveOthers.length === 0 ? (
        <div className="py-2 text-base italic text-center text-gray-500">
          NO STAFF REMAINING
        </div>
      ) : hasVotedDay ? (
        <div className="inline-block px-2 py-1 text-base font-bold text-red-600 transform border-2 border-red-600 border-double -rotate-2">
          [✓] VOTE FILED — awaiting the rest of the floor
        </div>
      ) : (
        <p className="text-gray-700 leading-tight">
          ► Debate, then hit VOTE next to a name in STAFF_DIR.EXE. Majority gets
          terminated.
        </p>
      )}
    </div>
  );
}
