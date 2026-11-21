import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F9F5FF",
        surface: "#FFFFFF",
        primary: "#7C3AED",
        "primary-dark": "#6D28D9",
        like: "#22C55E",
        pass: "#EF4444",
        ink: "#1E1B2E",
        muted: "#6B7280",
        chip: "#EDE9FE",
        "chip-text": "#6D28D9",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 8px 32px rgba(0, 0, 0, 0.12)",
        soft: "0 2px 16px rgba(30, 27, 46, 0.08)",
      },
      backgroundImage: {
        match: "linear-gradient(135deg, #E879F9, #818CF8)",
      },
    },
  },
  plugins: [],
};

export default config;
