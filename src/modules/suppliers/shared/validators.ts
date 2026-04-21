import { z } from 'zod';

export const createSupplierSchema = z.object({
  business_name: z.string().min(1, 'La razón social es requerida').max(200),
  trade_name: z.string().max(200).optional().or(z.literal('')),
  tax_id: z.string().regex(/^\d{2}-?\d{8}-?\d{1}$/, 'CUIT inválido (formato: XX-XXXXXXXX-X)'),
  tax_condition: z.enum(['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTISTA', 'EXENTO', 'NO_RESPONSABLE', 'CONSUMIDOR_FINAL']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  province: z.string().max(100).optional().or(z.literal('')),
  zip_code: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).default('Argentina'),
  payment_term_days: z.coerce.number().int().min(0).max(365).default(0),
  credit_limit: z.coerce.number().min(0).optional(),
  contact_name: z.string().max(200).optional().or(z.literal('')),
  contact_phone: z.string().max(50).optional().or(z.literal('')),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
});
