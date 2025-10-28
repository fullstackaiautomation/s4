import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        muted: "rgb(var(--muted))",
        "muted-foreground": "rgb(var(--muted-foreground))",
        primary: "rgb(var(--primary))",
        "primary-foreground": "rgb(var(--primary-foreground))",
        secondary: "rgb(var(--secondary))",
        "secondary-foreground": "rgb(var(--secondary-foreground))",
        border: "rgb(var(--border))",
        card: "rgb(var(--card))",
        danger: "rgb(var(--danger))",
        warning: "rgb(var(--warning))",
        success: "rgb(var(--success))",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        card: "0 10px 30px -15px rgba(15, 30, 60, 0.18)",
        subtle: "0 1px 2px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: "var(--font-geist-sans)",
        mono: "var(--font-geist-mono)",
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, rgba(var(--primary), 0.12), rgba(var(--secondary), 0.12))",
      },
    },
  },
  plugins: [],
} satisfies Config;
