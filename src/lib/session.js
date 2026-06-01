const SESSION_KEY = "acct-game:sessionId";
const ROOM_KEY = "acct-game:roomCode";

export function saveSession(sessionId, roomCode) {
  try {
    if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
    if (roomCode) localStorage.setItem(ROOM_KEY, roomCode);
  } catch {}
}

export function loadSession() {
  try {
    return {
      sessionId: localStorage.getItem(SESSION_KEY) || "",
      roomCode: localStorage.getItem(ROOM_KEY) || "",
    };
  } catch {
    return { sessionId: "", roomCode: "" };
  }
}
