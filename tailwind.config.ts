import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        cyber: {
          red: "hsl(var(--cyber-red))",
          orange: "hsl(var(--cyber-orange))",
          pink: "hsl(var(--cyber-pink))",
          glow: "hsl(var(--cyber-glow))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-20px) rotate(120deg)" },
          "66%": { transform: "translateY(10px) rotate(240deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px rgba(255, 72, 79, 0.3)",
            opacity: "0.8"
          },
          "50%": { 
            boxShadow: "0 0 40px rgba(255, 72, 79, 0.6)",
            opacity: "1"
          },
        },
        "slide-in-up": {
          from: {
            opacity: "0",
            transform: "translateY(30px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "circuit-flow": {
          "0%": { 
            opacity: "0",
            transform: "scaleX(0)",
          },
          "50%": { 
            opacity: "1",
            transform: "scaleX(1)",
          },
          "100%": { 
            opacity: "0",
            transform: "scaleX(1)",
          },
        },
        "network-pulse": {
          "0%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
          "100%": { opacity: "0.4" },
        },
        "glow-pulse": {
          "0%, 100%": { filter: "brightness(1) drop-shadow(0 0 10px rgba(255, 72, 79, 0.5))" },
          "50%": { filter: "brightness(1.2) drop-shadow(0 0 20px rgba(255, 72, 79, 0.8))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin-slow 3s linear infinite",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        slideIn: "slideIn 0.3s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-in-up": "slide-in-up 0.6s ease-out",
        "circuit-flow": "circuit-flow 3s ease-in-out infinite",
        "network-pulse": "network-pulse 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #FF483F 0%, #E63D7A 50%, #FF5A3D 100%)',
        'cyber-glow': 'radial-gradient(circle, rgba(255, 72, 79, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(255, 72, 79, 0.3)',
        'cyber-lg': '0 0 30px rgba(255, 72, 79, 0.4)',
        'cyber-xl': '0 0 40px rgba(255, 72, 79, 0.5)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
