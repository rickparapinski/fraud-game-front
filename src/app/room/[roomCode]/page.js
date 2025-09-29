"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getSocket } from "@/lib/socket";
import RoleCard from "@/components/RoleCard";
import NightActions from "@/components/NightActions";
import VotingPanel from "@/components/VotingPanel";
import GameLog from "@/components/GameLog";
import RoomCodeBox from "@/components/ui/RoomCodeBox";
import TimerPill from "@/components/ui/TimerPill";
import CompactPhaseStepper from "@/components/ui/PhaseStepper";
import Avatar from "@/components/ui/Avatar";
import DevControls from "@/components/DevControls";
import HostControls from "@/components/HostControls";
import { GameOverBanner } from "@/components/ui/GameOverBanner";
import { SystemToast } from "@/components/ui/SystemToast";
import PhaseSummaryCard from "@/components/ui/PhaseSummaryCard";

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

  // timing state
  const [offsetMs, setOffsetMs] = useState(0); // serverNow - clientNow
  const [totalMs, setTotalMs] = useState(0); // phase total duration

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

  //assing avatars
  function statusFor(p) {
    // customize as you like
    if (p.eliminated || p.isActive === false) {
      return {
        label: "Eliminated",
        cls: "bg-role-fraudster/20 text-role-fraudster",
      };
    }
    if (p.name?.startsWith("Bot-")) {
      return {
        label: "Bot",
        cls: "bg-role-controller/20 text-role-controller",
      };
    }
    return {
      label: "Active",
      cls: "bg-role-accountant/20 text-role-accountant",
    };
  }

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
            // timing from server (if your backend sends it)
            if (res.room.serverNow) {
              setOffsetMs(res.room.serverNow - Date.now());
            }
            if (typeof res.room.totalMs === "number")
              setTotalMs(res.room.totalMs);
            if (typeof res.room.deadline === "number")
              setDeadline(res.room.deadline);
          });

        /* ------- Handlers ------- */

        // roster + host
        const onJoined = ({ players }) => setPlayers(players || []);
        const onHostChanged = ({ newHostId }) =>
          setIsHost(getSocket().id === newHostId);

        // start + role
        const onGameStarted = ({
          currentPhase,
          players,
          logs,
          totalMs,
          serverNow,
        }) => {
          setPhase(currentPhase || "night_review");
          if (Array.isArray(players)) setPlayers(players);
          setLogs((prev) => mergeLogs(prev, logs || []));
          setDeadline(null);
          if (typeof totalMs === "number") setTotalMs(totalMs);
          if (typeof serverNow === "number")
            setOffsetMs(serverNow - Date.now());
          setNightSummary(null);
          setFraudTally(null);
          setFraudVotes(null);
          // keep auditMsg until next Night (so morning shows result)
          setDaySummary(null);
          setHasVotedDay(false);
          setGameOver(null);
          setDevRoleStatus(""); // clear dev picker feedback on game start
          setHasVotedDay(false);
        };

        const onYourRole = ({ role, instructions, teammates = [] }) => {
          setMyRole(role);
          setRoleInfo(instructions);
          setTeammates(teammates);
        };

        // phase changes (server includes roster; only set if provided)
        const onPhaseChanged = ({
          phase,
          deadline,
          players,
          totalMs,
          serverNow,
        }) => {
          setPhase(phase);
          setDeadline(deadline || null);
          if (phase === "morning_meeting") {
            setHasVotedDay(false);
          }
          if (Array.isArray(players)) setPlayers(players);
          // clear per-phase banners
          setNightSummary(null);
          setFraudTally(null);
          setFraudVotes(null);
          if (phase === "night_review") setAuditMsg(""); // keep result into morning
          setDaySummary(null);
          if (typeof totalMs === "number") setTotalMs(totalMs);
          if (typeof serverNow === "number")
            setOffsetMs(serverNow - Date.now());
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
      setError(null); // clear any previous error
      getSocket()
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
          setHasVotedDay(true); // lock for the rest of this day
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
      <header className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
        {/* Left: Room code */}
        <div className="md:justify-self-start">
          <RoomCodeBox code={roomCode || ""} />
        </div>

        {/* Center: Stylish Timer */}
        <div className="md:justify-self-center w-full flex justify-center">
          <TimerPill
            deadline={deadline ? deadline - offsetMs : null}
            durationMs={totalMs}
            label={
              phase === "night_review"
                ? "Night ends in"
                : phase === "morning_meeting"
                ? "Day ends in"
                : "Time left"
            }
          />
        </div>

        {/* Right: Compact Stepper */}
        <div className="md:justify-self-end">
          <CompactPhaseStepper current={phase} />
        </div>
      </header>

      {/* Toasts */}
      {error && (
        <SystemToast
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {auditMsg && (
        <SystemToast
          type="audit"
          message={auditMsg}
          onClose={() => setAuditMsg(null)}
        />
      )}

      {/* Phase Summary */}
      {nightSummary && (
        <PhaseSummaryCard
          phase="night_review"
          eliminatedName={nightSummary.eliminatedName}
          protectedName={nightSummary.protectedName}
          ephemeral={true} // auto-hide after 6s
          onDismiss={() => setNightSummary(null)}
          showAvatars={false} // flip to true if you like
        />
      )}

      {daySummary && (
        <PhaseSummaryCard
          phase="morning_meeting"
          eliminatedName={daySummary.eliminatedName}
          eliminatedRole={daySummary.eliminatedRole}
          protectedName={daySummary.protectedName}
          ephemeral={true}
          onDismiss={() => setDaySummary(null)}
        />
      )}

      {/* Game Over */}
      {gameOver && (
        <GameOverBanner winner={gameOver.winner} reason={gameOver.reason} />
      )}

      <section className="grid md:grid-cols-3 gap-4">
        {/* Left: Players + Log */}
        <div className="md:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-sm">
          {/* Role card */}
          {myRole && (
            <div className="pt-2">
              <RoleCard
                role={myRole}
                instructions={roleInfo}
                teammates={teammates}
              />
            </div>
          )}
          <div className="mt-6">
            <h2 className="font-semibold mb-3 text-white/90 tracking-wide">
              Game Log
            </h2>
            <GameLog logs={logs} />
          </div>
        </div>

        {/* Right: Sidebar */}
        <aside className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-sm">
          {/* Dev controls: Pick my role (host-only, lobby-only) */}
          <DevControls
            DEV_CONTROLS={DEV_CONTROLS}
            isHost={isHost}
            phase={phase}
            devRole={devRole}
            setDevRole={setDevRole}
            applyDevRole={applyDevRole}
            devRoleStatus={devRoleStatus}
            ALLOW_BOTS={ALLOW_BOTS}
            botCount={botCount}
            setBotCount={setBotCount}
            spawnBots={spawnBots}
            despawnBots={despawnBots}
          />

          {/* Host controls */}
          <HostControls
            isHost={isHost}
            phase={phase}
            gameOver={gameOver}
            startGame={startGame}
            beginNight={beginNight}
          />

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
              me={me}
              players={players}
              onVote={castDayVote}
              disabled={!!gameOver} // parent guard
              phase={phase} // lets panel reset when day starts
              hasVotedDay={hasVotedDay} // locks after a successful vote
            />
          )}
          <h2 className="font-semibold mb-4 text-white/90 tracking-wide">
            Players
          </h2>
          <ul className="space-y-2">
            {players.map((p) => {
              const s = statusFor(p);
              return (
                <li
                  key={p.id || p.name}
                  className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      seed={p.id || p.name}
                      label={p.name}
                      host={!!p.isHost}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {p.name}{" "}
                        {p.isHost && (
                          <span className="text-accent-gold align-middle">
                            👑
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}

            {!players.length && (
              <li className="text-sm text-white/60 px-1">
                Waiting for players…
              </li>
            )}
          </ul>
        </aside>
      </section>
    </main>
  );
}
