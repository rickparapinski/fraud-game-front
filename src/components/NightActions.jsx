"use client";
import { useMemo, useState, useEffect } from "react";
import { Skull, Search, ShieldCheck, Check, X } from "lucide-react";
import { ACTION_TYPES, ROLES } from "@/lib/constants";

// --- SUB-COMPONENT: The Accountant's Ledger (Mini-Game) ---
function AccountantLedger({ onAct }) {
  const [problem, setProblem] = useState(null);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState("");
  const [penalty, setPenalty] = useState(false);

  const generateProblem = () => {
    const a = Math.floor(Math.random() * 51) + 15; // 15–65
    const b = Math.floor(Math.random() * 51) + 15; // 15–65
    const c = Math.floor(Math.random() * 26) + 5;  // 5–30 discount
    const correctTotal = a + b - c;

    const isCorrect = Math.random() > 0.5;
    // Wrong answer off by 1–4 (hard to spot at a glance)
    const sign = Math.random() > 0.5 ? 1 : -1;
    const offset = isCorrect ? 0 : sign * (Math.floor(Math.random() * 4) + 1);
    const displayTotal = correctTotal + offset;

    const invoiceNum = Math.floor(Math.random() * 9000) + 1000;
    setProblem({ a, b, c, correctTotal, displayTotal, isCorrect, invoiceNum });
  };

  useEffect(() => {
    generateProblem();
  }, []);

  const handleAnswer = (userApproved) => {
    if (!problem) return;
    const isSuccess = problem.isCorrect === userApproved;

    if (isSuccess) {
      setScore((s) => s + 1);
      setFlash("bg-green-200");
      onAct("work_task", null);
    } else {
      setFlash("bg-red-200");
      setScore(0);
      setPenalty(true);
      onAct("work_reset", null);
      setTimeout(() => setPenalty(false), 1500);
    }

    setTimeout(() => setFlash(""), 300);
    generateProblem();
  };

  return (
    <div
      className={`p-4 border-2 border-gray-600 bg-[#e0e0d1] text-black shadow-inner transition-colors duration-200 ${flash}`}
    >
      {/* Header */}
      <div className="flex items-end justify-between pb-2 mb-3 border-b border-gray-500">
        <span className="text-xs font-bold text-gray-600 uppercase">
          INVOICE_VERIFICATION.EXE
        </span>
        <span className="font-mono text-sm font-bold text-blue-900">
          PROCESSED: {score}
        </span>
      </div>

      {/* Penalty banner */}
      {penalty && (
        <div className="mb-3 p-1 bg-red-800 text-white text-center text-[11px] font-bold tracking-widest animate-blink">
          ⚠ AUDIT ERROR — QUOTA RESET
        </div>
      )}

      {/* Invoice */}
      {problem && (
        <div className="mb-4 bg-white border border-gray-300 shadow-sm font-mono text-sm text-black">
          <div className="text-center text-gray-400 text-[10px] uppercase tracking-widest py-2 border-b border-gray-200">
            INVOICE #{problem.invoiceNum}
          </div>
          <div className="px-4 py-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Services Rendered</span>
              <span className="font-bold">${problem.a}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Materials</span>
              <span className="font-bold">${problem.b}</span>
            </div>
            <div className="flex justify-between text-red-700">
              <span>Discount Applied</span>
              <span className="font-bold">-${problem.c}</span>
            </div>
            <div className="border-t border-dashed border-gray-400 pt-2 flex justify-between font-bold text-base">
              <span>TOTAL DUE</span>
              <span className="underline decoration-dotted decoration-gray-400">
                ${problem.displayTotal}
              </span>
            </div>
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

      <p className="mt-4 text-xs text-center text-gray-700 font-bold border-t border-gray-300 pt-2">
        * Errors reset your entire audit quota. Precision required.
      </p>
    </div>
  );
}

// --- SUB-COMPONENT: Fraudster team vote board ---
function FraudVoteBoard({ me, players, fraudVotes }) {
  const aliveFraudsters = players.filter(
    (p) => p.isActive && p.role === ROLES.FRAUDSTER,
  );

  // Find the leading target (if any)
  const tally = {};
  for (const v of fraudVotes || []) tally[v.targetId] = (tally[v.targetId] || 0) + 1;
  const topCount = Math.max(0, ...Object.values(tally));
  const topTargetIds = topCount > 0
    ? Object.entries(tally).filter(([, c]) => c === topCount).map(([id]) => id)
    : [];
  const hasConsensus = topTargetIds.length === 1 && topCount === aliveFraudsters.length;

  return (
    <div className="mt-3 border-t border-gray-400 border-dashed pt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-red-900 uppercase tracking-wide">
          Team Votes
        </span>
        {hasConsensus && (
          <span className="text-[10px] font-bold text-green-800 bg-green-100 px-1 border border-green-700">
            CONSENSUS
          </span>
        )}
      </div>
      <div className="space-y-[2px]">
        {aliveFraudsters.map((f) => {
          const vote = fraudVotes?.find((v) => v.voterId === f.id);
          const isMe = f.id === me.id;
          const isLeading = vote && topTargetIds.includes(vote.targetId) && topCount > 1;
          return (
            <div
              key={f.id}
              className={`flex items-center justify-between px-2 py-[3px] text-[11px] font-mono
                ${isLeading ? "bg-red-100 border border-red-400" : "bg-gray-100 border border-gray-300"}`}
            >
              <span className={`truncate max-w-[90px] ${isMe ? "font-bold" : "text-gray-700"}`}>
                {f.name}{isMe ? " (you)" : ""}
              </span>
              <span className="flex items-center gap-1">
                {vote ? (
                  <>
                    <span className="text-gray-400">→</span>
                    <span className={`font-bold ${isLeading ? "text-red-800" : "text-black"}`}>
                      {vote.targetName}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 italic">—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function NightActions({ me, players, onAct, fraudTally, fraudVotes, auditHistory, protectHistory }) {
  const [targetId, setTargetId] = useState("");
  const [pending, setPending] = useState(false);
  const [submittedFor, setSubmittedFor] = useState(null);

  // All hooks must run before any conditional return
  const aliveOthers = useMemo(
    () => players.filter((p) => p.isActive && p.id !== me.id),
    [players, me.id],
  );

  if (me.role === ROLES.ACCOUNTANT) {
    return <AccountantLedger onAct={onAct} />;
  }

  const isFraudster = me.role === ROLES.FRAUDSTER;

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

  // Fraudsters can re-vote any time — derive filed state from server votes
  const myFiledVote = isFraudster
    ? fraudVotes?.find((v) => v.voterId === me.id)
    : null;

  const submit = async () => {
    if (!targetId || pending) return;
    setPending(true);

    const actionType = isFraudster
      ? ACTION_TYPES.FRAUD_TARGET
      : me.role === ROLES.AUDITOR
        ? ACTION_TYPES.AUDIT_CHECK
        : ACTION_TYPES.PROTECT;

    try {
      await onAct(actionType, targetId);
      if (!isFraudster) {
        const p = players.find((x) => x.id === targetId);
        setSubmittedFor(p?.name || "Unknown");
      }
    } finally {
      setPending(false);
    }
  };

  const isLocked = !isFraudster && (pending || !!submittedFor);

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
            disabled={isLocked}
          >
            <option value="">-- SELECT --</option>
            {aliveOthers.map((p) => {
              const audited = me.role === "auditor" && auditHistory?.[p.sessionId];
              const protected_ = me.role === "controller" && protectHistory?.[p.sessionId];
              return (
                <option key={p.id} value={p.id}>
                  {p.name}{audited ? " [audited]" : ""}{protected_ ? ` [guarded ×${protected_.count}]` : ""}
                </option>
              );
            })}
          </select>
        </div>

        <button
          onClick={submit}
          disabled={pending || !targetId || isLocked}
          className="w-full py-2 text-xs font-bold bg-gray-300 border-2 border-black retro-btn hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending
            ? "PROCESSING..."
            : isFraudster && myFiledVote
              ? "UPDATE VOTE"
              : submittedFor
                ? "ACTION FILED"
                : config.btnText}
        </button>
      </div>

      {/* FEEDBACK / VOTE BOARD */}
      {me.role === "auditor" && (
        <div className="pt-2 mt-3 border-t border-gray-400 border-dashed">
          <p className="text-[10px] text-gray-600 italic">
            * Report will be generated at 09:00 AM.
          </p>
        </div>
      )}

      {!isFraudster && submittedFor && (
        <div className="inline-block px-2 py-1 mt-3 text-xs font-bold text-green-700 transform border-2 border-green-700 -rotate-2 opacity-80">
          [✓] FILED: {submittedFor}
        </div>
      )}

      {isFraudster && (
        <FraudVoteBoard me={me} players={players} fraudVotes={fraudVotes} />
      )}
    </div>
  );
}
