# Editar Factura de Compra en Borrador

**Fecha de inicio:** 2026-05-13
**Estado:** Analisis completado

---

## 1. Analisis

### 1.1 Problema

Actualmente las facturas de compra solo se pueden **crear** (flujo unidireccional). Una vez creada con status `DRAFT`, el usuario no tiene forma de editar sus datos (cabecera, lineas, descuentos, percepciones) antes de confirmarla. La unica opcion que existe es la funcionalidad de **revision de precios** (PriceReviewButton) que actualiza precios unitarios desde el catalogo de productos, pero no permite editar campos arbitrarios.

Si el usuario comete un error al cargar la factura (cantidad equivocada, linea de mas, percepcion incorrecta, fecha erronea, etc.), debe eliminar la factura y crearla de nuevo. Esto es ineficiente y propenso a errores.

### 1.2 Contexto actual

#### Flujo de creacion

1. **Pagina:** `src/app/dashboard/purchasing/invoices/new/page.tsx` - carga suppliers, products y perceptionTypes del server
2. **Formulario:** `src/modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm.tsx` - formulario con React Hook Form + Zod
3. **Action:** `createPurchaseInvoice()` en `src/modules/purchasing/features/invoices/list/actions.server.ts`
4. La factura se crea siempre con `status: 'DRAFT'` y `receiving_status: 'NOT_RECEIVED'`

#### Modelo de datos (Prisma)

**purchase_invoices** (cabecera):
- `id`, `company_id`, `supplier_id`, `voucher_type`, `point_of_sale`, `number`, `full_number`
- `issue_date`, `due_date`, `cae`, `notes`
- `subtotal`, `vat_amount`, `other_taxes`, `total` (calculados)
- `global_discount_type`, `global_discount_value`, `discount_amount`
- `status` (enum: DRAFT, CONFIRMED, PAID, PARTIAL_PAID, CANCELLED)
- `receiving_status` (enum: NOT_RECEIVED, PARTIALLY_RECEIVED, FULLY_RECEIVED)
- `document_url`, `document_key` (adjunto)
- `purchase_order_id` (FK legacy a OC primaria)
- `original_invoice_id` (para notas de credito)
- Unique constraint: `[company_id, supplier_id, full_number]`

**purchase_invoice_lines** (lineas):
- `id`, `invoice_id`, `product_id`, `description`
- `quantity`, `unit_cost`, `vat_rate`, `vat_amount`, `subtotal`, `total`
- `discount_type`, `discount_value`, `discount_amount`
- `purchase_order_line_id` (vinculo a linea de OC)
- `received_qty` (cantidad recibida via remitos)
- Cascade delete desde invoice

**purchase_invoice_perceptions** (percepciones):
- `id`, `invoice_id`, `tax_type_id`, `base_amount`, `rate`, `amount`, `notes`
- Cascade delete desde invoice

#### Estados y transiciones

```
DRAFT --> CONFIRMED (via confirmPurchaseInvoice)
CONFIRMED --> PAID / PARTIAL_PAID (via ordenes de pago en treasury)
DRAFT / CONFIRMED --> CANCELLED (no implementado aun)
```

Solo en `DRAFT` se puede:
- Confirmar la factura (cambia a CONFIRMED e incrementa `invoiced_qty` en lineas de OC)
- Revisar precios (PriceReviewButton)

#### Vinculacion con OCs

- Al crear, el usuario puede seleccionar OCs y se cargan lineas pendientes de facturar
- Cada linea puede tener `purchase_order_line_id` vinculando a una linea de OC especifica
- Al confirmar, se incrementa `invoiced_qty` en las `purchase_order_lines` vinculadas
- Se recalcula `invoicing_status` de las OCs afectadas (NOT_INVOICED / PARTIALLY_INVOICED / FULLY_INVOICED)

#### Que existe de edicion parcial

- `applyPurchaseInvoicePriceUpdates()` en `price-review/actions.server.ts`: actualiza `unit_cost` de lineas seleccionadas y recalcula totales. Solo funciona si `status === 'DRAFT'`.
- `preparePurchaseInvoiceAttachmentUpload()` / `confirmPurchaseInvoiceAttachmentUpload()`: permiten agregar/reemplazar adjunto en cualquier estado.
- `removePurchaseInvoiceDocument()`: quitar adjunto.
- **No existe** una action `updatePurchaseInvoice()` ni una ruta `/invoices/[id]/edit`.

#### Formulario actual

El `PurchaseInvoiceForm.tsx` es exclusivo de creacion:
- 700 lineas, usa RHF con `useFieldArray` para lineas y percepciones
- Maneja vinculacion a OCs con `MultiSelectCombobox` y carga dinamica de lineas
- Calcula totales en tiempo real (subtotal bruto, descuentos por linea, descuento global, IVA proporcional, percepciones)
- Sube adjunto despues de crear
- No acepta `defaultValues` desde una factura existente ni tiene modo "edicion"

### 1.3 Archivos involucrados

**Modificar:**
- `src/modules/purchasing/features/invoices/list/actions.server.ts` - agregar `getPurchaseInvoiceForEdit()` y `updatePurchaseInvoice()`
- `src/modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm.tsx` - hacerlo dual (crear/editar) o crear componente separado
- `src/modules/purchasing/features/invoices/list/components/columns.tsx` - agregar opcion "Editar" en dropdown de acciones para DRAFT
- `src/app/dashboard/purchasing/invoices/[id]/page.tsx` - agregar boton "Editar" visible solo en DRAFT

