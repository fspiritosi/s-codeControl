/**
 * Catálogo y formato del certificado de torqueo (tsk-575).
 *
 * Puro y sin dependencias: lo consumen el formulario, el PDF y las server
 * actions, y se testea aislado.
 */

export const PREVIOUS_CHECK_KEYS = [
  'area_trabajo_seguro',
  'epp',
  'base_firme',
  'herramienta_condiciones',
  'tornilleria_estado',
  'secuencia_disponible',
  'estado_checkpoint',
] as const;

export const TIGHTENING_CHECK_KEYS = [
  'torque_del_derecho',
  'torque_del_izquierdo',
  'torque_tras_derecho',
  'torque_tras_izquierdo',
  'ind_rueda_del_derecho',
  'ind_rueda_del_izquierdo',
  'ind_rueda_tras_derecho',
  'ind_rueda_tras_izquierdo',
] as const;

export type TorqueCheckKey =
  | (typeof PREVIOUS_CHECK_KEYS)[number]
  | (typeof TIGHTENING_CHECK_KEYS)[number];

export const TORQUE_CHECK_ITEMS: { key: TorqueCheckKey; label: string; group: 'previous' | 'tightening' }[] = [
  { key: 'area_trabajo_seguro', label: 'Área de trabajo seguro', group: 'previous' },
  { key: 'epp', label: 'Elementos de Protección Personal (EPP)', group: 'previous' },
  { key: 'base_firme', label: 'Base firme y vehículo inmovilizado', group: 'previous' },
  { key: 'herramienta_condiciones', label: 'Herramienta de torque en condiciones', group: 'previous' },
  { key: 'tornilleria_estado', label: 'Tornillería en buen estado', group: 'previous' },
  { key: 'secuencia_disponible', label: 'Secuencia de apriete disponible', group: 'previous' },
  { key: 'estado_checkpoint', label: 'Estado de Checkpoint', group: 'previous' },
  { key: 'torque_del_derecho', label: 'Torque del. derecho', group: 'tightening' },
  { key: 'torque_del_izquierdo', label: 'Torque del. izquierdo', group: 'tightening' },
  { key: 'torque_tras_derecho', label: 'Torque tras. derecho', group: 'tightening' },
  { key: 'torque_tras_izquierdo', label: 'Torque tras. izquierdo', group: 'tightening' },
  { key: 'ind_rueda_del_derecho', label: 'Ind. rueda del. derecho', group: 'tightening' },
  { key: 'ind_rueda_del_izquierdo', label: 'Ind. rueda del. izquierdo', group: 'tightening' },
  { key: 'ind_rueda_tras_derecho', label: 'Ind. rueda tras. derecho', group: 'tightening' },
  { key: 'ind_rueda_tras_izquierdo', label: 'Ind. rueda tras. izquierdo', group: 'tightening' },
];

/** Formato de hoja: cambia solo el juego de fotos del PDF. */
export const SHEET_FORMATS = [
  { value: 'LIGHT', label: 'Vehículos chicos' },
  { value: 'BUS', label: 'Colectivos' },
] as const;

export type SheetFormat = (typeof SHEET_FORMATS)[number]['value'];

/**
 * Cantidad de tuercas de la rueda. Es lo único que define qué secuencia de
 * apriete corresponde, así que se elige en el formulario y no se deriva del
 * formato de hoja: un colectivo y una camioneta pueden llevar la misma.
 */
export const NUT_COUNTS = [6, 8, 10] as const;

export type NutCount = (typeof NUT_COUNTS)[number];

export function isNutCount(value: unknown): value is NutCount {
  return NUT_COUNTS.includes(value as NutCount);
}

export function checkLabel(key: string): string {
  return TORQUE_CHECK_ITEMS.find((i) => i.key === key)?.label ?? key;
}

/** "150-170 Nm (111-125 ft-lbs)", como figura en el papel. */
export function formatTorqueRange(spec: {
  nm_min: number;
  nm_max: number;
  ftlb_min: number | null;
  ftlb_max: number | null;
}): string {
  const nm = `${spec.nm_min}-${spec.nm_max} Nm`;
  if (spec.ftlb_min == null || spec.ftlb_max == null) return nm;
  return `${nm} (${spec.ftlb_min}-${spec.ftlb_max} ft-lbs)`;
}

/**
 * Juego de imágenes de cada hoja: el diagrama de secuencia de apriete
 * (sección 4) y la silueta del vehículo que lo acompaña. Son los recortes de
 * los dos formularios en papel, servidos como assets estáticos desde
 * `public/torque/` — no cambian por empresa ni por vehículo, así que no tiene
 * sentido guardarlos en storage.
 *
 * Las rutas son relativas al origen a propósito: el PDF se arma en el
 * navegador (`pdf(...).toBlob()`), así que resuelven contra el mismo host y no
 * pasan por CORS. Si algún día el certificado se generase en el servidor,
 * habría que absolutizarlas.
 *
 * `diagram` es el recorte del papel con las tres secuencias juntas: quedó
 * solo como fallback de los certificados emitidos antes del selector de
 * secuencia (ver `sequenceDiagramSrc`).
 */
export const TORQUE_SHEET_ASSETS: Record<SheetFormat, { diagram: string; photos: string }> = {
  LIGHT: { diagram: '/torque/secuencia-light.png', photos: '/torque/ruedas-light.png' },
  BUS: { diagram: '/torque/secuencia-bus.png', photos: '/torque/ruedas-bus.png' },
};

/** Diagrama de la secuencia de apriete de cada cantidad de tuercas. */
export const TORQUE_SEQUENCE_DIAGRAMS: Record<NutCount, string> = {
  6: '/torque/secuencia-6.png',
  8: '/torque/secuencia-8.png',
  10: '/torque/secuencia-10.png',
};

/**
 * Imagen de la sección 4 del PDF. Con `nutCount` elegido imprime solo esa
 * secuencia; sin él (certificados anteriores al selector) cae al recorte del
 * papel con las tres, para que una reimpresión salga igual que el original.
 */
export function sequenceDiagramSrc(nutCount: number | null | undefined, sheetFormat: SheetFormat): string {
  return isNutCount(nutCount) ? TORQUE_SEQUENCE_DIAGRAMS[nutCount] : TORQUE_SHEET_ASSETS[sheetFormat].diagram;
}
