# COD-458 — Orden de Pago: estado Pagada + PDF + mail al proveedor + recálculo de facturas

## Problema

La OP solo tenía estados `DRAFT`, `CONFIRMED` y `CANCELLED`. No había forma de
marcarla como efectivamente pagada, generar el comprobante PDF, notificar al
proveedor ni propagar el estado de pago hacia las facturas de compra.

## Decisiones

- Nuevo enum value `PAID` en `payment_order_status`, después de `CONFIRMED`.
  Estado terminal: no se permite revertir a `CONFIRMED`.
- Botón "Marcar como Pagada" visible solo cuando la OP está en `CONFIRMED`.
- Tabla pivote OP↔FC ya existente: `payment_order_items` (FK `invoice_id` +
  `amount` como `applied_amount`). No se crea ninguna tabla nueva.
- Recalculo de status de FC se hace sumando `payment_order_items.amount` de
  todas las OPs en estado `PAID` que apliquen a la factura. `>= total` →
  `PAID`. `> 0 && < total` → `PARTIAL_PAID` (ya existente). Tolerancia 0.005.
- Mail al proveedor en el momento de marcar pagada, con PDF adjunto. Si no hay
  email, se muestra toast warning y la transición igual ocurre. Si el envío
  falla, no se revierte la transición.
- Layout PDF estilo "ENSI": header empresa + N° + Fecha, datos de proveedor,
  tabla de comprobantes a cancelar, tabla de medios de pago, total, importe en
  letras, bloque de firma del proveedor.
- Helper `amountToSpanishWords()` implementado in-house para no agregar deps.

## Archivos creados / modificados

### Migración
- `supabase/migrations/20260504215725_add_paid_status_to_payment_orders.sql` —
  agrega `PAID` al enum (idempotente) y columnas `paid_at` / `paid_by` a
  `payment_orders`.

### Schema Prisma
- `prisma/schema.prisma` — enum `payment_order_status` + campos `paid_at` /
  `paid_by` en `payment_orders`.

### Backend (treasury)
- `src/modules/treasury/features/payment-orders/actions.server.ts` — nueva
  acción `markPaymentOrderAsPaid` con transacción, recálculo de FCs y disparo
  de mail.
- `src/modules/treasury/features/payment-orders/shared/pdf/types.ts`
- `src/modules/treasury/features/payment-orders/shared/pdf/styles.ts`
- `src/modules/treasury/features/payment-orders/shared/pdf/PaymentOrderTemplate.tsx`
- `src/modules/treasury/features/payment-orders/shared/pdf/generator.tsx`
- `src/modules/treasury/features/payment-orders/shared/pdf/amount-in-words.ts`
- `src/modules/treasury/features/payment-orders/shared/pdf/index.ts`
- `src/modules/treasury/features/payment-orders/shared/email/sendPaymentOrderPaidEmail.ts`
- `src/modules/treasury/shared/validators.ts` — agrega `PAID` a
  `PAYMENT_ORDER_STATUS_LABELS`.

### Email
- `src/shared/lib/email-templates/payment-order-paid.ts` — plantilla HTML.

### API
- `src/app/api/payment-orders/[id]/pdf/route.ts` — preview / descarga manual.

### UI
- `src/modules/treasury/features/payment-orders/components/PaymentOrderActions.tsx` —
  botón "Marcar como Pagada" + AlertDialog + manejo de toasts según
  `emailStatus`.
- `src/modules/treasury/features/payment-orders/components/PaymentOrderDetail.tsx` —
  variante `success` para badge `PAID`.
- `src/modules/treasury/features/payment-orders/components/PaymentOrdersList.tsx` —
  variante `success` para badge `PAID`.
- `src/app/dashboard/purchasing/invoices/[id]/page.tsx` — Card "Órdenes de
  Pago" con tabla y link al detalle de OP.

## Riesgos / Notas

- Concurrencia: dos OPs marcadas como `PAID` simultáneamente sobre la misma FC
  recalculan ambas con la misma fuente; el último update gana, pero ambos ven
  el mismo estado consistente porque la suma agrupa todo lo `PAID` actual.
- El envío de mail no está reintentado: si falla, queda registrado solo en log
  + toast warning. No bloquea la transición.
- `pdf_settings.signed_pdf_keys` puede contener `'payment-order'` para incluir
  firma — clave nueva que el equipo de configuración debería habilitar si se
  desea.
