"use client";

export default function HostControls({
  isHost,
  phase,
  gameOver,
  startGame,
  beginNight,
  className = "",
}) {
  if (!isHost) return null;

  return (
    <section
      className={`rounded-2xl border border-ink-700 bg-ink-800/95 p-5 mb-4 text-white ring-1 ring-role-accountant/30 shadow-[0_0_25px_-5px_rgba(59,130,246,0.35)] ${className}`}
    >
      <h3 className="font-semibold text-lg mb-3">Host Controls</h3>

      {phase === "lobby" && (
        <button
          onClick={startGame}
          className="w-full rounded-xl py-3 font-semibold bg-accent-gold text-ink-900 hover:bg-yellow-400 transition"
        >
          Start Audit
        </button>
      )}

      {phase === "morning_meeting" && !gameOver && (
        <button
          onClick={beginNight}
          className="w-full rounded-xl py-3 font-semibold bg-accent-gold text-ink-900 hover:bg-yellow-400 transition"
        >
          Begin Night
        </button>
      )}

      {phase !== "lobby" && phase !== "morning_meeting" && (
        <p className="text-sm text-white/60">
          Host actions will appear here when available.
        </p>
      )}
    </section>
  );
}
