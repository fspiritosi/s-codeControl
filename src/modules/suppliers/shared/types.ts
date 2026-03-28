export interface Supplier {
  id: string;
  company_id: string;
  code: string;
  business_name: string;
  trade_name: string | null;
  tax_id: string;
  tax_condition: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  zip_code: string | null;
  country: string;
  payment_term_days: number;
  credit_limit: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export const TAX_CONDITION_LABELS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTISTA: 'Monotributista',
  EXENTO: 'Exento',
  NO_RESPONSABLE: 'No Responsable',
  CONSUMIDOR_FINAL: 'Consumidor Final',
};

export const SUPPLIER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  BLOCKED: 'Bloqueado',
};
