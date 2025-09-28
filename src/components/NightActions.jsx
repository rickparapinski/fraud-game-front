"use client";
import { useMemo, useState } from "react";

export default function NightActions({ me, players, onAct, fraudTally }) {
  const [targetId, setTargetId] = useState("");
  const [submittedFor, setSubmittedFor] = useState(null);
  const [pending, setPending] = useState(false);

  const aliveOthers = useMemo(
    () => players.filter((p) => p.isActive && p.id !== me.id),
    [players, me.id]
  );

  const label =
    me.role === "fraudster"
      ? "Choose a target to eliminate"
      : me.role === "auditor"
      ? "Choose a player to audit"
      : me.role === "controller"
      ? "Choose a player to protect"
      : "";

  const actionType =
    me.role === "fraudster"
      ? "fraudster_target"
      : me.role === "auditor"
      ? "audit_check"
      : me.role === "controller"
      ? "protect_employee"
      : null;

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
    <div className="border rounded p-3 space-y-3">
      <div className="font-medium">Night Actions</div>
      {actionType ? (
        <>
          <label className="text-sm">{label}</label>
          <select
            className="w-full border rounded p-2"
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
            className="w-full rounded p-2 bg-black text-white"
          >
            Submit Action
          </button>
          {me?.role === "auditor" && (
            <p className="text-xs text-gray-500">
              Your audit result appears at morning.
            </p>
          )}
          {me.role === "fraudster" && fraudTally && (
            <div className="text-xs text-gray-600">
              <div className="mt-2 font-medium">
                Fraudster vote tally (private):
              </div>
              <ul className="list-disc list-inside">
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
        </>
      ) : (
        <div className="text-sm text-gray-600">
          Accountants rest during night.
        </div>
      )}
    </div>
  );
}
