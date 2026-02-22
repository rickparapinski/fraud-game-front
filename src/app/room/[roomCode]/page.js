"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getSocket } from "@/lib/socket";

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

const ALLOW_BOTS = true;
const DEV_CONTROLS = true;
const SESSION_KEY = "acct-game:sessionId";
const ROOM_KEY = "acct-game:roomCode";

/* ---THEME CONFIG --- */
const THEMES = {
  day: {
    desktop: "bg-[#008080]",
    windowBody: "bg-[#d1d1c4]",
    titleBar: "bg-blue-900",
    textMain: "text-black",
    textDim: "text-gray-600",
    border: "border-gray-400",
    button: "bg-gray-200",
  },
  night: {
    desktop: "bg-[#050505]", // Very dark
    windowBody: "bg-[#1a1a1a]", // Dark terminal
    titleBar: "bg-[#500000]", // Dark Red
    textMain: "text-[#33ff00]", // Matrix Green
    textDim: "text-[#1a8000]",
    border: "border-[#333]",
    button: "bg-[#333] text-white border-gray-600",
  },
};

/* --- Session Helpers --- */
function saveSession(sessionId, roomCode) {
  try {
    if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
    if (roomCode) localStorage.setItem(ROOM_KEY, roomCode);
  } catch {}
}

function loadSession() {
  try {
    return {
      sessionId: localStorage.getItem(SESSION_KEY) || "",
      roomCode: localStorage.getItem(ROOM_KEY) || "",
    };
  } catch {
    return { sessionId: "", roomCode: "" };
  }
}

/* ==================================================================================
   HOOK: useGameLogic
   ================================================================================== */
