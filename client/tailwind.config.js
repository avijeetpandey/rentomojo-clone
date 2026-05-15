/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        canvas: {
          DEFAULT: 'rgb(var(--gh-canvas) / <alpha-value>)',
          subtle: 'rgb(var(--gh-canvas-subtle) / <alpha-value>)',
        },
        surface: 'rgb(var(--gh-surface) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--gh-border) / <alpha-value>)',
          muted: 'rgb(var(--gh-border-muted) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--gh-fg-default) / <alpha-value>)',
          muted: 'rgb(var(--gh-fg-muted) / <alpha-value>)',
          subtle: 'rgb(var(--gh-fg-subtle) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--gh-accent) / <alpha-value>)',
          fg: 'rgb(var(--gh-accent-fg) / <alpha-value>)',
          emphasis: 'rgb(var(--gh-accent-emphasis) / <alpha-value>)',
        },
        success: 'rgb(var(--gh-success) / <alpha-value>)',
        danger: 'rgb(var(--gh-danger) / <alpha-value>)',
        warning: 'rgb(var(--gh-warning) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-in': {
          '0%': { transform: 'translateY(8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in': 'slide-in 200ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
