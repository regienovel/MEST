import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        mest: {
          ink: '#1A1A1A',
          paper: '#FAF9F6',
          blue: '#1B4F72',
          'blue-light': '#EAF2F8',
          teal: '#0E6B5C',
          'teal-light': '#E8F5F2',
          gold: '#B8860B',
          'gold-light': '#FDF6E3',
          rust: '#922B21',
          'rust-light': '#FDEDEC',
          sage: '#5D8B7F',
          'sage-light': '#E8F0ED',
          grey: {
            900: '#1A1A1A',
            700: '#424949',
            500: '#7B7D7D',
            300: '#BDC3C7',
            100: '#F4F6F7',
            50: '#FAFBFC',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
