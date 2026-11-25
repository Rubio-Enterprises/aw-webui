import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './fork/e2e',
  retries: 0,
  reporter: [['junit', { outputFile: 'reports/test-e2e/junit.xml' }]],
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', serviceWorkers: 'block' },
  webServer: {
    command:
      'make -o node_modules/ build-vite && npx --no-install vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 180000,
  },
});
