# COD-570 — Orden de Pago: 4 cambios

Linear: https://linear.app/codecontrol-sas/issue/COD-570/orden-de-pago

## Alcance

1. Nueva columna `scheduled_payment_date` (DATE, nullable) en `payment_orders`.
2. Botón "Cargar saldo pendiente" en el form de OP a nivel OP (no por línea).
3. Editar OP en estado `DRAFT` reutilizando `NewPaymentOrderForm` con prop `initialData`.
4. Filtros en el listado de OPs: estado, proveedor, rango de fechas (sobre `payment_orders.date`).

## Migración

Path: `supabase/migrations/20260505112326_payment_orders_scheduled_date.sql`
Aditiva, idempotente: `ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS scheduled_payment_date DATE;`

## Decisiones tomadas

- **Botón "Cargar saldo pendiente"**: ubicado en el header de la card "Pagos". Visible solo si hay items con `invoice_id` cuyo `remaining > 0`. Al click: pisa el monto del primer pago con la suma de los `remaining`, vacía los demás, y muestra toast con el total. Es el atajo "queremos pagar todo el saldo seleccionado". Implementación de un solo botón, sin controles por línea.
- **Filtro de fecha**: aplicado sobre `payment_orders.date` (no sobre `scheduled_payment_date`) para mantener compatibilidad con OPs viejas y simplicidad.
- **Edit page**: reutiliza `NewPaymentOrderShell` con prop `initialData`. El shell ya carga suppliers/cajas/cuentas. La page server-component carga la OP por id; si no es `DRAFT` redirige al detalle con `?notEditable=1`.
- **Botón "Editar"**: agregado en `PaymentOrderActions` solo cuando `status === 'DRAFT'`.
- **Validators**: `scheduled_payment_date` opcional/nullable, regex `YYYY-MM-DD`.

## Archivos modificados

- `prisma/schema.prisma` — campo `scheduled_payment_date DateTime? @db.Date` en `payment_orders`.
- `supabase/migrations/20260505112326_payment_orders_scheduled_date.sql` — nuevo.
- `src/modules/treasury/shared/payment-order-validators.ts` — agrega `scheduled_payment_date` al schema.
- `src/modules/treasury/shared/validators.ts` — exporta `PAYMENT_ORDER_STATUSES`.
- `src/modules/treasury/features/payment-orders/actions.server.ts` — `updatePaymentOrder`, filtros en `getPaymentOrdersPaginated`, persistencia de `scheduled_payment_date`.
- `src/modules/treasury/features/payment-orders/components/NewPaymentOrderForm.tsx` — input fecha programada, botón "Cargar saldo pendiente", soporte `initialData` (modo edit), submit dual create/update.
- `src/modules/treasury/features/payment-orders/components/NewPaymentOrderShell.tsx` — acepta `initialData`.
- `src/modules/treasury/features/payment-orders/components/PaymentOrderActions.tsx` — botón "Editar" solo en DRAFT.
- `src/modules/treasury/features/payment-orders/components/PaymentOrdersList.tsx` — toolbar de filtros, columna pago programado.
- `src/modules/treasury/features/payment-orders/components/PaymentOrdersFilters.tsx` — nuevo, client component que persiste filtros en URL params.
- `src/app/dashboard/treasury/page.tsx` — passes filters from searchParams al list.
- `src/app/dashboard/treasury/payment-orders/[id]/edit/page.tsx` — nuevo.

## Verificación

- `npm run check-types`: OK sin errores.
- `npm run build`: Compiled successfully.
- Migración aplicada localmente: OK.

## Riesgos

- Cambio en firma de `getPaymentOrdersPaginated` (segundo parámetro opcional) — compatible hacia atrás.
- En modo edit el server action elimina y recrea items y payments. Riesgo: si la OP tuviera relaciones secundarias, se perderían. Hoy `payment_order_payments` tiene relación con `checks` (1:1) — pero solo se crean cheques desde OP confirmadas, no DRAFT, así que no hay cheques colgando de un payment de un DRAFT. OK.
- La migración de producción debe correrse antes del deploy.
