/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0B0D1B",
        surface: {
          DEFAULT: "#121528",
          hover: "#1A1E38",
          card: "#151830",
          border: "#262A4A"
        },
        amethyst: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          glow: "rgba(139, 92, 246, 0.25)"
        },
        cyan: {
          DEFAULT: "#06B6D4",
          hover: "#0891B2",
          glow: "rgba(6, 182, 212, 0.2)"
        },
        emerald: {
          DEFAULT: "#10B981",
          hover: "#059669"
        },
        amber: {
          DEFAULT: "#F59E0B",
          hover: "#D97706"
        },
        crimson: {
          DEFAULT: "#EF4444",
          hover: "#DC2626"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
