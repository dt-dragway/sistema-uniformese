module.exports = {
  root: true,
  env: {
    node: true, // Specify Node.js environment
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Integrates Prettier
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  rules: {
    // Add any specific rules for your backend here
  },
};
