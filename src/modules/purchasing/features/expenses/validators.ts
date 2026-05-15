import { z } from 'zod';

// ============================================
// CONSTANTES
// ============================================

export const EXPENSE_STATUSES = ['DRAFT', 'CONFIRMED', 'PARTIAL_PAID', 'PAID', 'CANCELLED'] as const;

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmado',
  PARTIAL_PAID: 'Parcialmente pagado',
  PAID: 'Pagado',
  CANCELLED: 'Anulado',
};

// ============================================
// SCHEMAS ZOD
// ============================================

export const expenseFormSchema = z.object({
  description: z.string().min(1, 'La descripcion es requerida'),
  amount: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Monto invalido (hasta 3 decimales)'),
  date: z.date({ message: 'La fecha es requerida' }),
  due_date: z.date().optional().nullable(),
  category_id: z.string().uuid('Seleccione una categoria'),
  supplier_id: z.string().uuid().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});

export type ExpenseFormInput = z.infer<typeof expenseFormSchema>;

export const expenseCategoryFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional().nullable(),
});

export type ExpenseCategoryFormInput = z.infer<typeof expenseCategoryFormSchema>;
