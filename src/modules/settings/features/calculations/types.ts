export interface ExchangeRateData {
  id: string;
  moneda_origen: string;
  moneda_destino: string;
  valor: number;
  /** ISO date 'YYYY-MM-DD' */
  fecha: string;
  fuente: string | null;
}

export interface IndiceData {
  id: string;
  nombre: string;
  valuesCount: number;
}

export interface IndexValueData {
  id: string;
  indice_id: string;
  mes: number;
  anio: number;
  variacion: number;
}

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;
