# COD-568 — Productos: tipo de operación + precio compra dual + margen

## Problema
El form de productos exigía cargar `cost_price` y `sale_price` por separado, sin
distinguir productos que solo se compran de los que también se venden. No había
forma de cargar el precio de compra "con IVA" ni de derivar el de venta a partir
de un % de ganancia.

## Decisiones
- Nuevo enum `product_purchase_sale_type` con valores `PURCHASE` / `PURCHASE_SALE`.
  Default `PURCHASE_SALE` para preservar productos existentes.
- Nueva columna `profit_margin_percent` (decimal nullable). Aplica solo cuando
  `purchase_sale_type = PURCHASE_SALE`.
- En DB el `cost_price` siempre se guarda en NETO (sin IVA). El con-IVA se
  deriva al renderizar.
- `sale_price` se calcula al guardar: `cost_price * (1 + margen/100)`. Si tipo
  es `PURCHASE`, se setea en 0 y `profit_margin_percent` en NULL.
- Migración 100% aditiva e idempotente.

## Archivos modificados
- `prisma/schema.prisma` — nuevo enum + columnas.
- `supabase/migrations/20260505110311_products_purchase_sale_type.sql`.
- `src/modules/products/shared/validators.ts` — schema con superRefine.
- `src/modules/products/shared/types.ts` — tipo Product extendido + labels.
- `src/modules/products/features/list/actions.server.ts` — create/update calculan sale_price.
- `src/modules/products/features/create/components/ProductForm.tsx` — Tabs Sin IVA / Con IVA, % ganancia condicional, preview de precios.
- `src/modules/products/features/detail/components/ProductDetail.tsx` — muestra tipo, costo sin/con IVA, % ganancia y precio de venta sin/con IVA.

## Notas
- En `updateProduct` se detecta si la llamada incluye `purchase_sale_type` o
  `profit_margin_percent`. Si los incluye se recalcula `sale_price`; si no
  (toggle de status desde la lista), se preservan los valores actuales.
- El input dual usa Tabs (`Sin IVA` / `Con IVA`) y siempre persiste el neto.
  Al editar "Con IVA" se calcula `neto = bruto / (1 + iva/100)` antes de guardar.
- Campo "type" se renombra en UI a "Categoría" para distinguirlo del nuevo
  "Tipo de operación".

## Verificación
- `npm run check-types` OK.
- `npm run build` OK.