function useGameLogic(roomCode, name) {
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [phase, setPhase] = useState("lobby");
  const [deadline, setDeadline] = useState(null);
  const [socketId, setSocketId] = useState("");
  const [myRole, setMyRole] = useState(null);
  const [roleInfo, setRoleInfo] = useState("");
  const [teammates, setTeammates] = useState([]);
  const [offsetMs, setOffsetMs] = useState(0);
  const [totalMs, setTotalMs] = useState(0);
  const [error, setError] = useState("");
  const [auditMsg, setAuditMsg] = useState("");
  const [nightSummary, setNightSummary] = useState(null);
  const [daySummary, setDaySummary] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [fraudTally, setFraudTally] = useState(null);
  const [fraudVotes, setFraudVotes] = useState(null);
  const [logs, setLogs] = useState([]);
  const [hasVotedDay, setHasVotedDay] = useState(false);
  const [connected, setConnected] = useState(false);
  const joinedRef = useRef(false);
  const [dayVotingStatus, setDayVotingStatus] = useState([]);

  const mergeLogs = (prev, incoming) => {
    const map = new Map();
    for (const e of prev || []) if (e?.id) map.set(e.id, e);
    for (const e of incoming || [])
      if (e?.id && !map.has(e.id)) map.set(e.id, e);
    return Array.from(map.values()).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  };

  // --- Socket Setup (With Resume Logic) ---
  useEffect(() => {
    if ((!roomCode && !loadSession().roomCode) || joinedRef.current) return;

    // ✅ lock immediately to prevent StrictMode double-run from emitting twice
    joinedRef.current = true;

    let socket; // will be assigned after connect
    let handlers = null; // will be assigned after listeners are created

    const waitForSocket = () =>
      new Promise((resolve, reject) => {
        const s = getSocket();
        if (s.connected) return resolve(s);
        const onConnect = () => {
          s.off("connect", onConnect);
          resolve(s);
        };
        s.once("connect", onConnect);
        setTimeout(() => reject(new Error("Socket timeout")), 5000);
      });

    (async () => {
      try {
        socket = await waitForSocket();
        setSocketId(socket.id);
        setConnected(true);

        // --- Join / Resume (sets initial isHost + roster) ---
        const prior = loadSession();
        let res = null;

        // 1) Try resume first (if we have a session for this room)
        if (prior.sessionId && prior.roomCode === roomCode) {
          try {
            res = await socketEmit("resume-player", {
              roomCode,
              sessionId: prior.sessionId,
              name,
            });
          } catch {
            res = null;
          }
        }

        // 2) Fallback to join-room
        if (!res) {
          res = await socketEmit("join-room", {
            roomCode,
            name,
            sessionId: prior.sessionId || undefined,
          });
        }

        // 3) Persist session so refresh works
        if (res?.player?.sessionId) saveSession(res.player.sessionId, roomCode);

        // ✅ THIS IS THE KEY: initialize host state from server response
        setIsHost(!!res?.player?.isHost);

        // Optional: also initialize basic room state immediately
        if (res?.room?.players) setPlayers(res.room.players);
        if (res?.room?.currentPhase) setPhase(res.room.currentPhase);
        if (res?.room?.logs) setLogs((prev) => mergeLogs(prev, res.room.logs));

        // --- Event Listeners ---
        handlers = {
          "player-joined": ({ players }) => setPlayers(players || []),
          "host-changed": ({ newHostId }) => setIsHost(socket.id === newHostId),
          "game-started": (data) => {
            console.log("[socket] game-started", data);
            setPhase(data.currentPhase || "night");
            setPlayers(data.players || []);
            setLogs((prev) => mergeLogs(prev, data.logs));
            setDeadline(null);
            setTotalMs(data.totalMs || 0);
            setOffsetMs((data.serverNow || Date.now()) - Date.now());
            setNightSummary(null);
            setFraudTally(null);
            setFraudVotes(null);
            setDaySummary(null);
            setHasVotedDay(false);
            setGameOver(null);
          },
          "your-role": ({ role, instructions, teammates }) => {
            console.log("YOUR ROLE EVENT", { role, instructions, teammates });
            setMyRole(role);
            setRoleInfo(instructions);
            setTeammates(teammates || []);
          },
          "phase-changed": (data) => {
            console.log("[socket] phase-changed", data);
            setPhase(data.phase);
            if (data.phase !== "day") setDayVotingStatus([]);
            setDeadline(data.deadline || null);
            if (data.phase === "day") setHasVotedDay(false);
            if (data.players) setPlayers(data.players);
            setNightSummary(null);
            setFraudTally(null);
            setFraudVotes(null);
            setDaySummary(null);
          },
          "fraud-vote-update": ({ tally, votes }) => {
            setFraudTally(tally);
            setFraudVotes(votes);
          },
          "night-results": (data) => setNightSummary(data),
          "audit-result": ({ isFraudster, targetName }) => {
            setAuditMsg(
              `${targetName} is ${isFraudster ? "" : "NOT "}a fraudster.`,
            );
          },
          "day-results": (data) => setDaySummary(data),
          "log-entry": (entry) => setLogs((prev) => mergeLogs(prev, [entry])),
          "game-over": (data) => setGameOver(data),
          "day-voting-status": ({ status }) => {
            setDayVotingStatus(status || []);
          },
        };

        Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));
      } catch (e) {
        setError("Connection failed.");
      }
    })();

    // ✅ cleanup belongs here, and must not reference undefined variables
    return () => {
      if (socket && handlers) {
        Object.entries(handlers).forEach(([evt, fn]) => socket.off(evt, fn));
      }
    };
  }, [roomCode, name]);
  // --- Socket Disconnect Handler ---
  const socketEmit = (event, data) =>
    new Promise((resolve, reject) => {
      getSocket()
        .timeout(5000)
        .emit(event, data, (err, res) => {
          if (err) {
            setError("Action timed out.");
            reject(new Error("Action timed out."));
          } else if (!res?.ok) {
            const msg = res?.error || "Action failed";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
            reject(new Error(msg));
          } else {
            resolve(res);
          }
        });
    });

  return {
    players,
    isHost,
    phase,
    deadline,
    connected,
    socketId,
    myRole,
    roleInfo,
    teammates,
    offsetMs,
    totalMs,
    logs,
    dayVotingStatus,
    error,
    setError,
    auditMsg,
    setAuditMsg,
    nightSummary,
    setNightSummary,
    daySummary,
    setDaySummary,
    gameOver,
    fraudTally,
    fraudVotes,
    hasVotedDay,
    actions: {
      startGame: () => socketEmit("start-game", { roomCode }),
      beginNight: () => socketEmit("begin-night", { roomCode }),
      submitNightAction: (type, targetId) =>
        socketEmit("night-action", { roomCode, type, targetId }),
      castDayVote: async (targetId) => {
        await socketEmit("day-vote", { roomCode, targetId });
        setHasVotedDay(true);
      },
      spawnBots: (count) => socketEmit("debug-spawn-bots", { roomCode, count }),
      despawnBots: () => socketEmit("debug-despawn-bots", { roomCode }),
      setDevRole: (role) =>
        socketEmit("debug-set-host-role", { roomCode, role }),
    },
  };
}

