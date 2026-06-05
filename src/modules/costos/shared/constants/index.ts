export const COSTOS_MODULE_NAME = 'costos';

export const COSTOS_PDF_BUCKET = 'costos-pdfs';

export function COSTOS_PDF_PATHS(companyId: string) {
  return {
    composicion: (servicioId: string, periodo: string) =>
      `${companyId}/composicion/${servicioId}/${periodo}.pdf`,
    liquidacion: (employeeId: string, periodo: string) =>
      `${companyId}/liquidacion/${employeeId}/${periodo}.pdf`,
  };
}

/** Tiempo de vida (segundos) de las URLs firmadas de PDFs */
export const COSTOS_SIGNED_URL_TTL = 3600;

/** Tolerancia para validar que la suma de ponderaciones de la fórmula polinómica = 1.0 */
export const COSTOS_PONDERACION_TOLERANCIA = 0.0001;
