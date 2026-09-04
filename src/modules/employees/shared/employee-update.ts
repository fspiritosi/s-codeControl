/**
 * Normalización y validación del payload de actualización del legajo (tkt-631).
 *
 * Puro y sin dependencias: lo consumen el formulario (cliente) y la server
 * action, y se testea aislado.
 */

/**
 * Normaliza una fecha del form a ISO-8601 completo.
 *
 * El detalle del empleado carga `date_of_admission` como string `yyyy-MM-dd`
 * (ver `app/dashboard/employee/action/page.tsx`). Si el usuario edita cualquier
 * otro campo sin tocar el datepicker, ese string llega tal cual a Prisma y el
 * update falla con "Expected ISO-8601 DateTime", abortando todo el guardado.
 *
 * Devuelve `undefined` cuando no hay fecha: OJO, para Prisma eso significa "no
 * toques este campo", no "guardá null". Por eso todo campo NOT NULL que pase
 * por acá tiene que revisarse después con `findMissingRequiredFields` — ver
 * tkt-631, donde un `undefined` se tragaba el cambio de fecha en silencio.
 */
export const toISODate = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }
  return undefined;
};

/**
 * Columnas NOT NULL de `employees` que el formulario del legajo siempre manda
 * en un update completo. Si alguna llega vacía, el update es parcial y hay que
 * cortarlo: Prisma descartaría la clave y guardaría el resto como si nada.
 */
export const REQUIRED_EMPLOYEE_UPDATE_FIELDS = [
  'lastname',
  'firstname',
  'cuil',
  'document_number',
  'date_of_admission',
  'file',
  'type_of_contract',
] as const;

export type RequiredEmployeeUpdateField = (typeof REQUIRED_EMPLOYEE_UPDATE_FIELDS)[number];

/**
 * Campos obligatorios que no viajan en el payload (ausentes, `undefined`,
 * `null` o solo espacios). Vacío significa que el update es completo.
 */
export function findMissingRequiredFields(payload: Record<string, unknown>): RequiredEmployeeUpdateField[] {
  return REQUIRED_EMPLOYEE_UPDATE_FIELDS.filter((field) => {
    const value = payload[field];
    if (value === undefined || value === null) return true;
    return typeof value === 'string' && value.trim() === '';
  });
}
