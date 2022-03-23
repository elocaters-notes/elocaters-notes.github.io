import Typography from 'typography';

const typography = new Typography({
  baseFontSize: '18px',
  googleFonts: [
    {
      name: 'Arvo',
      styles: ['700i', '700'],
    },
    {
      name: 'Roboto',
      styles: ['400', '400i'],
    },
  ],
  headerFontFamily: ['Arvo', 'sans-serif'],
  bodyFontFamily: ['Roboto', 'sans-serif'],
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
