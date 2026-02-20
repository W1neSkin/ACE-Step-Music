/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Deep dark palette inspired by Suno / Spotify */
        surface: {
          DEFAULT: "#0a0a0f",
          50: "#10101a",
          100: "#16162a",
          200: "#1e1e36",
          300: "#282845",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          light: "#a78bfa",
          dark: "#6d28d9",
          glow: "rgba(139, 92, 246, 0.25)",
        },
        neon: {
          pink: "#ec4899",
          blue: "#3b82f6",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(139, 92, 246, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
