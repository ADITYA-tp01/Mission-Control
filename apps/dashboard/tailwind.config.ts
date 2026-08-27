/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // MissionControl status system
        ok: 'hsl(var(--ok) / <alpha-value>)',
        warn: 'hsl(var(--warn) / <alpha-value>)',
        bad: 'hsl(var(--bad) / <alpha-value>)',
        info: 'hsl(var(--info) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-grotesk)', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'glow-ok': '0 0 24px -8px hsl(var(--ok) / 0.45)',
        'glow-warn': '0 0 24px -8px hsl(var(--warn) / 0.5)',
        'glow-bad': '0 0 24px -6px hsl(var(--bad) / 0.55)',
        'glow-cyan': '0 0 24px -8px hsl(var(--primary) / 0.5)',
        panel: '0 1px 0 0 hsl(0 0% 100% / 0.03) inset, 0 8px 24px -12px hsl(0 0% 0% / 0.6)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.15' },
        },
        'ping-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        rise: 'rise 0.35s ease-out both',
        sweep: 'sweep 2.4s ease-in-out infinite',
        blink: 'blink 1.1s steps(2, start) infinite',
        'ping-ring': 'ping-ring 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
