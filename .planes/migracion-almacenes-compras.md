# Migración: Almacenes y Compras desde baxer-n

**Estado:** Planificación completada
**Fecha:** 2026-03-28
**Fuente:** `/media/fabricio/E/dev/baxer-n` (Next.js 16 + Prisma + Clerk)
**Destino:** `/media/fabricio/E/dev/s-codeControl` (Next.js 16 + Prisma + Supabase/NextAuth)

---

## 1. Scope

### Incluido
- **Almacenes:** CRUD completo + stock + movimientos + transferencias
- **Proveedores:** CRUD (necesario para compras)
- **Productos/Items:** Catálogo de productos con trackStock
- **Órdenes de Compra:** Crear → Aprobar → Recepción parcial/total
- **Facturas de Compra:** Crear → Confirmar (sin contabilidad)
- **Remitos de Recepción:** Crear → Confirmar (ingreso de stock al almacén)

### Excluido (por ahora)
- Integración contable (asientos automáticos)
- Integración AFIP (importación de facturas)
- Pagos / Órdenes de pago
- PDF generation (se puede agregar después)
- Reportes de compras
- Notas de crédito/débito (se puede agregar después)

---

## 2. Análisis de baxer-n

### Arquitectura fuente
- **Framework:** Next.js 16 + React 19
- **Auth:** Clerk (getActiveCompanyId, checkPermission)
- **ORM:** Prisma 7 con `$transaction` para operaciones atómicas
- **UI:** shadcn/ui + TanStack Table + React Query
- **Estructura:** `src/modules/commercial/features/{warehouses,purchases}/`

### Workflow de compras (PO → FC → RR)

```
1. Crear OC (DRAFT) → 2. Aprobar → 3. Recibir materiales (RR) → 4. Recibir factura (FC)
                                          ↓
                                    Stock entra al almacén
                                    (tipo PURCHASE en stock_movements)
```

**Puntos clave:**
- Stock NO entra con la factura — solo con el Remito de Recepción
- Recepciones parciales soportadas (receivedQty por línea)
- Facturación parcial soportada (invoicedQty por línea)
- Modelo de stock de 2 capas: `warehouse_stocks` (saldos) + `stock_movements` (auditoría)

### Tablas fuente (12 tablas)

| Tabla | Propósito |
|-------|-----------|
| `warehouses` | Almacenes físicos/virtuales |
| `warehouse_stocks` | Saldo por producto×almacén |
| `stock_movements` | Log inmutable de movimientos |
| `suppliers` | Proveedores |
| `purchase_orders` | Órdenes de compra |
| `purchase_order_lines` | Líneas de OC |
| `purchase_order_installments` | Cuotas de OC |
| `purchase_invoices` | Facturas de compra |
| `purchase_invoice_lines` | Líneas de factura |
| `receiving_notes` | Remitos de recepción |
| `receiving_note_lines` | Líneas de remito |
| `products` | Catálogo de productos (ya existe en baxer-n) |

---

## 3. Adaptaciones necesarias (baxer-n → s-codeControl)

| Concepto | baxer-n | s-codeControl |
|----------|---------|---------------|
| Auth | `getActiveCompanyId()` + Clerk | `getSession()` / `getActionContext()` |
| Permisos | `checkPermission('commercial.warehouses.view')` | Rol del usuario (`session.role`) |
| Multi-tenant | `companyId` de Clerk session | `companyId` de cookie `actualComp` |
| DataTable | Misma arquitectura | Mismo patrón (ya migrado) |
| Tabs | UrlTabs (mismo componente) | UrlTabs (ya copiado) |
| Contabilidad | `createJournalEntry` en confirmación | **Omitir** — no hay módulo contable |
| AFIP | `afip-import.server.ts` | **Omitir** — fuera de scope |
| PDF | React-PDF templates | **Omitir** — se agrega después |
| React Query | Para lazy-load de selects en forms | Mantener o reemplazar con server actions |

---

## 4. Fases de implementación

### Fase 0: Migración de base de datos
**Objetivo:** Crear todas las tablas necesarias en Prisma

- [ ] Agregar al schema de Prisma:
  - `products` — catálogo de productos/items (id, company_id, code, name, unit, trackStock, isActive)
  - `suppliers` — proveedores (id, company_id, code, businessName, taxId, taxCondition, status, etc.)
  - `warehouses` — almacenes (id, company_id, code, name, type, address, isActive)
  - `warehouse_stocks` — saldos (warehouseId + productId unique, quantity, reservedQty, availableQty)
  - `stock_movements` — log (id, companyId, warehouseId, productId, type, quantity, referenceType, referenceId, date)
  - `purchase_orders` + `purchase_order_lines` + `purchase_order_installments`
  - `purchase_invoices` + `purchase_invoice_lines`
  - `receiving_notes` + `receiving_note_lines`
