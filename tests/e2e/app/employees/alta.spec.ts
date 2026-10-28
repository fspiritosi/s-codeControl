import { expect, test, type Page } from '@playwright/test';
import {
  cleanupEmployees,
  createEmployeeViaUi,
  cuilFor,
  employeeRow,
  fillContact,
  fillEmployeeForm,
  fillLabor,
  fillPersonal,
  filterByLastname,
  newEmployeeData,
  TINY_PNG,
  uniqueIdentity,
} from '../../helpers/employees';

const openNewEmployeeForm = async (page: Page) => {
  await page.goto('/dashboard/employee/action?action=new');
  await expect(page.getByRole('tab', { name: 'Datos Personales' })).toBeVisible();
};
const submit = (page: Page) => page.getByRole('button', { name: 'Agregar empleado' }).click();

test.describe('empleados: alta, validaciones del formulario', () => {
  test.use({ actionTimeout: 15_000 });

  test('un formulario vacío no se envía y marca los errores en las tres pestañas', async ({ page }) => {
    await openNewEmployeeForm(page);
    await submit(page);

    const personal = ['El nombre debe tener al menos 2 caracteres.', 'La nacionalidad es requerida', 'La fecha de nacimiento es requerida', 'El tipo de documento es requerido', 'El género es requerido'];
    for (const msg of personal) await expect(page.getByText(msg)).toBeVisible();
    await expect(page.getByText('Falta corregir algunos campos')).toBeVisible();

    await page.getByRole('tab', { name: 'Datos de Contacto' }).click();
    for (const msg of ['La calle debe tener al menos 2 caracteres.', 'La provincia es requerida', 'La ciudad es requerida', 'El código postal debe tener al menos 4 caracteres.']) {
      await expect(page.getByText(msg)).toBeVisible();
    }

    await page.getByRole('tab', { name: 'Datos Laborales' }).click();
    for (const msg of ['El nivel jerárquico es requerido', 'El cargo debe tener al menos 3 caracteres.', 'El diagrama de trabajo es requerido', 'El tipo de contrato es requerido', 'La fecha de ingreso es requerida']) {
      await expect(page.getByText(msg)).toBeVisible();
    }
    // Nada se creó: seguimos en el formulario.
    await expect(page).toHaveURL(/action=new/);
  });

  test('el CUIL con dígito verificador incorrecto se rechaza', async ({ page }) => {
    const e = newEmployeeData('cuil');
    await openNewEmployeeForm(page);
    await fillPersonal(page, { ...e, cuil: `${e.cuil.slice(0, 10)}${(Number(e.cuil[10]) + 1) % 10}` });
    await submit(page);
    await expect(page.getByText('El CUIT es inválido')).toBeVisible();
  });

  test('el CUIL debe tener 11 números', async ({ page }) => {
    const e = newEmployeeData('cuil11');
    await openNewEmployeeForm(page);
    await fillPersonal(page, { ...e, cuil: '2099' });
    await submit(page);
    await expect(page.getByText('El CUIT debe contener 11 números.')).toBeVisible();
  });

  test('el CUIL debe contener el número de documento', async ({ page }) => {
    const e = newEmployeeData('cuildni');
    const otro = uniqueIdentity();
    await openNewEmployeeForm(page);
    // La regla cruzada CUIL/documento solo corre con el resto del formulario válido: se completa todo.
    await fillEmployeeForm(page, { ...e, cuil: otro.cuil });
    await submit(page);
    await page.getByRole('tab', { name: 'Datos Personales' }).click();
    await expect(page.getByText('El CUIL debe contener el número de documento.')).toBeVisible();
    await expect(page).toHaveURL(/action=new/);
  });

  test('longitudes mínimas: nombre, documento, código postal y email', async ({ page }) => {
    await openNewEmployeeForm(page);
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('A');
    await page.getByRole('textbox', { name: 'Numero de documento' }).fill('12345');
    await page.getByRole('tab', { name: 'Datos de Contacto' }).click();
    await page.getByRole('textbox', { name: 'Codigo postal' }).fill('123');
    await page.getByRole('textbox', { name: 'Email' }).fill('no-es-un-mail');
    await submit(page);

    await expect(page.getByText('El código postal debe tener al menos 4 caracteres.')).toBeVisible();
    await expect(page.getByText('Email inválido')).toBeVisible();
    await page.getByRole('tab', { name: 'Datos Personales' }).click();
    await expect(page.getByText('El nombre debe tener al menos 2 caracteres.')).toBeVisible();
    await expect(page.getByText('El documento debe tener al menos 7 caracteres.')).toBeVisible();
  });

  test('la ciudad depende de la provincia', async ({ page }) => {
    await openNewEmployeeForm(page);
    await page.getByRole('tab', { name: 'Datos de Contacto' }).click();
    await page.getByRole('combobox', { name: 'Provincia *' }).click();
    await page.getByRole('option', { name: 'Buenos Aires', exact: true }).click();
    await page.getByRole('combobox', { name: 'Ciudad *' }).click();
    await expect(page.getByRole('option', { name: '25 de Mayo' })).toBeVisible();
  });

  test('convenio y categoría quedan deshabilitados hasta elegir sindicato', async ({ page }) => {
    await openNewEmployeeForm(page);
    await page.getByRole('tab', { name: 'Datos Laborales' }).click();
    await expect(page.getByRole('combobox', { name: 'Convenio' })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'Categoria' })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'Sindicato' })).toBeEnabled();
  });
});

