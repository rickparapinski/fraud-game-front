"use client";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { saveSession, loadSession } from "@/lib/session";
import { useGameActions } from "@/hooks/useGameActions";

function mergeLogs(prev, incoming) {
  const map = new Map();
  for (const e of prev || []) if (e?.id) map.set(e.id, e);
  for (const e of incoming || [])
    if (e?.id && !map.has(e.id)) map.set(e.id, e);
  return Array.from(map.values()).sort((a, b) => (a.ts || 0) - (b.ts || 0));
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
  const [auditHistory, setAuditHistory] = useState({});
  const [protectHistory, setProtectHistory] = useState({});
  const [nightSummary, setNightSummary] = useState(null);
  const [daySummary, setDaySummary] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [fraudTally, setFraudTally] = useState(null);
  const [fraudVotes, setFraudVotes] = useState(null);
  const [logs, setLogs] = useState([]);
  const [hasVotedDay, setHasVotedDay] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mySessionId, setMySessionId] = useState("");
  const [dayVotingStatus, setDayVotingStatus] = useState([]);
  const joinedRef = useRef(false);

  const { socketEmit, actions } = useGameActions(roomCode, setError, setHasVotedDay);

  // --- Connection, join/resume negotiation, and event listener registration ---
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

        // --- Event handlers ---
        handlers = {
          "player-joined": ({ players }) => setPlayers(players || []),
          "host-changed": ({ newHostId }) => setIsHost(socket.id === newHostId),
          "game-started": (data) => {
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
            setMyRole(role);
            setRoleInfo(instructions);
            setTeammates(teammates || []);
            setAuditHistory({});
            setProtectHistory({});
          },
          "phase-changed": (data) => {
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
              isFraudster
                ? `⚠ ${targetName} is a FRAUDSTER. Use this info well.`
                : `${targetName} is NOT a fraudster.`,
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
          "day-voting-status": ({ status }) => setDayVotingStatus(status || []),
        };

        Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));
      } catch {
        setError("Connection failed.");
      }
    })();

    return () => {
      if (socket && handlers)
        Object.entries(handlers).forEach(([evt, fn]) => socket.off(evt, fn));
    };
  }, [roomCode, name]);

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
    actions,
  };
}
