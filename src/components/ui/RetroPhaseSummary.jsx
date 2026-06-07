"use client";
import { useEffect } from "react";

export default function RetroPhaseSummary({
  phase,
  eliminatedName,
  protectedName,
  eliminatedRole,
  onDismiss,
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isDay = phase === "morning_meeting";

  return (
    <div className="animate-in slide-in-from-top-10 duration-500 relative w-[320px] mx-auto mt-4 font-mono text-sm text-black">
      {/* Paper Styling */}
      <div className="bg-[#fff0cf] border border-gray-400 p-4 shadow-[5px_5px_15px_rgba(0,0,0,0.5)] rotate-1">
        {/* Header — day only */}
        {isDay && (
          <div className="pb-2 mb-3 text-center border-b-2 border-black border-dashed">
            <h3 className="text-lg font-bold tracking-widest uppercase">
              DAILY_TERMINATION_REPORT
            </h3>
            <p className="text-[10px] opacity-60">
              CONFIDENTIAL // INTERNAL USE ONLY
            </p>
          </div>
        )}

        {/* Body */}
        <div className="space-y-2 text-center">
          {eliminatedName ? (
            <>
              <div className="text-xl font-bold text-red-700 uppercase font-retro">
                {eliminatedName}
              </div>
              <div className="inline-block px-1 text-xs text-white bg-black">
                STATUS: TERMINATED
              </div>
              {eliminatedRole && (
                <div className="mt-1 text-xs">
                  ROLE REVEALED:{" "}
                  <span className="font-bold">{eliminatedRole}</span>
                </div>
              )}
            </>
          ) : (
            <div className="inline-block px-2 py-1 text-lg font-bold text-green-800 transform border-2 border-green-800 font-retro -rotate-3 opacity-80">
              NO CASUALTIES
            </div>
          )}

          {protectedName && (
            <div className="pt-2 mt-3 text-xs italic text-blue-800 border-t border-gray-300">
              (Security Detail Report: {protectedName} was shielded from an
              attack.)
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-[10px] text-center opacity-50">
          PRESS 'OK' TO ACKNOWLEDGE...
        </div>
      </div>

      {/* "Tape" effect holding it to the screen */}
      <div className="absolute w-16 h-6 transform -translate-x-1/2 border-l border-r -top-3 left-1/2 bg-white/30 border-white/50 -rotate-1 backdrop-blur-sm"></div>
    </div>
  );
}
