# TKT-586 — Notas de crédito: imputación explícita y uso en Órdenes de Pago

**Ticket:** TKT-586 "Modificación en OP y NC" (cc-tickets #586)
**Rama:** `feature/tkt-586-notas-credito-op` (desde `main`)
**Estado:** Spec aprobado, pendiente de implementación
**Fecha:** 2026-08-18

---

## 1. Problema

El cliente describe este circuito real:

1. El proveedor factura FC-1 por $200.000.
2. Se carga la factura, se hace la OP, se paga y se le manda la OP con el comprobante de transferencia.
3. El producto vino mal. El proveedor emite una **NC por $200.000** que anula FC-1 y **refactura FC-2 por $400.000**.
4. La plata de FC-1 **ya salió**: lo que resta es hacer **una nueva OP que cargue FC-2 y la NC**, de modo que la OP tome el crédito y solo se transfiera la diferencia ($200.000).

Y agrega un segundo requerimiento: **una NC debe poder aplicarse a varias facturas**, no solo a una.

### Por qué hoy no se puede

| Punto | Situación actual | Archivo |
|---|---|---|
| Una NC apunta a **una sola** factura, obligatoriamente | `purchase_invoices.original_invoice_id` + validación `superRefine` "Seleccioná la factura que corrige esta nota de crédito" | `prisma/schema.prisma:2190`, `src/modules/purchasing/shared/validators.ts:78` |
| La NC **se autoimputa** a esa factura, sin decisión del usuario | `getCreditNoteAmountsByInvoice` agrupa por `original_invoice_id` y `derivePurchaseInvoiceStatus` la cuenta como cobertura | `src/shared/lib/purchase-invoice-status.ts:28` |
| Las NC están **excluidas de la OP** | `voucher_type: { notIn: CREDIT_NOTE_VOUCHER_TYPES }` — "las notas de crédito no se imputan a una OP" | `src/modules/treasury/features/payment-orders/actions.server.ts:353` |
| El excedente de una NC es **solo visual** | `buildSupplierAccountRows` lo expone como `unappliedCredit`, pero no es imputable ni cargable en ningún lado | `src/shared/lib/purchase-invoice-balance.ts` |
| La bolsa de crédito **no se alimenta de NC** | `supplier_credit_applications` se nutre solo de ítems `is_on_account` de OPs `PAID` | `src/modules/suppliers/features/credit/actions.server.ts` |
| Una OP `PAID` **no se puede anular** | Estado terminal por diseño (COD-572) | `cancelPaymentOrder` |

**Resultado en el caso del cliente:** FC-1 está 100% pagada, así que la NC no descuenta nada (no queda saldo que descontar), queda como crédito inerte, y la OP vieja no se puede anular. La plata queda trabada.

### El matiz contable que hay que respetar

El crédito realmente disponible de una NC **no es su total**: es lo que exceda del saldo que le quedaba a la factura que corrige.

- Si FC-1 estaba impaga, la NC solo la cancela → no hay crédito para llevar a otra OP.
- Si FC-1 estaba pagada, la NC vale como crédito real porque **la plata ya salió**.

El modelo de imputación explícita reproduce esto de forma natural: lo que no se imputa a una factura, queda disponible.

---

## 2. Decisiones tomadas

| # | Decisión | Elegido | Por qué |
|---|---|---|---|
| 1 | Autoimputación vs. imputación explícita | **Imputación explícita** (tabla de aplicaciones NC → facturas, N:M) | Conviven las dos sería doble conteo. La imputación explícita es la única forma de que una NC llegue a varias facturas y de que el remanente sea usable. |
| 2 | Bolsa de crédito NC vs. bolsa de pago a cuenta | **Separadas** | Trazabilidad NC → factura. Origen y semántica distintos: la NC es un comprobante fiscal, el pago a cuenta es plata sin comprobante. |
| 3 | Cómo entra la NC en la OP | **Bloque de créditos aparte**, no ítem negativo | Un ítem negativo rompe totales, base de retenciones y PDF. El bloque deja `total_amount` como "lo facturado" y suma un `credits_total` que baja el neto. |
| 4 | NC parcialmente aplicada a varias facturas con remanente | **Sí** | Es exactamente lo que pide el cliente. |

### Decisiones derivadas (mías, revisables)

| # | Decisión | Justificación |
|---|---|---|
| 5 | `original_invoice_id` pasa a **opcional** y queda como referencia informativa ("NC que corrige a FC-X") | La imputación real vive en la tabla nueva. Se conserva el campo porque es dato del comprobante y porque la migración lo necesita para el backfill. Si el usuario no elige factura, el formulario lo avisa explícitamente (ver decisión 10). |
| 6 | El crédito NC se **reserva desde que la OP está en DRAFT** y se libera al anularla | Mismo criterio que los cheques (`selected_in_payments` con OP no anulada). Evita gastar el mismo crédito en dos OPs en borrador. |
| 7 | Las retenciones se siguen calculando sobre `items_total`, **no** neteadas de crédito | La retención se practica sobre el comprobante facturado, no sobre lo que se termina transfiriendo. |
| 8 | Una OP puede quedar **sin pagos** si el crédito cubre todo el neto | Es el caso "la NC cubre la refacturación entera". Requiere relajar `payments.min(1)` y saltear los movimientos de tesorería cuando el neto es 0. |
| 9 | Aplicar una NC **no genera movimiento de tesorería** | Igual que el pago a cuenta: es un asiento de imputación entre comprobantes. |
| 10 | NC sin factura asociada: el formulario muestra una **nota visible** al lado del selector | Que quede sin factura es válido, pero no puede pasar por descuido. Texto: *"Esta nota de crédito no queda asociada a ninguna factura. Su importe queda disponible como crédito para imputar más adelante."* |
| 11 | Al **confirmar** una NC con factura de referencia, se **ofrece** imputarla ahí; el usuario puede decir que no y hacerlo después desde la cuenta corriente | El caso frecuente (NC que corrige una factura concreta) se resuelve en un click, sin volver a la autoimputación silenciosa que este ticket elimina. La decisión sigue siendo del usuario. |
| 12 | Cuenta corriente: **una sola vista de crédito** con columna **Origen** (Pago a cuenta / Nota de crédito) | Los datos siguen en dos tablas separadas (decisión 2), pero para administración es una sola bolsa de plata a favor: partirla en dos paneles obliga a sumar de cabeza. |

---

## 3. Modelo de datos

### Tabla nueva: `credit_note_applications`

Una fila = un tramo de crédito de una NC consumido en algún lado.

```prisma
model credit_note_applications {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  company_id       String    @db.Uuid
  supplier_id      String    @db.Uuid
  credit_note_id   String    @db.Uuid
  /// Imputación directa a una factura (desde la cuenta corriente).
  invoice_id       String?   @db.Uuid
  /// Uso del crédito dentro de una OP (bloque de créditos).
  payment_order_id String?   @db.Uuid
  /// Importe en la moneda de la NC.
  amount           Decimal   @db.Decimal(15, 2)
  applied_at       DateTime  @default(now()) @db.Timestamptz
  applied_by       String
  reversed_at      DateTime? @db.Timestamptz
  reversed_by      String?
  notes            String?
  created_at       DateTime  @default(now()) @db.Timestamptz

  company       company           @relation(fields: [company_id], references: [id], onDelete: Cascade)
  supplier      suppliers         @relation(fields: [supplier_id], references: [id])
  credit_note   purchase_invoices @relation("credit_note_applications_note", fields: [credit_note_id], references: [id])
  invoice       purchase_invoices? @relation("credit_note_applications_invoice", fields: [invoice_id], references: [id])
  payment_order payment_orders?   @relation(fields: [payment_order_id], references: [id], onDelete: Cascade)

  @@index([company_id, supplier_id])
  @@index([credit_note_id])
  @@index([invoice_id])
  @@index([payment_order_id])
}
```

**Constraints SQL:**

- `CHECK (amount > 0)` — una imputación de cero o negativa rompe la aritmética de la bolsa.
- `CHECK ((invoice_id IS NOT NULL) <> (payment_order_id IS NOT NULL))` — exactamente un destino: o factura, o OP. Nunca los dos ni ninguno.

**Invariantes de dominio (validadas en el server action, no en SQL):**

- `credit_note.voucher_type` ∈ `CREDIT_NOTE_VOUCHER_TYPES` y `status` ∈ `ACTIVE_CREDIT_NOTE_STATUSES`.
- `invoice.voucher_type` ∉ `CREDIT_NOTE_VOUCHER_TYPES` (no se imputa crédito a una NC).
- NC, factura destino y OP pertenecen al **mismo proveedor y a la misma empresa**.
- Σ aplicaciones activas de una NC ≤ `credit_note.total`.
- Σ aplicaciones a una factura ≤ saldo pendiente de esa factura.

### Cambio en `purchase_invoices`

- `original_invoice_id` sigue existiendo. Deja de ser obligatorio a nivel validador (decisión 5). **Sin cambio de esquema** — ya es nullable.

### Cambio en `payment_orders`

```prisma
/// Total de créditos de NC aplicados en esta OP, en la moneda de la orden (TKT-586).
credits_total Decimal @default(0) @db.Decimal(15, 2)
credit_applications credit_note_applications[]
```

`net_to_pay` pasa a ser `total_amount - retentions_total - credits_total`.

### Migración — solo ADD, con backfill

Archivo: `supabase/migrations/<timestamp>_credit_note_applications.sql`

1. `CREATE TABLE credit_note_applications` + constraints + índices.
2. `ALTER TABLE payment_orders ADD COLUMN credits_total numeric(15,2) NOT NULL DEFAULT 0;`
3. **Backfill**: por cada NC activa con `original_invoice_id`, insertar una aplicación contra esa factura por
   `min(total_NC_remanente, saldo_pendiente_de_la_original)`, en orden cronológico de `issue_date` (greedy, la NC más vieja consume primero) — replicando exactamente lo que hoy hace `allocateCreditNotes`.
   - Saldo pendiente de la original = `total − Σ payment_order_items.amount de OPs no anuladas`.
   - `applied_by = 'system:tkt-586'`, `notes = 'Backfill imputación automática TKT-586'`.
   - Efecto buscado: **ningún saldo ni estado de factura cambia** al aplicar la migración, y el excedente que hoy es inerte queda disponible como crédito imputable.

> **Verificación obligatoria post-backfill:** comparar `derivePurchaseInvoiceStatus` antes/después sobre todas las facturas con NC asociada. Si algún estado cambia, el backfill está mal.

---

## 4. Cambios en el núcleo de dominio

### `src/shared/lib/purchase-invoice-status.ts`

`getCreditNoteAmountsByInvoice` es el **punto único de verdad** del crédito de NC por factura y ya lo consumen recalc de estados, saldos pendientes, OPs y la bolsa de proveedores. Cambiar su implementación propaga a todos:

```ts
// ANTES: groupBy purchase_invoices por original_invoice_id
// DESPUÉS: groupBy credit_note_applications por invoice_id, reversed_at = null
```

Firma y semántica se mantienen → **cero cambios** en sus 5 consumidores:
`recalcPurchaseInvoiceStatus`, `recalcPurchaseInvoiceStatusMany`, `pending-balances/actions.server.ts:91`, `payment-orders/actions.server.ts:380`, `suppliers/credit/actions.server.ts:162,260`.

### `src/shared/lib/purchase-invoice-balance.ts`

- `allocateCreditNotes` **se elimina**: el reparto greedy en memoria lo reemplazan las aplicaciones reales.
- `buildSupplierAccountRows` pasa a recibir un `creditAppliedByNote: Map<string, number>` y un `creditAppliedByInvoice: Map<string, number>` calculados desde la tabla, en vez de derivarlos. Se simplifica: desaparece todo el bloque de agrupación por `original_invoice_id`.
- Se agrega `computeCreditNoteAvailable({ total, applied })` — espejo de `computeSupplierCreditBalance`.
- Los tests de `purchase-invoice-balance.test.ts` se ajustan a las firmas nuevas.

### Módulo nuevo: `src/modules/suppliers/features/credit-notes/actions.server.ts`

Espejo funcional de `features/credit`, pero para NC:

| Función | Qué hace |
|---|---|
| `getSupplierCreditNotes(supplierId)` | NC activas del proveedor con total, aplicado y disponible. |
| `getInvoicesForCreditNoteApplication(supplierId, creditNoteId)` | Facturas con saldo > 0 elegibles para recibir el crédito. |
| `applyCreditNote({ creditNoteId, invoiceId, amount, notes })` | Imputa. Relee disponibilidad **dentro de la transacción** (mismo patrón que `applySupplierCredit`) y llama a `recalcPurchaseInvoiceStatus`. |
| `applyCreditNoteToMany({ creditNoteId, allocations: [{invoiceId, amount}] })` | Imputación múltiple en una sola transacción. |
| `reverseCreditNoteApplication(applicationId)` | Revierte (no-op si ya estaba revertida). Recalcula el estado de la factura afectada. |
| `getAvailableCreditNotesForPaymentOrder(supplierId, currentOrderId?)` | NC con disponible > 0 para el bloque de créditos de la OP; excluye las reservas de la propia OP en edición. |
| `getCreditNoteApplicationSuggestion(creditNoteId)` | Para el diálogo post-confirmación (decisión 11): devuelve la factura de referencia y el importe sugerido = `min(disponible NC, saldo de la factura)`. |

---

## 5. Cambios en Órdenes de Pago

### Validador — `src/modules/treasury/shared/payment-order-validators.ts`

```ts
paymentOrderCreditSchema = z.object({
  credit_note_id: z.string().uuid(),
  amount: z.string(),           // en la moneda de la NC
  currency: z.enum(SUPPORTED_CURRENCIES).optional().default('ARS'),
  exchange_rate: z.coerce.number().positive().optional().default(1),
})
```

En `paymentOrderSchema`:

- `credits: z.array(paymentOrderCreditSchema).optional().default([])`.
- **Cuadre nuevo:** `itemsTotal − retentionsTotal − creditsTotal === paymentsTotal` (hoy: `itemsTotal − retentionsTotal === paymentsTotal`). Todo convertido a la moneda de la orden con `convertAmount`/`effectiveRate`, igual que los ítems.
- `payments.min(1)` → se relaja: se exige al menos un pago **solo si el neto a pagar es > 0** (decisión 8).
- `superRefine`: un crédito requiere `supplier_id` (mismo motivo que el pago a cuenta).
- `superRefine`: conversión de moneda de cada crédito, mismo control que los ítems (`effectiveRate <= 1` con monedas distintas ⇒ error).

### `actions.server.ts`

| Función | Cambio |
|---|---|
| `createPaymentOrder` | Convierte créditos a la moneda de la orden, calcula `creditsTotal`, persiste `credits_total`, crea las `credit_note_applications` con `payment_order_id`. `netToPay = total − retenciones − créditos`. Valida disponibilidad de cada NC **dentro de la transacción**. |
| `updatePaymentOrder` | Borra y recrea las aplicaciones de la OP (solo posible en `DRAFT`, restricción existente). |
| `confirmPaymentOrder` | Si `net_to_pay === 0`, **no** genera movimientos de banco/caja (no hay plata que mover) y no exige sesión de caja abierta. |
| `markPaymentOrderAsPaid` | Sin cambios de fondo: los ítems ya cubren las facturas por su importe completo. Las aplicaciones quedan firmes. |
| `cancelPaymentOrder` | Además del reverso de movimientos, **revierte las aplicaciones de NC de esa OP** (`reversed_at`) y recalcula el estado de las facturas afectadas. |
| `getPendingPurchaseInvoices` | Sin cambios (sigue excluyendo NC de los ítems; su `remaining` ya sale de `getCreditNoteAmountsByInvoice`, que ahora lee aplicaciones reales). |
| `getPaymentOrderById` | Incluye `credit_applications` con datos de la NC para el detalle y el PDF. |

### UI — `NewPaymentOrderForm.tsx`

Card nuevo **"Créditos aplicados (N)"**, entre "Facturas/Gastos" y "Pagos":

- Botón "Agregar nota de crédito" → selector de NC del proveedor con disponible > 0, y campo de importe (tope = `min(disponible, neto pendiente de la OP)`).
- Fila por crédito: número de NC, fecha, total, disponible, importe aplicado, botón quitar.
- Totales del pie: `Total ítems − Retenciones − Créditos = Neto a pagar`, y el `diff` contra `paymentsTotal` se calcula contra ese neto.
- El botón "Cargar saldo pendiente" del bloque de Pagos usa el neto **ya descontado el crédito**.
- Si el neto queda en 0, el bloque de Pagos se puede dejar vacío y el form no lo marca como error.

### Detalle, PDF y mail

- `PaymentOrderDetail.tsx`: sección de créditos aplicados + línea de total.
- `pdf/types.ts`: `PaymentOrderPDFCredit { fullNumber, issueDate, total, appliedAmount }` y `creditsTotal` en `PaymentOrderPDFData`.
- `pdf/mappers.ts` + `PaymentOrderTemplate.tsx`: tabla de créditos y el neto desglosado. **Importante para el cliente**: la OP que recibe el proveedor tiene que mostrar explícitamente que se le descontó la NC.
- `sendPaymentOrderPaidEmail`: sin cambios de lógica, hereda el PDF nuevo.

---

## 6. Cambios en cuenta corriente y facturas

- `AccountStatementTab` / `CreditSection`: **una sola vista de crédito** (decisión 12). Los datos vienen de dos tablas, pero la UI los une:
  - **Disponible total** = saldo a favor por pagos a cuenta + crédito de NC sin imputar, con el desglose de cada origen debajo.
  - Tabla de imputaciones con columna **Origen**: `Pago a cuenta` / `NC 0001-00000123`. La acción de revertir despacha al action que corresponda según el origen de la fila.
  - Botón "Imputar crédito" → el usuario elige de qué origen toma la plata y contra qué factura(s).
- Nueva UI de imputación de NC: elegir NC → elegir una o varias facturas con importe por cada una → aplicar (usa `applyCreditNoteToMany`).
- Diálogo post-confirmación de NC (decisión 11): al confirmar una NC con `original_invoice_id`, se ofrece imputarla a esa factura por el importe sugerido, con botón "Ahora no". Si la factura no tiene saldo, el diálogo lo dice y no ofrece nada.
- Nota en `PurchaseInvoiceForm` cuando el tipo es NC y no hay factura seleccionada (decisión 10).
- `InvoicesSection` / detalle de factura: mostrar qué NC la cubren y por qué importe (hoy la relación es implícita).
- Bloquear la anulación de una NC que tenga aplicaciones activas, con mensaje claro (mismo criterio que el pago a cuenta: sin cascada automática).

---

## 7. Casos borde a cubrir

| Caso | Comportamiento esperado |
|---|---|
| NC en `DRAFT` o `CANCELLED` | No aporta crédito, no aparece en selectores. |
| NC de otro proveedor | Rechazada con error explícito. |
| Imputar crédito a otra NC | Rechazado. |
| Dos OPs en borrador tomando la misma NC | La segunda ve el disponible ya reservado por la primera. Validación releída dentro de la transacción. |
| Crédito ≥ neto de la OP | OP sin pagos, `net_to_pay = 0`, `confirmPaymentOrder` no genera movimientos. |
| NC en USD y OP en ARS | Se convierte con `convertAmount`/`effectiveRate`, igual que los ítems. `amount` se guarda en la moneda de la NC. |
| Anular OP `CONFIRMED` con créditos | Reversa movimientos **y** aplicaciones; las facturas recuperan saldo. |
| Anular OP `PAID` | Sigue bloqueado (COD-572). El camino correcto es NC + nueva OP — exactamente el circuito de este ticket. |
| Redondeo | Todo a 2 decimales con `BALANCE_EPS = 0.01`, criterio ya vigente. |

---

## 8. Escenario del cliente, de punta a punta (test de aceptación)

1. FC-1 $200.000 → OP-1 con ítem FC-1 $200.000 → confirmada y pagada por transferencia. FC-1 queda `PAID`.
2. Se carga **NC-1 $200.000** referenciando FC-1. Como FC-1 no debe nada, **no se le imputa**: NC-1 queda con **$200.000 disponibles**.
3. Se carga **FC-2 $400.000**, `CONFIRMED`, saldo $400.000.
4. Se crea **OP-2**: ítem FC-2 $400.000 + crédito NC-1 $200.000 → `total_amount = 400.000`, `credits_total = 200.000`, `net_to_pay = 200.000`. Un pago por transferencia de $200.000.
5. Confirmar y pagar OP-2: sale $200.000 de banco, FC-2 queda `PAID`, NC-1 queda con disponible $0.
6. Cuenta corriente del proveedor: deuda total 0, crédito sin aplicar 0, y cada comprobante con su saldo real.

Y el segundo requerimiento: **NC-1 imputada a FC-2 $120.000 y a FC-3 $80.000** desde la cuenta corriente, dejando ambas facturas con su saldo reducido y la NC en disponible $0.

---

## 9. Plan de fases

| Fase | Contenido | Verificación |
|---|---|---|
| **F1** | Migración SQL (tabla + `credits_total` + backfill) y `schema.prisma`. | Migración aplicada en local; comparación de estados de factura antes/después = idénticos. |
| **F2** | Núcleo: `getCreditNoteAmountsByInvoice` sobre la tabla nueva, `buildSupplierAccountRows` refactorizado, `computeCreditNoteAvailable`, tests unitarios. | `npm run test` sobre `purchase-invoice-balance.test.ts` + tests nuevos. |
| **F3** | `features/credit-notes/actions.server.ts` (imputación NC → 1..N facturas, reversa). | Test manual: imputar una NC a dos facturas y revertir una. |
| **F4** | OP: validador, `create`/`update`/`confirm`/`cancel`, bloque de créditos en el form, totales. | Escenario del cliente completo end-to-end. |
| **F5** | PDF, detalle de OP, cuenta corriente unificada, diálogo post-confirmación de NC, nota en el form, detalle de factura. | Revisión visual del PDF y de la cuenta corriente. |
| **F6** | `npm run check-types`, `npm run build`, repaso de casos borde. | Ambos en verde. |

Commits por fase (supera holgado los umbrales de CLAUDE.md). Sin push hasta que lo indiques.

---

## 10. Riesgos

- **El backfill es la parte delicada.** Es solo INSERT sobre una tabla nueva (no toca datos existentes), pero si el reparto no replica el greedy actual, cambian saldos y estados de facturas ya cerradas. Por eso la verificación de estados antes/después es obligatoria antes de pasar a F2.
- **`getCreditNoteAmountsByInvoice` tiene 5 consumidores.** Mantener firma y semántica es lo que hace barato el cambio; cualquier desvío ahí se propaga a saldos pendientes, OPs y bolsa de proveedores.
- **Relajar `payments.min(1)`** abre la puerta a OPs sin pagos por error. Se acota exigiendo pagos siempre que `net_to_pay > 0`.
- **Reserva del crédito en DRAFT**: una OP en borrador olvidada retiene crédito. Mitigación: la columna "disponible" muestra el detalle de qué OP lo tiene reservado.

---

## 11. Preguntas abiertas

Ninguna: las tres decisiones pendientes se cerraron el 2026-08-18 y quedaron incorporadas como decisiones 10, 11 y 12.
