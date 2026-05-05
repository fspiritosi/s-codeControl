import { z } from 'zod';

export const createProductSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido').max(200),
    description: z.string().max(1000).optional().or(z.literal('')),
    type: z.enum(['PRODUCT', 'SERVICE', 'RAW_MATERIAL', 'CONSUMABLE']),
    purchase_sale_type: z.enum(['PURCHASE', 'PURCHASE_SALE']).default('PURCHASE_SALE'),
    unit_of_measure: z.string().max(20).default('UN'),
    cost_price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
    sale_price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
    vat_rate: z.coerce.number().min(0).max(100).default(21),
    profit_margin_percent: z.coerce.number().min(0).max(10000).nullable().optional(),
    track_stock: z.boolean().default(true),
    min_stock: z.coerce.number().min(0).optional(),
    max_stock: z.coerce.number().min(0).optional(),
    barcode: z.string().max(50).optional().or(z.literal('')),
    brand: z.string().max(100).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.purchase_sale_type === 'PURCHASE_SALE') {
      if (data.profit_margin_percent == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['profit_margin_percent'],
          message: 'El margen de ganancia es requerido para productos de compra y venta',
        });
      }
    }
  });

export const updateProductSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().or(z.literal('')),
    type: z.enum(['PRODUCT', 'SERVICE', 'RAW_MATERIAL', 'CONSUMABLE']).optional(),
    purchase_sale_type: z.enum(['PURCHASE', 'PURCHASE_SALE']).optional(),
    unit_of_measure: z.string().max(20).optional(),
    cost_price: z.coerce.number().min(0).optional(),
    sale_price: z.coerce.number().min(0).optional(),
    vat_rate: z.coerce.number().min(0).max(100).optional(),
    profit_margin_percent: z.coerce.number().min(0).max(10000).nullable().optional(),
    track_stock: z.boolean().optional(),
    min_stock: z.coerce.number().min(0).optional(),
    max_stock: z.coerce.number().min(0).optional(),
    barcode: z.string().max(50).optional().or(z.literal('')),
    brand: z.string().max(100).optional().or(z.literal('')),
    status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
  });
