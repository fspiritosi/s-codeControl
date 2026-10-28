export const QA_USER = process.env.E2E_USER ?? 'qa-e2e@codecontrol.test';
export const QA_PASSWORD = process.env.E2E_PASSWORD ?? '';
/** Empresa de prueba creada por scripts/e2e/seed-qa.sql. */
export const QA_COMPANY_ID = 'e2e00000-0000-4000-8000-0000000000c1';
/** Todo lo que crean los tests lleva este prefijo para poder limpiarlo. */
export const PREFIX = 'QA-E2E-';
export const uniq = (name: string) => `${PREFIX}${name}-${Date.now().toString(36)}`;
