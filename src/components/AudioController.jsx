"use client";
import { useState, useRef, useEffect } from "react";

const AudioController = ({ phase }) => {
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize the background track
    audioRef.current = new Audio("/audio/bg-music.ogg");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.2;

    return () => {
      audioRef.current.pause();
    };
  }, []);

  // Effect: React to Game Phase changes
  useEffect(() => {
    if (!audioRef.current || isMuted) return;

    if (phase === "NIGHT") {
      // Make music slightly louder/tense during Night
      audioRef.current.volume = 0.35;
    } else {
      // Chill volume for Day discussion
      audioRef.current.volume = 0.15;
    }
  }, [phase, isMuted]);

  const toggleAudio = () => {
    if (isMuted) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
    setIsMuted(!isMuted);
  };

  return (
    <button
      onClick={toggleAudio}
      className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-2 
        border-2 transition-all active:translate-y-1 active:shadow-none
        ${
          isMuted
            ? "bg-slate-900 border-slate-700 text-slate-500 shadow-[4px_4px_0px_0px_#1e293b]"
            : "bg-indigo-950 border-indigo-400 text-indigo-300 shadow-[4px_4px_0px_0px_#4338ca]"
        }
      `}
    >
      {/* Retro "LED" indicator */}
      <div
        className={`w-2 h-2 rounded-full ${isMuted ? "bg-slate-700" : "bg-red-500 shadow-[0_0_8px_red] animate-pulse"}`}
      />

      <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
        {isMuted ? "System Silent" : "Audio Feed Live"}
      </span>

      <div className="flex items-end h-3 gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 bg-current transition-all duration-300 ${!isMuted ? "animate-bounce" : "h-1"}`}
            style={{
              animationDelay: `${i * 0.1}s`,
              height: isMuted ? "2px" : "100%",
            }}
          />
        ))}
      </div>
    </button>
  );
};

export default AudioController;
