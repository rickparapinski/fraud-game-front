"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useGameLogic } from "@/hooks/useGameLogic";

// UI Components
import Monitor from "@/components/Monitor";
import NightActions from "@/components/NightActions";
import VotingPanel from "@/components/VotingPanel";
import GameLog from "@/components/GameLog";
import HostControls from "@/components/HostControls";
import RetroGameOver from "@/components/ui/RetroGameOver";
import RetroToast from "@/components/ui/RetroToast";
import RetroPhaseSummary from "@/components/ui/RetroPhaseSummary";
import AudioController from "@/components/AudioController";
import CityBackground from "@/components/CityBackground";
import PlayerRoster from "@/components/PlayerRoster";
import { sfx } from "@/lib/sfx";

const ALLOW_BOTS = process.env.NEXT_PUBLIC_ALLOW_BOTS === "true";
const DEV_CONTROLS = process.env.NEXT_PUBLIC_DEV_CONTROLS === "true";

/* ==================================================================================
   COMPONENT: RoomPage (Visuals)
   ================================================================================== */
export default function RoomPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const name = (search.get("name") || "Player").trim();
  const roomCode = useMemo(
    () => (params?.roomCode ? String(params.roomCode).toUpperCase() : ""),
    [params?.roomCode],
  );

  const game = useGameLogic(roomCode, name);
  const { actions } = game;

  // Stable callbacks so toast/summary timers don't reset on every re-render
  const handleCloseError = useCallback(() => game.setError(""), [game.setError]);
  const handleCloseAuditMsg = useCallback(() => { game.setAuditMsg(""); game.setAuditTitle(""); }, [game.setAuditMsg, game.setAuditTitle]);
  const handleDismissDaySummary = useCallback(() => game.setDaySummary(null), [game.setDaySummary]);

  // -- Local UI State --
  const [devMode, setDevMode] = useState(false);
  const [botCount, setBotCount] = useState(10);
  const [botsSpawned, setBotsSpawned] = useState(false);
  const [devRole, setDevRole] = useState("");
  const [copied, setCopied] = useState(false);

  // -- Derived --
  const me = useMemo(() => {
    return (
      game.players.find((p) => p.sessionId === game.mySessionId) || {
        id: game.socketId || "pending",
        name,
        isActive: true,
        role: game.myRole,
      }
    );
  }, [game.players, name, game.myRole, game.mySessionId, game.socketId]);

  const votingMap = useMemo(() => {
    const map = new Map();
    for (const s of game.dayVotingStatus || []) {
      map.set(s.id, s.hasVoted);
    }
    return map;
  }, [game.dayVotingStatus]);

  // Time Left Calc
  const [timeLeft, setTimeLeft] = useState("00:00");
  const [msLeft, setMsLeft] = useState(0);
  useEffect(() => {
    if (!game.deadline) {
      setTimeLeft("00:00");
      setMsLeft(0);
      return;
    }
    const interval = setInterval(() => {
      const ms = game.deadline - (Date.now() + game.offsetMs);
      if (ms <= 0) {
        setTimeLeft("00:00");
        setMsLeft(0);
        return;
      }
      setMsLeft(ms);
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTimeLeft(`${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [game.deadline, game.offsetMs]);
  const timerUrgent = msLeft > 0 && msLeft <= 10000;

  // -- Local flavor log lines (client-side only, merged into SECURITY_LOG) --
  const [localLines, setLocalLines] = useState([]);
  const localIdRef = useRef(0);
  const addLine = useCallback((text, type = "flavor") => {
    setLocalLines((ls) => [
      ...ls,
      { id: `local-${++localIdRef.current}`, ts: Date.now(), type, text },
    ]);
  }, []);

  // "X punched in. (badge printed)" — every roster addition (players and bots)
  const prevIdsRef = useRef(null);
  useEffect(() => {
    if (!game.players.length) return;
    const ids = new Set(game.players.map((p) => p.sessionId || p.id));
    if (prevIdsRef.current === null) {
      // first snapshot: announce yourself only, not the whole existing roster
      prevIdsRef.current = ids;
      addLine(`${name} punched in. (badge printed)`, "system");
      return;
    }
    for (const p of game.players) {
      if (!prevIdsRef.current.has(p.sessionId || p.id)) {
        addLine(`${p.name} punched in. (badge printed)`, "system");
      }
    }
    prevIdsRef.current = ids;
  }, [game.players, addLine, name]);

  // Phase-change jingles + flavor lines + game-over sting (no game logic)
  const prevPhaseRef = useRef(null);
  useEffect(() => {
    if (prevPhaseRef.current && prevPhaseRef.current !== game.phase) {
      const nightsResolved = (game.logs || []).filter(
        (l) => l.type === "night-results",
      ).length;
      if (game.phase === "night") {
        if (prevPhaseRef.current === "lobby") {
          addLine(
            `AUDIT SEQUENCE INITIATED. ${game.players.length} employees on the books.`,
            "system",
          );
        }
        addLine(`Night ${nightsResolved + 1}: lights out. Lock your drawers.`);
        sfx.night();
      } else if (game.phase === "day") {
        addLine(
          `Day ${Math.max(1, nightsResolved)}: discussion open. Majority vote terminates one employee.`,
        );
        sfx.day();
      }
    }
    prevPhaseRef.current = game.phase;
  }, [game.phase, game.logs, game.players.length, addLine]);

  // backend logs + local flavor lines, in chronological order
  const mergedLogs = useMemo(
    () =>
      [...(game.logs || []), ...localLines].sort(
        (a, b) => new Date(a.ts || 0) - new Date(b.ts || 0),
      ),
    [game.logs, localLines],
  );
  useEffect(() => {
    if (game.gameOver) {
      (game.gameOver.winner === "fraudsters" ? sfx.alert : sfx.good)();
    }
  }, [game.gameOver]);

  const phaseLabel =
    game.phase === "lobby"
      ? "LOBBY"
      : game.phase === "night"
        ? "NIGHT"
        : game.phase === "day"
          ? "DAY"
          : "COMPLETE";

  // Copy Code Handler
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Unable to copy", err);
    }
  };

  return (
    <div className="relative z-0 flex items-center justify-center w-full h-screen p-2 md:p-4 overflow-hidden">
      {/* City backdrop — scrolls behind the monitor */}
      <CityBackground phase={game.phase} />

      <Monitor>
        <div className="relative w-full h-full flex flex-col overflow-hidden font-retro os-desktop-flat">
          {/* CRT line texture — sits on the teal desktop, behind every window */}
          <div className="crt-scanlines95" />

          {/* === GAME OVER OVERLAY (Inside Monitor) === */}
          {game.gameOver && (
            <RetroGameOver
              winner={game.gameOver.winner}
              reason={game.gameOver.reason}
              players={game.gameOver.players || game.players}
              onRestart={() => router.push("/")}
              isHost={game.isHost}
            />
          )}

          {/* === 1. TOP STATUS BAR === */}
          <div className="flex justify-between items-stretch gap-2 px-2 pt-2 text-black select-none z-20">
            {/* Left: Dept ID (Now Clickable) */}
            <button
              onClick={handleCopyCode}
              title="Click to copy room code"
              className="dept-plate group"
            >
              <span className="hidden sm:inline">DEPT:</span>
              <span className="dept-code">
                {copied ? "COPIED!" : roomCode}
              </span>
              {!copied && (
                <span className="text-xs opacity-50 group-hover:opacity-100">
                  📋
                </span>
              )}
            </button>

            {/* Center: Phase LEDs */}
            <div className="flex-1 phase-tabs">
              {["LOBBY", "NIGHT", "DAY", "COMPLETE"].map((p) => (
                <div
                  key={p}
                  className={`phase-tab ${phaseLabel === p ? "active" : ""}`}
                >
                  {p}
                </div>
              ))}
            </div>
            {/* Right: Clock */}
            <div className="flex items-center h-full gap-2">
              <AudioController phase={game.phase} />
              <div
                className="clock95"
                style={timerUrgent ? {
                  color: "#ff4444",
                  borderColor: "#ff4444",
                  animation: "timer-urgent-pulse 0.6s ease-in-out infinite alternate",
                  textShadow: "0 0 8px #ff4444",
                } : undefined}
              >
                {timeLeft}
              </div>
            </div>
          </div>

          {/* === 2. MAIN SPLIT VIEW === */}
          <div className="relative flex flex-col flex-1 gap-4 p-2 overflow-hidden md:flex-row md:p-4">
            {/* --- BANNERS (Overlay) --- */}
            <div className="absolute z-50 flex flex-col items-center w-full max-w-md gap-2 px-4 transform -translate-x-1/2 pointer-events-none top-4 left-1/2">
              <div className="w-full pointer-events-auto">
                {game.error && (
                  <RetroToast
                    type="error"
                    message={game.error}
                    onClose={handleCloseError}
                  />
                )}
                {game.auditMsg && (
                  <RetroToast
                    type="audit"
                    title={game.auditTitle || undefined}
                    message={game.auditMsg}
                    duration={12000}
                    onClose={handleCloseAuditMsg}
                  />
                )}
                {game.daySummary && (
                  <RetroPhaseSummary
                    phase="morning_meeting"
                    eliminatedName={game.daySummary.eliminatedName}
                    eliminatedRole={game.daySummary.eliminatedRole}
                    onDismiss={handleDismissDaySummary}
                  />
                )}
              </div>
            </div>

            {/* --- LEFT COLUMN (Work Area) --- */}
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {/* A. CURRENT_TASK.EXE (Redesigned Dossier Style) */}
              {game.phase !== "lobby" && !game.gameOver && (
                <div className="w95 flex-shrink-0 flex flex-col max-h-[50vh]">
                  <div className="w95-title">
                    <span>CURRENT_TASK.EXE</span>
                    <div className="flex gap-1">
                      <span className="w95-ctl">_</span>
                      <span className="w95-ctl">x</span>
                    </div>
                  </div>

                  <div className="bg-[#c6c6c6] p-2 md:p-3 overflow-y-auto flex-1 scroll95 space-y-2">
                    {/* 1. Role "Paper Form" */}
                    {game.myRole && (
                      <div className="memo">
                        <div className="memo-head">
                          <span className="memo-confidential">
                            C O N F I D E N T I A L
                          </span>
                          <span className="memo-ref">REF: {roomCode}-88</span>
                        </div>
                        <div className="memo-divider" />

                        <div className="mb-2">
                          <span className="memo-label">ASSIGNMENT:</span>
                          <span className="memo-role">{game.myRole}</span>
                        </div>

                        <div className="memo-brief">
                          <span className="memo-label">BRIEF:</span>
                          {game.roleInfo}
                        </div>

                        {game.teammates.length > 0 && (
                          <div className="memo-partners">
                            <span className="memo-label">PARTNERS:</span>
                            {game.teammates.map((t, i) => {
                              const alive = game.players.find((p) => p.id === t.id)?.isActive !== false;
                              return (
                                <span key={t.id} className={alive ? "" : "line-through opacity-50"}>
                                  {t.name}{i < game.teammates.length - 1 ? ", " : ""}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Action Area */}
                    <div className="action-panel">
                      <div>
                        <div className="action-title">
                          Action Required
                        </div>
                        <div className="retro-form-wrapper">
                          {game.phase === "night" && me?.isActive && (
                            <NightActions
                              me={{ ...me, role: game.myRole }}
                              players={game.players}
                              onAct={actions.submitNightAction}
                              fraudTally={game.fraudTally}
                              fraudVotes={game.fraudVotes}
                              auditHistory={game.auditHistory}
                              protectHistory={game.protectHistory}
                              teammates={game.teammates}
                            />
                          )}
                          {game.phase === "day" && (
                            <div className="mb-2 font-retro text-lg text-gray-600">
                              Waiting on{" "}
                              {
                                game.players.filter(
                                  (p) => p.isActive && !votingMap.get(p.id),
                                ).length
                              }{" "}
                              player(s)
                            </div>
                          )}
                          {game.phase === "day" && me?.isActive && (
                            <VotingPanel
                              me={me}
                              players={game.players}
                              onVote={actions.castDayVote}
                              disabled={false}
                              phase={game.phase}
                              hasVotedDay={!!votingMap.get(me.id)}
                            />
                          )}
                        </div>
                        {!me?.isActive && (
                          <div className="denied-banner">
                            ⚠ ACCESS DENIED: TERMINATED
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* B. SECURITY_LOG.TXT (Raw Terminal) */}
              <div className="flex flex-col flex-1 min-h-0 w95">
                <div className="w95-title">
                  <span>SECURITY_LOG.TXT</span>
                  <div className="flex gap-1">
                    <span className="w95-ctl">_</span>
                    <span className="w95-ctl">x</span>
                  </div>
                </div>
                <div className="relative flex-1 min-h-0 bg-black">
                  <GameLog logs={mergedLogs} />
                </div>
              </div>
            </div>

            {/* --- RIGHT COLUMN (Sidebar) --- */}
            <div className="flex flex-col flex-shrink-0 w-full gap-4 md:w-72">
              {/* 1. HOST CONTROLS */}
              <HostControls
                isHost={game.isHost}
                phase={game.phase}
                gameOver={game.gameOver}
                onStartGame={actions.startGame}
                onBeginNight={actions.beginNight}
                onRestart={() => router.push("/")}
              />

              {/* 2. STAFF DIRECTORY */}
              <PlayerRoster
                players={game.players}
                me={me}
                myRole={game.myRole}
                mySessionId={game.mySessionId}
                phase={game.phase}
                votingMap={votingMap}
                auditHistory={game.auditHistory}
                protectHistory={game.protectHistory}
                fraudVotes={game.fraudVotes}
                hasVotedDay={!!votingMap.get(me.id)}
                onDayVote={actions.castDayVote}
                onNightAction={actions.submitNightAction}
              />

              {/* 3. DEV TOOLS */}
              {DEV_CONTROLS && (
                <div className="w95 !bg-[#3a3a3a]">
                  <button
                    onClick={() => setDevMode(!devMode)}
                    className="w95-title w-full text-left !bg-[#1a1a1a] cursor-pointer"
                  >
                    [{devMode ? "-" : "+"}] DEVELOPER_TOOLS
                  </button>
                  {devMode && (
                    <div className="p-2 space-y-2 font-retro text-base text-green-500">
                      {game.isHost ? (
                        <>
                          <div className="space-y-1">
                            <label className="dev-label block">
                              PICK ROLE:
                            </label>
                            <select
                              value={devRole}
                              onChange={(e) => setDevRole(e.target.value)}
                              className="dev-select95"
                            >
                              <option value="">-- Select --</option>
                              <option value="fraudster">Fraudster</option>
                              <option value="auditor">Auditor</option>
                              <option value="controller">Controller</option>
                              <option value="accountant">Accountant</option>
                            </select>
                            <button
                              onClick={() => actions.setDevRole(devRole)}
                              className="dev-apply95"
                            >
                              APPLY
                            </button>
                          </div>
                          {ALLOW_BOTS && game.phase === "lobby" && (
                            <div className="pt-2 space-y-1 border-t border-gray-600">
                              <label className="dev-label block">
                                BOTS:
                              </label>
                              <div className="flex gap-1">
                                <input
                                  value={botCount}
                                  onChange={(e) =>
                                    setBotCount(Number(e.target.value))
                                  }
                                  disabled={botsSpawned}
                                  className="w-12 text-center dev-select95 !w-12 disabled:opacity-40"
                                />
                                <button
                                  onClick={async () => {
                                    await actions.spawnBots(botCount);
                                    setBotsSpawned(true);
                                  }}
                                  disabled={botsSpawned}
                                  className="flex-1 dev-apply95 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {botsSpawned ? "SPAWNED" : "SPAWN"}
                                </button>
                              </div>
                              <button
                                onClick={async () => {
                                  await actions.despawnBots();
                                  setBotsSpawned(false);
                                }}
                                className="w-full dev-apply95 !text-red-500 !border-red-800 hover:!bg-red-950"
                              >
                                CLEAR BOTS
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-red-500">
                          ERR: HOST_ACCESS_REQUIRED
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Monitor>
    </div>
  );
}
