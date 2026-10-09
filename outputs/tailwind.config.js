/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // LandDoc Design System
        'paper': '#F7F5F0',        // Warm background
        'white': '#FFFFFF',
        'green-dark': '#0F3D2E',   // Primary green
        'text-primary': '#1C2420',
        'text-muted': '#6B7468',
        'border': '#E4E0D6',        // Hairline borders
        'brass': '#B8893B',         // Accent
        'success': '#2F7A57',
        'warning': '#B7791F',
        'danger': '#B3382C',
      },
      fontFamily: {
        // Use Newsreader with system fallback for headings
        'serif': ['Newsreader', 'Georgia', 'Garamond', 'serif'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Custom sizes for LandDoc
        'h1': ['40px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'secondary': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'xs': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        // 8px scale
        'xs': '8px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        'xxl': '64px',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '8px',
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(20, 30, 25, 0.06)',
        'card': '0 1px 2px rgba(20, 30, 25, 0.06)',
      },
      maxWidth: {
        'container': '1200px',
        'form': '720px',
        'reading': '920px',
      },
    },
  },
  plugins: [],
};
