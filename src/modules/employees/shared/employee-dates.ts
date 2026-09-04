import { isValid as isValidDate, parse as dateFnsParse } from 'date-fns';

/** `yyyy-MM-dd`, tal como el legajo recibe las columnas `@db.Date`. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Convierte a `Date` un valor de fecha del legajo (ingreso, nacimiento, baja).
 *
 * Un `yyyy-MM-dd` es una fecha civil, no un instante. `new Date('2025-12-01')`
 * lo interpreta como medianoche UTC, y al formatearlo en hora local cae en el
 * dia anterior para cualquier zona detras de UTC: en Argentina el legajo
 * mostraba 30/11/2025 una fecha de ingreso guardada como 2025-12-01, y el
 * usuario lo leia como que su cambio no se habia guardado (tkt-648).
 *
 * Por eso el formato de solo fecha se parsea en hora local. Los strings que
 * llevan hora si son instantes y se respetan tal cual.
 */
export function parseEmployeeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValidDate(value) ? value : null;
  if (typeof value !== 'string') return null;

  if (DATE_ONLY.test(value)) {
    const civil = dateFnsParse(value, 'yyyy-MM-dd', new Date());
    return isValidDate(civil) ? civil : null;
  }

  const instante = new Date(value);
  return isValidDate(instante) ? instante : null;
}
