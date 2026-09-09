import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Official attendance color tokens according to PRD & WCAG
        att: {
          present: {
            bg: "#C6EFCE",
            text: "#006100",
            border: "#93D097",
            darkBg: "rgba(34, 197, 94, 0.2)",
            darkText: "#4ade80",
          },
          absent: {
            bg: "#FFC7CE",
            text: "#9C0006",
            border: "#F59DA7",
            darkBg: "rgba(239, 68, 68, 0.2)",
            darkText: "#f87171",
          },
          verified: {
            bg: "#FFEB9C",
            text: "#9C6500",
            border: "#ECC767",
            darkBg: "rgba(234, 179, 8, 0.2)",
            darkText: "#facc15",
          },
          weekend: {
            bg: "#f3f4f6",
            text: "#9ca3af",
          }
        }
      },
    },
  },
  plugins: [],
};

export default config;
