"use client";
import { getSocket } from "@/lib/socket";

export function useGameActions(roomCode, setError, setHasVotedDay) {
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

  const actions = {
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
    setDevRole: (role) => socketEmit("debug-set-host-role", { roomCode, role }),
  };

  return { socketEmit, actions };
}
