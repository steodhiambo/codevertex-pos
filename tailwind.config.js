/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6B2D8B',
          light: '#8B4DAB',
          pale: '#F3ECF8',
        },
        bg: '#F8F7FA',
        surface: '#FFFFFF',
        text: {
          primary: '#1A1A1A',
          secondary: '#6B7280',
        },
        border: '#E8E5ED',
        success: '#10B981',
        info: '#3B82F6',
        warning: '#F59E0B',
        error: '#EF4444',
        new: '#EAB308',
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
      },
      lineHeight: {
        'body': '1.5',
        'heading': '1.2',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'card': '12px',
      }
    },
  },
  plugins: [],
}
