/**
 * Reglas compartidas de pedidos de reparación (repair_solicitudes).
 *
 * Módulo PURO (sin 'use server' ni imports de servidor): lo usan tanto el guard
 * del API como los formularios cliente, para no duplicar la definición de
 * "estado resuelto" ni el formato del mensaje de conflicto.
 */

/**
 * Estados que se consideran RESUELTOS (cerrados). Cualquier otro estado
 * (Pendiente, Esperando_repuestos, En_reparacion, Programado) cuenta como
 * "no resuelto" / abierto a efectos de la regla de duplicados.
 */
export const RESOLVED_STATES = ['Cancelado', 'Finalizado', 'Rechazado'] as const;

/** Etiquetas legibles de los estados abiertos para mostrar al usuario. */
const STATE_LABELS: Record<string, string> = {
  Pendiente: 'pendiente',
  Esperando_repuestos: 'esperando repuestos',
  En_reparacion: 'en reparación',
  Programado: 'programada',
};

/** Convierte el nombre de miembro del enum a texto legible (fallback genérico). */
export function formatRepairState(state: string): string {
  return STATE_LABELS[state] ?? state.replaceAll('_', ' ').toLowerCase();
}

export interface RepairConflict {
  /** Dominio o serie de la unidad. */
  unit: string;
  /** Nombre del tipo de reparación. */
  typeName: string;
  /** Estado (nombre de miembro del enum) de la solicitud en conflicto. */
  state: string;
}

/**
 * Arma el mensaje de error claro para mostrar en el toast cuando ya existe una
 * solicitud del mismo tipo sin resolver para la unidad.
 */
export function buildRepairConflictMessage(conflicts: RepairConflict[]): string {
  if (conflicts.length === 0) return '';

  if (conflicts.length === 1) {
    const c = conflicts[0];
    return `No es posible crear la solicitud: la unidad ${c.unit} ya tiene una solicitud del tipo "${c.typeName}" en estado ${formatRepairState(c.state)}.`;
  }

  const list = conflicts.map((c) => `${c.unit} (${c.typeName})`).join(', ');
  return `No es posible crear la solicitud: las siguientes unidades ya tienen una solicitud sin resolver del mismo tipo: ${list}.`;
}
