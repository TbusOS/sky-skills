/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#FFFFFF',
          'bg-alt': '#F5F5F7',
          'bg-dark': '#000000',
          text: '#1D1D1D',
          'text-secondary': '#6E6E73',
          'text-on-dark': '#F5F5F7',
          link: '#0071E3',
          'link-hover': '#0077ED',
          divider: '#D2D2D7',
          'system-green': '#34C759',
          'system-orange': '#FF9500',
          'system-red': '#FF3B30',
        },
      },
      fontFamily: {
        'apple-display': ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'apple-text': ['"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'apple-mono': ['"SF Mono"', 'ui-monospace', 'Menlo', 'Monaco', '"Cascadia Mono"', 'monospace'],
      },
      fontSize: {
        'apple-hero': ['64px', { lineHeight: '1.05', fontWeight: '700', letterSpacing: '-0.015em' }],
        'apple-section': ['48px', { lineHeight: '1.08', fontWeight: '600', letterSpacing: '-0.01em' }],
        'apple-subhead': ['28px', { lineHeight: '1.14', fontWeight: '500', letterSpacing: '-0.005em' }],
        'apple-lead': ['21px', { lineHeight: '1.38' }],
        'apple-body': ['17px', { lineHeight: '1.47' }],
        'apple-caption': ['12px', { lineHeight: '1.33' }],
        'apple-stat': ['120px', { lineHeight: '1', fontWeight: '600', letterSpacing: '-0.02em' }],
      },
      spacing: {
        'apple-1': '4px', 'apple-2': '8px', 'apple-3': '12px', 'apple-4': '16px',
        'apple-5': '24px', 'apple-6': '32px', 'apple-7': '48px', 'apple-8': '64px',
        'apple-9': '80px', 'apple-10': '120px',
      },
      borderRadius: {
        'apple-sm': '6px', 'apple-md': '12px', 'apple-lg': '18px', 'apple-pill': '9999px',
      },
      boxShadow: {
        'apple-product': '0 20px 60px -20px rgba(0,0,0,0.15)',
        'apple-card': '0 2px 8px rgba(0,0,0,0.04)',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.42, 0, 0.58, 1)',
        'apple-out': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      transitionDuration: {
        'apple-sm': '240ms', 'apple-md': '400ms', 'apple-lg': '700ms',
      },
      screens: {
        'apple-mobile': { 'max': '734px' },
        'apple-tablet': { 'min': '735px', 'max': '1068px' },
        'apple-desktop': { 'min': '1069px' },
      },
    },
  },
};
