"use client";
import { useState, useEffect } from "react";
import { Skull, Search, ShieldCheck, Check, X } from "lucide-react";
import { ACTION_TYPES, ROLES } from "@/lib/constants";
import { sfx } from "@/lib/sfx";

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
      sfx.click();
      setScore((s) => s + 1);
      setFlash("bg-green-200");
      onAct(ACTION_TYPES.WORK_TASK, null);
    } else {
      sfx.alert();
      setFlash("bg-red-200");
      setScore(0);
      setPenalty(true);
      onAct(ACTION_TYPES.WORK_RESET, null);
      setTimeout(() => setPenalty(false), 1500);
    }

    setTimeout(() => setFlash(""), 300);
    generateProblem();
  };

  return (
    <div
      className={`text-black transition-colors duration-200 ${flash} ${penalty ? "inv-shake95" : ""}`}
    >
      {/* Header */}
      <div className="flex items-end justify-between pb-2 mb-2">
        <span className="font-pixel text-[8px] text-gray-600 uppercase">
          INVOICE_VERIFICATION.EXE
        </span>
        <span className="font-pixel text-[8px] font-bold text-blue-900">
          PROCESSED: {score}
        </span>
      </div>

      {/* Penalty banner */}
      {penalty && (
        <div className="mb-2 p-1 bg-red-800 text-white text-center font-pixel text-[9px] tracking-widest animate-blink">
          ⚠ AUDIT ERROR — QUOTA RESET
        </div>
      )}

      {/* Invoice */}
      {problem && (
        <div className="mb-3 bg-white border border-gray-300 font-retro text-lg text-black">
          <div className="text-center text-gray-400 font-pixel text-[8px] uppercase tracking-[3px] py-2 border-b border-gray-200">
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
            <div className="border-t-2 border-dashed border-gray-300 pt-2 flex justify-between font-pixel text-[10px]">
              <span>TOTAL DUE</span>
              <span>${problem.displayTotal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => handleAnswer(false)} className="inv-btn95 inv-reject95">
          <X className="w-4 h-4" /> REJECT
        </button>
        <button onClick={() => handleAnswer(true)} className="inv-btn95 inv-approve95">
          <Check className="w-4 h-4" /> APPROVE
        </button>
      </div>

      <p className="mt-3 text-base text-center text-gray-600 font-retro">
        * Errors reset your entire audit quota. Precision required.
      </p>
    </div>
  );
}

// --- SUB-COMPONENT: Fraudster team vote board ---
function FraudVoteBoard({ me, players, fraudVotes, teammates }) {
  // Build full fraudster list from teammates (co-fraudsters) + self, then cross-ref isActive from public roster
  const aliveFraudsters = [...(teammates || []).map((t) => ({ id: t.id, name: t.name })), { id: me.id, name: me.name }]
    .filter((f) => {
      const p = players.find((p) => p.id === f.id);
      return p ? p.isActive : true;
    });

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
              <span className={`truncate max-w-[90px] ${isMe ? "font-bold text-black" : "text-gray-700"}`}>
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
// Night targets are now filed directly on the STAFF_DIR.EXE cards; this panel
// shows the briefing, role-specific intel, and the fraud team vote board.
export default function NightActions({ me, players, onAct, fraudTally, fraudVotes, auditHistory, protectHistory, teammates }) {
  const isFraudster = me.role === ROLES.FRAUDSTER;

  if (me.role === ROLES.ACCOUNTANT) {
    return <AccountantLedger onAct={onAct} />;
  }

  const roleConfig = {
    fraudster: {
      label: "ELIMINATION_TARGET",
      Icon: Skull,
      hint: "Pick an employee in STAFF_DIR.EXE to shred their contract. You can change the target until sunrise.",
    },
    auditor: {
      label: "AUDIT_SUBJECT",
      Icon: Search,
      hint: "Pick an employee in STAFF_DIR.EXE to pull their books. One audit per night.",
    },
    controller: {
      label: "ASSET_PROTECTION",
      Icon: ShieldCheck,
      hint: "Pick an employee in STAFF_DIR.EXE to protect tonight. One guard per night.",
    },
  };

  const config = roleConfig[me.role];
  const Icon = config?.Icon;

  if (!config) return <div className="text-xs">NO ACTIONS</div>;

  const myFiledVote = isFraudster
    ? fraudVotes?.find((v) => v.voterId === me.id)
    : null;

  return (
    <div className="font-retro text-lg">
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-1 mb-2 border-b border-gray-400">
        {Icon && <Icon className="w-4 h-4 text-black" />}
        <span className="font-pixel text-[8px] text-black uppercase">{config.label}</span>
      </div>

      <p className="text-gray-700 leading-tight">► {config.hint}</p>

      {isFraudster && myFiledVote && (
        <div className="inline-block px-2 py-1 mt-2 text-base font-bold text-red-700 transform border-2 border-red-700 -rotate-2 opacity-80">
          TARGET LOCKED: {myFiledVote.targetName}
        </div>
      )}

      {me.role === "auditor" && (
        <p className="mt-2 text-base text-gray-600 italic">
          * Report will be generated at 09:00 AM.
        </p>
      )}

      {isFraudster && (
        <FraudVoteBoard me={me} players={players} fraudVotes={fraudVotes} teammates={teammates} />
      )}
    </div>
  );
}
