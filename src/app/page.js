"use client";
import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

const ROOM_RE = /^[A-Z0-9]{6}$/;

function isValidRoomCode(input) {
  const code = input.replace(/\s+/g, ""); // remove all spaces
  return ROOM_RE.test(code);
}

export default function Home() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [errors, setErrors] = useState({ name: "", room: "" });
  const router = useRouter();

  // Restore saved name
  useEffect(() => {
    const n = localStorage.getItem("oos:name");
    if (n) setName(n);
  }, []);

  // Save name as user types
  useEffect(() => {
    if (name.trim()) localStorage.setItem("oos:name", name.trim());
  }, [name]);

  const cleanName = useMemo(() => name.trim(), [name]);
  const nameValid = cleanName.length >= 1 && cleanName.length <= 24;
  const roomValid = ROOM_RE.test(roomCode);

  function validateJoin() {
    const next = { name: "", room: "" };
    if (!nameValid) next.name = "Name must be 1–24 characters.";
    if (!roomValid) next.room = "Room code must be 6 letters/numbers.";
    setErrors(next);
    return !next.name && !next.room;
  }

  function validateCreate() {
    const next = { name: "", room: "" };
    if (!nameValid) next.name = "Name must be 1–24 characters.";
    setErrors(next);
    return !next.name;
  }

  function createRoom() {
    if (!validateCreate()) return;
    if (!confirm("Create a new room? You’ll get a code to share.")) return;

    const socket = getSocket();
    socket.emit("create-room", { hostName: cleanName }, (res) => {
      if (!res?.ok) return alert("Could not create room");
      router.push(
        `/room/${res.roomCode}?name=${encodeURIComponent(cleanName)}`
      );
    });
  }

  function joinRoom() {
    if (!validateJoin()) return;
    router.push(
      `/room/${roomCode.toUpperCase()}?name=${encodeURIComponent(cleanName)}`
    );
  }

  // Enter submits Join if a code is present
  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      roomCode ? joinRoom() : createRoom();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-2xl m-5 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold uppercase">Office of Suspicion</h1>
          <p className="text-white/70">Find frauds. Cook books. Repeat</p>
        </div>

        {/* Shared: Your name */}
        <div className="space-y-2">
          <label className="block text-sm">Your name</label>
          <input
            className={`w-full border rounded-xl p-3 bg-transparent outline-none
                        ${
                          errors.name
                            ? "border-red-500"
                            : "border-ink-700 focus:border-white/30"
                        }`}
            placeholder="e.g., João"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            onKeyDown={onKeyDown}
            aria-invalid={!!errors.name}
            aria-describedby="name-error"
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        {/* JOIN card */}
        <section className="card p-5 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Join a room</h2>
            <p className="text-sm text-white/70">
              Have a code from a friend? Enter it below.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Room code</label>
            <input
              className={`w-full border rounded-xl p-3 uppercase tracking-widest bg-transparent outline-none
                          ${
                            errors.room
                              ? "border-red-500"
                              : "border-ink-700 focus:border-white/30"
                          }`}
              placeholder="E.g., 7K2F9A"
              value={roomCode}
              maxLength={6}
              onChange={(e) =>
                setRoomCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 6)
                )
              }
              onKeyDown={onKeyDown}
              aria-invalid={!!errors.room}
              aria-describedby="room-error"
            />
            {errors.room && (
              <p id="room-error" className="text-xs text-red-400">
                {errors.room}
              </p>
            )}
          </div>

          <Button
            variant="primary"
            className="w-full"
            onClick={joinRoom}
            disabled={!nameValid || !roomValid}
            aria-disabled={!nameValid || !roomValid}
          >
            Join Audit
          </Button>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-3 text-white/50">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-widest">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* HOST card */}
        <section className="card p-5 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Host a new room</h2>
            <p className="text-sm text-white/70">
              You’ll create a code and share it with others.
            </p>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={createRoom}
            disabled={!nameValid}
            aria-disabled={!nameValid}
            title={!nameValid ? "Enter your name first" : undefined}
          >
            Start New Audit
          </Button>
        </section>
      </div>
    </main>
  );
}
