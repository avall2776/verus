import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background, #050814)",
        panel: "var(--panel, #0B1224)",
        "panel-secondary": "var(--panel-secondary, #161b22)",
        primary: "#0055FF",
        accent: "#00D2FF",
        "text-primary": "var(--text-primary, #FFFFFF)",
        "text-secondary": "var(--text-secondary, #94A3B8)",
        "border-main": "var(--border-main, #1e293b)",
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #0055FF, #00D2FF)',
      }
    },
  },
  plugins: [],
};
export default config;
