import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  type: z.enum(['PRODUCT', 'SERVICE', 'RAW_MATERIAL', 'CONSUMABLE']),
  unit_of_measure: z.string().max(20).default('UN'),
  cost_price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  sale_price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  vat_rate: z.coerce.number().min(0).max(100).default(21),
  track_stock: z.boolean().default(true),
  min_stock: z.coerce.number().min(0).optional(),
  max_stock: z.coerce.number().min(0).optional(),
  barcode: z.string().max(50).optional().or(z.literal('')),
  brand: z.string().max(100).optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
});
