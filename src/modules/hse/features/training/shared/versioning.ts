/**
 * Versionado de capacitaciones (TKT-827).
 *
 * Una capacitación publicada que ya tiene intentos no se edita: se crea una
 * versión nueva. Al publicarla, la anterior se cierra "por cambio de versión".
 * Acá vive la lógica que no toca la base, para poder testearla.
 */

export const SUPERSEDED_EFFECTIVENESS = 'Cerrada por cambio de versión';

type CloseFields = {
  effectiveness_method: string | null;
  requires_new_actions: boolean | null;
  new_actions_detail: string | null;
};

const isBlank = (value: string | null | undefined) => !value?.trim();

/** Solo se versiona lo que está publicado y ya fue rendido: lo demás se edita. */
export function canCreateVersion(input: { status: string | null; attemptsCount: number }): boolean {
  return input.status === 'Publicado' && input.attemptsCount > 0;
}

/**
 * Campos de cierre de HSE de la versión reemplazada. Completa solo los vacíos:
 * lo que el referente de HSE cargó a mano va al registro ante una auditoría y
 * no se pisa.
 */
export function buildSupersededCloseFields(current: CloseFields, nextVersion: number): CloseFields {
  const requires_new_actions = current.requires_new_actions ?? true;

  return {
    effectiveness_method: isBlank(current.effectiveness_method)
      ? SUPERSEDED_EFFECTIVENESS
      : current.effectiveness_method,
    requires_new_actions,
    new_actions_detail:
      requires_new_actions && isBlank(current.new_actions_detail)
        ? `Se emite la versión ${nextVersion}`
        : current.new_actions_detail,
  };
}

/**
 * Datos del update de la versión reemplazada.
 *
 * - Ya reemplazada (se republicó la nueva): null, no se toca. La versión
 *   anterior no cambia después de que existe la nueva.
 * - Publicada o archivada mientras la nueva estaba en preparación: se cierra,
 *   así su registro queda definitivo.
 * - Cerrada a mano: no se pisa ese cierre, solo se marca como reemplazada.
 */
export function buildSupersedeUpdate(
  input: { status: string | null; close: CloseFields; superseded_at?: Date | null },
  nextVersion: number,
  now: Date,
  userId: string | null
) {
  if (input.superseded_at) return null;

  if (input.status !== 'Publicado' && input.status !== 'Archivado') {
    return { superseded_at: now, updated_at: now };
  }

  return {
    status: 'Cerrada' as const,
    closed_at: now,
    closed_by: userId,
    superseded_at: now,
    updated_at: now,
    ...buildSupersededCloseFields(input.close, nextVersion),
  };
}

/** Título con el número de versión, solo si la capacitación tiene más de una. */
export function versionedTitle(title: string, versionNumber: number, isVersioned: boolean): string {
  return isVersioned ? `${title} (versión ${versionNumber})` : title;
}

export function supersededClosureNote(nextVersion: number): string {
  return `${SUPERSEDED_EFFECTIVENESS} (reemplazada por la versión ${nextVersion})`;
}

/**
 * Archivos de material que se pueden borrar de Storage. Las versiones comparten
 * archivos: nunca se borra uno que otra capacitación sigue referenciando.
 */
export function materialPathsSafeToDelete(candidates: string[], stillReferenced: string[]): string[] {
  const referenced = new Set(stillReferenced);
  return [...new Set(candidates)].filter((path) => !isBlank(path) && !referenced.has(path));
}

/** document_path con que archiveCertificateInEmployeeFile guarda cada constancia. */
export function certificatePath(companyId: string, employeeId: string, attemptId: string): string {
  return `capacitaciones/${companyId}/${employeeId}/${attemptId}.pdf`;
}

export function certificatePathsForAttempts(
  companyId: string,
  attempts: { id: string; employee_id: string }[]
): string[] {
  return attempts.map((attempt) => certificatePath(companyId, attempt.employee_id, attempt.id));
}

/**
 * Estado con que se archiva una constancia en el legajo. Si la versión ya fue
 * reemplazada, la constancia nace vencida a la fecha del reemplazo: igual que
 * las que se vencieron al publicar la nueva.
 */
export function certificateArchiveState(
  supersededAt: Date | null,
  validity: string | null
): { state: 'presentado' | 'vencido'; validity: string | null } {
  return supersededAt
    ? { state: 'vencido', validity: supersededAt.toISOString() }
    : { state: 'presentado', validity };
}

/**
 * El registro de una versión reemplazada no incorpora gente: solo cuentan los
 * aprobados hasta el reemplazo. Sin reemplazo no hay corte.
 */
export function isWithinRecordCutoff(completedAt: Date | null, supersededAt: Date | null): boolean {
  if (!supersededAt) return true;
  return completedAt !== null && completedAt <= supersededAt;
}

export type VersionNode = {
  id: string;
  version_number: number;
  previous_version_id: string | null;
  status: string | null;
  closed_at: string | null;
  approved: number;
};

/**
 * Vínculos de una versión con sus vecinas, para la tarjeta del listado:
 * "Reemplaza a la v{n}" y "v{n} en preparación".
 */
export function versionLinks(
  nodes: VersionNode[],
  id: string
): {
  previousVersion: { version_number: number; closed_at: string | null; approved: number } | null;
  draftVersion: { id: string; version_number: number } | null;
} {
  const current = nodes.find((node) => node.id === id);
  // Un borrador todavía no reemplaza a nadie: la anterior sigue vigente.
  const previous =
    current?.previous_version_id && current.status !== 'Borrador'
      ? nodes.find((node) => node.id === current.previous_version_id)
      : undefined;
  const draft = nodes.find((node) => node.previous_version_id === id && node.status === 'Borrador');

  return {
    previousVersion: previous
      ? { version_number: previous.version_number, closed_at: previous.closed_at, approved: previous.approved }
      : null,
    draftVersion: draft ? { id: draft.id, version_number: draft.version_number } : null,
  };
}
