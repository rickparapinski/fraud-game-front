"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getSocket } from "@/lib/socket";
import RoleCard from "@/components/RoleCard";
import PhaseTimer from "@/components/PhaseTimer";
import NightActions from "@/components/NightActions";
import VotingPanel from "@/components/VotingPanel";
import GameLog from "@/components/GameLog";

const ALLOW_BOTS = true;
const DEV_CONTROLS = true;

export default function RoomPage() {
  const params = useParams();
  const search = useSearchParams();

  const name = (search.get("name") || "Player").trim();
  const roomCode = useMemo(
    () => (params?.roomCode ? String(params.roomCode).toUpperCase() : ""),
    [params?.roomCode]
  );

  // Core state
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [phase, setPhase] = useState("lobby");
  const [deadline, setDeadline] = useState(null);

  // Me / role
  const [socketId, setSocketId] = useState("");
  const [myRole, setMyRole] = useState(null);
  const [roleInfo, setRoleInfo] = useState("");
  const [teammates, setTeammates] = useState([]);

  // UI banners + summaries
  const [error, setError] = useState("");
  const [auditMsg, setAuditMsg] = useState("");
  const [nightSummary, setNightSummary] = useState(null); // { eliminatedId, eliminatedName, protectedId, protectedName }
  const [daySummary, setDaySummary] = useState(null); // { eliminatedId, eliminatedName, eliminatedRole }
  const [gameOver, setGameOver] = useState(null); // { winner, reason, players }

  // Fraudster coordination
  const [fraudTally, setFraudTally] = useState(null); // { targetId: count }
  const [fraudVotes, setFraudVotes] = useState(null); // [{ voterId, voterName, targetId, targetName }]

  // Logs (with de-dupe)
  const [logs, setLogs] = useState([]);
  const mergeLogs = (prev, incoming) => {
    const map = new Map();
    for (const e of prev || []) if (e?.id) map.set(e.id, e);
    for (const e of incoming || [])
      if (e?.id && !map.has(e.id)) map.set(e.id, e);
    return Array.from(map.values()).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  };

  // Flow helpers
  const [hasVotedDay, setHasVotedDay] = useState(false);
  const [connected, setConnected] = useState(false);
  const joinedRef = useRef(false);

  // Dev role picker state
  const [devRole, setDevRole] = useState(""); // "fraudster" | "auditor" | "controller" | "accountant" | ""
  const [devRoleStatus, setDevRoleStatus] = useState(""); // feedback text

  /* ------------------------ Socket lifecycle ------------------------ */

  const waitForSocket = () =>
    new Promise((resolve, reject) => {
      const s = getSocket();
      if (s.connected) return resolve(s);
      const onConnect = () => {
        s.off("connect", onConnect);
        s.off("connect_error", onErr);
        resolve(s);
      };
      const onErr = (e) => {
        s.off("connect", onConnect);
        s.off("connect_error", onErr);
        reject(e || new Error("socket connect_error"));
      };
      s.once("connect", onConnect);
      s.once("connect_error", onErr);
      setTimeout(() => reject(new Error("Socket connect timeout")), 8000);
    });

  useEffect(() => {
    const s = getSocket();
    const onConnect = () => {
      setConnected(true);
      setSocketId(s.id);
    };
    const onDisconnect = () => setConnected(false);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    if (s.connected) onConnect();
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (!roomCode || !name || joinedRef.current) return;

    (async () => {
      try {
        const socket = await waitForSocket();
        setSocketId(socket.id);

        socket
          .timeout(6000)
          .emit("join-room", { roomCode, name }, (err, res) => {
            if (err)
              return setError("Server didn’t acknowledge. Is backend running?");
            if (!res?.ok) return setError(res?.error || "Failed to join room.");
            setPlayers(res.room.players || []);
            setIsHost(!!res.player?.isHost);
            setPhase(res.room.currentPhase || "lobby");
            setLogs((prev) => mergeLogs(prev, res.room.logs || []));
            joinedRef.current = true;
          });

        /* ------- Handlers ------- */

        // roster + host
        const onJoined = ({ players }) => setPlayers(players || []);
        const onHostChanged = ({ newHostId }) =>
          setIsHost(getSocket().id === newHostId);

        // start + role
        const onGameStarted = ({ currentPhase, players, logs: serverLogs }) => {
          setPhase(currentPhase || "night_review");
          if (Array.isArray(players)) setPlayers(players);
          setLogs((prev) => mergeLogs(prev, serverLogs || []));
          // reset fronts
          setDeadline(null);
          setNightSummary(null);
          setFraudTally(null);
          setFraudVotes(null);
          // keep auditMsg until next Night (so morning shows result)
          setDaySummary(null);
          setHasVotedDay(false);
          setGameOver(null);
          setDevRoleStatus(""); // clear dev picker feedback on game start
        };

        const onYourRole = ({ role, instructions, teammates = [] }) => {
          setMyRole(role);
          setRoleInfo(instructions);
          setTeammates(teammates);
        };

        // phase changes (server includes roster; only set if provided)
        const onPhaseChanged = ({ phase, deadline, players }) => {
          setPhase(phase || "morning_meeting");
          setDeadline(deadline || null);
          if (Array.isArray(players)) setPlayers(players);
          if (phase === "morning_meeting") setHasVotedDay(false);
          // clear per-phase banners
          setNightSummary(null);
          setFraudTally(null);
          setFraudVotes(null);
          if (phase === "night_review") setAuditMsg(""); // keep result into morning
          setDaySummary(null);
        };

        // fraudster live updates
        const onFraudUpdate = ({ tally, votes }) => {
          setFraudTally(tally || null);
          setFraudVotes(Array.isArray(votes) ? votes : null);
        };

        // summaries / results
        const onNightResults = ({
          eliminatedId,
          eliminatedName,
          protectedId,
          protectedName,
        }) => {
          setNightSummary({
            eliminatedId: eliminatedId || null,
            eliminatedName: eliminatedName || null,
            protectedId: protectedId || null,
            protectedName: protectedName || null,
          });
        };
        const onAuditResult = ({ targetId, isFraudster, targetName }) => {
          setAuditMsg(
            `${targetName} is ${isFraudster ? "" : "NOT "}a fraudster.`
          );
        };
        const onDayResults = ({
          eliminatedId,
          eliminatedName,
          eliminatedRole,
        }) => {
          setDaySummary({
            eliminatedId: eliminatedId || null,
            eliminatedName: eliminatedName || null,
            eliminatedRole: eliminatedRole || null,
          });
        };

        // logs + game over
        const onLogEntry = (entry) =>
          setLogs((prev) => mergeLogs(prev, [entry]));
        const onGameOver = ({ winner, reason, players }) =>
          setGameOver({ winner, reason, players });

        /* ------- Wire / unwire ------- */
        socket.on("player-joined", onJoined);
        socket.on("host-changed", onHostChanged);
        socket.on("game-started", onGameStarted);
        socket.on("your-role", onYourRole);
        socket.on("phase-changed", onPhaseChanged);
        socket.on("fraud-vote-update", onFraudUpdate);
        socket.on("night-results", onNightResults);
        socket.on("audit-result", onAuditResult);
        socket.on("day-results", onDayResults);
        socket.on("log-entry", onLogEntry);
        socket.on("game-over", onGameOver);

        return () => {
          socket.off("player-joined", onJoined);
          socket.off("host-changed", onHostChanged);
          socket.off("game-started", onGameStarted);
          socket.off("your-role", onYourRole);
          socket.off("phase-changed", onPhaseChanged);
          socket.off("fraud-vote-update", onFraudUpdate);
          socket.off("night-results", onNightResults);
          socket.off("audit-result", onAuditResult);
          socket.off("day-results", onDayResults);
          socket.off("log-entry", onLogEntry);
          socket.off("game-over", onGameOver);
        };
      } catch (e) {
        setError(e?.message || "Connection failed.");
      }
    })();
  }, [roomCode, name]);

  /* ------------------------ Actions / host controls ------------------------ */

  const startGame = () =>
    new Promise((resolve, reject) => {
      const socket = getSocket();
      socket.timeout(6000).emit("start-game", { roomCode }, (err, res) => {
        if (err) {
          setError("Start game timed out.");
          return reject(err);
        }
        if (!res?.ok) {
          setError(res?.error || "Could not start game.");
          return reject(new Error(res?.error || "Could not start game."));
        }
        resolve();
      });
    });

  const beginNight = () =>
    new Promise((resolve, reject) => {
      const socket = getSocket();
      socket.timeout(6000).emit("begin-night", { roomCode }, (err, res) => {
        if (err) {
          setError("Begin night timed out.");
          return reject(err);
        }
        if (!res?.ok) {
          setError(res?.error || "Could not start night.");
          return reject(new Error(res?.error || "Could not start night."));
        }
        resolve();
      });
    });

  const submitNightAction = (type, targetId) =>
    new Promise((resolve, reject) => {
      const socket = getSocket();
      socket
        .timeout(6000)
        .emit("night-action", { roomCode, type, targetId }, (err, res) => {
          if (err) {
            setError("Night action timed out.");
            return reject(err);
          }
          if (!res?.ok) {
            setError(res?.error || "Night action failed.");
            return reject(new Error(res?.error || "Night action failed."));
          }
          resolve();
        });
    });

  const castDayVote = (targetId) =>
    new Promise((resolve, reject) => {
      const socket = getSocket();
      socket
        .timeout(6000)
        .emit("day-vote", { roomCode, targetId }, (err, res) => {
          if (err) {
            setError("Day vote timed out.");
            return reject(err);
          }
          if (!res?.ok) {
            setError(res?.error || "Vote failed.");
            return reject(new Error(res?.error || "Vote failed"));
          }
          setHasVotedDay(true);
          resolve();
        });
    });

  // Debug: spawn/stop bots
  const [botCount, setBotCount] = useState(6);
  const spawnBots = () =>
    new Promise((resolve, reject) => {
      const socket = getSocket();
      socket
        .timeout(8000)
        .emit("debug-spawn-bots", { roomCode, count: botCount }, (err, res) => {
          if (err) {
            setError("Spawn bots timed out.");
            return reject(err);
          }
          if (!res?.ok) {
            setError(res?.error || "Spawn failed.");
            return reject(new Error(res?.error || "Spawn failed"));
          }
          resolve();
        });
    });
  const despawnBots = () =>
    new Promise((resolve, reject) => {
      const socket = getSocket();
      socket
        .timeout(8000)
        .emit("debug-despawn-bots", { roomCode }, (err, res) => {
          if (err) {
            setError("Despawn bots timed out.");
            return reject(err);
          }
          if (!res?.ok) {
            setError(res?.error || "Despawn failed.");
            return reject(new Error(res?.error || "Despawn failed"));
          }
          resolve();
        });
    });

  // Dev role picker: apply choice (host, lobby)
  const applyDevRole = () =>
    new Promise((resolve, reject) => {
      if (!DEV_CONTROLS) {
        setDevRoleStatus("Dev controls disabled.");
        return resolve();
      }
      if (!isHost) {
        setDevRoleStatus("Only host can set dev role.");
        return resolve();
      }
      if (phase !== "lobby") {
        setDevRoleStatus("Role can be set only in the lobby.");
        return resolve();
      }
      if (!devRole) {
        setDevRoleStatus("Pick a role first.");
        return resolve();
      }

      const socket = getSocket();
      socket
        .timeout(4000)
        .emit(
          "debug-set-host-role",
          { roomCode, role: devRole },
          (err, res) => {
            if (err) {
              setDevRoleStatus("Request timed out.");
              return reject(err);
            }
            if (!res?.ok) {
              setDevRoleStatus(res?.error || "Failed to set role.");
              return reject(new Error(res?.error || "Failed to set role."));
            }
            setDevRoleStatus(`Locked: ${devRole.toUpperCase()} (for host)`);
            resolve();
          }
        );
    });

  /* ------------------------------ Derived ------------------------------ */

  const me = useMemo(
    () =>
      players.find((p) => p.id === socketId) || {
        id: socketId,
        name,
        isActive: true,
        role: myRole,
      },
    [players, socketId, name, myRole]
  );

  /* ------------------------------- Render ------------------------------- */

  return (
    <main className="min-h-screen p-6 space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">Room: {roomCode || "…"}</h1>
        <div className="flex items-center gap-2">
          <div className="text-sm px-3 py-1 rounded border">Phase: {phase}</div>
          {deadline && <PhaseTimer deadline={deadline} />}
        </div>
      </header>

      {error && (
        <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}
      {auditMsg && (
        <div className="p-3 rounded bg-blue-50 text-blue-700 border border-blue-200">
          {auditMsg}
        </div>
      )}
      {nightSummary && (
        <div className="p-3 rounded bg-amber-50 text-amber-800 border border-amber-200">
          Night:{" "}
          {nightSummary.eliminatedName
            ? `${nightSummary.eliminatedName} was eliminated.`
            : "No one was eliminated."}
          {nightSummary.protectedName
            ? ` (Protected: ${nightSummary.protectedName})`
            : ""}
        </div>
      )}
      {daySummary && (
        <div className="p-3 rounded bg-violet-50 text-violet-800 border border-violet-200">
          Day:{" "}
          {daySummary.eliminatedName
            ? `${daySummary.eliminatedName} was eliminated`
            : "No elimination (tie or no votes)."}
          {daySummary.eliminatedRole
            ? ` — Role: ${String(daySummary.eliminatedRole).toUpperCase()}`
            : ""}
        </div>
      )}
      {gameOver && (
        <div className="p-3 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
          Game Over — Winner: <b>{gameOver.winner.toUpperCase()}</b> (
          {gameOver.reason})
        </div>
      )}

      <section className="grid md:grid-cols-3 gap-4">
        {/* Left: Players + Log */}
        <div className="md:col-span-2 border rounded p-4">
          <h2 className="font-medium mb-2">Players</h2>
          <ul className="space-y-2">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between border rounded p-2"
              >
                <span>
                  {p.name} {p.isHost ? "👑" : ""}
                </span>
                <span
                  className={`text-xs ${
                    p.isActive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {p.isActive ? "Active" : "Eliminated"}
                </span>
              </li>
            ))}
            {!players.length && (
              <li className="text-sm text-gray-500">
                Waiting for players to join…
              </li>
            )}
          </ul>

          <div className="mt-4">
            <h2 className="font-medium mb-2">Game Log</h2>
            <GameLog logs={logs} />
          </div>
        </div>

        {/* Right: Sidebar */}
        <aside className="border rounded p-4 space-y-3">
          <div className="text-sm">
            You: <b>{name}</b> {isHost ? "👑 (Host)" : ""}
          </div>

          {/* Dev controls: Pick my role (host-only, lobby-only) */}
          {DEV_CONTROLS && isHost && (
            <div className="border rounded p-3 space-y-2 bg-slate-50">
              <div className="text-sm font-medium">Dev: Pick My Role</div>
              <select
                className="w-full border rounded p-2"
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
                className={`w-full rounded p-2 ${
                  !devRole || phase !== "lobby"
                    ? "bg-gray-300"
                    : "bg-indigo-600 text-white"
                }`}
              >
                Apply Role (Host)
              </button>
              {devRoleStatus && (
                <div className="text-xs text-gray-600">{devRoleStatus}</div>
              )}
              <p className="text-[11px] text-gray-500">
                Dev-only. Applies to host in the lobby. Roles stay balanced via
                swap.
              </p>
            </div>
          )}

          {/* Bot controls (dev) */}
          {isHost && ALLOW_BOTS && (
            <div className="border rounded p-3 space-y-2">
              <div className="text-sm font-medium">Debug: Spawn Bots</div>
              <div className="text-xs text-gray-500">
                env:{String(ALLOW_BOTS)} | phase:{phase} | isHost:
                {String(isHost)}
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
                className="w-full border rounded p-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={spawnBots}
                  disabled={phase !== "lobby"}
                  className={`flex-1 rounded p-2 border ${
                    phase !== "lobby" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Spawn
                </button>
                <button
                  onClick={despawnBots}
                  className="flex-1 rounded p-2 border"
                >
                  Despawn
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Bots can only join in the lobby. Start the audit after spawning.
              </p>
            </div>
          )}

          {/* Host controls */}
          {isHost && phase === "lobby" && (
            <button
              onClick={startGame}
              className="w-full rounded p-2 bg-black text-white"
            >
              Start Audit
            </button>
          )}
          {isHost && phase === "morning_meeting" && !gameOver && (
            <button
              onClick={beginNight}
              className="w-full rounded p-2 bg-black text-white"
            >
              Begin Night
            </button>
          )}

          {/* Role card */}
          {myRole && (
            <div className="pt-2 border-t">
              <RoleCard
                role={myRole}
                instructions={roleInfo}
                teammates={teammates}
              />
            </div>
          )}

          {/* Night actions */}
          {phase === "night_review" && me?.isActive && (
            <NightActions
              me={{ ...me, role: myRole }}
              players={players}
              onAct={submitNightAction}
              fraudTally={fraudTally}
              fraudVotes={fraudVotes}
            />
          )}

          {/* Day voting */}
          {phase === "morning_meeting" && me?.isActive && !gameOver && (
            <VotingPanel
              me={{ ...me, role: myRole }}
              players={players}
              onVote={castDayVote}
              disabled={hasVotedDay}
            />
          )}
        </aside>
      </section>
    </main>
  );
}
