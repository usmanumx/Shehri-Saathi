import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette pulled from the ShehriSaathi logo
        brand: {
          green: "#1f7a3d",
          greenDark: "#155e2e",
          navy: "#13315c",
          cream: "#f5f5ec",
        },
      },
      fontFamily: {
        urdu: ["var(--font-urdu)", "serif"],
        sans: ["var(--font-latin)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
