# Pago a cuenta a proveedores

**Fecha:** 2026-07-24
**Estado:** Diseño aprobado, pendiente de implementación

## Problema

Hoy no existe forma de registrar un pago a un proveedor que no esté imputado a un
comprobante. Si se paga de más, o se adelanta plata antes de recibir la factura,
ese dinero no queda como crédito aplicable a una factura futura: hay que forzar
imputaciones contra comprobantes que no corresponden.

Esto salió a la luz revisando la cuenta corriente del proveedor `194dd099`, donde
el "Total pagado" de las OPs ($620.918.282,63) no cerraba contra los ítems
imputados a facturas. La corrección de las notas de crédito (commit `f686505e`)
resolvió el cálculo de las NC, pero dejó expuesto que no hay mecanismo para el
excedente pagado.

Restricción relacionada, que **no** se cambia: una OP solo se puede editar en
estado borrador. Confirmada genera movimientos reales de caja/banco/cheques, y
pagada persiste estados de facturas. Editar la imputación después alteraría
asientos ya registrados. El pago a cuenta es la salida correcta a esa fricción,
no relajar la restricción.

## Decisiones tomadas

| Decisión | Elegido | Por qué |
|---|---|---|
| Origen del crédito | Ítem "a cuenta" dentro de una OP | Reusa numeración, retenciones y movimientos de tesorería que ya existen. Cero duplicación del circuito de pago. |
| Imputación | Manual explícita | Administración controla contra qué factura se aplica. Auditable y reversible. |
| Granularidad | Bolsa única por proveedor | Es cómo funciona una cuenta corriente contable. Sin trazabilidad punto a punto OP→factura. |
| Anular OP con crédito aplicado | Falla con mensaje claro | Sin cascada automática: revertir imputaciones a espaldas del usuario es peor que pedirle que las revierta. |

Aplicar crédito a una factura **no genera movimiento de tesorería**: la plata ya
salió cuando se pagó la OP. Es solo un asiento de imputación entre comprobantes.

## Modelo de datos

Ambas migraciones son **solo ADD** (columna nueva + tabla nueva). Sin riesgo para
los datos existentes.

### `payment_order_items` — columna nueva

```prisma
is_on_account Boolean @default(false)
```

Un ítem a cuenta va con `invoice_id = null`, `expense_id = null`,
`is_on_account = true` y su monto.

El flag es explícito en vez de inferirse de "ambos null" porque un bug que pierda
el `invoice_id` convertiría un ítem normal en un crédito fantasma.

### `supplier_credit_applications` — tabla nueva

| campo | tipo | nota |
|---|---|---|
| `id` | uuid PK | |
| `company_id` | uuid | scope multi-tenant |
| `supplier_id` | uuid | |
| `invoice_id` | uuid | factura destino |
| `amount` | Decimal(15,2) | monto imputado |
| `applied_at` | timestamptz | |
| `applied_by` | string | |
| `reversed_at` | timestamptz? | reversión soft |
| `reversed_by` | string? | |
| `notes` | text? | |

Índices: `[company_id, supplier_id]`, `[invoice_id]`.

### Saldo a favor: derivado, no persistido

```
saldo a favor = Σ ítems a cuenta de OPs PAGADAS − Σ aplicaciones activas
```

Una aplicación es activa si `reversed_at IS NULL`. Los ítems a cuenta de OPs en
borrador, confirmada o anulada no cuentan: el crédito recién existe cuando la OP
pasa a pagada, igual que los pagos a facturas.

### Cobertura de una factura

```
cobertura = pagos por OP + NC aplicadas + créditos aplicados
```

El tercer término es nuevo y aditivo: no altera el comportamiento ya andando.

## Flujo de trabajo

### Crear el pago a cuenta

En el form de la OP, el botón **"Pago a cuenta"** agrega un ítem sin comprobante,
solo con su monto. Requiere proveedor seleccionado — el crédito es por proveedor.

Para el detalle del concepto se usa el campo `notes` que la OP ya tiene; no se
agrega una columna de descripción por ítem.

**Hallazgo durante la implementación:** el form ya tenía un botón *"Ítem sin
factura"* (`addFreeItem`) que creaba ítems sin `invoice_id` ni `expense_id`. Eso
era, sin nombre ni consecuencia, un pago a cuenta — y explica el monto "sin
imputar" que apareció en la cuenta corriente del proveedor `194dd099`. En vez de
agregar una tercera opción se convirtió esa en el pago a cuenta explícito.

Los ítems libres **históricos** quedan con `is_on_account = false` y siguen
apareciendo como "Sin imputar — descuadre a revisar". No se migran a pago a
cuenta: asumir esa intención sobre datos viejos sería inventar crédito que nadie
registró. Si administración confirma que alguno era efectivamente un anticipo, se
marca a mano.

