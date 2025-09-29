import { Trophy, Skull } from "lucide-react";

export function GameOverBanner({ winner, reason }) {
  const isFraud = winner?.toLowerCase().includes("fraud");
  const Icon = isFraud ? Skull : Trophy;
  const bg = isFraud
    ? "bg-red-900/40 border-red-700 text-red-100"
    : "bg-emerald-900/40 border-emerald-700 text-emerald-100";

  return (
    <div
      className={`mt-4 rounded-xl border px-5 py-4 flex items-center gap-3 justify-center text-lg font-semibold ${bg}`}
    >
      <Icon className="w-6 h-6" />
      <span>
        Game Over — {winner?.toUpperCase()} ({reason})
      </span>
    </div>
  );
}
