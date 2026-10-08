import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./*.html",
  ],
  theme: {
    extend: {
      colors: {
        "primary-dark": "#071D3A",
        "primary-blue": "#172B4D",
        "brand-blue": "#2E5BFF",
        "bg-ice": "#EAF5FC",
        "accent-gold": "#D4AF37",
        "accent-gold-hover": "#A98717",
        "gold-btn": "#C9A227",
        "gold-btn-hover": "#A98717",
        "gold-light": "#F4D675",
        "status-green": "#2ECC71",
        "status-orange": "#F39C12",
        "footer-text": "#B8C9DA",
      },
      borderRadius: {
        "xl": "12px",
        "2xl": "16px",
      },
      boxShadow: {
        "card": "0 4px 20px rgba(0,0,0,0.08)",
        "nav": "0 4px 20px rgba(7,29,58,0.25)",
        "btn-gold": "0 4px 10px rgba(201,162,39,0.35)",
        "btn-gold-hover": "0 6px 15px rgba(201,162,39,0.50)",
      },
      fontFamily: {
        sans: ["Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
