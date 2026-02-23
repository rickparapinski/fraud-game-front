"use client";
import { useState, useRef, useEffect } from "react";

export default function AudioController({ phase }) {
  const [isMuted, setIsMuted] = useState(true);
  const [userVol, setUserVol] = useState(0.5); // User's master volume setting (0 to 1)
  const audioRef = useRef(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio("/audio/bg-music.ogg");
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        audioRef.current.loop = true;
      }
    };
  }, []);

  // Handle Logic (Phase Multiplier)
  useEffect(() => {
    if (!audioRef.current) return;

    const p = (phase || "lobby").toLowerCase();

    // Day = Quiet (40%), Night = Loud (100%), Lobby = Medium (80%)
    let multiplier = 0.8;
    if (p === "day") multiplier = 0.4;
    if (p === "night") multiplier = 1.0;

    if (isMuted) {
      audioRef.current.volume = 0;
      if (!audioRef.current.paused) audioRef.current.pause();
    } else {
      audioRef.current.volume = Math.min(1, userVol * multiplier);
      if (audioRef.current.paused) audioRef.current.play().catch(() => {});
    }
  }, [phase, isMuted, userVol]);

  // Handle clicking a bar to set volume
  const handleBarClick = (index) => {
    const newVol = (index + 1) / 10; // 10 bars total
    setUserVol(newVol);
    if (isMuted) setIsMuted(false);
  };

  const isNight = (phase || "").toLowerCase() === "night";

  return (
    // CONTAINER: "Sunken" Bezel (Matches the Clock)
    <div className="flex items-center h-full gap-2 px-2 bg-black border-2 border-gray-600 select-none border-b-white border-r-white">
      {/* MUTE BUTTON (Icon) */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className={`font-bold text-xs font-mono uppercase focus:outline-none hover:opacity-80
          ${isMuted ? "text-red-600 animate-pulse" : "text-green-500"}
        `}
        title={isMuted ? "System Muted" : "System Audio Active"}
      >
        {isMuted ? "OFF" : "VOL"}
      </button>

      {/* VOLUME BARS (Segmented LED Display) */}
      <div className="flex items-end gap-[2px] h-4">
        {[...Array(10)].map((_, i) => {
          const barLevel = (i + 1) / 10;
          const isActive = !isMuted && userVol >= barLevel;

          // Color Logic:
          // Active + Night = Amber (Warning)
          // Active + Day = Green (Safe)
          // Inactive = Dark Green/Gray (Dim)
          let barColor = "bg-[#112211]"; // Default Dim
          if (isActive) {
            barColor = isNight
              ? "bg-amber-500 shadow-[0_0_4px_orange]"
              : "bg-green-500 shadow-[0_0_4px_lime]";
          }

          return (
            <div
              key={i}
              onClick={() => handleBarClick(i)}
              className={`w-1.5 cursor-pointer transition-all duration-300 rounded-[1px] ${barColor}`}
              style={{ height: `${40 + i * 6}%` }} // Ascending height effect
            />
          );
        })}
      </div>
    </div>
  );
}
