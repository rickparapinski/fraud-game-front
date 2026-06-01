"use client";
import { useEffect, useRef } from "react";

export default function GameLog({ logs = [] }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // HELPER: Convert Game Event Objects to Readable Text
  const formatLog = (log) => {
    if (!log) return "";

    const num = typeof log.number === "number" ? log.number : "";

    // Handle Day Results (Voting)
    if (log.type === "day-results") {
      const { eliminatedName, tally, eliminatedId } = log.data || {};
      if (eliminatedName) {
        let votes = null;
        if (Array.isArray(tally)) {
          const hit = tally.find((t) => t.targetId === eliminatedId);
          votes = hit?.votes ?? null;
        }
        return `Day ${num}: ${eliminatedName} TERMINATED (${votes} votes).`;
      }
      return `Day ${num}: NO ELIMINATION.`;
    }

    // Handle Night Results (Attacks/Saves)
    if (log.type === "night-results") {
      const { eliminatedName, protectedName } = log.data || {};
      if (eliminatedName) {
        return `Night ${num}: ${eliminatedName} TERMINATED.`;
      }
      if (protectedName) {
        return `Night ${num}: FRAUD PREVENTED (PWC PROTECTION).`;
      }
      return `Night ${num}: NO ACTIVITY DETECTED.`;
    }

    // Handle Standard Text (Fallback to 'text' or 'message')
    let content = log.text || log.message || "";

    // Strip internal ID codes if they exist in parens e.g. "Name (ID123)" -> "Name"
    return content.replace(/\s+\([A-Z0-9_-]+\)/g, "");
  };

  // Safety guard
  if (!Array.isArray(logs)) {
    return (
      <div className="p-2 font-mono text-sm text-green-700 bg-black">
        Initializing...
      </div>
    );
  }

  return (
    <div className="bg-black p-2 md:p-4 h-full font-mono text-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex flex-col min-h-0">
      {/* Static Header to simulate terminal history */}
      <div className="flex-shrink-0 mb-4 text-green-700 opacity-50 select-none">
        Microsoft(R) Windows 95
        <br />
        (C)Copyright Microsoft Corp 1981-1996
        <br />
        <br />
        C:\SYSTEM\LOGS\&gt; tail -f security.log --watch
      </div>

      {/* Scrollable Log Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <ul className="space-y-1 tracking-wider font-retro">
          {logs.map((log) => {
            const message = formatLog(log);
            if (!message) return null;

            // Determine color based on log type
            let colorClass = "text-green-400";
            if (log.type === "night-results") colorClass = "text-blue-300";
            if (log.type === "day-results") colorClass = "text-yellow-300";
            if (log.type === "game-over") colorClass = "text-purple-300 font-bold";
            if (log.type === "night-results" && (log.data?.eliminatedId || log.data?.eliminatedName))
              colorClass = "text-red-500 font-bold";
            if (log.type === "day-results" && (log.data?.eliminatedId || log.data?.eliminatedName))
              colorClass = "text-red-400 font-bold";

            // Format Timestamp
            const time = log.ts
              ? new Date(log.ts).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "00:00:00";

            return (
              <li key={log.id} className="flex items-start gap-2 leading-tight">
                <span className="opacity-50 text-xs mt-[2px] select-none">
                  [{time}]
                </span>
                <span className="select-none">{">"}</span>
                <span className={`${colorClass} break-words`}>{message}</span>
              </li>
            );
          })}
          <li className="mt-2 text-green-400 animate-blink">_</li>
        </ul>
      </div>
    </div>
  );
}
