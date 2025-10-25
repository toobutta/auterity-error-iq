/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // AutoMatrix Automotive Colors
        "automotive-primary": "#1e40af",
        "automotive-secondary": "#3b82f6",
        "automotive-accent": "#f59e0b",
        "automotive-silver": "#64748b",
        "automotive-gold": "#fbbf24",

        // Semantic colors
        dealership: "#1e40af",
        customer: "#f59e0b",
        inventory: "#059669",
        service: "#8b5cf6",
        finance: "#06b6d4",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};


