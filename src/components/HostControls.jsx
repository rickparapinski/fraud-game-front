"use client";

export default function HostControls({
  isHost,
  phase,
  gameOver,
  onStartGame,
  onBeginNight,
  onRestart,
}) {
  return (
    <div className="p-1 retro-window">
      {/* Red Title Bar for "Admin/Host" feel */}
      <div className="mb-1 text-white bg-red-900 retro-title-bar">
        <span>MANAGER_OVERRIDE.EXE</span>
        <span className="text-[8px]">X</span>
      </div>

      <div className="bg-[#d1d1c4] p-3 flex flex-col gap-2">
        {!isHost ? (
          <div className="py-2 font-mono text-xs italic text-center text-gray-500 bg-gray-100 border border-gray-400 border-dashed">
            ⚠ AUTHENTICATION REQUIRED:
            <br />
            HOST ACCESS ONLY
          </div>
        ) : (
          <>
            <div className="text-black text-[10px] font-bold uppercase mb-1 border-b border-gray-400 pb-1">
              Phase Controls
            </div>

            {phase === "lobby" && (
              <button
                onClick={onStartGame}
                className="w-full py-3 text-xs font-bold bg-white border-2 border-black retro-btn hover:bg-green-100 active:translate-y-1"
              >
                START AUDIT SEQUENCE
              </button>
            )}

            {(phase === "day" || phase === "night") && (
              <button
                onClick={onBeginNight}
                className="w-full py-3 text-xs font-bold bg-white border-2 border-black retro-btn hover:bg-blue-100 active:translate-y-1"
              >
                {phase === "day" ? "INITIATE NIGHT SHIFT" : "FORCE PHASE END"}
              </button>
            )}

            {gameOver && (
              <button
                onClick={onRestart}
                className="w-full py-3 text-xs font-bold text-red-900 bg-red-100 border-2 border-black retro-btn hover:bg-red-200 active:translate-y-1"
              >
                REBOOT SYSTEM
              </button>
            )}

            {!gameOver &&
              phase !== "lobby" &&
              phase !== "day" &&
              phase !== "night" && (
                <div className="py-2 text-xs text-center text-gray-500">
                  WAITING FOR SUB-ROUTINES...
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
