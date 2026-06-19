# Circuito OC + FAC + Gastos + Adjuntos (tsk-302 / tsk-303)

**Fecha:** 2026-06-19
**Estado:** Diseño aprobado — pendiente de planificación
**Tareas:** tsk-302 (Circuito OC + FAC + OP), tsk-303 (Gastos a OC)

## Problema

1. **tsk-302** — Hoy una factura de compra (FAC) solo se vincula a una orden de compra (OC)
   al momento de crearla. Se necesita poder **imputar facturas ya generadas** a una OC creada
   posteriormente. Además, poder **cargar documentos adjuntos** en la OC.
2. **tsk-303** — Los gastos (expenses) no tienen ninguna relación con las OC. Se necesita poder
   **asociar gastos a órdenes de compra**.

## Decisiones de alcance (acordadas)

- **OP→OC descartado.** Una orden de pago (OP) no se vincula directo a una OC: paga facturas vía
  `payment_order_items.invoice_id`. Si la factura está imputada a una OC, la OP queda trazada a la
  OC automáticamente. No se agrega relación directa OP↔OC.
- **Diseño integral** que cubre: imputar FAC a OC, imputar gastos a OC, y adjuntos múltiples en OC.
- **Adjuntos:** varios documentos por OC (tabla nueva).
- **Reglas de imputación:** solo FAC/gastos del mismo proveedor de la OC. Si el total imputado
  supera el total de la OC, se **avisa pero no se bloquea**.
- **Mecánica:** la imputación se hace **desde el detalle de la OC**.

## Estado actual relevante (referencias)

- `purchase_invoices.purchase_order_id String? @db.Uuid` — ya existe (nullable). FAC→OC no requiere
  cambio de schema. (`prisma/schema.prisma:1960`)
- `expenses` no tiene FK a OC. Adjuntos de gastos en tabla `expense_attachments`
  (`prisma/schema.prisma:2608`).
- OC tiene campo `invoicing_status` (`purchase_order_invoicing_status`) que debe recalcularse al
  imputar/desimputar facturas.
- Adjuntos de facturas: patrón de subida en 2 fases (`prepare*` / `confirm*`), bucket Supabase
  `purchase_invoices`, validación MIME/tamaño en `purchasing/shared/validators.ts` (MIME:
  jpeg/png/pdf, máx 10MB). UI: `InvoiceAttachmentSection.tsx`.
- Detalle de OC: `purchase-orders/detail/components/PurchaseOrderDetail.tsx`. Ya tiene sección
  "Facturas vinculadas".

## Modelo de datos (migración solo-ADD)

1. **Gastos→OC:** `expenses.purchase_order_id String? @db.Uuid` + relación a `purchase_orders`
   (nullable). Inversa en `purchase_orders`: `expenses expenses[]`.
2. **Adjuntos OC:** tabla nueva `purchase_order_attachments`, espejo de `expense_attachments`:
   - `id`, `purchase_order_id` (FK → purchase_orders, onDelete cascade), `file_name`, `file_key`,
     `file_size Int?`, `mime_type String?`, `created_at`.
   - Inversa en `purchase_orders`: `purchase_order_attachments purchase_order_attachments[]`.
3. FAC→OC: sin cambios de schema.

> Migración con `npm run create-migration`, aplicada localmente primero. Push a producción manual
> cuando el usuario lo indique. Nunca db reset ni operaciones destructivas.

## Acciones server (`purchase-orders/.../actions.server.ts`)

- `getImputableInvoices(orderId)`: facturas del mismo proveedor de la OC **que no tengan OC
  asignada** (`purchase_order_id IS NULL`). Una factura ya imputada a otra OC no aparece; para
  moverla hay que desimputarla primero. Las notas de crédito (con `original_invoice_id`) se
  excluyen del selector: siguen el vínculo de su factura original.
- `getImputableExpenses(orderId)`: gastos del mismo proveedor (gasto sin proveedor: permitido).
- `imputeInvoicesToOrder(orderId, invoiceIds[])`: valida proveedor; setea `purchase_order_id`;
  recalcula `invoicing_status`; devuelve el excedente si el total imputado supera el total de la OC
  (para aviso, no bloquea).
- `imputeExpensesToOrder(orderId, expenseIds[])`: análogo para gastos.
- `removeInvoiceFromOrder(orderId, invoiceId)` / `removeExpenseFromOrder(orderId, expenseId)`:
  desimputar (FK → null) + recalcular estado.
- Adjuntos OC (patrón 2 fases, bucket `purchase_orders`):
  `preparePurchaseOrderAttachmentUpload`, `confirmPurchaseOrderAttachmentUpload`,
  `deletePurchaseOrderAttachment`, `listPurchaseOrderAttachments`.

## UI — detalle de la OC (`PurchaseOrderDetail.tsx`)

- **Facturas vinculadas** (sección existente): botón "Imputar factura existente" → diálogo con
  selector de facturas imputables; acción de quitar por fila; badge/aviso de excedente.
- **Gastos vinculados** (sección nueva): tabla + botón "Imputar gasto"; quitar por fila.
- **Documentos adjuntos** (sección nueva): componente `PurchaseOrderAttachmentsSection` (basado en
  `InvoiceAttachmentSection`): subida múltiple, lista con descargar/eliminar.
- Indicador de total imputado vs total de la OC, con advertencia visual cuando hay excedente.

## Reglas de negocio

- Solo FAC/gastos del mismo proveedor que la OC (gasto sin proveedor: permitido).
- Excedente sobre el total de la OC: se avisa, no se bloquea.
- Imputar/desimputar recalcula `invoicing_status` de la OC.
- Permisos: misma capacidad que editar una OC (reusar el control de permisos existente del módulo
  purchasing).

## Testing / verificación

- `npm run check-types` + `npm run build`.
- Verificación manual: imputar/desimputar FAC y gasto, recálculo de `invoicing_status`,
  subir/descargar/eliminar adjuntos, caso de excedente (aviso visible, operación permitida),
  validación de proveedor distinto (rechazo).

## Fuera de alcance

- Relación directa OP↔OC.
- Cambios en el flujo de creación de FAC/OP/gastos (solo se agrega imputación retroactiva).
- Refactors no relacionados.
