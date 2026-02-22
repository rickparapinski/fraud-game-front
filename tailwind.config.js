/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Retro Palette
        wall: "#222222",
        "monitor-case": "#d1d1c4",

        // Day Mode (Windows 95)
        "win-teal": "#008080",
        "win-gray": "#c0c0c0",
        "win-blue": "#000080",

        // Night Mode (Terminal)
        "term-bg": "#0a0a0a",
        "term-green": "#33ff00",
        "term-amber": "#ffb000",
        "term-red": "#ff3333",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "cursive"],
        retro: ['"VT323"', "monospace"],
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "turn-on": "turn-on 0.3s ease-out forwards",
      },
      keyframes: {
        blink: {
          "50%": { opacity: "0" },
        },
        "turn-on": {
          "0%": {
            transform: "scale(1, 0.002)",
            opacity: "0",
            filter: "brightness(30)",
          },
          "30%": { transform: "scale(1, 0.002)", opacity: "1" },
          "50%": { transform: "scale(1.1, 0.01)" },
          "100%": { transform: "scale(1, 1)", filter: "brightness(1)" },
        },
      },
    },
  },
  plugins: [],
};
