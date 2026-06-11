import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1B2A45",
        emeraldBrand: "#0D9373",
        brand: {
          50: "#E1F5EE",
          100: "#BFE8D9",
          600: "#0F6E56",
          700: "#085041",
        },
        ink: {
          900: "#0F172A",
          700: "#334155",
          500: "#64748B",
        },
      },
    },
  },
  plugins: [],
};

export default config;
