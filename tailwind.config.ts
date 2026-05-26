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
        /* Editorial palette — maps to CSS vars */
        page:     "var(--bg-page)",
        surface:  "var(--bg-surface)",
        subtle:   "var(--bg-subtle)",
        accent:   "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-bg":    "var(--accent-bg)",
        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted":     "var(--text-muted)",
        "on-accent":      "var(--text-on-accent)",
        "border-s":       "var(--border-subtle)",
        "border-m":       "var(--border-medium)",
        /* Keep for admin dark UI */
        slate: require("tailwindcss/colors").slate,
        zinc:  require("tailwindcss/colors").zinc,
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Amiri", "Georgia", "serif"],
        sans:  ["var(--font-sans)",  "Cairo", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card:   "6px",
        btn:    "6px",
        badge:  "3px",
        img:    "6px",
      },
      boxShadow: {
        editorial: "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
      },
      maxWidth: {
        article: "680px",
      },
      lineHeight: {
        arabic: "1.8",
      },
    },
  },
  plugins: [],
};

export default config;
