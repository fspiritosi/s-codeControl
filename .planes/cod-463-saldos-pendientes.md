# COD-463 — Saldos Pendientes

## Resumen

Vista plana de facturas de compra con saldo pendiente, en `/dashboard/treasury/pending-balances`. Permite seleccionar items del mismo proveedor y crear una OP precargada con esas líneas.

## Archivos

- `src/modules/treasury/features/pending-balances/actions.server.ts`
  - `listPendingInvoices({ supplier_id, op_status, search, page, pageSize })`
  - `getSuppliersWithPendingInvoices()`
- `src/modules/treasury/features/pending-balances/components/PendingBalancesView.tsx`
- `src/modules/treasury/features/pending-balances/index.ts`
- `src/app/dashboard/treasury/pending-balances/page.tsx`
- Modificado `src/modules/treasury/features/payment-orders/components/NewPaymentOrderForm.tsx`: lee `sessionStorage.pending-balances-draft` en mount, precarga supplier + items + monto en pago #1, limpia el draft.
- Modificado `src/app/dashboard/treasury/page.tsx`: botón de acceso "Saldos Pendientes".

## Cálculos

- `paid_amount` = suma de `payment_order_items.amount` cuya OP esté `PAID`.
- `pending_amount` = `invoice.total - paid_amount`.
- `op_status`:
  - `SCHEDULED` si existe alguna OP en `DRAFT`/`CONFIRMED` con item apuntando a la factura. Se devuelve la más reciente (`created_at`).
  - `NONE` en caso contrario.
- Solo se incluyen facturas con `status IN ('CONFIRMED','PARTIAL_PAID')` y `pending_amount > 0`.

## Flujo Crear OP

1. Validar único proveedor + montos válidos (`0 < x <= pending`).
2. `sessionStorage['pending-balances-draft'] = { supplierId, items: [{ invoiceId, amount }] }`.
3. Navegar a `/dashboard/treasury/payment-orders/new`.
4. `NewPaymentOrderForm` lee el draft (no en modo edit), setea supplier, espera la carga de pendingInvoices y aplica items + monto. Luego limpia sessionStorage.

## Riesgos

- Cálculo en memoria de `paid_amount` recorre todas las facturas activas del company antes de paginar. Si crece mucho la base, conviene mover a SQL crudo / agregación. Por ahora es aceptable porque el filtro `status IN ('CONFIRMED','PARTIAL_PAID')` ya recorta bastante.
- N+1 evitado: una sola query con `payment_order_items.payment_order` incluido.
