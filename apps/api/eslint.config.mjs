import api from '@beekal/config/eslint/api.js';

export default [
  ...api,
  {
    // Seeds and operational scripts report to the operator through stdout.
    // That is their interface, not a stray debug statement.
    files: ['prisma/**/*.ts', 'src/cli/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
];
