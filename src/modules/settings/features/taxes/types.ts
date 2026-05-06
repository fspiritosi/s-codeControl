export const TAX_KIND_LABELS: Record<'RETENTION' | 'PERCEPTION', string> = {
  RETENTION: 'Retención',
  PERCEPTION: 'Percepción',
};

export const TAX_SCOPE_LABELS: Record<'NATIONAL' | 'PROVINCIAL' | 'MUNICIPAL', string> = {
  NATIONAL: 'Nacional',
  PROVINCIAL: 'Provincial',
  MUNICIPAL: 'Municipal',
};

export const TAX_CALCULATION_BASE_LABELS: Record<'NET' | 'TOTAL' | 'VAT', string> = {
  NET: 'Neto gravado',
  TOTAL: 'Total',
  VAT: 'IVA',
};

export interface TaxTypeData {
  id: string;
  code: string;
  name: string;
  kind: 'RETENTION' | 'PERCEPTION';
  scope: 'NATIONAL' | 'PROVINCIAL' | 'MUNICIPAL';
  jurisdiction: string | null;
  calculation_base: 'NET' | 'TOTAL' | 'VAT';
  default_rate: number;
  min_taxable_amount: number | null;
  is_active: boolean;
  notes: string | null;
}
