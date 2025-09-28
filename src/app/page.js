"use client";
import { useState } from "react";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const createRoom = () => {
    const socket = getSocket();
    socket.emit("create-room", { hostName: name || "Host" }, (res) => {
      if (!res?.ok) return alert("Could not create room");
      router.push(
        `/room/${res.roomCode}?name=${encodeURIComponent(name || "Host")}`
      );
    });
  };

  const joinRoom = () => {
    if (!roomCode) return;
    router.push(
      `/room/${roomCode.toUpperCase()}?name=${encodeURIComponent(
        name || "Player"
      )}`
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Accounting Fraud — Start Audit
        </h1>
        <div className="space-y-2">
          <label className="block text-sm">Your name</label>
          <input
            className="w-full border rounded p-2"
            placeholder="e.g., João"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button
          onClick={createRoom}
          className="w-full rounded p-2 bg-black text-white"
        >
          Start New Audit (Host)
        </button>

        <div className="space-y-2">
          <label className="block text-sm">Room code</label>
          <input
            className="w-full border rounded p-2 uppercase"
            placeholder="e.g., 7K2F9A"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
        </div>
        <button onClick={joinRoom} className="w-full rounded p-2 border">
          Join Audit
        </button>
      </div>
    </main>
  );
}
