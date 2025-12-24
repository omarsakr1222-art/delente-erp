module.exports = {
  content: [
    './index.html',
    './*.js',
    './shared_state.js',
    './netlify/functions/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo','ui-sans-serif','system-ui']
      }
    }
  },
  plugins: []
};
