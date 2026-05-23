import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        shell: "#0f0f0f",
        sidebar: "#111111",
        card: {
          DEFAULT: "#1a1a1a",
          secondary: "#1e1e1e",
          hover: "#242424",
        },
        input: "#1e1e1e",
        accent: {
          green: "#b5f023",
          "green-dim": "#8aab1a",
          "green-glow": "rgba(181, 240, 35, 0.15)",
        },
        "text-primary": "#ffffff",
        "text-secondary": "#9a9a9a",
        "text-muted": "#555555",
        border: {
          subtle: "rgba(255,255,255,0.06)",
          card: "rgba(255,255,255,0.04)",
        },
        severity: {
          phishing: "#ef4444",
          suspicious: "#f59e0b",
          safe: "#22c55e",
          spam: "#8b5cf6",
          info: "#3b82f6",
        },
      },
      borderRadius: {
        card: "24px",
        button: "14px",
        pill: "999px",
        input: "12px",
      },
      fontFamily: {
        heading: ["Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.5)",
        elevated: "0 8px 40px rgba(0,0,0,0.6)",
        glow: "0 0 20px rgba(181,240,35,0.15)",
      },
      animation: {
        "pulse-green": "pulseGreen 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 1.5s infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
      },
      keyframes: {
        pulseGreen: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