- [ ] Crear enums: WarehouseType, StockMovementType, SupplierStatus, SupplierTaxCondition, PurchaseOrderStatus, PurchaseInvoiceStatus, ReceivingNoteStatus, VoucherType
- [ ] Crear migración: `npm run create-migration -- add_warehouse_and_purchasing`
- [ ] Generar tipos: `npm run gentypes`

**Archivos:** `prisma/schema.prisma`, migración SQL
**Criterio:** `npm run check-types` pasa, tablas creadas en DB local

### Fase 1: Módulo Productos (catálogo)
**Objetivo:** CRUD de productos — necesario antes de almacenes y compras

- [ ] `src/modules/products/features/list/` — DataTable server-side paginada
- [ ] `src/modules/products/features/create/` — Form de creación/edición
- [ ] `src/modules/products/shared/types.ts` + `validators.ts`
- [ ] Ruta: `/dashboard/products`
- [ ] Sidebar: agregar link "Productos" con icono `Package`

**Archivos:** ~8 archivos nuevos
**Criterio:** CRUD completo de productos funcionando

### Fase 2: Módulo Proveedores
**Objetivo:** CRUD de proveedores — necesario para compras

- [ ] `src/modules/suppliers/features/list/` — DataTable
- [ ] `src/modules/suppliers/features/create/` — Form
- [ ] `src/modules/suppliers/shared/types.ts` + `validators.ts`
- [ ] Ruta: `/dashboard/suppliers`
- [ ] Sidebar: agregar link "Proveedores" con icono `Users` o `Building`

**Archivos:** ~8 archivos nuevos
**Criterio:** CRUD completo de proveedores funcionando

### Fase 3: Módulo Almacenes
**Objetivo:** CRUD almacenes + control de stock + movimientos

Sub-fases:
#### 3a: CRUD de almacenes
- [ ] `src/modules/warehouse/features/list/` — DataTable
- [ ] `src/modules/warehouse/features/create/` — Form
- [ ] `src/modules/warehouse/features/detail/` — Detalle con tabla de stock
- [ ] Ruta: `/dashboard/warehouse`
- [ ] Sidebar: agregar link "Almacenes" con icono `Warehouse`

#### 3b: Control de stock
- [ ] `src/modules/warehouse/features/stock/` — Vista cross-warehouse
- [ ] Ajuste de stock (dialog)
- [ ] Transferencia entre almacenes (dialog con transacción atómica)

#### 3c: Movimientos de stock
- [ ] `src/modules/warehouse/features/movements/` — DataTable con filtros
- [ ] Log inmutable (solo lectura)
- [ ] Filtros por tipo, almacén, producto, fecha

**Archivos:** ~20 archivos nuevos
**Criterio:** Almacenes CRUD + stock con ajustes/transferencias + historial de movimientos

### Fase 4: Órdenes de Compra
**Objetivo:** Crear y gestionar órdenes de compra

- [ ] `src/modules/purchasing/features/purchase-orders/list/` — DataTable
- [ ] `src/modules/purchasing/features/purchase-orders/create/` — Form con líneas dinámicas
- [ ] `src/modules/purchasing/features/purchase-orders/detail/` — Detalle con acciones
- [ ] Flujo de estados: DRAFT → PENDING_APPROVAL → APPROVED → PARTIALLY_RECEIVED → COMPLETED
- [ ] Cuotas opcionales (installments)
- [ ] Ruta: `/dashboard/purchasing?tab=orders`
- [ ] Sidebar: agregar link "Compras" con icono `ShoppingCart`

**Archivos:** ~15 archivos nuevos
**Criterio:** Crear OC, aprobar, ver estado de recepción

### Fase 5: Facturas de Compra
**Objetivo:** Registrar facturas de proveedores

- [ ] `src/modules/purchasing/features/invoices/list/` — DataTable
- [ ] `src/modules/purchasing/features/invoices/create/` — Form
- [ ] `src/modules/purchasing/features/invoices/detail/` — Detalle
- [ ] Flujo: DRAFT → CONFIRMED (sin contabilidad)
- [ ] Link opcional a OC
- [ ] Ruta: `/dashboard/purchasing?tab=invoices`

