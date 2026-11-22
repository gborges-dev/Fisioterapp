import { defineConfig, devices } from '@playwright/test'

// Os servidores (front e API) são iniciados à parte; não há webServer aqui.
export default defineConfig({
  testDir: './tests',
  // Sufixo .e2e.ts para o vitest do front (que pega *.spec/*.test) não rodar estes testes.
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  retries: 0,
  // O vite dev pode levar alguns segundos no primeiro carregamento.
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8081',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
