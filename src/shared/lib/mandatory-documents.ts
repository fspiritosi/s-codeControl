/**
 * Filas de documentación obligatoria que hay que crear al dar de alta un
 * recurso (empleado o equipo).
 *
 * Nacen sin `document_path` y en estado `pendiente`: son los casilleros que el
 * usuario después completa desde el legajo del recurso. Si no se crean, la
 * pantalla del recurso no tiene nada que listar y la documentación no se puede
 * cargar desde ahí.
 */

export interface MandatoryDocumentType {
  id: string;
}

export interface PendingDocumentRow {
  applies: string;
  id_document_types: string;
  validity: null;
  user_id: string | undefined;
}

/**
 * `mandatoryTypes` en `null` significa "no se pudieron obtener los tipos", y es
 * un error: distinto de `[]`, que significa "la empresa no tiene obligatorios".
 *
 * La distinción es el punto. Antes los tipos se leían de un store que arrancaba
 * en `{}` y que hidrataba un componente de otro módulo; cuando todavía estaba
 * frío, el `?.forEach` no iteraba, no se creaba ninguna fila y el alta terminaba
 * bien. El recurso quedaba sin su documentación obligatoria y nadie se enteraba
 * hasta que alguien iba a cargar un documento y no encontraba dónde.
 */
export function buildMissingMandatoryDocuments({
  mandatoryTypes,
  existingTypeIds,
  appliesId,
  userId,
}: {
  mandatoryTypes: MandatoryDocumentType[] | null | undefined;
  existingTypeIds: string[];
  appliesId: string;
  userId: string | undefined;
}): PendingDocumentRow[] {
  if (!mandatoryTypes) {
    throw new Error(
      'No se pudieron obtener los tipos de documento obligatorios. No se creó la documentación del recurso.'
    );
  }

  const yaExisten = new Set(existingTypeIds);

  return mandatoryTypes
    .filter((tipo) => !yaExisten.has(tipo.id))
    .map((tipo) => ({
      applies: appliesId,
      id_document_types: tipo.id,
      validity: null as null,
      user_id: userId,
    }));
}
