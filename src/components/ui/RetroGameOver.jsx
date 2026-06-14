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

  const ROLE_COLORS = {
    fraudster: "#c0392b",
    auditor: "#8e44ad",
    controller: "#1f6feb",
    accountant: "#2d7d46",
  };

  return (
    <div className="report-overlay95">
      <div className="w95 report-window95">
        <div className="w95-title">
          <span>INCIDENT_REPORT.EXE</span>
          <span className="w95-ctl">x</span>
        </div>
        <div className="flex flex-col min-h-0 gap-2 p-2">
          <div
            className={`report-banner95 ${
              isFraudWin ? "banner-fraud95" : "banner-clean95"
            }`}
          >
            {isFraudWin
              ? "✗ BRANCH COLLAPSE — FRAUD WINS"
              : "✓ BOOKS BALANCED — CLEAN TEAM WINS"}
          </div>

          <div className="report-reason95">
            Termination Reason: {reasonLabel}
          </div>

          {/* Player Role Reveal */}
          <div className="report-roster95 flex-1">
            {players.map((p) => (
              <div key={p.id} className="report-row95">
                <span className={p.isActive === false ? "line-through opacity-50" : ""}>
                  {p.name}
                </span>
                <span className="report-dots95" />
                <span
                  className="report-role95"
                  style={{ color: ROLE_COLORS[p.role] || "#444" }}
                >
                  {p.role || "UNKNOWN"}
                </span>
                <span
                  className={`report-fate95 ${
                    p.isActive === false ? "st-dead" : "st-active"
                  }`}
                >
                  {p.isActive === false ? "TERMINATED" : "SURVIVED"}
                </span>
              </div>
            ))}
          </div>

          {/* Back to lobby */}
          <button onClick={onRestart} className="btn95 w-full py-3">
            OPEN NEW BRANCH (NEW_ROOM.BAT)
          </button>
        </div>
      </div>
    </div>
  );
}
