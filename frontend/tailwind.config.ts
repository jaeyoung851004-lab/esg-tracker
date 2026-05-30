import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1B2A45",
        emeraldBrand: "#0D9373",
      },
    },
  },
  plugins: [],
};

export default config;
