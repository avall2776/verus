import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050814",
        panel: "#0B1224",
        primary: "#0055FF",
        accent: "#00D2FF",
        "text-primary": "#FFFFFF",
        "text-secondary": "#94A3B8",
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #0055FF, #00D2FF)',
      }
    },
  },
  plugins: [],
};
export default config;
