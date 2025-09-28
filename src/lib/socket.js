import { io } from "socket.io-client";

let socket;
export function getSocket() {
  if (!socket) {
    const URL = process.env.NEXT_PUBLIC_SOCKET_URL; // e.g. https://fraud-backend-<you>.fly.dev
    if (!URL) throw new Error("NEXT_PUBLIC_SOCKET_URL is not set");
    socket = io(URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: false,
    });
  }
  return socket;
}
