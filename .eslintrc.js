'use strict';

const OFF = 0;

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest'],
  env: {
    node: true,
    es6: true,
    'jest/globals': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:jest/recommended',
  ],

  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': OFF,
        '@typescript-eslint/ban-ts-comment': OFF,
      },
    },
  ],
};
