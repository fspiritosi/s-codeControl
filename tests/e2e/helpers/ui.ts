import { expect, type Locator } from '@playwright/test';

/**
 * Espera a que React haya hidratado el elemento. Un clic anterior a la hidratación se pierde sin error, que es la
 * causa de la mayoría de los falsos fallos al hacer `goto` + clic inmediato en esta app.
 */
export async function hydrated(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect
    .poll(() => locator.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactProps$'))), { timeout: 15_000 })
    .toBe(true);
}

/** Clic seguro: espera la hidratación del elemento y recién ahí hace clic. */
export async function clickHydrated(locator: Locator) {
  await hydrated(locator);
  await locator.click();
}
