# COD-572 — Anular OP confirmada con reverso de movimientos

Linear: https://linear.app/codecontrol-sas/issue/COD-572/op-confirmada

## Problema

`cancelPaymentOrder` solo cambiaba `status → CANCELLED` sin revertir los movimientos de tesorería que `confirmPaymentOrder` había generado. Anular una OP confirmada dejaba balances de banco/caja desfasados.

## Solución

### 1. Migración aditiva
`supabase/migrations/20260505123008_add_payment_order_id_to_cash_movements.sql`

Agrega `cash_movements.payment_order_id uuid NULL` con FK a `payment_orders(id) ON DELETE SET NULL` e índice. Permite localizar e identificar los movimientos a revertir (a la par de `bank_movements.payment_order_id` que ya existía).

Reflejado en `prisma/schema.prisma`:
- `cash_movements`: campo + relación `payment_order` + `@@index([payment_order_id])`.
- `payment_orders`: relación inversa `cash_movements cash_movements[]`.

### 2. `confirmPaymentOrder`
Pasa `payment_order_id: order.id` al crear el `cash_movement` tipo `EXPENSE`.

### 3. `cancelPaymentOrder` reescrita
- Bloquea OP en estado `PAID`.
- Si la OP estaba `CONFIRMED`, dentro de una transacción genera asientos de **reverso** (no borra los originales, preserva audit trail):
  - `bank_movements`: `TRANSFER_OUT` → `TRANSFER_IN`, `DEBIT` → `DEPOSIT`. Repone el balance de la cuenta bancaria.
  - `cash_movements`: `EXPENSE` → `INCOME` en la sesión `OPEN` actual de la caja. Si no hay sesión abierta, falla con mensaje claro pidiendo abrir la caja.
- Descripción/referencia: `Anulación OP <full_number>` y `REV-<reference>`.

### 4. UI
`PaymentOrderActions.tsx`: botón "Anular" ahora abre `AlertDialog` con descripción que avisa del reverso. Confirmar ejecuta el server action.

## Enum `bank_movement_type`
Valores reales: `DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, CHECK, DEBIT, FEE, INTEREST`. No existe `CREDIT`, así que el reverso de un `DEBIT` se realiza con `DEPOSIT` (entrada de fondos genérica, semánticamente equivalente).

## Verificación
- `npm run check-types`: OK.
- `npm run build`: OK.

## Riesgos
- Si la sesión de caja se cerró tras confirmar, anular requiere abrir una nueva sesión (esperado y comunicado en el error).
- El reverso recalcula el balance bancario a partir del valor actual; si hubo movimientos manuales intermedios, igual queda consistente porque suma el monto original.
