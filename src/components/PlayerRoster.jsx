import { ROLES } from "@/lib/constants";

export default function PlayerRoster({
  players,
  myRole,
  mySessionId,
  phase,
  votingMap,
  auditHistory,
  protectHistory,
}) {
  return (
    <div className="retro-window flex-1 flex flex-col p-1 min-h-[200px]">
      <div className="mb-1 retro-title-bar">
        <span>STAFF_DIR.EXE</span>
      </div>
      <div className="flex-1 p-2 overflow-y-auto bg-white border-2 border-gray-600 shadow-inner">
        <div className="grid grid-cols-1 gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 p-1 border ${
                !p.isActive
                  ? "bg-gray-300 border-gray-400 grayscale"
                  : "bg-blue-100 border-blue-300"
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center text-xs border ${
                  !p.isActive
                    ? "bg-gray-400 border-gray-500"
                    : "bg-blue-300 border-blue-500"
                }`}
              >
                {p.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold leading-none text-black truncate">
                  {p.name}
                </div>
                <div
                  className={`text-[10px] uppercase tracking-tighter ${
                    !p.isActive ? "text-red-600 font-bold" : "text-green-600"
                  }`}
                >
                  {!p.isActive ? "TERMINATED" : "ACTIVE"}
                </div>
              </div>

              {myRole === ROLES.AUDITOR && p.sessionId !== mySessionId && (() => {
                const entry = auditHistory[p.sessionId];
                if (!entry) return null;
                return (
                  <span
                    className={`ml-auto text-[9px] font-bold px-1 py-px border font-pixel ${
                      entry.isFraudster
                        ? "text-red-700 bg-red-100 border-red-500"
                        : "text-green-700 bg-green-100 border-green-500"
                    }`}
                    title={`Audited: ${entry.isFraudster ? "FRAUDSTER" : "CLEAN"}`}
                  >
                    {entry.isFraudster ? "FRAUD" : "CLEAN"}
                  </span>
                );
              })()}

              {myRole === ROLES.CONTROLLER && p.sessionId !== mySessionId && (() => {
                const entry = protectHistory[p.sessionId];
                if (!entry) return null;
                return (
                  <span
                    className="ml-auto text-[9px] font-bold px-1 py-px border font-pixel text-blue-700 bg-blue-100 border-blue-500"
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

              {p.isHost && <span title="Host">👑</span>}
            </div>
          ))}
          {players.length === 0 && (
            <div className="mt-4 text-xs text-center text-gray-500">
              Searching for staff...
            </div>
          )}
        </div>
      </div>
      <div className="bg-[#d1d1c4] px-2 py-1 text-xs text-black border-t border-gray-400 flex justify-between">
        <span>{players.length} RECORDS</span>
        <span>DB: ONLINE</span>
      </div>
    </div>
  );
}
