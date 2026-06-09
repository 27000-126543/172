/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        geo: {
          primary: "#0A1628",
          secondary: "#0F2035",
          card: "#152238",
          accent: "#E8702A",
          success: "#22C55E",
          danger: "#EF4444",
          warning: "#F59E0B",
          muted: "#64748B",
          text: "#E2E8F0",
          "text-secondary": "#94A3B8",
        },
      },
      animation: {
        "pulse-alert": "pulse-alert 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-alert": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};