test.describe('empleados: alta completa, duplicados y foto', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });
  const principal = newEmployeeData('alta');
  const conFoto = newEmployeeData('foto');

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEmployees(browser, baseURL, [principal.lastname, conFoto.lastname]);
  });

  test('el alta con todos los datos crea el empleado y aparece en el listado', async ({ page }) => {
    await createEmployeeViaUi(page, principal);
    await filterByLastname(page, principal.lastname);
    const row = employeeRow(page, principal.lastname);
    await expect(row).toContainText(principal.fullName);
    await expect(row).toContainText(principal.cuil);
    await expect(row).toContainText('No avalado');
    await expect(row).toContainText('Operador QA');
    await expect(row).toContainText('A tiempo indeterminado');
    await expect(row).toContainText('Sin afectar');
  });

  test('el detalle del empleado creado guarda los datos de las tres pestañas', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await filterByLastname(page, principal.lastname);
    await employeeRow(page, principal.lastname).getByRole('link', { name: principal.fullName }).click();
    await expect(page).toHaveURL(/action=view/);

    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue(principal.firstname);
    await expect(page.getByRole('textbox', { name: 'CUIL' })).toHaveValue(principal.cuil);
    await expect(page.getByRole('textbox', { name: 'Numero de documento' })).toHaveValue(principal.dni);
    await expect(page.getByRole('button', { name: 'Fecha de nacimiento *' })).toContainText('/1990');

    await page.getByRole('tab', { name: 'Datos de Contacto' }).click();
    await expect(page.getByRole('textbox', { name: 'Calle' })).toHaveValue('Calle de Prueba');
    await expect(page.getByRole('textbox', { name: 'Teléfono' })).toHaveValue('1155550000');
    await expect(page.getByRole('combobox', { name: 'Provincia *' })).toContainText('Buenos Aires');

    await page.getByRole('tab', { name: 'Datos Laborales' }).click();
    await expect(page.getByRole('spinbutton', { name: 'Legajo' })).toHaveValue(principal.file);
    await expect(page.getByRole('textbox', { name: 'Puesto en la empresa' })).toHaveValue('Operador QA');
    await expect(page.getByRole('combobox', { name: 'Diagrama de trabajo *' })).toContainText('Lunes a Viernes');
  });

  test('un CUIL ya cargado en la empresa se rechaza', async ({ page }) => {
    const repetido = { ...newEmployeeData('dup'), dni: principal.dni, cuil: principal.cuil };
    await openNewEmployeeForm(page);
    await fillPersonal(page, repetido);
    await submit(page);
    await expect(page.getByText('Ya existe un empleado con este CUIL en la empresa').first()).toBeVisible();
    await expect(page).toHaveURL(/action=new/);
  });

  test('un legajo ya cargado en la empresa se rechaza', async ({ page }) => {
    const otro = newEmployeeData('dupleg');
    await openNewEmployeeForm(page);
    await fillEmployeeForm(page, { ...otro, file: principal.file });
    await submit(page);
    await expect(page.getByText('Ya existe un empleado con este legajo en la empresa').first()).toBeVisible();
    await expect(page).toHaveURL(/action=new/);
  });

  test('el alta con foto sube la imagen al storage y se puede descargar', async ({ page, request }) => {
    await openNewEmployeeForm(page);
    await page.locator('input[type="file"]#fileInput').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: TINY_PNG });
    await fillEmployeeForm(page, conFoto);
    await submit(page);
    await expect(page.getByText('Empleado agregado correctamente')).toBeVisible();

    // La subida corre después del toast y falla en silencio: se espera a que el objeto aparezca en el bucket.
    await expect(async () => {
      const res = await request.get(`/api/storage?bucket=employee_photos&path=${conFoto.dni}.png`);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('image/png');
    }).toPass({ timeout: 20_000 });
  });

  // H-04: la foto se guarda con una URL armada con NEXT_PUBLIC_PROJECT_URL (<app>/employee_photos/<dni>.png) en vez
  // de la URL pública del storage: el archivo existe pero la URL da 404 y el avatar muestra el spinner de carga.
  // Corregido en useEmployeeForm.ts (usa storage.getPublicUrl); pendiente de deploy para quitar el fixme.
  test.fixme('el detalle muestra la foto del empleado', async ({ page, request }) => {
    await page.goto('/dashboard/employee');
    await filterByLastname(page, conFoto.lastname);
    await employeeRow(page, conFoto.lastname).getByRole('link', { name: conFoto.fullName }).click();
    const avatar = page.getByRole('img', { name: 'Imagen del empleado' });
    await expect(avatar).toBeVisible();
    const res = await request.get((await avatar.getAttribute('src'))!);
    expect(res.status()).toBe(200);
  });

  // H-01: tras "Agregar empleado" el toast de éxito aparece y la app navega a /dashboard/employee,
  // pero medio segundo después vuelve sola a /action?action=new con el formulario vacío.
  test.fixme('tras el alta el usuario queda en el listado de empleados', async ({ page, browser, baseURL }) => {
    const e = newEmployeeData('redir');
    await openNewEmployeeForm(page);
    await fillEmployeeForm(page, e);
    await submit(page);
    await expect(page.getByText('Empleado agregado correctamente')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/employee$/);
    await expect(page.getByRole('tab', { name: 'Empleados activos' })).toBeVisible();
    // Única espera fija de la suite (en un test.fixme, que hoy no corre): la app rebota ~500 ms después de navegar.
    await page.waitForTimeout(3_000);
    await expect(page).toHaveURL(/\/dashboard\/employee$/);
    await expect(page).not.toHaveURL(/action=new/);
    await cleanupEmployees(browser, baseURL, [e.lastname]);
  });
});
