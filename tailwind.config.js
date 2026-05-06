/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        peach: '#FF8A5B',
        'soft-yellow': '#FFF9F5',
        'warm-grey': '#8D7B6D',
        'deep-brown': '#4A3728',
      },
    },
  },
  plugins: [],
}
