"use client";
import {
  hashString,
  mulberry32,
  pickFromPaletteDeterministic,
} from "@/utils/seed";

const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
};

export default function Avatar({
  seed, // string: player.id || player.name
  label, // fallback initial(s)
  size = "md",
  host = false,
  className = "",
}) {
  const px = typeof size === "number" ? size : SIZES[size] ?? 40;
  const initial = (label || "?").trim()[0]?.toUpperCase() ?? "?";

  const rnd = mulberry32(hashString(seed || label || "?"));

  const bg = pickFromPaletteDeterministic(seed || label || "?"); // 👈 curated pastel
  // simple face variants
  const eyeVariant = Math.floor(rnd() * 3); // 0,1,2

  return (
    <div
      className={`relative rounded-full shrink-0 ring-1 ring-white/10 ${className}`}
      style={{ width: px, height: px, background: bg }}
      aria-label={label}
      title={label}
    >
      <svg width={px} height={px} viewBox="0 0 64 64" role="img" aria-hidden>
        {/* head */}
        <circle cx="32" cy="32" r="26" fill="rgba(255,255,255,0.2)" />
        {/* eyes */}
        {eyeVariant === 0 && (
          <>
            <circle cx="24" cy="28" r="3" fill="#0b1020" />
            <circle cx="40" cy="28" r="3" fill="#0b1020" />
          </>
        )}
        {eyeVariant === 1 && (
          <>
            <rect
              x="21"
              y="26.5"
              width="6"
              height="3"
              rx="1.5"
              fill="#0b1020"
            />
            <rect
              x="37"
              y="26.5"
              width="6"
              height="3"
              rx="1.5"
              fill="#0b1020"
            />
          </>
        )}
        {eyeVariant === 2 && (
          <>
            <path
              d="M21 28 q3 -4 6 0"
              stroke="#0b1020"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M37 28 q3 -4 6 0"
              stroke="#0b1020"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
        {/* mouth — always smile */}
        <path
          d="M24 42 q8 6 16 0"
          stroke="#0b1020"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* fallback initial, subtle */}
      <span
        className="absolute inset-0 grid place-items-center text-white/90 font-semibold select-none mix-blend-soft-light"
        style={{ fontSize: px * 0.45 }}
      >
        {initial}
      </span>

      {/* host crown */}
      {host && (
        <span
          className="absolute -right-1 -bottom-1 text-[10px] px-1 py-0.5 rounded-full bg-accent-gold text-ink-800 font-bold"
          title="Host"
        >
          👑
        </span>
      )}
    </div>
  );
}
