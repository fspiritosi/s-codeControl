import { z } from 'zod';

const amountString = z
  .string()
  .min(1, 'El monto es requerido')
  .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máximo 2 decimales)');

export const checkSchema = z.object({
  type: z.enum(['OWN', 'THIRD_PARTY']),
  check_number: z.string().min(1, 'Número de cheque requerido').max(50),
  bank_name: z.string().min(1, 'Banco requerido').max(100),
  branch: z.string().max(100).optional().nullable(),
  account_number: z.string().max(50).optional().nullable(),
  amount: amountString.refine((v) => parseFloat(v) > 0, 'Debe ser mayor a 0'),
  issue_date: z.string().min(1, 'Fecha de emisión requerida'),
  due_date: z.string().min(1, 'Fecha de vencimiento requerida'),
  drawer_name: z.string().min(1, 'Librador requerido').max(200),
  drawer_tax_id: z.string().max(20).optional().nullable(),
  payee_name: z.string().max(200).optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
export type CheckFormData = z.infer<typeof checkSchema>;

export type CheckStatusValue =
  | 'PORTFOLIO'
  | 'DEPOSITED'
  | 'CLEARED'
  | 'REJECTED'
  | 'ENDORSED'
  | 'DELIVERED'
  | 'CASHED'
  | 'VOIDED';

export type CheckTypeValue = 'OWN' | 'THIRD_PARTY';

// Transiciones válidas por tipo de cheque
export const ALLOWED_TRANSITIONS: Record<CheckTypeValue, Record<CheckStatusValue, CheckStatusValue[]>> = {
  OWN: {
    PORTFOLIO: ['DELIVERED', 'VOIDED'],
    DELIVERED: ['CASHED', 'VOIDED'],
    CASHED: [],
    VOIDED: [],
    // Estados que no aplican a OWN
    DEPOSITED: [],
    CLEARED: [],
    REJECTED: [],
    ENDORSED: [],
  },
  THIRD_PARTY: {
    PORTFOLIO: ['DEPOSITED', 'ENDORSED', 'VOIDED'],
    DEPOSITED: ['CLEARED', 'REJECTED'],
    CLEARED: [],
    REJECTED: [],
    ENDORSED: [],
    VOIDED: [],
    // Estados que no aplican a THIRD_PARTY
    DELIVERED: [],
    CASHED: [],
  },
};

export function getNextStatuses(type: CheckTypeValue, current: CheckStatusValue): CheckStatusValue[] {
  return ALLOWED_TRANSITIONS[type][current] ?? [];
}
