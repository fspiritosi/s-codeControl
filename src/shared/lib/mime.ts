/**
 * Resolución de Content-Type para descargas.
 *
 * Forzar `application/octet-stream` (binario genérico) en las descargas hace que
 * algunos antivirus (p. ej. McAfee) las marquen como sospechosas y las manden a
 * cuarentena. Estos helpers derivan el MIME real del archivo para que la
 * descarga llegue declarada con su tipo correcto (application/pdf, image/jpeg…).
 */

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  csv: 'text/csv',
  txt: 'text/plain',
  rtf: 'application/rtf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  svg: 'image/svg+xml',
  zip: 'application/zip',
  json: 'application/json',
  xml: 'application/xml',
};

const GENERIC = 'application/octet-stream';

/** MIME type a partir de la extensión del nombre de archivo. */
export function mimeTypeForFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXTENSION[ext] ?? GENERIC;
}

/**
 * Type confiable para descargar un Blob: prioriza el Content-Type que ya trae el
 * Blob (p. ej. el que devuelve Supabase Storage) cuando es específico, y si es
 * genérico o vacío lo deriva de la extensión del nombre. Evita degradar a
 * octet-stream.
 */
export function resolveDownloadType(blobType: string | undefined | null, filename: string): string {
  if (blobType && blobType !== GENERIC) return blobType;
  return mimeTypeForFilename(filename);
}

/**
 * Reenvuelve un Blob descargado con su Content-Type correcto (si hace falta) para
 * que la descarga quede declarada con el MIME real.
 */
export function blobWithResolvedType(data: Blob, filename: string): Blob {
  const type = resolveDownloadType(data.type, filename);
  if (data.type === type) return data;
  return new Blob([data], { type });
}
