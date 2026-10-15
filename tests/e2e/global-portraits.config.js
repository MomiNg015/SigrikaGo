import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORTRAIT_VISUAL_PORT || '5298';
export default defineConfig({
  testDir: '.', testMatch: ['global-portraits.spec.js', 'interface-polish.spec.js', 'handbook-puzzle.spec.js'],
  timeout: 120_000, workers: 1,
  use: { baseURL: `http://127.0.0.1:${port}`, ...devices['Desktop Chrome'], channel: 'chrome' },
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/tests/e2e/fixtures/global-portraits.html`,
    timeout: 120_000, reuseExistingServer: true,
  },
});
