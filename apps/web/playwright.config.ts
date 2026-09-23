import { defineConfig, devices } from '@playwright/test';

/**
 * E2E and accessibility tests.
 *
 * Runs against a production build, not the dev server — dev has different
 * hydration timing and does not include the optimisations the tests are
 * partly there to protect.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:3200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      // Mid-tier Android is the majority of Dhaka traffic, so it is the
      // default rather than an afterthought.
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],

  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        // next start directly: `pnpm start -- -p` appends to the script's own
        // -p flag rather than replacing it.
        command: 'npx next start -p 3200',
        url: 'http://localhost:3200',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
      },
});
