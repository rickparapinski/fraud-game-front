"use client";
import { useEffect } from "react";
import { AlertTriangle, Search } from "lucide-react";

export function SystemToast({ type, message, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 5000);
    return () => clearTimeout(id);
  }, [onClose]);

  const styles = {
    error: {
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      bg: "bg-red-100 text-red-800 border-red-300",
    },
    audit: {
      icon: <Search className="w-4 h-4 text-blue-500" />,
      bg: "bg-blue-100 text-blue-800 border-blue-300",
    },
  }[type] || {
    icon: null,
    bg: "bg-gray-100 text-gray-800 border-gray-300",
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md border shadow-sm ${styles.bg}`}
    >
      {styles.icon}
      <span className="text-sm">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-xs text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>
    </div>
  );
}
