/**
 * Tipos compartidos para secciones de documentos vinculados en PDFs.
 * Se usan en los templates @react-pdf cuando el usuario elige incluir registros asociados
 * (ej: remitos, facturas, etc.)
 */

export interface LinkedDocumentRecord {
  label: string;
  date?: string;
  amount?: string;
  status?: string;
}

export interface LinkedDocumentSection {
  title: string;
  columns: string[];
  records: LinkedDocumentRecord[];
}

export interface LinkedDocumentsData {
  sections: LinkedDocumentSection[];
}
