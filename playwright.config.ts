import { defineConfig, devices } from '@playwright/test'

/**
 * E2E testleri API'yi `page.route` ile taklit eder (tests/e2e/mock-api.ts);
 * backend'in çalışması gerekmez. Vite dev sunucusu otomatik başlatılır.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: { VITE_API_BASE_URL: 'http://api.test' },
  },
})
