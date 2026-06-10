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
        background: "#050505",
        surface: "rgba(255,255,255,0.03)",
        border: "rgba(255,255,255,0.08)",
        "accent-blue": "#0066FF",
        "accent-cyan": "#00E5FF",
        "accent-purple": "#7B2FBE",
        "glow-blue": "rgba(0,102,255,0.3)",
        "glow-cyan": "rgba(0,229,255,0.2)",
        "text-primary": "#FFFFFF",
        "text-secondary": "rgba(255,255,255,0.6)",
        "text-muted": "rgba(255,255,255,0.3)",
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