**Crear:**
- `src/app/dashboard/purchasing/invoices/[id]/edit/page.tsx` - pagina de edicion (thin wrapper)

**Posiblemente modificar:**
- `src/modules/purchasing/shared/validators.ts` - si se necesita un schema separado para edicion (ej. con `id` obligatorio)
- `src/modules/purchasing/shared/invoice-orders.ts` - si cambia la logica de derivacion de OCs

### 1.4 Dependencias

**Librerias:**
- `react-hook-form` + `@hookform/resolvers/zod` - formulario con validacion
- `zod` - esquemas de validacion
- `@tanstack/react-table` - tabla de lineas
- `sonner` - toasts
- `date-fns` - formateo de fechas

**Modulos internos:**
- `src/modules/suppliers/features/list/actions.server.ts` - `getSuppliersByCompany()`
- `src/modules/products/features/list/actions.server.ts` - `getProductsByCompany()`
- `src/modules/settings/features/taxes/actions.server.ts` - `listTaxTypes()`
- `src/modules/purchasing/features/purchase-orders/list/actions.server.ts` - `getOrdersForInvoicing()`, `getPurchaseOrderLinesForInvoicingBulk()`
- `src/shared/lib/prisma` - cliente Prisma
- `src/shared/lib/server-action-context` - `getActionContext()` para company_id
- `src/shared/lib/storage` / `src/shared/lib/storage-server` - manejo de adjuntos

**Servicios:**
- Prisma/PostgreSQL (via Supabase) - modelos `purchase_invoices`, `purchase_invoice_lines`, `purchase_invoice_perceptions`

### 1.5 Restricciones y reglas

1. **Solo DRAFT es editable** - Una factura confirmada (CONFIRMED) ya afecto `invoiced_qty` de OCs; editarla requeriria revertir esos cambios, lo cual es mucho mas complejo y riesgoso. Limitar a DRAFT.
2. **No perder datos** - La action de update debe ser transaccional: actualizar cabecera + borrar lineas/percepciones antiguas + crear nuevas (o hacer diff). El cascade delete en lineas y percepciones facilita un approach de "replace all".
3. **Unique constraint** - `[company_id, supplier_id, full_number]`: si el usuario cambia el proveedor o numero, hay que validar que no colisione. Pero cambiar proveedor en una factura es conceptualmente raro y peligroso (rompe la vinculacion con OCs). Probablemente conviene hacer el proveedor **no editable**.
4. **Vinculacion con OCs** - Si la factura tiene lineas vinculadas a OCs, la edicion debe preservar o permitir cambiar esas vinculaciones. Dado que la factura esta en DRAFT, aun no afecto `invoiced_qty`, asi que es seguro.
5. **Received_qty** - Las lineas tienen `received_qty` para tracking de remitos. En DRAFT no deberia haber remitos asociados (los remitos se hacen sobre facturas CONFIRMED), pero hay que verificar como safe-guard.
6. **Adjunto** - Ya se maneja por separado (InvoiceAttachmentSection), no necesita estar en el formulario de edicion.
7. **CLAUDE.md** - No cross-module imports. Server actions en el modulo. App/ solo routing.

### 1.6 Riesgos identificados

1. **Complejidad del formulario** - El `PurchaseInvoiceForm` es de 700 lineas con logica compleja (carga de OCs, descuentos, percepciones). Hacerlo dual (crear/editar) requiere manejar `defaultValues` dinami cos y decidir que campos son editables en modo edicion.
2. **Proveedor no editable en edicion** - Cambiar proveedor invalida las OCs vinculadas. Hay que bloquearlo o implementar logica de re-vinculacion.
3. **Lineas de OC ya borradas/modificadas** - Si entre la creacion y la edicion las lineas de OC cambiaron (ej. se cancelo la OC), la edicion podria intentar vincular a lineas que ya no existen.
4. **Concurrencia** - Otro usuario podria confirmar la factura mientras se esta editando. La action de update debe verificar `status === 'DRAFT'` dentro de la transaccion.
5. **Recalculo de totales** - La logica de calculo (descuentos por linea, descuento global, IVA proporcional, percepciones) debe ser identica en creacion y edicion. Idealmente extraerla a una funcion compartida.
6. **Replace vs diff de lineas** - La estrategia mas simple es borrar todas las lineas/percepciones existentes y recrearlas (gracias al cascade). La alternativa (diff) es mas eficiente pero mucho mas compleja y propensa a bugs. Dado que las facturas estan en DRAFT y no tienen dependencias externas (no hay remitos, no hay pagos), el replace es seguro.
7. **Remitos en DRAFT** - Aunque en teoria no deberia haber remitos sobre facturas en DRAFT, hay que validar que `receiving_status === 'NOT_RECEIVED'` y que no existan `receiving_notes` vinculadas antes de permitir la edicion.

---

## 2. Planificacion
_Pendiente - ejecutar `/planificar editar-factura-borrador`_

## 3. Diseno
_Pendiente - ejecutar `/disenar editar-factura-borrador`_

## 4. Implementacion
_Pendiente - ejecutar `/implementar editar-factura-borrador`_

## 5. Verificacion
_Pendiente - ejecutar `/verificar editar-factura-borrador`_
