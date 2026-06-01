"use client";

import { useEffect, useMemo, useState } from "react";
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

const ALLOW_BOTS = process.env.NEXT_PUBLIC_ALLOW_BOTS === "true";
const DEV_CONTROLS = process.env.NEXT_PUBLIC_ALLOW_BOTS === "true";

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

  // -- Local UI State --
  const [devMode, setDevMode] = useState(false);
  const [botCount, setBotCount] = useState(6);
  const [devRole, setDevRole] = useState("");
  const [copied, setCopied] = useState(false);

  // -- Derived --
  const me = useMemo(() => {
    const sid = game.socketId;
    return (
      game.players.find((p) => p.id === sid) || {
        id: sid || "pending",
        name,
        isActive: true,
        role: game.myRole,
      }
    );
  }, [game.players, name, game.myRole, game.socketId]);

  const votingMap = useMemo(() => {
    const map = new Map();
    for (const s of game.dayVotingStatus || []) {
      map.set(s.id, s.hasVoted);
    }
    return map;
  }, [game.dayVotingStatus]);

  // Time Left Calc
  const [timeLeft, setTimeLeft] = useState("00:00");
  useEffect(() => {
    if (!game.deadline) {
      setTimeLeft("00:00");
      return;
    }
    const interval = setInterval(() => {
      const ms = game.deadline - (Date.now() + game.offsetMs);
      if (ms <= 0) {
        setTimeLeft("00:00");
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTimeLeft(`${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [game.deadline, game.offsetMs]);

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
        <div className="relative w-full h-full flex flex-col overflow-hidden font-retro bg-[var(--win-teal)]">
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
          <div className="bg-[#c0c0c0] border-b-2 border-white flex justify-between items-center px-2 py-1 text-black select-none shadow-md z-20">
            {/* Left: Dept ID (Now Clickable) */}
            <button
              onClick={handleCopyCode}
              title="Click to copy room code"
              className="flex items-center gap-2 px-2 transition-colors bg-gray-200 border-2 border-gray-600 border-b-white border-r-white hover:bg-white active:border-t-gray-600 active:border-l-gray-600 active:border-b-white active:border-r-white group"
            >
              <span className="hidden font-bold sm:inline">DEPT:</span>
              <span className="text-xl tracking-widest font-retro">
                {copied ? "COPIED!" : roomCode}
              </span>
              {!copied && (
                <span className="text-xs opacity-50 group-hover:opacity-100">
                  📋
                </span>
              )}
            </button>

            {/* Center: Phase LEDs */}
            <div className="flex gap-1 p-1 bg-gray-800 border border-white rounded border-b-gray-600 border-r-gray-600">
              {["LOBBY", "NIGHT", "DAY", "COMPLETE"].map((p) => (
                <div
                  key={p}
                  className={`px-2 text-xs font-pixel py-1 ${
                    phaseLabel === p
                      ? "bg-green-500 text-black animate-pulse"
                      : "text-gray-500"
                  }`}
                >
                  {p}
                </div>
              ))}
            </div>
            {/* Right: Clock */}
            <div className="flex items-center h-full gap-2">
              <AudioController phase={game.phase} />
              <div className="w-20 px-2 font-mono text-xl text-center text-red-500 bg-black border-2 border-gray-600 border-b-white border-r-white">
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
                    onClose={() => game.setError("")}
                  />
                )}
                {game.auditMsg && (
                  <RetroToast
                    type="audit"
                    message={game.auditMsg}
                    duration={12000}
                    onClose={() => game.setAuditMsg("")}
                  />
                )}

                {game.nightSummary && (
                  <RetroPhaseSummary
                    phase="night"
                    eliminatedName={game.nightSummary.eliminatedName}
                    protectedName={game.nightSummary.protectedName}
                    onDismiss={() => game.setNightSummary(null)}
                  />
                )}

                {game.daySummary && (
                  <RetroPhaseSummary
                    phase="day"
                    eliminatedName={game.daySummary.eliminatedName}
                    eliminatedRole={game.daySummary.eliminatedRole}
                    onDismiss={() => game.setDaySummary(null)}
                  />
                )}
              </div>
            </div>

            {/* --- LEFT COLUMN (Work Area) --- */}
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {/* A. CURRENT_TASK.EXE (Redesigned Dossier Style) */}
              {game.phase !== "lobby" && !game.gameOver && (
                <div className="retro-window flex-shrink-0 flex flex-col max-h-[50vh]">
                  <div className="bg-blue-900 retro-title-bar">
                    <span>CURRENT_TASK.EXE</span>
                    <div className="flex gap-1">
                      <span className="text-[8px]">_</span>
                      <span className="text-[8px]">X</span>
                    </div>
                  </div>

                  <div className="bg-[#d1d1c4] p-4 overflow-y-auto flex-1">
                    {/* 1. Role "Paper Form" */}
                    {game.myRole && (
                      <div className="bg-white border border-gray-400 p-3 shadow-md mb-4 relative transform rotate-[0.5deg]">
                        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#d1d1c4]"></div>
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#d1d1c4]"></div>

                        <div className="flex items-end justify-between pb-2 mb-2 border-b-2 border-gray-300 border-dashed">
                          <span className="text-xl tracking-widest text-gray-400 uppercase font-retro">
                            CONFIDENTIAL
                          </span>
                          <span className="font-mono text-[10px] text-gray-500">
                            REF: {roomCode}-88
                          </span>
                        </div>

                        <div className="grid grid-cols-[80px_1fr] gap-2 items-baseline">
                          <span className="font-bold text-[10px] uppercase text-gray-600 text-right">
                            Assignment:
                          </span>
                          <span className="px-1 text-sm text-blue-900 uppercase font-pixel bg-blue-50">
                            {game.myRole}
                          </span>

                          <span className="font-bold text-[10px] uppercase text-gray-600 text-right">
                            Brief:
                          </span>
                          <span className="font-mono text-xs leading-tight text-gray-800">
                            {game.roleInfo}
                          </span>

                          {game.teammates.length > 0 && (
                            <>
                              <span className="font-bold text-[10px] uppercase text-red-600 text-right">
                                Partners:
                              </span>
                              <span className="font-mono text-xs font-bold text-red-800">
                                {game.teammates.map((t) => t.name).join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 2. Action Area */}
                    <div className="p-1 bg-gray-200 border-2 border-gray-500">
                      <div className="border border-gray-400 p-2 bg-[#e0e0d1]">
                        <div className="font-bold text-[10px] uppercase mb-2 text-gray-600 border-b border-gray-400">
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
                            />
                          )}
                          {game.phase === "day" && (
                            <div className="mb-2 font-mono text-xs text-gray-600">
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
                          <div className="py-4 font-bold text-center text-red-600 bg-black border border-red-500">
                            ⚠ ACCESS DENIED: TERMINATED
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* B. SECURITY_LOG.TXT (Raw Terminal) */}
              <div className="flex flex-col flex-1 min-h-0 retro-window">
                <div className="retro-title-bar">
                  <span>SECURITY_LOG.TXT</span>
                  <div className="flex gap-1">
                    <span className="cursor-pointer">_</span>
                    <span className="cursor-pointer">X</span>
                  </div>
                </div>
                <div className="relative flex-1 min-h-0 bg-black">
                  <GameLog logs={game.logs} />
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
              <div className="retro-window flex-1 flex flex-col p-1 min-h-[200px]">
                <div className="mb-1 retro-title-bar">
                  <span>STAFF_DIR.EXE</span>
                </div>
                <div className="flex-1 p-2 overflow-y-auto bg-white border-2 border-gray-600 shadow-inner">
                  <div className="grid grid-cols-1 gap-2">
                    {game.players.map((p) => (
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
                              !p.isActive
                                ? "text-red-600 font-bold"
                                : "text-green-600"
                            }`}
                          >
                            {!p.isActive ? "TERMINATED" : "ACTIVE"}
                          </div>
                        </div>
                        {/* Audit badge — only visible to the auditor */}
                        {game.myRole === "auditor" && p.sessionId !== game.mySessionId && (() => {
                          const entry = game.auditHistory[p.sessionId];
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
                        {/* Guard badge — only visible to the controller */}
                        {game.myRole === "controller" && p.sessionId !== game.mySessionId && (() => {
                          const entry = game.protectHistory[p.sessionId];
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
                        {game.phase === "day" && p.isActive && (
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
                    {game.players.length === 0 && (
                      <div className="mt-4 text-xs text-center text-gray-500">
                        Searching for staff...
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-[#d1d1c4] px-2 py-1 text-xs text-black border-t border-gray-400 flex justify-between">
                  <span>{game.players.length} RECORDS</span>
                  <span>DB: ONLINE</span>
                </div>
              </div>

              {/* 3. DEV TOOLS */}
              {DEV_CONTROLS && (
                <div className="p-1 retro-window">
                  <button
                    onClick={() => setDevMode(!devMode)}
                    className="w-full px-2 py-1 font-mono text-xs text-left text-black border border-transparent hover:bg-gray-300 hover:border-gray-400"
                  >
                    [{devMode ? "-" : "+"}] DEVELOPER_TOOLS
                  </button>
                  {devMode && (
                    <div className="p-2 mt-1 font-mono text-xs text-green-500 bg-black border-t border-gray-600">
                      {game.isHost ? (
                        <>
                          <div className="mb-2">
                            <label className="block mb-1 text-gray-400">
                              PICK ROLE:
                            </label>
                            <select
                              value={devRole}
                              onChange={(e) => setDevRole(e.target.value)}
                              className="w-full p-1 mb-1 text-white bg-gray-800 border border-gray-600"
                            >
                              <option value="">-- Select --</option>
                              <option value="fraudster">Fraudster</option>
                              <option value="auditor">Auditor</option>
                              <option value="controller">Controller</option>
                              <option value="accountant">Accountant</option>
                            </select>
                            <button
                              onClick={() => actions.setDevRole(devRole)}
                              className="w-full text-green-500 border border-green-700 hover:bg-green-900"
                            >
                              APPLY
                            </button>
                          </div>
                          {ALLOW_BOTS && game.phase === "lobby" && (
                            <div className="pt-2 border-t border-gray-800">
                              <label className="block mb-1 text-gray-400">
                                BOTS:
                              </label>
                              <div className="flex gap-1 mb-1">
                                <input
                                  value={botCount}
                                  onChange={(e) =>
                                    setBotCount(Number(e.target.value))
                                  }
                                  className="w-10 text-center text-white bg-gray-800 border border-gray-600"
                                />
                                <button
                                  onClick={() => actions.spawnBots(botCount)}
                                  className="flex-1 border border-gray-600 hover:bg-gray-800"
                                >
                                  SPAWN
                                </button>
                              </div>
                              <button
                                onClick={actions.despawnBots}
                                className="w-full text-red-500 border border-red-900 hover:bg-red-950"
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
