import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'linear-gradient(to bottom right, white, rgb(250 250 250 / 0.9), rgb(244 244 245 / 0.8))'
      },
    },
  },
  plugins: [],
} satisfies Config;
