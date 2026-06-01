"use client";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

const SESSION_KEY = "acct-game:sessionId";
const ROOM_KEY = "acct-game:roomCode";

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

export function useGameLogic(roomCode, name) {
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
  const [auditHistory, setAuditHistory] = useState({}); // { [sessionId]: { name, isFraudster } }
  const [protectHistory, setProtectHistory] = useState({}); // { [sessionId]: { name, count } }
  const [nightSummary, setNightSummary] = useState(null);
  const [daySummary, setDaySummary] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [fraudTally, setFraudTally] = useState(null);
  const [fraudVotes, setFraudVotes] = useState(null);
  const [logs, setLogs] = useState([]);
  const [hasVotedDay, setHasVotedDay] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mySessionId, setMySessionId] = useState("");
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

    joinedRef.current = true;

    let socket;
    let handlers = null;

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

        const prior = loadSession();
        let res = null;

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

        if (!res) {
          res = await socketEmit("join-room", {
            roomCode,
            name,
            sessionId: prior.sessionId || undefined,
          });
        }

        if (res?.player?.sessionId) {
          saveSession(res.player.sessionId, roomCode);
          setMySessionId(res.player.sessionId);
        }

        setIsHost(!!res?.player?.isHost);

        if (res?.room?.players) setPlayers(res.room.players);
        if (res?.room?.currentPhase) setPhase(res.room.currentPhase);
        if (res?.room?.logs) setLogs((prev) => mergeLogs(prev, res.room.logs));

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
            setAuditHistory({});
            setProtectHistory({});
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
          "audit-result": ({ isFraudster, targetName, targetSessionId }) => {
            setAuditMsg(
              `AUDIT REPORT: ${targetName} is ${isFraudster ? "⚠ a FRAUDSTER." : "✓ NOT a fraudster."}`,
            );
            if (targetSessionId) {
              setAuditHistory((prev) => ({
                ...prev,
                [targetSessionId]: { name: targetName, isFraudster },
              }));
            }
          },
          "audit-missed": () => {
            setAuditMsg("NO REPORT FILED — time expired before audit was submitted.");
          },
          "protect-result": ({ targetSessionId, targetName }) => {
            if (targetSessionId) {
              setProtectHistory((prev) => ({
                ...prev,
                [targetSessionId]: {
                  name: targetName,
                  count: (prev[targetSessionId]?.count || 0) + 1,
                },
              }));
            }
          },
          "protect-missed": () => {
            setAuditMsg("NO GUARD ASSIGNED — time expired before protection was submitted.");
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

    return () => {
      if (socket && handlers) {
        Object.entries(handlers).forEach(([evt, fn]) => socket.off(evt, fn));
      }
    };
  }, [roomCode, name]);

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
    mySessionId,
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
    auditHistory,
    protectHistory,
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
