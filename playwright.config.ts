import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 300_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] },
  },
  projects: [{ name: 'chrome', use: { browserName: 'chromium', channel: 'chrome' } }],
  webServer: {
    command: 'pnpm exec vite build && pnpm exec vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
