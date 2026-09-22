import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Components arrive in Phase 1. Until then an empty run is a pass, not a
    // failure.
    passWithNoTests: true,
  },
});
