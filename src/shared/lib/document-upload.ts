import { storage } from '@/shared/lib/storage';

/**
 * Sube el archivo de un documento al bucket `document_files`.
 *
 * Los errores se propagan a proposito: antes se capturaban y se devolvia `[]`,
 * con lo cual el formulario seguia adelante y avisaba "Documento cargado
 * correctamente" aunque el archivo no hubiera llegado al storage (TKT-646).
 */
export const uploadDocumentFile = async (file: File, path: string) => {
  return storage.upload('document_files', path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
};

/**
 * Sube el archivo y recien despues registra el documento en la base.
 *
 * El orden importa: al registrar primero, un rechazo del storage dejaba una
 * fila en estado "presentado" apuntando a un archivo que no existe (TKT-646).
 * Si el registro falla se borra el archivo recien subido, para no dejarlo
 * huerfano ni bloquear un reintento con la misma ruta (`upsert: false`).
 */
export const uploadDocumentWithFile = async ({
  file,
  path,
  saveDocument,
}: {
  file: File;
  path: string;
  saveDocument: () => Promise<unknown>;
}) => {
  await uploadDocumentFile(file, path);

  try {
    await saveDocument();
  } catch (error) {
    try {
      await storage.remove('document_files', [path]);
    } catch (removeError) {
      // El error que le importa al usuario es el del registro, no el del
      // borrado de compensacion.
      console.error('No se pudo borrar el archivo tras fallar el registro:', removeError);
    }
    throw error;
  }
};
