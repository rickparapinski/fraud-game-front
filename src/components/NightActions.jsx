"use client";
import { useMemo, useState, useEffect } from "react";
import { Skull, Search, ShieldCheck, Check, X } from "lucide-react";

// --- SUB-COMPONENT: The Accountant's Ledger (Mini-Game) ---
function AccountantLedger({ onAct }) {
  const [problem, setProblem] = useState(null);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState(""); // 'green', 'red', or ''

  // 1. Generate a new Invoice Problem
  const generateProblem = () => {
    // Random numbers between 10 and 99
    const a = Math.floor(Math.random() * 90) + 10;
    const b = Math.floor(Math.random() * 90) + 10;
    const correctSum = a + b;

    // 50% chance to be correct, 50% chance to be wrong (by +/- 10)
    const isCorrect = Math.random() > 0.5;
    const displaySum = isCorrect
      ? correctSum
      : correctSum + (Math.floor(Math.random() * 10) - 5) || correctSum + 5;

    setProblem({ a, b, displaySum, isCorrect });
  };

  // Initial load
  useEffect(() => {
    generateProblem();
  }, []);

  // 2. Handle User Input
  const handleAnswer = (userApproved) => {
    if (!problem) return;

    // Logic:
    // - Problem is TRUE and user clicked APPROVE (True) -> Correct
    // - Problem is FALSE and user clicked REJECT (False) -> Correct
    const isSuccess = problem.isCorrect === userApproved;

    if (isSuccess) {
      setScore((s) => s + 1);
      setFlash("bg-green-200");
      // Send 'ping' to server (no targetId needed for work tasks)
      onAct("work_task", null);
    } else {
      setFlash("bg-red-200");
    }

    // Reset flash and get new problem
    setTimeout(() => setFlash(""), 200);
    generateProblem();
  };

  return (
    <div
      className={`p-4 border-2 border-gray-600 bg-[#e0e0d1] shadow-inner transition-colors duration-200 ${flash}`}
    >
      {/* Header */}
      <div className="flex items-end justify-between pb-2 mb-4 border-b border-gray-500">
        <span className="text-xs font-bold text-gray-600 uppercase">
          INVOICE_VERIFICATION.EXE
        </span>
        <span className="font-mono text-sm font-bold text-blue-900">
          PROCESSED: {score}
        </span>
      </div>

      {/* The Invoice */}
      {problem && (
        <div className="py-4 mb-4 text-center bg-white border border-gray-300 shadow-sm">
          <div className="text-gray-500 text-[10px] uppercase mb-1 tracking-widest">
            Verify Sum
          </div>
          <div className="font-mono text-2xl font-bold tracking-widest text-black">
            ${problem.a} + ${problem.b} ={" "}
            <span className="underline decoration-dotted decoration-gray-400">
              ${problem.displaySum}
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAnswer(false)}
          className="flex items-center justify-center gap-2 py-3 font-bold text-red-900 bg-red-100 border-2 border-red-800 shadow-sm hover:bg-red-200 active:translate-y-1"
        >
          <X className="w-5 h-5" /> REJECT
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className="flex items-center justify-center gap-2 py-3 font-bold text-green-900 bg-green-100 border-2 border-green-800 shadow-sm hover:bg-green-200 active:translate-y-1"
        >
          <Check className="w-5 h-5" /> APPROVE
        </button>
      </div>

      <p className="mt-4 text-[10px] text-center text-gray-500 italic border-t border-gray-300 pt-2">
        * Correctly processing invoices generates Department Budget Surplus.
        <br />* Surplus unlocks HR records for eliminated employees.
      </p>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function NightActions({ me, players, onAct, fraudTally }) {
  const [targetId, setTargetId] = useState("");
  const [pending, setPending] = useState(false);
  const [submittedFor, setSubmittedFor] = useState(null);

  // ✅ 1. If Accountant, show the Ledger immediately (Exit early)
  if (me.role === "accountant") {
    return <AccountantLedger onAct={onAct} />;
  }

  // --- Logic for other roles (Fraudster, Auditor, Controller) ---
  const aliveOthers = useMemo(
    () => players.filter((p) => p.isActive && p.id !== me.id),
    [players, me.id],
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

  if (!config) return <div className="text-xs">NO ACTIONS</div>;

  const submit = async () => {
    if (!targetId || pending) return;
    setPending(true);

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
          disabled={pending || !targetId}
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
        {me.role === "auditor" && (
          <p className="text-[10px] text-gray-600 italic">
            * Report will be generated at 09:00 AM.
          </p>
        )}
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
        {submittedFor && (
          <div className="inline-block px-2 py-1 mt-2 text-xs font-bold text-green-700 transform border-2 border-green-700 -rotate-2 opacity-80">
            [✓] FILED: {submittedFor}
          </div>
        )}
      </div>
    </div>
  );
}
