"use client";
import { useEffect } from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";
import { sfx } from "@/lib/sfx";

export default function RetroToast({
  message,
  type = "info",
  title: titleOverride,
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // One-shot bleep when the toast appears
  useEffect(() => {
    if (!message) return;
    if (type === "error") sfx.alert();
    else sfx.good();
  }, [message, type]);

  if (!message) return null;

  // Visual Config based on type
  const config = {
    error: {
      title: "SYSTEM_ERROR",
      bar: "!bg-[#8b0000]",
      icon: <X className="w-4 h-4" />,
    },
    audit: {
      title: "AUDIT_RESULT",
      bar: "",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    info: {
      title: "NOTIFICATION",
      bar: "!bg-[#3a3a3a]",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  };

  const style = { ...(config[type] || config.info), ...(titleOverride ? { title: titleOverride } : {}) };

  return (
    <div className="animate-in fade-in slide-in-from-top-5 duration-200 w95 min-w-[300px]">
      {/* Title Bar */}
      <div className={`w95-title ${style.bar}`}>
        <span>{style.title}.EXE</span>
        <button onClick={onClose} className="w95-ctl">
          x
        </button>
      </div>

      {/* Content Body */}
      <div className="p-3 flex gap-3 items-start">
        {/* Icon Box */}
        <div className="mt-1">
          {style.icon && (
            <div className="w-8 h-8 flex items-center justify-center border-2 border-[#2b2b2b] border-r-white border-b-white bg-white text-black">
              {style.icon}
            </div>
          )}
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="text-lg leading-tight text-black uppercase font-retro">
            {message}
          </p>
          {type !== "audit" && (
            <button onClick={onClose} className="mt-2 px-6 py-1 btn95">
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
