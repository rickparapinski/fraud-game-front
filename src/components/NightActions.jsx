"use client";
import { useMemo, useState } from "react";
import { Skull, Search, ShieldCheck } from "lucide-react";

export default function NightActions({ me, players, onAct, fraudTally }) {
  const [targetId, setTargetId] = useState("");
  const [pending, setPending] = useState(false);
  const [submittedFor, setSubmittedFor] = useState(null);

  const aliveOthers = useMemo(
    () => players.filter((p) => p.isActive && p.id !== me.id),
    [players, me.id]
  );

  const roleConfig = {
    fraudster: {
      label: "ELIMINATION_TARGET",
      Icon: Skull,
      btnText: "CONFIRM TARGET",
    },
    auditor: {
      label: "AUDIT_SUBJECT",
      Icon: Search,
      btnText: "REQUEST RECORDS",
    },
    controller: {
      label: "ASSET_PROTECTION",
      Icon: ShieldCheck,
      btnText: "ASSIGN GUARD",
    },
  };

  const config = roleConfig[me.role];
  const Icon = config?.Icon;

  if (!config)
    return (
      <div className="font-mono text-xs text-gray-500">
        NO ACTIONS AVAILABLE FOR ROLE: {me.role}
      </div>
    );

  const submit = async () => {
    if (!targetId || pending) return;
    setPending(true);

    // Map role to action type string expected by backend
    const actionType =
      me.role === "fraudster"
        ? "fraudster_target"
        : me.role === "auditor"
        ? "audit_check"
        : "protect_employee";

    try {
      await onAct(actionType, targetId);
      const p = players.find((x) => x.id === targetId);
      setSubmittedFor(p?.name || "Unknown");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="font-mono text-sm">
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-1 mb-3 border-b border-gray-400">
        {Icon && <Icon className="w-4 h-4 text-black" />}
        <span className="font-bold text-black uppercase">{config.label}</span>
      </div>

      {/* FORM */}
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">
            Select Employee:
          </label>
          <select
            className="w-full p-1 text-lg text-black bg-white border-2 border-gray-600 font-retro focus:outline-none focus:bg-yellow-50"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={pending || !!submittedFor}
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
          disabled={pending || !targetId || !!submittedFor}
          className="w-full py-2 text-xs font-bold bg-gray-300 border-2 border-black retro-btn hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending
            ? "PROCESSING..."
            : submittedFor
            ? "ACTION FILED"
            : config.btnText}
        </button>
      </div>

      {/* FEEDBACK MESSAGES */}
      <div className="pt-2 mt-3 border-t border-gray-400 border-dashed">
        {/* Auditor Note */}
        {me.role === "auditor" && (
          <p className="text-[10px] text-gray-600 italic">
            * Report will be generated at 09:00 AM (Morning Phase).
          </p>
        )}

        {/* Fraudster Tally */}
        {me.role === "fraudster" && fraudTally && (
          <div className="p-2 mt-2 bg-gray-200 border border-gray-400">
            <div className="font-bold text-[10px] text-red-800 mb-1 uppercase">
              Team Consensus:
            </div>
            <ul className="list-square list-inside text-[10px] text-black">
              {Object.entries(fraudTally).map(([tid, count]) => {
                const p = players.find((x) => x.id === tid);
                return (
                  <li key={tid}>
                    {p?.name || tid}: {count} votes
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Success Stamp */}
        {submittedFor && (
          <div className="inline-block px-2 py-1 mt-2 text-xs font-bold text-green-700 transform border-2 border-green-700 -rotate-2 opacity-80">
            [✓] FILED: {submittedFor}
          </div>
        )}
      </div>
    </div>
  );
}
