/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        anth: {
          bg: '#faf9f5',
          'bg-subtle': '#f0ede3',
          text: '#141413',
          'text-secondary': '#6b6a5f',
          orange: '#d97757',
          'orange-hover': '#c56544',
          blue: '#6a9bcc',
          green: '#788c5d',
          'mid-gray': '#b0aea5',
          'light-gray': '#e8e6dc',
          danger: '#a14238',
        },
      },
      fontFamily: {
        'anth-heading': ['Poppins', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'anth-body': ['Lora', 'Georgia', '"Times New Roman"', 'serif'],
        'anth-mono': ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        'anth-hero': ['56px', { lineHeight: '1.1', fontWeight: '600' }],
        'anth-section': ['40px', { lineHeight: '1.15', fontWeight: '600' }],
        'anth-subhead': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        'anth-body': ['18px', { lineHeight: '1.65' }],
        'anth-caption': ['13px', { lineHeight: '1.4' }],
        'anth-stat': ['64px', { lineHeight: '1', fontWeight: '700' }],
      },
      borderRadius: {
        'anth-sm': '6px', 'anth-md': '16px', 'anth-lg': '24px', 'anth-pill': '9999px',
      },
      boxShadow: {
        'anth-card': '0 2px 12px rgba(20,20,19,0.05)',
        'anth-pop': '0 10px 40px rgba(20,20,19,0.08)',
      },
      transitionTimingFunction: { 'anth': 'cubic-bezier(0.25, 1, 0.5, 1)' },
      screens: {
        'anth-mobile': { 'max': '768px' },
        'anth-tablet': { 'min': '769px', 'max': '1024px' },
        'anth-desktop': { 'min': '1025px' },
      },
    },
  },
};
