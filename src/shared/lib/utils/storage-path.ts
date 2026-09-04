/**
 * Descarta de un segmento de ruta lo que Supabase Storage no acepta, sin
 * alterar nada mas. Se usa donde el valor ya se interpolaba crudo en la ruta
 * (la serie del equipo, la version, la extension del archivo): reformatearlo
 * moveria documentos que hoy estan subidos y accesibles.
 */
export const stripNonAscii = (value?: string | null): string => {
  if (value === null || value === undefined) return '';

  return String(value)
    .normalize('NFD') // separa cada letra de su diacritico
    .replace(/[\u0300-\u036f]/g, '') // descarta los diacriticos
    .replace(/[^\x20-\x7e]/g, ''); // descarta lo que siga sin ser ascii imprimible
};

/**
 * Sanitiza un segmento de ruta de Supabase Storage.
 *
 * Supabase rechaza con `InvalidKey` cualquier clave que contenga caracteres
 * fuera del ASCII imprimible, y las rutas de documentos se arman con datos
 * cargados por el usuario (nombre de empresa, de empleado, dominio o serie del
 * equipo, nombre del tipo de documento). Sin esta normalizacion la subida
 * falla para cualquier recurso con una tilde, una ñ o un simbolo.
 *
 * La normalizacion se hace por Unicode (NFD + descarte de diacriticos) y no
 * por una lista de caracteres: en produccion aparecieron nombres en forma NFD,
 * donde la tilde es un code point separado y una lista de precompuestos
 * (`[íïìî]`) no la alcanza.
 *
 * Invariante: para una entrada que ya es ASCII imprimible la salida es
 * identica a la del formateo anterior, para no mover ninguna ruta existente.
 */
export const formatPathSegment = (value?: string | null): string => {
  if (value === null || value === undefined) return '';

  return stripNonAscii(
    String(value)
      .toLowerCase()
      .replace(/['"]/g, '') // elimina apostrofes y comillas
      .replace(/\s+/g, '-') // reemplaza espacios por guiones
  );
};

/**
 * Arma la ruta completa de un documento en el bucket `document_files`.
 * Todos los segmentos que provienen de datos cargados por el usuario pasan
 * por `formatPathSegment`, salvo la version y la extension, que nunca se
 * pasaron a minusculas y solo se limpian de caracteres no aceptados.
 */
export function calculateNameOFDocument(
  company_name: string,
  company_cuit: string,
  applies: string,
  document_name: string,
  version: string,
  file_extension: string,
  resource: string
) {
  const formatedCompanyName = formatPathSegment(company_name);
  const formatedAppliesName = formatPathSegment(applies);
  const formatedDocumentTypeName = formatPathSegment(document_name);
  const formatedVersion = stripNonAscii(version).replace(/\./g, '-');
  const formatedFileExtension = stripNonAscii(file_extension).replace(/\./g, '-');

  return `${formatedCompanyName}-(${company_cuit})/${resource}/${formatedAppliesName}/${formatedDocumentTypeName}-(${formatedVersion}).${formatedFileExtension}`;
}
