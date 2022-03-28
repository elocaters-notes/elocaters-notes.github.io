import Typography from 'typography';

const typography = new Typography({
  baseFontSize: '18px',
  googleFonts: [
    {
      name: 'Noto Serif Display',
      styles: ['700i', '700'],
    },
    {
      name: 'Noto Sans Display',
      styles: ['700i', '700'],
    },
    {
      name: 'Noto Serif',
      styles: ['400', '400i', '700', '700i'],
    },
  ],
  headerFontFamily: ['Noto Sans Display', 'sans-serif'],
  bodyFontFamily: ['Noto Serif', 'serif'],
  headerColor: 'var(--em-text)',
  bodyColor: 'var(--body-text)',
  overrideStyles: (vertical_rhythm, options) => ({
    a: {
      color: 'var(--solarized-blue)',
      'text-decoration': 'none',
    },
    'a:hover': {
      background: 'var(--background-highlight)',
      'text-decoration': 'underline',
    },
  }),
});

export default typography;
