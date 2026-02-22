import React from "react";

export default function Monitor({ children, className = "" }) {
  return (
    /* THE MONITOR HARDWARE (Beige Casing) */
    /* FIX: Added inline style for aspect-ratio to ensure it works even if Tailwind fails */
    <div
      className={`monitor-casing w-full max-w-5xl flex flex-col relative ${className}`}
      style={{ aspectRatio: "4/3", minHeight: "600px" }}
    >
      {/* BRANDING BADGE */}
      <div className="absolute z-20 flex items-center gap-2 bottom-2 right-8 opacity-60">
        <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_#00ff00] animate-pulse"></div>
        <span className="hidden text-sm font-bold tracking-widest uppercase text-neutral-600 font-retro sm:block">
          SyncMaster 2000
        </span>
      </div>

      {/* THE GLASS SCREEN */}
      <div className="relative flex-1 w-full h-full overflow-hidden screen-glass">
        {/* ARTIFACTS (Scanlines & Glow) */}
        <div className="scanlines"></div>
        <div className="crt-glow"></div>

        {/* ACTUAL SCREEN CONTENT */}
        {/* This div is the "Pixel Space" where the OS lives */}
        <div className="absolute inset-0 z-10 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
