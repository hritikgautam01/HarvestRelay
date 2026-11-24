/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f8f5',
          100: '#e1efe8',
          200: '#c4dfd3',
          300: '#9bc6b5',
          400: '#6ea893',
          500: '#4b8c76',
          600: '#38705e',
          700: '#2d5a4c',
          800: '#26483e',
          900: '#1b332c',
          950: '#0d1d18',
        },
        terracotta: {
          50: '#fdf6f2',
          100: '#fbe9e0',
          200: '#f7d3c0',
          300: '#f1b397',
          400: '#e88965',
          500: '#dc653a',
          600: '#c94d28',
          700: '#a73c20',
          800: '#87331f',
          900: '#6f2e1e',
        },
        amberGold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        stoneWarm: {
          50: '#faf9f6',
          100: '#f4f2ec',
          200: '#e8e5dc',
          300: '#d7d2c3',
          400: '#bfb8a4',
          500: '#a89f89',
          600: '#8f8671',
          700: '#726b5a',
          800: '#5c564a',
          900: '#4c473e',
          950: '#282520',
        }
      },
      fontFamily: {
        serifDisplay: ['"Newsreader"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace']
      },
      boxShadow: {
        'soft-sm': '0 1px 2px rgba(18, 32, 25, 0.04), 0 2px 4px rgba(18, 32, 25, 0.04)',
        'soft-md': '0 4px 12px rgba(18, 32, 25, 0.06), 0 1px 3px rgba(18, 32, 25, 0.04)',
        'soft-lg': '0 12px 28px rgba(18, 32, 25, 0.08), 0 4px 8px rgba(18, 32, 25, 0.04)',
        'elevation': '0 20px 40px -15px rgba(27, 51, 44, 0.12), 0 0 0 1px rgba(27, 51, 44, 0.05)',
      }
    },
  },
  plugins: [],
}

