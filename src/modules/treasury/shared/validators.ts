import { z } from 'zod';

// ============================================================
// CASH REGISTERS
// ============================================================

export const cashRegisterSchema = z.object({
  code: z
    .string()
    .min(1, 'El código es requerido')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Solo letras mayúsculas, números y guiones'),
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  location: z.string().max(200, 'Máximo 200 caracteres').optional().nullable(),
  is_default: z.boolean().default(false),
});
export type CashRegisterFormData = z.infer<typeof cashRegisterSchema>;

// ============================================================
// SESSIONS
// ============================================================

const amountString = z
  .string()
  .min(1, 'El monto es requerido')
  .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máximo 2 decimales)');

export const openSessionSchema = z.object({
  cash_register_id: z.string().uuid('Caja inválida'),
  opening_balance: amountString.refine(
    (v) => parseFloat(v) >= 0,
    'El saldo inicial debe ser positivo o cero'
  ),
  opening_notes: z.string().max(500).optional().nullable(),
});
export type OpenSessionFormData = z.infer<typeof openSessionSchema>;

export const closeSessionSchema = z.object({
  session_id: z.string().uuid('Sesión inválida'),
  actual_balance: amountString.refine(
    (v) => parseFloat(v) >= 0,
    'El saldo real debe ser positivo o cero'
  ),
  closing_notes: z.string().max(500).optional().nullable(),
});
export type CloseSessionFormData = z.infer<typeof closeSessionSchema>;

// ============================================================
// CASH MOVEMENTS
// ============================================================

export const cashMovementSchema = z.object({
  session_id: z.string().uuid('Sesión inválida'),
  cash_register_id: z.string().uuid('Caja inválida'),
  type: z.enum(['INCOME', 'EXPENSE', 'ADJUSTMENT'], { message: 'Seleccioná un tipo' }),
  amount: amountString.refine((v) => parseFloat(v) > 0, 'El monto debe ser mayor a 0'),
  description: z.string().min(1, 'La descripción es requerida').max(500),
  reference: z.string().max(100).optional().nullable(),
  purchase_invoice_id: z.string().uuid().optional().nullable(),
});
export type CashMovementFormData = z.infer<typeof cashMovementSchema>;

// ============================================================
// LABELS
// ============================================================

export const CASH_REGISTER_STATUS_LABELS = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
} as const;

export const SESSION_STATUS_LABELS = {
  OPEN: 'Abierta',
  CLOSED: 'Cerrada',
} as const;

export const CASH_MOVEMENT_TYPE_LABELS = {
  OPENING: 'Apertura',
  CLOSING: 'Cierre',
  INCOME: 'Ingreso',
  EXPENSE: 'Egreso',
  ADJUSTMENT: 'Ajuste',
} as const;

export const BANK_ACCOUNT_TYPE_LABELS = {
  CHECKING: 'Cuenta corriente',
  SAVINGS: 'Caja de ahorro',
  CREDIT: 'Cuenta de crédito',
  CASH: 'Efectivo',
  VIRTUAL_WALLET: 'Billetera virtual',
} as const;

export const BANK_ACCOUNT_STATUS_LABELS = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  CLOSED: 'Cerrada',
} as const;

export const BANK_MOVEMENT_TYPE_LABELS = {
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Extracción',
  TRANSFER_IN: 'Transferencia recibida',
  TRANSFER_OUT: 'Transferencia enviada',
  CHECK: 'Cheque',
  DEBIT: 'Débito automático',
  FEE: 'Comisión',
  INTEREST: 'Interés',
} as const;

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Efectivo',
  CHECK: 'Cheque',
  TRANSFER: 'Transferencia',
  DEBIT_CARD: 'Tarjeta de débito',
  CREDIT_CARD: 'Tarjeta de crédito',
  ACCOUNT: 'Cuenta corriente',
} as const;

export const PAYMENT_ORDER_STATUS_LABELS = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmada',
  PAID: 'Pagada',
  CANCELLED: 'Anulada',
} as const;

export const PAYMENT_ORDER_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'PAID',
  'CANCELLED',
] as const satisfies ReadonlyArray<keyof typeof PAYMENT_ORDER_STATUS_LABELS>;

export const CHECK_TYPE_LABELS = {
  OWN: 'Propio',
  THIRD_PARTY: 'Tercero',
} as const;

export const CHECK_STATUS_LABELS = {
  PORTFOLIO: 'En cartera',
  DEPOSITED: 'Depositado',
  CLEARED: 'Acreditado',
  REJECTED: 'Rechazado',
  ENDORSED: 'Endosado',
  DELIVERED: 'Entregado',
  CASHED: 'Cobrado',
  VOIDED: 'Anulado',
} as const;
