import { expect, test } from '@playwright/test';
import { QA_PASSWORD, QA_USER } from '../helpers/env';

test.describe('autenticación', () => {
  test('la página de ingreso muestra el formulario', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Contraseña' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
  });

  test('con credenciales válidas entra al dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(QA_USER);
    await page.getByRole('textbox', { name: 'Contraseña' }).fill(QA_PASSWORD);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('con contraseña incorrecta no entra', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(QA_USER);
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('clave-incorrecta-123');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('un usuario inexistente no entra', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill('no-existe@codecontrol.test');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('cualquiera-123');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('las rutas protegidas piden sesión', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await expect(page).not.toHaveURL(/\/dashboard\/employee$/);
  });

  test('la API de sesión sin login devuelve vacío', async ({ request }) => {
    const res = await request.get('/api/auth/session');
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toBeNull();
  });

  test('la página de recuperar contraseña pide el email', async ({ page }) => {
    await page.goto('/reset_password');
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();
  });

  test('el health check responde', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).status).toBe('ok');
  });

  test('los endpoints de cron rechazan llamadas sin secreto', async ({ request }) => {
    for (const path of ['/api/cron/document-states', '/api/cron/exams']) {
      const res = await request.post(path);
      expect(res.status(), path).toBe(401);
    }
  });

  test('el storage rechaza operaciones sin sesión', async ({ request }) => {
    const res = await request.get('/api/storage?bucket=document_files&path=cualquiera.pdf');
    expect(res.status()).toBe(401);
  });
});
