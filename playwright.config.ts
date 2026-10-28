import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra una instancia ya desplegada (el clon en Dokploy). No levanta nada: `E2E_BASE_URL` apunta al sistema real.
 * Usuario y empresa de prueba: `scripts/e2e/seed-qa.sql` (empresa "QA E2E", usuario dueño con todos los permisos).
 * Cada test que crea datos los nombra con el prefijo `QA-E2E-` y los borra al terminar.
 *
 * Local:  E2E_PASSWORD='...' npm run e2e            (base por defecto: el clon)
 * CI:     .github/workflows/e2e.yml
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['blob'], ['list']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://codecontrol-clon.31.97.42.82.sslip.io',
    timezoneId: 'America/Argentina/Buenos_Aires',
    locale: 'es-AR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'public',
      testMatch: /public\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'app',
      testIgnore: [/public\//, /auth\.setup\.ts/, /costos\//],
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/user.json' },
    },
    // Los specs de costos comparten el mismo convenio y servicio de la empresa QA: si corren a la vez en distintos
    // workers se pisan. Se ejecutan uno detrás del otro, cada uno en su proyecto encadenado.
    {
      name: 'costos-1',
      testMatch: /costos\/(catalogo-equipos|pantallas)\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/user.json' },
    },
    {
      name: 'costos-2',
      testMatch: /costos\/servicio-composicion\.spec\.ts/,
      dependencies: ['costos-1'], // depende del costo del tipo de equipo que deja catalogo-equipos
      use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/user.json' },
    },
  ],
});
