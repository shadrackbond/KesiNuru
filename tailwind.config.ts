import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211d",
        forest: "#173f35",
        leaf: "#2f6d5a",
        mint: "#dcebe5",
        cream: "#f6f4ed",
        sand: "#e8e2d3",
      },
      boxShadow: {
        soft: "0 18px 55px rgba(23, 63, 53, 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;