**Archivos:** ~12 archivos nuevos
**Criterio:** Crear factura, confirmar, vincular a OC

### Fase 6: Remitos de Recepción (ingreso de stock)
**Objetivo:** Registrar recepción de materiales e ingresar stock al almacén

- [ ] `src/modules/purchasing/features/receiving-notes/list/` — DataTable
- [ ] `src/modules/purchasing/features/receiving-notes/create/` — Form
  - Selección de fuente: OC / Factura / Libre
  - Auto-carga de líneas pendientes desde OC
  - Selección de almacén destino
- [ ] `src/modules/purchasing/features/receiving-notes/detail/` — Detalle con acciones
- [ ] `confirmReceivingNote()` — acción crítica:
  - Crear StockMovement tipo PURCHASE por cada línea
  - Upsert WarehouseStock (incrementar quantity + availableQty)
  - Incrementar receivedQty en líneas de OC
  - Actualizar estado de OC (PARTIALLY_RECEIVED / COMPLETED)
- [ ] `cancelReceivingNote()` — reversa completa (decrementa stock)
- [ ] Ruta: `/dashboard/purchasing?tab=receiving`

**Archivos:** ~15 archivos nuevos
**Criterio:** Crear remito desde OC, confirmar, stock ingresa al almacén, OC se marca como recibida

---

## 5. Orden de ejecución

```
Fase 0 (DB) → Fase 1 (Productos) → Fase 2 (Proveedores) → Fase 3 (Almacenes) → Fase 4 (OC) → Fase 5 (Facturas) → Fase 6 (Remitos)
```

Fases 1 y 2 son independientes entre sí (pueden hacerse en paralelo).
Fase 3 depende de Fase 1 (productos).
Fases 4, 5, 6 dependen de Fases 1, 2, 3.

---

## 6. Estructura de rutas resultante

```
/dashboard/products                          → Catálogo de productos
/dashboard/suppliers                         → Proveedores
/dashboard/warehouse                         → Almacenes (tabs: list, stock, movements)
/dashboard/warehouse/new                     → Crear almacén
/dashboard/warehouse/[id]                    → Detalle almacén
/dashboard/purchasing                        → Compras (tabs: orders, invoices, receiving)
/dashboard/purchasing/orders/new             → Crear OC
/dashboard/purchasing/orders/[id]            → Detalle OC
/dashboard/purchasing/invoices/new           → Crear factura
/dashboard/purchasing/invoices/[id]          → Detalle factura
/dashboard/purchasing/receiving/new          → Crear remito
/dashboard/purchasing/receiving/[id]         → Detalle remito
```

---

## 7. Sidebar actualizado

| Position | Name | Path | Icon | Nuevo |
|----------|------|------|------|-------|
| 1 | Dashboard | /dashboard | LayoutDashboard | |
| 2 | Empresa | /dashboard/company/actualCompany | Building2 | |
| 3 | Empleados | /dashboard/employee | Users | |
| 4 | Equipos | /dashboard/equipment | Truck | |
| 5 | Documentación | /dashboard/document | FileText | |
| 6 | Productos | /dashboard/products | Package | **Si** |
| 7 | Proveedores | /dashboard/suppliers | Contact | **Si** |
| 8 | Almacenes | /dashboard/warehouse | Warehouse | **Si** |
| 9 | Compras | /dashboard/purchasing | ShoppingCart | **Si** |
| 10 | Mantenimiento | /dashboard/maintenance | Wrench | |
| 11 | Formularios | /dashboard/forms | ClipboardList | |
| 12 | Operaciones | /dashboard/operations | Calendar | |
| 13 | HSE | /dashboard/hse | GraduationCap | |
| 14 | Ayuda | /dashboard/help | HelpCircle | |

---

## 8. Estimación de complejidad

| Fase | Complejidad | Archivos nuevos | Nota |
|------|-------------|-----------------|------|
| 0 - DB | Media | 1 migración + schema | Copiar/adaptar modelos de baxer-n |
| 1 - Productos | Baja | ~8 | CRUD simple, DataTable |
| 2 - Proveedores | Baja | ~8 | CRUD simple, DataTable |
| 3 - Almacenes | Alta | ~20 | Stock + transferencias + movimientos |
| 4 - OC | Alta | ~15 | Form con líneas dinámicas + flujo de estados |
| 5 - Facturas | Media | ~12 | Similar a OC pero más simple |
| 6 - Remitos | Alta | ~15 | Lógica de confirmación con stock + transacciones |

**Total estimado:** ~80 archivos nuevos, 12 tablas nuevas