El resto del circuito no cambia: retenciones, pagos, y los movimientos de
caja/banco/cheque que ya se generan al confirmar y pagar.

### Aplicar el crédito

Desde la cuenta corriente del proveedor. Cuando hay saldo a favor > 0 aparece el
stat **"Crédito a favor"** con un botón **"Aplicar crédito"**.

El diálogo lista las facturas del proveedor con saldo pendiente. Se elige factura
y monto, con default `min(saldo a favor, saldo de la factura)`. Se puede aplicar a
varias facturas hasta agotar el crédito.

Al confirmar: se crea el registro, se recalcula el estado de la factura, baja su
saldo, y la bolsa se reduce.

### Revertir

Historial de aplicaciones en la cuenta corriente, con opción **"Revertir"**: marca
`reversed_at`, devuelve el monto a la bolsa y recalcula el estado de la factura.

## Motor de cálculo

Extensión del núcleo compartido creado en el commit `f686505e`.

### `src/shared/lib/purchase-invoice-balance.ts` (puro, sin Prisma)

- `computePurchaseOutstanding` y `derivePurchaseInvoiceStatus` suman un tercer
  término `creditApplied` a la cobertura.
- Nueva `computeSupplierCreditBalance(onAccountPaid, applicationsActive)` para la
  bolsa.

### `src/shared/lib/purchase-invoice-status.ts` (acceso a DB)

- Nueva `getAppliedCreditByInvoice(invoiceIds, client)`, hermana de
  `getCreditNoteAmountsByInvoice`.
- `recalcPurchaseInvoiceStatus` incluye el crédito aplicado.

### Server actions — `src/modules/suppliers/features/credit/actions.server.ts`

- `getSupplierCreditBalance(supplierId)` → saldo a favor + historial.
- `getInvoicesForCreditApplication(supplierId)` → facturas con saldo imputable.
- `applySupplierCredit({ supplierId, invoiceId, amount })` → valida y crea en
  transacción, recalcula la factura.
- `reverseSupplierCreditApplication(id)` → revierte y recalcula.

Viven en `suppliers` y no en `treasury` porque la UI que las consume es la cuenta
corriente del proveedor, y los módulos no pueden importarse entre sí.

## Invariantes

Se validan en el servidor. La UI no es fuente de verdad.

1. No se puede aplicar más que el saldo a favor disponible. La relectura del saldo
   ocurre **dentro de la transacción**, para que dos aplicaciones concurrentes no
   puedan gastar el mismo crédito dos veces.
2. No se puede aplicar más que el saldo pendiente de la factura destino.
3. La factura destino debe pertenecer al mismo proveedor y no ser NC, ni estar
   anulada, ni en borrador.
4. No se puede anular una OP cuyo crédito ya fue imputado.

   **Ya está garantizado por construcción, sin código nuevo:** el saldo a favor
   solo nace de OPs en estado pagado, y `cancelPaymentOrder` ya rechaza anular
   una OP pagada. No existe transición que devuelva una OP de pagada a otro
   estado. Se documentó con un comentario en `cancelPaymentOrder` en vez de
   agregar una validación inalcanzable.
5. Revertir una aplicación ya revertida es un no-op explícito, no un error que
   duplique el crédito.

## Testing

### Unitarios (puros, extienden `purchase-invoice-balance.test.ts`)

- Cobertura combinando las tres fuentes (pagos + NC + crédito) hasta `PAID`.
- Bolsa: ítems a cuenta pagados menos aplicaciones activas; las revertidas vuelven
  a sumar al disponible.
- Ítems a cuenta de OPs en borrador / confirmada / anulada no cuentan.
- Aplicación que agota exactamente el saldo, y la que deja remanente.

### Invariantes, contra la base local

- Exceder el saldo a favor.
- Exceder el saldo de la factura destino.
- Factura de otro proveedor.
- Anular una OP con crédito ya aplicado.

## Fuera de alcance

Deliberado, para mantener el cambio acotado:

- Aplicar crédito desde el detalle de la factura (solo desde cuenta corriente).
- Aplicar crédito a **gastos** (solo facturas).
- Anticipos como documento propio con numeración separada.
- Reflejo del saldo a favor en reportes contables o exportaciones.

## Antecedente

El commit `f686505e` corrigió el cálculo de notas de crédito en la cuenta
corriente de proveedores y creó el núcleo compartido
(`purchase-invoice-balance.ts` / `purchase-invoice-status.ts`) que esta feature
extiende. El script `scripts/backfill-purchase-invoice-status.ts` de ese commit
sigue siendo válido: no necesita cambios para esta feature.
