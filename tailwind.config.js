/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // semantic colors mapped to CSS variables
        bg: 'var(--c-bg)',
        surface: 'var(--c-surface)',
        primary: 'var(--c-primary)',
        accent: 'var(--c-accent)',
        text: 'var(--c-text)',
        muted: 'var(--c-muted)',
      },
      boxShadow: {
        card: 'var(--card-shadow)',
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
}
