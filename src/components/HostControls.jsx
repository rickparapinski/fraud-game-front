"use client";
import { sfx } from "@/lib/sfx";

export default function HostControls({
  isHost,
  phase,
  gameOver,
  onStartGame,
  onBeginNight,
  onRestart,
}) {
  return (
    <div className="w95">
      <div className="w95-title">
        <span>MANAGER_OVERRIDE.EXE</span>
        <span className="w95-ctl">x</span>
      </div>

      <div className="p-3 flex flex-col gap-2">
        {!isHost ? (
          <div className="override-note py-2">
            ⚠ MANAGER CLEARANCE REQUIRED
            <br />
            — host controls the floor —
          </div>
        ) : (
          <>
            <div className="override-label">Phase Controls</div>
            <div className="override-sep" />

            {phase === "lobby" && (
              <button
                onClick={() => {
                  sfx.good();
                  onStartGame();
                }}
                className="btn95 override-btn"
              >
                START AUDIT SEQUENCE
              </button>
            )}

            {(phase === "day" || phase === "night") && (
              <button
                onClick={() => {
                  sfx.click();
                  onBeginNight();
                }}
                className="btn95 override-btn"
              >
                {phase === "day" ? "INITIATE NIGHT SHIFT" : "FORCE PHASE END"}
              </button>
            )}

            {gameOver && (
              <button
                onClick={onRestart}
                className="btn95 override-btn !text-red-900"
              >
                REBOOT SYSTEM
              </button>
            )}

            {!gameOver &&
              phase !== "lobby" &&
              phase !== "day" &&
              phase !== "night" && (
                <div className="override-note py-2">
                  WAITING FOR SUB-ROUTINES...
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
