/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tactico Premium Palette
        charcoal: {
          DEFAULT: '#1A1A1E',
          50: '#2A2A30',
          100: '#252529',
          200: '#1F1F23',
          300: '#1A1A1E',
          400: '#151518',
          500: '#101013',
        },
        graphite: {
          DEFAULT: '#2D2D35',
          50: '#3D3D47',
          100: '#383842',
          200: '#333340',
          300: '#2D2D35',
          400: '#272730',
          500: '#212128',
        },
        midnight: {
          DEFAULT: '#1E293B',
          50: '#334155',
          100: '#2D3B50',
          200: '#253348',
          300: '#1E293B',
          400: '#172033',
          500: '#111827',
        },
        offwhite: {
          DEFAULT: '#F0F0F5',
          50: '#FFFFFF',
          100: '#F8F8FC',
          200: '#F0F0F5',
          300: '#E0E0E8',
          400: '#C8C8D4',
          500: '#A0A0B0',
        },
        gold: {
          DEFAULT: '#C9A84C',
          50: '#E8D48B',
          100: '#DBC56A',
          200: '#D4BE5E',
          300: '#C9A84C',
          400: '#B8963E',
          500: '#A07E30',
        },
        // Game-specific colors
        pitch: {
          DEFAULT: '#1B5E20',
          light: '#2E7D32',
          dark: '#0D3B12',
        },
        momentum: {
          high: '#22C55E',
          medium: '#EAB308',
          low: '#EF4444',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-in-up': 'fadeInUp 250ms ease-out',
        'slide-in-right': 'slideInRight 200ms ease-out',
        'slide-in-left': 'slideInLeft 200ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'ticker': 'ticker 30s linear infinite',
        'momentum-pulse': 'momentumPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(201, 168, 76, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(201, 168, 76, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        momentumPulse: {
          '0%, 100%': { transform: 'scaleX(1)' },
          '50%': { transform: 'scaleX(1.02)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'glass-light': '0 4px 16px rgba(0, 0, 0, 0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'gold-glow': '0 0 15px rgba(201, 168, 76, 0.4)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
