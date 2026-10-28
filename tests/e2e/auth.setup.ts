import { expect, test as setup } from '@playwright/test';
import { QA_COMPANY_ID, QA_PASSWORD, QA_USER } from './helpers/env';

setup('iniciar sesión con el usuario de QA y guardar el estado', async ({ page, context, baseURL }) => {
  expect(QA_PASSWORD, 'falta E2E_PASSWORD').not.toBe('');
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(QA_USER);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(QA_PASSWORD);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.waitForURL(/\/dashboard/);
  // La empresa activa vive en una cookie que el selector de empresa normalmente fija.
  await context.addCookies([{ name: 'actualComp', value: QA_COMPANY_ID, url: baseURL! }]);
  await context.storageState({ path: 'tests/e2e/.auth/user.json' });
});
