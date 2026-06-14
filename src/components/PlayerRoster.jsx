"use client";
import { useEffect, useState } from "react";
import { ROLES, ACTION_TYPES } from "@/lib/constants";
import { sfx } from "@/lib/sfx";

// Night-action config per role: which action each role files from the directory
const NIGHT_SLOTS = {
  [ROLES.FRAUDSTER]: { type: ACTION_TYPES.FRAUD_TARGET, verb: "TARGET", done: "TARGETED" },
  [ROLES.AUDITOR]: { type: ACTION_TYPES.AUDIT_CHECK, verb: "AUDIT", done: "FILED" },
  [ROLES.CONTROLLER]: { type: ACTION_TYPES.PROTECT, verb: "GUARD", done: "FILED" },
};

export default function PlayerRoster({
  players,
  me,
  myRole,
  mySessionId,
  phase,
  votingMap,
  auditHistory,
  protectHistory,
  fraudVotes,
  hasVotedDay = false,
  onDayVote,
  onNightAction,
}) {
  // local action state — resets every phase change
  const [votedId, setVotedId] = useState(null); // day vote target (this client)
  const [actedId, setActedId] = useState(null); // auditor/controller night target
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setVotedId(null);
    setActedId(null);
    setPending(false);
  }, [phase]);

  const iAmActive = me?.isActive !== false;
  const nightSlot = phase === "night" && iAmActive ? NIGHT_SLOTS[myRole] : null;
  const isFraudster = myRole === ROLES.FRAUDSTER;

  // fraudster target is server-synced (can be updated until night resolves)
  const myFraudTargetId = isFraudster
    ? fraudVotes?.find((v) => v.voterId === me?.id)?.targetId
    : null;

  const dayLocked = hasVotedDay || !!votedId || pending;
  const nightLocked = !isFraudster && (!!actedId || pending);

  const castVote = async (p) => {
    if (dayLocked || !onDayVote) return;
    sfx.click();
    setPending(true);
    try {
      await onDayVote(p.id);
      setVotedId(p.id);
    } finally {
      setPending(false);
    }
  };

  const fileNightAction = async (p) => {
    if (!nightSlot || !onNightAction) return;
    if (!isFraudster && nightLocked) return;
    sfx.click();
    setPending(true);
    try {
      await onNightAction(nightSlot.type, p.id);
      if (!isFraudster) setActedId(p.id);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w95 flex-1 flex flex-col min-h-[200px]">
      <div className="w95-title">
        <span>STAFF_DIR.EXE</span>
        <span className="w95-ctl">x</span>
      </div>
      <div className="flex flex-col flex-1 min-h-0 gap-1 p-2">
        <div className="staff-list95 flex-1 overflow-y-auto scroll95">
          <div className="grid grid-cols-1 gap-[5px]">
            {[...players].sort((a, b) => b.isActive - a.isActive).map((p) => {
              const isMe = p.sessionId === mySessionId;
              const isTargetable = iAmActive && p.isActive && !isMe;

              const showVoteBtn =
                phase === "day" && isTargetable && !!onDayVote;
              const showNightBtn = !!nightSlot && isTargetable && !!onNightAction;

              const isMyVote = votedId === p.id;
              const isMyNightTarget = isFraudster
                ? myFraudTargetId === p.id
                : actedId === p.id;

              return (
                <div
                  key={p.id}
                  className={`staff-card ${!p.isActive ? "staff-dead" : ""}`}
                >
                  <div className={`staff-avatar ${isMe ? "is-me" : ""}`}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="staff-name">
                      <span className="truncate">{p.name}</span>
                      {isMe && <span className="you-chip">YOU</span>}
                      {p.isHost && <span title="Host">👑</span>}
                    </div>
                    <div
                      className={`staff-status ${
                        !p.isActive ? "st-dead" : "st-active"
                      }`}
                    >
                      {!p.isActive ? "TERMINATED" : "ACTIVE"}
                    </div>
                  </div>

                  {myRole === ROLES.AUDITOR &&
                    p.sessionId !== mySessionId &&
                    (() => {
                      const entry = auditHistory[p.sessionId];
                      if (!entry) return null;
                      return (
                        <span
                          className={`badge95 ${
                            entry.isFraudster ? "badge-fraud" : "badge-clean"
                          }`}
                        >
                          {(entry.role || (entry.isFraudster ? "fraudster" : "unknown")).toUpperCase()}
                        </span>
                      );
                    })()}

                  {myRole === ROLES.CONTROLLER &&
                    p.sessionId !== mySessionId &&
                    (() => {
                      const entry = protectHistory[p.sessionId];
                      if (!entry) return null;
                      return (
                        <span
                          className="badge95 badge-guarded"
                          title={`Protected ${entry.count}x`}
                        >
                          {`GUARDED${entry.count > 1 ? ` ×${entry.count}` : ""}`}
                        </span>
                      );
                    })()}

                  {phase === "day" && p.isActive && (
                    <span
                      className="text-xs"
                      title={votingMap.get(p.id) ? "Voted" : "Waiting for vote"}
                    >
                      {votingMap.get(p.id) ? "🗳️" : "⏳"}
                    </span>
                  )}

                  {showVoteBtn && (
                    <button
                      className={`btn95 !text-[7px] !px-2 !py-1 ${isMyVote ? "pressed" : ""}`}
                      disabled={dayLocked && !isMyVote}
                      onClick={() => castVote(p)}
                    >
                      {isMyVote ? "VOTED" : "VOTE"}
                    </button>
                  )}

                  {showNightBtn && (
                    <button
                      className={`btn95 !text-[7px] !px-2 !py-1 ${isMyNightTarget ? "pressed" : ""}`}
                      disabled={nightLocked && !isMyNightTarget}
                      onClick={() => fileNightAction(p)}
                    >
                      {isMyNightTarget ? nightSlot.done : nightSlot.verb}
                    </button>
                  )}
                </div>
              );
            })}
            {players.length === 0 && (
              <div className="mt-4 text-base text-center text-gray-500 font-retro">
                Searching for staff...
              </div>
            )}
          </div>
        </div>
        <div className="staff-footer95">
          <span>{players.length} RECORDS</span>
          <span>DB: ONLINE</span>
        </div>
      </div>
    </div>
  );
}
