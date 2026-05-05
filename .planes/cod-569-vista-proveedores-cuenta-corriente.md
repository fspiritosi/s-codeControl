# COD-569 — Vista de Proveedores: tab "Cuenta corriente"

## Resumen
Se agregó una tab "Cuenta corriente" al detalle del proveedor (`/dashboard/suppliers/[id]`), con accordion de 4 cards:
- Facturas de compra (`purchase_invoices`)
- Órdenes de compra (`purchase_orders`)
- Remitos de recepción (`receiving_notes`)
- Órdenes de pago (`payment_orders`)

Cada card expandible muestra:
- Card de resumen con conteos por estado y montos relevantes (total adeudado / pagado / programado / monto facturado).
- Toolbar con `<Select>` para filtrar por estado (más opción "Limpiar").
- Tabla paginada (10 por página) con click en fila → detalle del comprobante.

## Arquitectura

### Server actions (lectura, sin migración)
`src/modules/suppliers/features/account-statement/actions.server.ts`:
- `getSupplierInvoices(supplierId)` — devuelve `{ rows, summary }`. `summary` incluye `totalDebt` (suma de saldos pendientes de facturas no anuladas, restando OPs PAGADAS asociadas), `totalAmount`, `countByStatus`, `total`.
- `getSupplierPurchaseOrders(supplierId)` — totales y conteos por estado (excluye CANCELLED del monto).
- `getSupplierReceivingNotes(supplierId)` — conteos por estado (no hay total monetario en remitos).
- `getSupplierPaymentOrders(supplierId)` — `totalPaid`, `totalScheduled` (DRAFT + CONFIRMED), conteos.

Cada action:
- Scope por `companyId` desde `getActionContext()`.
- Valida supplier ↔ company antes de consultar.
- Sin paginación server-side: el volumen por proveedor es manejable y todo va a un componente cliente con filtros locales.

### UI
- `AccountStatementTab` (server component): hace las 4 queries con `Promise.all`, pasa el resultado al accordion cliente.
- `AccountStatementAccordion` (client): `Accordion type="multiple"`, primer ítem (Facturas) abierto por defecto.
- 4 sections (`InvoicesSection`, `PurchaseOrdersSection`, `ReceivingNotesSection`, `PaymentOrdersSection`) usan helpers compartidos en `SectionShell`:
  - `SummaryGrid + StatBlock` para los mini-stats.
  - `StatusFilterToolbar` (un `Select` por estado, scope local con `useState`).
  - `PaginatedTable` (tabla shadcn con slice + Anterior/Siguiente, click navega).

### Decisión sobre filtros: client-side
Cuatro DataTables del estándar comparten URL params, lo que generaría colisiones. Se priorizó simplicidad: server fetch único + estado local. Trade-off aceptado: si un proveedor tiene cientos de comprobantes, se cargan todos en una sola request. Para el alcance esperado de Transporte SP es suficiente.

### Integración
`src/app/dashboard/suppliers/[id]/page.tsx`:
- Antes: render directo de `<SupplierDetail />`.
- Ahora: `<Tabs>` con `General` (contenido previo) y `Cuenta corriente` (server tab dentro de `<Suspense>`).

## Archivos creados
- `src/modules/suppliers/features/account-statement/actions.server.ts`
- `src/modules/suppliers/features/account-statement/components/AccountStatementTab.tsx`
- `src/modules/suppliers/features/account-statement/components/AccountStatementAccordion.tsx`
- `src/modules/suppliers/features/account-statement/components/sections/SectionShell.tsx`
- `src/modules/suppliers/features/account-statement/components/sections/InvoicesSection.tsx`
- `src/modules/suppliers/features/account-statement/components/sections/PurchaseOrdersSection.tsx`
- `src/modules/suppliers/features/account-statement/components/sections/ReceivingNotesSection.tsx`
- `src/modules/suppliers/features/account-statement/components/sections/PaymentOrdersSection.tsx`

## Archivos modificados
- `src/app/dashboard/suppliers/[id]/page.tsx` (agregadas tabs General / Cuenta corriente)

## Verificaciones
- `npm run check-types`: ok.
- `npm run build`: ok.
