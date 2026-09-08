/**
 * Traduce una fila de las tablas de documentos a los props de
 * `UploadPendingDocumentDialog`.
 *
 * Todo lo que el dialogo necesita ya viaja en la fila (la arman
 * `formatEmployeeDocuments` / `formatVehiculesDocuments`), asi que la carga no
 * depende de ningun store del cliente. Esa dependencia era el bug: el dialogo
 * anterior buscaba el recurso en `useLoggedUserStore.employees`, que quedo como
 * un `[]` fijo tras el refactor de stores, y la carga desde el legajo fallaba
 * siempre con "No se encontro el recurso".
 */

export type PendingUploadKind = 'employee' | 'equipment';

export interface PendingUploadRow {
  id?: string | null;
  /** `document_types.applies`: 'Persona' | 'Equipos' | 'Empresa'. */
  applies?: string | null;
  documentName?: string | null;
  resource?: string | null;
  expires?: unknown;
  isItMonthly?: unknown;
}

export interface PendingUploadProps {
  rowId: string;
  kind: PendingUploadKind;
  documentName: string;
  resourceLabel: string;
  expires: boolean;
  monthly: boolean;
}

const KIND_POR_APPLIES: Record<string, PendingUploadKind> = {
  Persona: 'employee',
  Equipos: 'equipment',
};

/**
 * Devuelve `null` cuando la fila no se puede cargar por este camino: sin id, o
 * de un tipo de recurso que el dialogo no maneja (hoy, documentos de empresa).
 * Quien llama no renderiza el boton en ese caso, que es mejor que ofrecer una
 * carga que va a fallar.
 */
export function pendingUploadPropsFromRow(row: PendingUploadRow | null | undefined): PendingUploadProps | null {
  if (!row?.id) return null;

  const kind = KIND_POR_APPLIES[row.applies ?? ''];
  if (!kind) return null;

  return {
    rowId: row.id,
    kind,
    documentName: row.documentName || 'Documento',
    resourceLabel: row.resource || '',
    expires: !!row.expires,
    monthly: !!row.isItMonthly,
  };
}
