"use client";
import { ClipboardIcon } from "lucide-react";

export default function RoomCodeBox({ code = "" }) {
  const formatted = code.replace(/(.{3})/g, "$1 ").trim() || "------";

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={formatted}
        className="flex-1 rounded-xl bg-ink-900 border border-ink-700 px-4 py-3 font-mono tracking-widest text-center text-lg select-all"
        onClick={(e) => e.target.select()} // auto-select when clicked
      />
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(code)}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
        title="Copy room code"
      >
        <ClipboardIcon className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
