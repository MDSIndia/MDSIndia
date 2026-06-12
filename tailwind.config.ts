import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#020208",
        surface: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.08)",
        "accent-blue": "#0055FF",
        "accent-cyan": "#00D4FF",
        "accent-purple": "#7B2FBE",
        "glow-blue": "rgba(0,85,255,0.35)",
        "glow-cyan": "rgba(0,212,255,0.25)",
        "text-primary": "#FFFFFF",
        "text-secondary": "rgba(255,255,255,0.65)",
        "text-muted": "rgba(255,255,255,0.35)",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },
      // Only keep animations that are truly needed
      animation: {
        "fade-up": "fadeUp 0.8s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      screens: {
        xs: "375px",
      },
    },
  },
  plugins: [],
};

export default config;
