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
