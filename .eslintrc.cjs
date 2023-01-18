module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: '2018',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'node/no-missing-import': 'off',
    'node/no-unpublished-import': [
      'error',
      {
        allowModules: ['ts-jest'],
      },
    ],
  },
};
