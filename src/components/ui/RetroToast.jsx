"use client";
import { useEffect } from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";

export default function RetroToast({
  message,
  type = "info",
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  // Visual Config based on type
  const config = {
    error: {
      title: "SYSTEM_ERROR",
      bg: "bg-red-900",
      border: "border-red-500",
      text: "text-white",
      icon: <X className="w-4 h-4" />,
    },
    audit: {
      title: "AUDIT_RESULT",
      bg: "bg-blue-900",
      border: "border-blue-400",
      text: "text-green-400",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    info: {
      title: "NOTIFICATION",
      bg: "bg-gray-800",
      border: "border-gray-500",
      text: "text-gray-200",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  };

  const style = config[type] || config.info;

  return (
    <div className="animate-in fade-in slide-in-from-top-5 duration-200 retro-window min-w-[300px] shadow-xl">
      {/* Title Bar */}
      <div
        className={`retro-title-bar ${style.bg} flex justify-between items-center px-2 py-1`}
      >
        <span className="text-xs font-bold tracking-wider text-white uppercase">
          {style.title}.EXE
        </span>
        <button onClick={onClose} className="hover:bg-white/20 p-0.5 rounded">
          <X className="w-3 h-3 text-white" />
        </button>
      </div>

      {/* Content Body */}
      <div className="bg-[#c0c0c0] p-3 border-t-2 border-white border-l-2 border-white border-r-2 border-gray-600 border-b-2 border-gray-600 flex gap-3 items-start">
        {/* Icon Box */}
        <div className="mt-1">
          {style.icon && (
            <div
              className={`w-8 h-8 flex items-center justify-center border-2 border-gray-600 bg-white text-black`}
            >
              {style.icon}
            </div>
          )}
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="mb-2 text-lg leading-tight text-black uppercase font-retro">
            {message}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1 text-xs font-bold bg-gray-300 retro-btn active:translate-y-1"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
