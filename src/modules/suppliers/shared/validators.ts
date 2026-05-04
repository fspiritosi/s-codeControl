import { z } from 'zod';

const cuitRegex = /^\d{2}-?\d{8}-?\d{1}$/;

const supplierPaymentMethodCheckSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.literal('CHECK'),
  is_default: z.boolean().default(false),
});

const supplierPaymentMethodAccountSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.literal('ACCOUNT'),
  bank_name: z.string().min(1, 'El banco es requerido').max(200),
  account_holder: z.string().min(1, 'El titular es requerido').max(200),
  account_holder_tax_id: z.string().regex(cuitRegex, 'CUIT del titular inválido (formato: XX-XXXXXXXX-X)'),
  account_type: z.enum(['CHECKING', 'SAVINGS']),
  cbu: z.string().regex(/^\d{22}$/, 'El CBU debe tener exactamente 22 dígitos'),
  alias: z.string().max(50).optional().or(z.literal('')),
  currency: z.enum(['ARS', 'USD']).default('ARS'),
  is_default: z.boolean().default(false),
});

export const supplierPaymentMethodSchema = z.discriminatedUnion('type', [
  supplierPaymentMethodCheckSchema,
  supplierPaymentMethodAccountSchema,
]);

export type SupplierPaymentMethodInput = z.infer<typeof supplierPaymentMethodSchema>;

export const supplierPaymentMethodsArraySchema = z
  .array(supplierPaymentMethodSchema)
  .superRefine((items, ctx) => {
    const checkCount = items.filter((it) => it.type === 'CHECK').length;
    if (checkCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Solo se permite un método "Cheque" por proveedor',
        path: [],
      });
    }
    const defaultCount = items.filter((it) => it.is_default).length;
    if (defaultCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Solo un método de pago puede estar marcado como predeterminado',
        path: [],
      });
    }
  });

export const createSupplierSchema = z.object({
  business_name: z.string().min(1, 'La razón social es requerida').max(200),
  trade_name: z.string().max(200).optional().or(z.literal('')),
  tax_id: z.string().regex(cuitRegex, 'CUIT inválido (formato: XX-XXXXXXXX-X)'),
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
  payment_methods: supplierPaymentMethodsArraySchema.optional().default([]),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
  payment_methods: supplierPaymentMethodsArraySchema.optional(),
});
