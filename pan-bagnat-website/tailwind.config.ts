import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'nice-blue': '#0066CC',
        'nice-yellow': '#FFD700',
        'mediterranean': '#4A90E2',
        'olive': '#8FBC8F',
        'tomato-red': '#FF6347',
        'bread-gold': '#DAA520',
      },
      fontFamily: {
        'serif': ['Georgia', 'serif'],
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config