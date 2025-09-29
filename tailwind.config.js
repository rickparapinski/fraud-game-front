// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          900: "#0F172A", // top bg
          800: "#1E293B", // bottom bg / cards
          700: "#334155", // borders
        },
        role: {
          accountant: "#3B82F6",
          controller: "#10B981",
          auditor: "#8B5CF6",
          fraudster: "#EF4444",
        },
        accent: {
          gold: "#FACC15",
          mint: "#34D399",
        },
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 6px 18px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
};
