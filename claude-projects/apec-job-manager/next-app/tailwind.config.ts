import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // APEC Brand Colors
        apec: {
          blue: {
            DEFAULT: '#0066CC',
            light: '#3385D6',
            dark: '#004C99',
            50: '#E6F2FF',
            100: '#CCE5FF',
            200: '#99CCFF',
            300: '#66B3FF',
            400: '#3399FF',
            500: '#0066CC',
            600: '#0052A3',
            700: '#003D7A',
            800: '#002952',
            900: '#001429',
          },
          gray: {
            DEFAULT: '#53565A',
            light: '#7A7D81',
            dark: '#2C2E31',
            50: '#F7F7F8',
            100: '#EEEEF0',
            200: '#DDDEE1',
            300: '#CBCDD1',
            400: '#BABDC2',
            500: '#53565A',
            600: '#424548',
            700: '#323436',
            800: '#212224',
            900: '#111112',
          },
          green: {
            DEFAULT: '#00A85A',
            light: '#33BA7B',
            dark: '#007F43',
          },
          orange: {
            DEFAULT: '#FF6B35',
            light: '#FF8C5F',
            dark: '#CC5527',
          },
          red: {
            DEFAULT: '#E63946',
            light: '#EB616B',
            dark: '#B82D38',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'apec': '0 4px 6px -1px rgba(0, 102, 204, 0.1), 0 2px 4px -1px rgba(0, 102, 204, 0.06)',
      },
    },
  },
  plugins: [],
}

export default config
