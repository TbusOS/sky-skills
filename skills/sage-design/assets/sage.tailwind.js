/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        sage: {
          bg: '#f8faec',
          'bg-subtle': '#eef2de',
          text: '#2a2c40',
          'text-secondary': '#6d6f82',
          sage: '#97B077',
          'sage-dark': '#7a9561',
          ink: '#393C54',
          divider: '#e5e8da',
          card: '#ffffff',
          danger: '#b04545',
        },
      },
      fontFamily: {
        'sage-heading': ['"Instrument Serif"', 'Georgia', '"Times New Roman"', 'serif'],
        'sage-body': ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'sage-mono': ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        'sage-hero': ['64px', { lineHeight: '1.05', fontWeight: '400', letterSpacing: '-0.01em' }],
        'sage-section': ['40px', { lineHeight: '1.15', fontWeight: '400', letterSpacing: '-0.005em' }],
        'sage-subhead': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        'sage-lead': ['19px', { lineHeight: '1.55' }],
        'sage-body': ['17px', { lineHeight: '1.65' }],
        'sage-caption': ['13px', { lineHeight: '1.45' }],
        'sage-stat': ['76px', { lineHeight: '1', fontWeight: '400', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        'sage-sm': '6px', 'sage-md': '12px', 'sage-lg': '20px', 'sage-pill': '9999px',
      },
      boxShadow: {
        'sage-card': '0 4px 20px rgba(57, 60, 84, 0.06)',
        'sage-pop': '0 12px 40px rgba(57, 60, 84, 0.10)',
      },
      transitionTimingFunction: { 'sage': 'cubic-bezier(0.32, 0.72, 0, 1)' },
      screens: {
        'sage-mobile': { 'max': '768px' },
        'sage-tablet': { 'min': '769px', 'max': '1024px' },
        'sage-desktop': { 'min': '1025px' },
      },
    },
  },
};
