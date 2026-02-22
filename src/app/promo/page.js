"use client";
import { useEffect, useState } from "react";
import Monitor from "@/components/Monitor";
import RetroGameOver from "@/components/ui/RetroGameOver";

export default function PromoPage() {
  const [step, setStep] = useState(0); // 0:Boot, 1:UI, 2:Crash
  const [lines, setLines] = useState([]);
  const [isGlitching, setIsGlitching] = useState(false);

  // The Script
  useEffect(() => {
    const script = [
      // --- BOOT SEQUENCE ---
      { t: 500, cmd: "> POWER_ON..." },
      { t: 1000, cmd: "> CHECKING_ASSETS: [OK]" },
      { t: 1500, cmd: "> LOADING: OFFICE_SUSPICION_2.0" },
      { t: 2200, cmd: "> INSTALLING: NEW_UI_PACKAGE..." },
      { t: 3000, cmd: "> UPDATING: ROLE_DEFINITIONS..." },
      { t: 3800, cmd: "> CONNECTING TO HOST..." },
      { t: 4500, action: () => setStep(1) }, // SHOW UI

      // --- THE MELTDOWN SEQUENCE ---
      { t: 7000, action: () => setIsGlitching(true) }, // START GLITCH
      {
        t: 7200,
        action: () => setLines((prev) => [...prev, "ERR: INTEGRITY_FAILURE"]),
      },
      {
        t: 7400,
        action: () =>
          setLines((prev) => [...prev, "CRITICAL: UNAUTHORIZED_ACCESS"]),
      },

      // --- THE CRASH ---
      {
        t: 8000,
        action: () => {
          setIsGlitching(false);
          setStep(2);
        },
      },
    ];

    const timers = script.map((s) =>
      setTimeout(() => {
        if (s.cmd) setLines((p) => [...p, s.cmd]);
        if (s.action) s.action();
      }, s.t)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    /* Container forces centering and ensures max width for the monitor */
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4 w-full">
      {/* One-off styles for the glitch effect */}
      <style jsx>{`
        @keyframes shake {
          0% {
            transform: translate(1px, 1px) rotate(0deg);
          }
          10% {
            transform: translate(-1px, -2px) rotate(-1deg);
          }
          20% {
            transform: translate(-3px, 0px) rotate(1deg);
          }
          30% {
            transform: translate(3px, 2px) rotate(0deg);
          }
          40% {
            transform: translate(1px, -1px) rotate(1deg);
          }
          50% {
            transform: translate(-1px, 2px) rotate(-1deg);
          }
          60% {
            transform: translate(-3px, 1px) rotate(0deg);
          }
          70% {
            transform: translate(3px, 1px) rotate(-1deg);
          }
          80% {
            transform: translate(-1px, -1px) rotate(1deg);
          }
          90% {
            transform: translate(1px, 2px) rotate(0deg);
          }
          100% {
            transform: translate(1px, -2px) rotate(-1deg);
          }
        }
        .glitch-active {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both
            infinite;
          filter: invert(1) contrast(2);
        }
        .glitch-overlay {
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
        }
      `}</style>

      <div className="w-full max-w-5xl">
        <Monitor>
          <div
            className={`w-full h-full bg-[#008080] relative overflow-hidden flex flex-col font-retro ${
              isGlitching ? "glitch-active" : ""
            }`}
          >
            {/* === PHASE 0: BOOT SCREEN (Background Layer) === */}
            {/* We keep this visible during glitch to bleed through */}
            {(step === 0 || isGlitching) && (
              <div
                className={`absolute inset-0 z-50 p-8 font-mono text-xl bg-black ${
                  isGlitching ? "opacity-50 text-red-500" : "text-green-500"
                }`}
              >
                {lines.map((l, i) => (
                  <div key={i} className="mb-2">
                    {l}
                  </div>
                ))}
                <div className="mt-4 animate-blink">_</div>
              </div>
            )}

            {/* === PHASE 1: FAKE UI === */}
            {(step === 1 || isGlitching) && (
              <div className="flex flex-col flex-1">
                {/* Top Bar */}
                <div className="flex justify-between px-2 py-1 text-black bg-[#c0c0c0] border-b-2 border-white shadow-md">
                  <div className="flex items-center gap-2 px-2 bg-gray-200 border-2 border-gray-600">
                    <span className="font-bold">DEPT:</span>
                    <span className="text-xl tracking-widest font-retro">
                      PROMO-25
                    </span>
                  </div>
                  <div className="px-2 font-mono text-xl text-red-500 bg-black border-2 border-gray-600">
                    00:00
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex items-center justify-center flex-1 gap-4 p-4">
                  <div className="p-1 duration-500 retro-window animate-in zoom-in">
                    <div className="bg-[#000080] retro-title-bar text-white p-1">
                      <span>PREVIEW.EXE</span>
                    </div>
                    <div className="bg-[#d1d1c4] p-8 flex flex-col items-center gap-4">
                      <div className="text-4xl leading-tight text-center font-pixel">
                        OFFICE
                        <br />
                        SUSPICION
                        <br />
                        <span className="text-red-600">2.0</span>
                      </div>
                      <div className="font-mono text-sm text-gray-600">
                        WAITING FOR PLAYERS...
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-12 h-12 bg-blue-200 border-2 border-blue-400 animate-pulse"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* === GLITCH OVERLAY === */}
            {isGlitching && (
              <div className="absolute inset-0 z-[60] pointer-events-none glitch-overlay flex items-center justify-center">
                <h1 className="font-black text-red-600 opacity-50 text-9xl rotate-12">
                  ERROR
                </h1>
              </div>
            )}

            {/* === PHASE 2: CRASH === */}
            {step === 2 && (
              <RetroGameOver
                winner="fraudster"
                reason="SECURITY_BREACH_DETECTED"
                players={[
                  { id: 1, name: "THE_HOST", role: "FRAUDSTER" },
                  { id: 2, name: "YOUR_BOSS", role: "ACCOUNTANT" },
                  { id: 3, name: "HR_DEPT", role: "AUDITOR" },
                  { id: 4, name: "YOU", role: "FRAUDSTER" },
                ]}
                onRestart={() => window.location.reload()}
              />
            )}
          </div>
        </Monitor>
      </div>
    </div>
  );
}
