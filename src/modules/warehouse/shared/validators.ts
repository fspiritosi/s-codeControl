import { z } from 'zod';

export const createWarehouseSchema = z.object({
  code: z.string().min(1, 'El código es requerido').max(20),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  type: z.enum(['MAIN', 'BRANCH', 'TRANSIT', 'VIRTUAL']).default('MAIN'),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  province: z.string().max(100).optional().or(z.literal('')),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export const adjustStockSchema = z.object({
  warehouse_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.coerce.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  notes: z.string().min(1, 'Las notas son requeridas'),
});

export const transferStockSchema = z.object({
  source_warehouse_id: z.string().uuid(),
  destination_warehouse_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  notes: z.string().optional().or(z.literal('')),
}).refine((data) => data.source_warehouse_id !== data.destination_warehouse_id, {
  message: 'El almacén de origen y destino deben ser diferentes',
  path: ['destination_warehouse_id'],
});
