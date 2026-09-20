"use client";
import { useEffect, useState } from "react";
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
  const [auditTitle, setAuditTitle] = useState("");
  const [auditHistory, setAuditHistory] = useState({});
  const [protectHistory, setProtectHistory] = useState({});
  const [daySummary, setDaySummary] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [fraudTally, setFraudTally] = useState(null);
  const [fraudVotes, setFraudVotes] = useState(null);
  const [logs, setLogs] = useState([]);
  const [hasVotedDay, setHasVotedDay] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mySessionId, setMySessionId] = useState("");
  const [myPid, setMyPid] = useState("");
  const [dayVotingStatus, setDayVotingStatus] = useState([]);

  const { socketEmit, actions } = useGameActions(roomCode, setError, setHasVotedDay);

  // --- Connection lifecycle, join/resume negotiation, and event listeners ---
  useEffect(() => {
    if (!roomCode && !loadSession().roomCode) return;

    const socket = getSocket();
    let cancelled = false;

    const applyJoinResult = (res) => {
      if (res?.player?.sessionId) {
        saveSession(res.player.sessionId, roomCode);
        setMySessionId(res.player.sessionId);
      }
      if (res?.player?.pid) setMyPid(res.player.pid);
      setIsHost(!!res?.player?.isHost);
      if (res?.player?.role) setMyRole(res.player.role);
      if (res?.room?.players) setPlayers(res.room.players);
      if (res?.room?.currentPhase) setPhase(res.room.currentPhase);
      if (res?.room?.logs) setLogs((prev) => mergeLogs(prev, res.room.logs));
      // On a mid-game resume the server also sends the live deadline/totalMs
      // so a reloaded tab doesn't sit on a frozen 00:00 countdown.
      if (res?.room?.deadline) {
        setDeadline(res.room.deadline);
        setTotalMs(res.room.totalMs || 0);
        setOffsetMs((res.room.serverNow || Date.now()) - Date.now());
      }
    };

    // Resume-then-join negotiation. Re-run on every (re)connect, not just the
    // first one, so a dropped socket re-establishes room membership instead
    // of the client silently going deaf to all further room broadcasts.
    const joinOrResume = async () => {
      try {
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

        if (!cancelled) {
          applyJoinResult(res);
          setError("");
        }
      } catch {
        if (!cancelled) setError("Connection failed.");
      }
    };

    // --- Event handlers (registered before any join/resume call so a
    // role-sync sent by the server ahead of its ack is never missed) ---
    const handlers = {
      "player-joined": ({ players }) => setPlayers(players || []),
      "host-changed": ({ newHostId }) => setIsHost(socket.id === newHostId),
      "game-started": (data) => {
        setPhase(data.currentPhase || "night");
        setPlayers(data.players || []);
        setLogs((prev) => mergeLogs(prev, data.logs));
        setDeadline(null);
        setTotalMs(data.totalMs || 0);
        setOffsetMs((data.serverNow || Date.now()) - Date.now());
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
      // Sent after a resume/reconnect: restores role UI without wiping the
      // audit/protect history the player already accumulated this game.
      "role-sync": ({ role, instructions, teammates }) => {
        setMyRole(role);
        setRoleInfo(instructions);
        setTeammates(teammates || []);
      },
      "phase-changed": (data) => {
        setPhase(data.phase);
        if (data.phase !== "day") setDayVotingStatus([]);
        setDeadline(data.deadline || null);
        if (data.phase === "day") setHasVotedDay(false);
        if (data.players) setPlayers(data.players);
        setFraudTally(null);
        setFraudVotes(null);
        setDaySummary(null);
      },
      "fraud-vote-update": ({ tally, votes }) => {
        setFraudTally(tally);
        setFraudVotes(votes);
      },
      "night-results": () => {},
      "audit-result": ({ isFraudster, targetName, targetPid, role }) => {
        setAuditMsg(
          isFraudster
            ? `⚠ ${targetName} is a FRAUDSTER. Use this info well.`
            : `${targetName} is NOT a fraudster — role: ${(role || "unknown").toUpperCase()}.`,
        );
        if (targetPid) {
          setAuditHistory((prev) => ({
            ...prev,
            [targetPid]: { name: targetName, isFraudster, role: role || (isFraudster ? "fraudster" : "unknown") },
          }));
        }
      },
      "audit-missed": () => {
        setAuditMsg("You did not submit your action. The board is displeased.");
      },
      "protect-result": ({ targetPid, targetName }) => {
        if (targetPid) {
          setProtectHistory((prev) => ({
            ...prev,
            [targetPid]: {
              name: targetName,
              count: (prev[targetPid]?.count || 0) + 1,
            },
          }));
        }
        setAuditTitle("PROTECTION_REPORT");
        setAuditMsg(`Security detail confirmed for ${targetName}.`);
      },
      "protect-missed": () => {
        setAuditTitle("MESSAGE_FROM_BOARD");
        setAuditMsg("You did not submit your action. The board is displeased.");
      },
      "work-missed": () => {
        setAuditTitle("MESSAGE_FROM_BOARD");
        setAuditMsg("Quota not met. Your team failed to balance the books. The board is displeased.");
      },
      "day-results": (data) => setDaySummary(data),
      "log-entry": (entry) => setLogs((prev) => mergeLogs(prev, [entry])),
      "game-over": (data) => setGameOver(data),
      "day-voting-status": ({ status }) => setDayVotingStatus(status || []),
    };

    Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));

    const onConnect = () => {
      setSocketId(socket.id);
      setConnected(true);
      joinOrResume();
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => {
      if (!cancelled) setError("Connection lost. Reconnecting…");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    if (socket.connected) onConnect();

    return () => {
      cancelled = true;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
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
    myPid,
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
    auditTitle,
    setAuditTitle,
    auditHistory,
    protectHistory,
    daySummary,
    setDaySummary,
    gameOver,
    fraudTally,
    fraudVotes,
    hasVotedDay,
    actions,
  };
}
