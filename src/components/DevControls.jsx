"use client";

export default function DevControls({
  DEV_CONTROLS,
  isHost,
  phase,
  devRole,
  setDevRole,
  applyDevRole,
  devRoleStatus,
  ALLOW_BOTS,
  botCount,
  setBotCount,
  spawnBots,
  despawnBots,
  className = "",
}) {
  if (!isHost) return null;

  return (
    <details
      className={`rounded-xl border border-white/10 bg-white/5 p-4 mb-4 text-sm open:shadow-sm ${className}`}
    >
      <summary className="cursor-pointer select-none list-none">
        <span className="inline-flex items-center gap-2">
          <span className="text-white/80">Developer Tools</span>
          <span className="text-white/40 text-xs">(click to toggle)</span>
        </span>
      </summary>

      <div className="mt-3 space-y-4">
        {DEV_CONTROLS && (
          <div className="space-y-2">
            <div className="text-white/80 font-medium">Dev: Pick My Role</div>
            <select
              className="w-full rounded-md bg-ink-900/60 border border-white/10 px-3 py-2 text-sm"
              value={devRole}
              onChange={(e) => setDevRole(e.target.value)}
              disabled={phase !== "lobby"}
            >
              <option value="">-- Select a role --</option>
              <option value="fraudster">Fraudster</option>
              <option value="auditor">Auditor</option>
              <option value="controller">Controller</option>
              <option value="accountant">Accountant</option>
            </select>
            <button
              onClick={applyDevRole}
              disabled={!devRole || phase !== "lobby"}
              className={`w-full rounded-md py-2 text-sm ${
                !devRole || phase !== "lobby"
                  ? "bg-white/10 text-white/50 cursor-not-allowed"
                  : "bg-white/15 text-white hover:bg-white/20"
              }`}
            >
              Apply Role (Host)
            </button>
            {devRoleStatus && (
              <div className="text-xs text-white/60">{devRoleStatus}</div>
            )}
            <p className="text-[11px] text-white/50">
              Dev-only. Applies to host in the lobby. Roles stay balanced via
              swap.
            </p>
          </div>
        )}

        {ALLOW_BOTS && (
          <div className="space-y-2">
            <div className="text-white/80 font-medium">Debug: Spawn Bots</div>
            <div className="text-xs text-white/50">
              env:{String(ALLOW_BOTS)} | phase:{phase} | isHost:{String(isHost)}
            </div>
            <input
              type="number"
              min={1}
              max={16}
              value={botCount}
              onChange={(e) =>
                setBotCount(
                  Math.max(1, Math.min(16, Number(e.target.value) || 1))
                )
              }
              className="w-full rounded-md bg-ink-900/60 border border-white/10 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={spawnBots}
                disabled={phase !== "lobby"}
                className={`flex-1 rounded-md py-2 text-sm border border-white/10 ${
                  phase !== "lobby"
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-white/10 hover:bg-white/15"
                }`}
              >
                Spawn
              </button>
              <button
                onClick={despawnBots}
                className="flex-1 rounded-md py-2 text-sm border border-white/10 bg-white/10 hover:bg-white/15"
              >
                Despawn
              </button>
            </div>
            <p className="text-xs text-white/50">
              Bots can only join in the lobby. Start the audit after spawning.
            </p>
          </div>
        )}
      </div>
    </details>
  );
}
