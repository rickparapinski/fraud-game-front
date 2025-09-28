"use client";

export default function GameLog({ logs }) {
  const formatEntry = (e) => {
    if (!e) return "";
    const num = typeof e.number === "number" ? e.number : "";
    if (e.type === "day-results") {
      const { eliminatedId, eliminatedName, tally } = e.data || {};
      if (eliminatedId) {
        // find the votes for the eliminated target (if present)
        let votes = null;
        if (Array.isArray(tally)) {
          const hit = tally.find((t) => t.targetId === eliminatedId);
          votes = hit?.votes ?? null;
        }
        return `Day ${num}: ${eliminatedName} was eliminated${
          votes != null ? ` with ${votes} vote(s)` : ""
        }.`;
      }
      return `Day ${num}: No elimination.`;
    }
    if (e.type === "night-results") {
      const { eliminatedName, protectedName } = e.data || {};
      if (eliminatedName) {
        return `Night ${num}: ${eliminatedName} was eliminated.${
          protectedName ? ` (Protected: ${protectedName})` : ""
        }`;
      }
      if (protectedName) {
        return `Night ${num}: No one eliminated (protected: ${protectedName}).`;
      }
      return `Night ${num}: No one was eliminated.`;
    }
    // Fallback: show server text but strip any " (ROLE)" bit just in case
    return String(e.text || "").replace(/\s+\([A-Z_]+\)/g, "");
  };

  if (!logs?.length) {
    return (
      <div className="border rounded p-3 text-sm text-gray-500">
        No logs yet. They’ll appear here as the game progresses.
      </div>
    );
  }

  return (
    <div className="border rounded p-3 h-64 overflow-auto space-y-2 text-sm">
      {logs.map((e) => (
        <div
          key={e.id || `${e.ts}-${Math.random()}`}
          className="border-b last:border-b-0 pb-2"
        >
          <div className="font-medium">{formatEntry(e)}</div>

          {/* Keep the day vote breakdown (names + counts), no roles here */}
          {e.type === "day-results" &&
            Array.isArray(e.data?.tally) &&
            e.data.tally.length > 0 && (
              <div className="mt-1 text-xs text-gray-600">
                Votes:&nbsp;
                {e.data.tally.map((t, i) => (
                  <span key={`${t.targetId}-${i}`}>
                    {t.targetName} ({t.votes})
                    {i < e.data.tally.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}

          <div className="text-[11px] text-gray-400 mt-0.5">
            {e.ts ? new Date(e.ts).toLocaleTimeString() : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
