/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        ember: {
          bg: '#fff2df',
          'bg-subtle': '#f5e5c8',
          text: '#312520',
          'text-secondary': '#6b5a4f',
          brown: '#492d22',
          'brown-hover': '#5c3a2b',
          gold: '#c49464',
          divider: '#e6d9bf',
          card: '#ffffff',
          danger: '#8b3a2f',
        },
      },
      fontFamily: {
        'ember-heading': ['Fraunces', 'Georgia', '"Times New Roman"', 'serif'],
        'ember-body': ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'ember-mono': ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        'ember-hero': ['60px', { lineHeight: '1.08', fontWeight: '600', letterSpacing: '-0.01em' }],
        'ember-section': ['40px', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.005em' }],
        'ember-subhead': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        'ember-lead': ['19px', { lineHeight: '1.55' }],
        'ember-body': ['17px', { lineHeight: '1.6' }],
        'ember-caption': ['13px', { lineHeight: '1.45' }],
        'ember-stat': ['72px', { lineHeight: '1', fontWeight: '600', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        'ember-sm': '6px', 'ember-md': '12px', 'ember-lg': '20px', 'ember-pill': '9999px',
      },
      boxShadow: {
        'ember-card': '0 4px 20px rgba(73, 45, 34, 0.08)',
        'ember-pop': '0 12px 40px rgba(73, 45, 34, 0.12)',
      },
      transitionTimingFunction: { 'ember': 'cubic-bezier(0.32, 0.72, 0, 1)' },
      screens: {
        'ember-mobile': { 'max': '768px' },
        'ember-tablet': { 'min': '769px', 'max': '1024px' },
        'ember-desktop': { 'min': '1025px' },
      },
    },
  },
};
