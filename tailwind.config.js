/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tombstone theme - Old West colors
        primary: {
          50: '#fef7ee',
          100: '#fdecd3',
          200: '#fad5a5',
          300: '#f6b76d',
          400: '#f19132',
          500: '#ed7712',
          600: '#de5c08',
          700: '#b84309',
          800: '#93360f',
          900: '#772f10',
          950: '#401506',
        },
        // Desert sand background tones
        sand: {
          50: '#faf8f5',
          100: '#f3efe6',
          200: '#e5dccb',
          300: '#d4c4a8',
          400: '#c1a67e',
          500: '#b39162',
          600: '#a67d54',
          700: '#8b6546',
          800: '#72543d',
          900: '#5e4634',
          950: '#32241a',
        },
        // Rich leather/rust brown tones
        leather: {
          50: '#fbf6f1',
          100: '#f5e8dc',
          200: '#ebcfb8',
          300: '#ddb08c',
          400: '#ce8b5f',
          500: '#c47242',
          600: '#b65d37',
          700: '#97482f',
          800: '#7a3c2c',
          900: '#643326',
          950: '#351912',
        },
        // Accent gold
        gold: {
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
          950: '#422006',
        },
        // Night sky deep blue for sleep
        sleep: '#6366f1',
        sleepNight: '#4338ca',
        sleepNap: '#b45309',
        // Warm sunset for feeding
        feeding: '#dc2626',
        // Cactus green for diaper
        diaper: '#65a30d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        western: ['Rye', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
