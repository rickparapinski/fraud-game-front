"use client";

const REASON_LABELS = {
  "fraudsters:after-night":
    "Fraudsters seized board majority via hostile termination",
  "fraudsters:after-day":
    "Fraudsters gained board majority during shareholder vote",
  "employees:after-day": "All fraudsters removed via shareholder vote",
  "employees:after-night": "All fraudsters eliminated during audit",
};

export default function RetroGameOver({
  winner,
  reason,
  players = [],
  onRestart,
  isHost = false,
}) {
  const isFraudWin = winner === "fraudsters";
  const reasonLabel =
    REASON_LABELS[`${winner}:${reason}`] || reason || "Unknown";

  // Classic BSOD Blue or Hacker Green/Red based on winner
  const bgClass = isFraudWin ? "bg-[#880000]" : "bg-[#0000AA]";
  const title = isFraudWin
    ? "SYSTEM FAILURE: FRAUD DETECTED"
    : "AUDIT COMPLETE: SYSTEM SECURE";

  return (
    <div
      className={`absolute inset-0 z-[100] ${bgClass} text-white font-mono p-8 overflow-y-auto animate-in zoom-in-95 duration-100`}
    >
      {/* Crash Header */}
      <div className="mb-8 text-center">
        <div className="inline-block px-4 py-1 mb-4 font-bold text-black bg-white">
          {title}
        </div>
        <p className="text-lg">
          A fatal exception has occurred at {new Date().toLocaleTimeString()}.
          <br />
          The current game session has been terminated.
        </p>
      </div>

      {/* Result */}
      <div className="flex flex-col items-center gap-4 pb-8 mb-8 border-b-2 border-white/30">
        <div className="text-center">
          <div className="text-xs tracking-widest uppercase opacity-80">
            VICTOR
          </div>
          <div className="mt-1 text-5xl font-bold font-pixel animate-pulse">
            {winner?.toUpperCase()}S
          </div>
        </div>
        <div className="px-4 py-2 text-sm border rounded bg-black/30 border-white/20">
          Termination Reason: {reasonLabel}
        </div>
      </div>

      {/* Player Role Reveal (Memory Dump) */}
      <div className="max-w-2xl mx-auto">
        <p className="mb-2 text-xs uppercase opacity-70">
          *** STOP: 0x000000 (PLAYER_ROLE_DUMP)
        </p>
        <div className="grid grid-cols-1 font-mono text-sm sm:grid-cols-2 gap-x-8 gap-y-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-end justify-between pb-1 border-b border-white/20"
            >
              <span>{p.name}</span>
              <span className="font-bold tracking-wider uppercase opacity-80">
                {p.role || "UNKNOWN"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Back to lobby */}
      <div className="mt-12 text-center">
        <button
          onClick={onRestart}
          className="px-6 py-3 text-xl font-bold text-black bg-[#c0c0c0] retro-btn font-retro hover:bg-white active:translate-y-1"
        >
          NEW_ROOM.BAT
        </button>
      </div>
    </div>
  );
}
