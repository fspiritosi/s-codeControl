import { z } from 'zod';

const amountString = z
  .string()
  .min(1, 'El monto es requerido')
  .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máximo 2 decimales)');

export const bankAccountSchema = z.object({
  bank_name: z.string().min(1, 'El banco es requerido').max(100),
  account_number: z.string().min(1, 'El número de cuenta es requerido').max(50),
  account_type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'CASH', 'VIRTUAL_WALLET']),
  cbu: z.string().max(30).optional().nullable(),
  alias: z.string().max(30).optional().nullable(),
  currency: z.string().min(1).max(10).default('ARS'),
  balance: amountString.default('0'),
});
export type BankAccountFormData = z.infer<typeof bankAccountSchema>;

export const bankMovementSchema = z.object({
  bank_account_id: z.string().uuid('Cuenta inválida'),
  type: z.enum([
    'DEPOSIT',
    'WITHDRAWAL',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'CHECK',
    'DEBIT',
    'FEE',
    'INTEREST',
  ]),
  amount: amountString.refine((v) => parseFloat(v) > 0, 'El monto debe ser mayor a 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  description: z.string().min(1, 'La descripción es requerida').max(500),
  reference: z.string().max(100).optional().nullable(),
  statement_number: z.string().max(50).optional().nullable(),
});
export type BankMovementFormData = z.infer<typeof bankMovementSchema>;

const INCOMING_TYPES = new Set(['DEPOSIT', 'TRANSFER_IN', 'INTEREST']);

export function isIncomingMovement(type: string): boolean {
  return INCOMING_TYPES.has(type);
}
