module.exports = {
  root: true,
  extends: [
    '@react-native/eslint-config',
    'plugin:prettier/recommended',
    'prettier',
  ],
  plugins: ['prettier'],
  ignorePatterns: [
    '.eslintrc.js',
    'babel.config.js',
    'metro.config.js',
    'jest.config.js',
    'tailwind.config.js',
    'postcss.config.js',
  ],
  rules: {
    'prettier/prettier': ['error', {endOfLine: 'auto'}],
  },
};