/* ==================================================================================
   COMPONENT: RoomPage (Visuals)
   ================================================================================== */
export default function RoomPage() {
  const params = useParams();
  const search = useSearchParams();
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
  const [copied, setCopied] = useState(false); // New state for copy feedback

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
    <div className="flex items-center justify-center w-full h-screen p-2 bg-neutral-900 md:p-4">
      <Monitor>
        <div className="relative w-full h-full bg-[var(--win-teal)] flex flex-col overflow-hidden font-retro">
          {/* === GAME OVER OVERLAY (Inside Monitor) === */}
          {game.gameOver && (
            <RetroGameOver
              winner={game.gameOver.winner}
              reason={game.gameOver.reason}
              players={game.gameOver.players || game.players} // Fallback to game.players if gameOver payload missing it
              onRestart={actions.startGame}
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
            {typeof roomData !== "undefined" && roomData !== null && (
              <AudioController phase={roomData.phase} />
            )}
            <div className="w-20 px-2 font-mono text-xl text-center text-red-500 bg-black border-2 border-gray-600 border-b-white border-r-white">
              {timeLeft}
            </div>
          </div>

          {/* === 2. MAIN SPLIT VIEW === */}
          <div className="relative flex flex-col flex-1 gap-4 p-2 overflow-hidden md:flex-row md:p-4">
            {/* --- BANNERS (Overlay) --- */}
            <div className="absolute z-50 flex flex-col items-center w-full max-w-md gap-2 px-4 transform -translate-x-1/2 pointer-events-none top-4 left-1/2">
              {/* Pointer events auto so buttons work */}
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
                        {/* Punched holes effect */}
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

                    {/* 2. Action Area (Wrapped to remove 'modern card' feel) */}
                    <div className="p-1 bg-gray-200 border-2 border-gray-500">
                      <div className="border border-gray-400 p-2 bg-[#e0e0d1]">
                        <div className="font-bold text-[10px] uppercase mb-2 text-gray-600 border-b border-gray-400">
                          Action Required
                        </div>
                        <div className="mb-2 font-mono text-[10px] text-gray-700">
                          DBG phase=<b>{String(game.phase)}</b> | me.id=
                          <b>{String(me?.id)}</b> | socketId=
                          <b>{String(game.socketId)}</b> | active=
                          <b>{String(me?.isActive)}</b> | players=
                          <b>{game.players.length}</b> | myRole=
                          <b>{String(game.myRole)}</b>
                        </div>
                        {/* Retro Wrapper for Inner Components */}
                        <div className="retro-form-wrapper">
                          {game.phase === "night" && me?.isActive && (
                            <NightActions
                              me={{ ...me, role: game.myRole }}
                              players={game.players}
                              onAct={actions.submitNightAction}
                              fraudTally={game.fraudTally}
                              fraudVotes={game.fraudVotes}
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
                onRestart={actions.startGame}
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
                        {game.phase === "day" && p.isActive && (
                          <span
                            className="ml-auto text-xs"
                            title={
                              votingMap.get(p.id) ? "Voted" : "Waiting for vote"
                            }
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
