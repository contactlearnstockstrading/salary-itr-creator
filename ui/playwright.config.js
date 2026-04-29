import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for TaxSmart UI tests.
 *
 * The dev server is started automatically before tests run.
 * API calls to /api/* are mocked in the test files themselves,
 * so the Spring Boot backend does NOT need to be running for UI tests.
 *
 * Run:  npm test              — headless, all browsers
 *       npm run test:ui        — interactive UI mode
 *       npm run test:report    — open last HTML report
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  timeout: 30_000,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  // Automatically start the Vite dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5180',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
