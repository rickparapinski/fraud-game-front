"use client";
import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import Monitor from "@/components/Monitor";

const ROOM_RE = /^[A-Z0-9]{6}$/;

export default function Home() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [errors, setErrors] = useState({ name: "", room: "" });
  const [bootStep, setBootStep] = useState(0);
  const router = useRouter();

  // Restore saved name & Run Boot Sequence
  useEffect(() => {
    const n = localStorage.getItem("oos:name");
    if (n) setName(n);

    const timers = [
      setTimeout(() => setBootStep(1), 800), // RAM
      setTimeout(() => setBootStep(2), 1600), // DRIVERS
      setTimeout(() => setBootStep(3), 2400), // READY
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Save name
  useEffect(() => {
    if (name.trim()) localStorage.setItem("oos:name", name.trim());
  }, [name]);

  const cleanName = useMemo(() => name.trim(), [name]);
  const nameValid = cleanName.length >= 1 && cleanName.length <= 24;
  const roomValid = ROOM_RE.test(roomCode);

  function validateJoin() {
    const next = { name: "", room: "" };
    if (!nameValid) next.name = "INVALID ID FORMAT";
    if (!roomValid) next.room = "INVALID DEPT CODE";
    setErrors(next);
    return !next.name && !next.room;
  }

  function validateCreate() {
    const next = { name: "", room: "" };
    if (!nameValid) next.name = "INVALID ID FORMAT";
    setErrors(next);
    return !next.name;
  }

  function createRoom() {
    if (!validateCreate()) return;
    if (!confirm("INITIALIZE NEW DEPARTMENT NODE?")) return;

    const socket = getSocket();
    socket.emit("create-room", { hostName: cleanName }, (res) => {
      if (!res?.ok) return alert("SERVER ERROR: CANNOT CREATE NODE");

      // ✅ persist host session so /room can resume instead of trying to "join" again
      try {
        if (res?.player?.sessionId)
          localStorage.setItem("acct-game:sessionId", res.player.sessionId);
        if (res?.roomCode)
          localStorage.setItem("acct-game:roomCode", res.roomCode);
      } catch {}

      router.push(
        `/room/${res.roomCode}?name=${encodeURIComponent(cleanName)}`,
      );
    });
  }

  function joinRoom() {
    if (!validateJoin()) return;
    router.push(
      `/room/${roomCode.toUpperCase()}?name=${encodeURIComponent(cleanName)}`,
    );
  }

  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      roomCode ? joinRoom() : createRoom();
    }
  }

  return (
    <main className="flex items-center justify-center w-full h-screen p-2 overflow-hidden md:p-4">
      <Monitor>
        {/* OS BACKGROUND - Default to Day/Teal Theme */}
        <div className="w-full h-full bg-[var(--win-teal)] p-4 md:p-8 overflow-y-auto font-retro text-lg flex flex-col">
          {/* -- VIEW 1: BOOT SEQUENCE -- */}
          {bootStep < 3 ? (
            <div className="space-y-2 text-xl text-white font-retro">
              <p>&gt; BIOS DATE 01/01/1999 14:22:51 VER 1.02</p>
              <p>&gt; CPU: INTEL 486 DX2-66 ... OK</p>
              {bootStep >= 1 && <p>&gt; CHECKING MEMORY ... 640K OK</p>}
              {bootStep >= 2 && <p>&gt; LOADING SUSPICION.DRV ... OK</p>}
              <p className="animate-blink">_</p>
            </div>
          ) : (
            /* -- VIEW 2: LOGIN FORM -- */
            <div className="flex flex-col h-full duration-300 animate-in fade-in">
              {/* OS TOP BAR */}
              <div className="flex justify-between pb-2 mb-6 text-white border-b-2 select-none border-white/50">
                <span>OFFICE_OS_V1.0</span>
                <span>USER: GUEST</span>
              </div>

              <div className="flex flex-col items-center justify-center flex-1">
                {/* LOGIN WINDOW */}
                <div className="w-full max-w-md p-1 retro-window">
                  <div className="mb-1 retro-title-bar">
                    <span>LOGIN.EXE</span>
                    <span className="text-[8px] cursor-pointer hover:text-red-300">
                      X
                    </span>
                  </div>

                  <div className="bg-[#d1d1c4] p-6 space-y-6">
                    {/* FORM: NAME */}
                    <div className="space-y-1">
                      <label className="font-pixel text-[10px] text-black uppercase">
                        Employee ID (Name)
                      </label>
                      <input
                        className={`retro-input w-full p-2 ${
                          errors.name ? "border-red-500 bg-red-100" : ""
                        }`}
                        placeholder="ENTER NAME..."
                        value={name}
                        maxLength={24}
                        onChange={(e) => setName(e.target.value.slice(0, 24))}
                        onKeyDown={onKeyDown}
                        autoComplete="off"
                      />
                      {errors.name && (
                        <p className="text-sm font-bold text-red-600 animate-blink">
                          &gt; {errors.name}
                        </p>
                      )}
                    </div>

                    {/* FORM: ROOM CODE */}
                    <div className="space-y-1">
                      <label className="font-pixel text-[10px] text-black uppercase">
                        Dept. Code (Room)
                      </label>
                      <div className="flex gap-2">
                        <input
                          className={`retro-input flex-1 p-2 uppercase tracking-widest ${
                            errors.room ? "border-red-500 bg-red-100" : ""
                          }`}
                          placeholder="______"
                          value={roomCode}
                          maxLength={6}
                          onChange={(e) =>
                            setRoomCode(
                              e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, "")
                                .slice(0, 6),
                            )
                          }
                          onKeyDown={onKeyDown}
                          autoComplete="off"
                        />
                        <button
                          onClick={joinRoom}
                          disabled={!nameValid || !roomValid}
                          className="px-4 py-2 text-white bg-blue-800 retro-btn disabled:opacity-50 hover:bg-blue-700 active:translate-y-1"
                        >
                          PUNCH
                          <br />
                          IN
                        </button>
                      </div>
                      {errors.room && (
                        <p className="text-sm font-bold text-red-600 animate-blink">
                          &gt; {errors.room}
                        </p>
                      )}
                    </div>

                    {/* DIVIDER */}
                    <div className="w-full h-px my-4 bg-gray-400 border-b border-white"></div>

                    {/* FORM: HOST */}
                    <div className="space-y-2 text-center">
                      <p className="text-sm text-black font-retro">
                        NO ASSIGNMENT?
                      </p>
                      <button
                        onClick={createRoom}
                        disabled={!nameValid}
                        className="w-full py-3 transition-colors retro-btn hover:bg-white active:translate-y-1"
                      >
                        OPEN NEW BRANCH
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* OS FOOTER */}
              <div className="pt-4 mt-auto text-sm text-center select-none text-white/60 font-retro">
                © 199X SUSPICION CORP. ALL RIGHTS RESERVED.
              </div>
            </div>
          )}
        </div>
      </Monitor>
    </main>
  );
}
