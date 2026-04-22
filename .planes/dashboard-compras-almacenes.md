# Dashboard: Cards de Compras, Almacenes y Proveedores

**Fecha de inicio:** 2026-03-30
**Estado:** Implementacion completada

---

## 1. Analisis

### 1.1 Problema

El dashboard actual (`/dashboard`) solo muestra 6 cards de indicadores relacionados con empleados y equipos (totales, documentos por vencer y vencidos). Los modulos de Compras, Almacenes y Proveedores — implementados recientemente — no tienen visibilidad en el dashboard. El usuario necesita 9 cards adicionales distribuidas en 3 secciones para tener un panorama operativo completo sin entrar a cada modulo.

**Cards a implementar:**

| # | Seccion | Card | Query |
|---|---------|------|-------|
| 1 | Compras | OC pendientes de aprobacion | `count(purchase_orders WHERE status = PENDING_APPROVAL)` |
| 2 | Compras | OC aprobadas sin recibir | `count(purchase_orders WHERE status IN (APPROVED, PARTIALLY_RECEIVED))` |
| 3 | Compras | Facturas pendientes de pago | `count(purchase_invoices WHERE status NOT IN (PAID, CANCELLED))` |
| 4 | Compras | Monto total comprometido en OC activas | `sum(total) FROM purchase_orders WHERE status IN (PENDING_APPROVAL, APPROVED, PARTIALLY_RECEIVED)` |
| 5 | Almacenes | Productos bajo stock minimo | `count(warehouse_stocks WHERE quantity < product.min_stock)` |
| 6 | Almacenes | ORM pendientes de completar | `count(withdrawal_orders WHERE status IN (DRAFT, PENDING_APPROVAL, APPROVED))` |
| 7 | Almacenes | Total movimientos del mes | `count(stock_movements WHERE date >= inicio_mes_actual)` |
| 8 | Proveedores | Proveedores activos | `count(suppliers WHERE status = ACTIVE)` |
| 9 | Proveedores | Proveedores con credito excedido | Query compleja: comparar sum de OC activas por proveedor vs credit_limit |

### 1.2 Contexto actual

#### Dashboard actual — Layout y componentes

- **Pagina:** `src/app/dashboard/page.tsx` — thin wrapper que renderiza `DashboardComponent` dentro de un `Suspense` con `DashboardSkeleton`.
- **Componente principal:** `src/modules/dashboard/features/overview/components/DashboardComponent.tsx` — renderiza `<CardsGrid />` dentro de un `Suspense`.
- **CardsGrid:** `src/modules/dashboard/features/overview/components/CardsGrid.tsx` — server component async que:
  - Llama a `getDashboardCounts()` (server action).
  - Define un array de 6 cards con config (title, value, icon, borderColor, iconColor, badge variant, href).
  - Renderiza un `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3`.
  - Cada card usa shadcn `Card` con `border-l-4` de color, `CardHeader` con titulo + icono, `CardContent` con `Badge` para el valor y un `Link` "ver detalle".
- **Skeleton:** `CardsGridSkeleton` renderiza 6 skeletons con el mismo grid layout.

#### Data fetching actual

- **Server action:** `src/modules/dashboard/features/overview/actions.server.ts`
  - `getDashboardCounts()` obtiene `companyId` de `getActionContext()`, luego llama a `fetchDashboardCounts(companyId)`.
  - `fetchDashboardCounts` ejecuta 10 queries en `Promise.all` usando Prisma (6 counts directos SQL + 4 evaluaciones condicionales en JS).
  - Se cachea con `unstable_cache` (revalidate: 60s, tag: `dashboard-{companyId}`).
  - Retorna un objeto tipado: `{ totalEmployees, totalEquipment, employeesExpiring, equipmentExpiring, employeesExpired, equipmentExpired }`.

#### Queries existentes en modulos (facets)

Los modulos ya tienen funciones `*Facets()` que hacen `groupBy` por status y retornan counts por valor. Estos datos son utiles para referencia pero **no conviene reutilizarlos** directamente en el dashboard porque:
1. Cada facet hace su propio `getActionContext()` (overhead).
2. No estan cacheados.
3. Importarlos en el modulo dashboard violaria la regla de no cross-module imports.

**Funciones de facets existentes:**
- `getPurchaseOrderFacets()` — groupBy status + invoicing_status en `purchase_orders`.
- `getInvoiceFacets()` — groupBy status + voucher_type en `purchase_invoices`.
- `getWithdrawalOrderFacets()` — groupBy status en `withdrawal_orders`.
- No hay facets para suppliers ni warehouse_stocks.

### 1.3 Archivos involucrados

#### Archivos a MODIFICAR

| Archivo | Cambio |
|---------|--------|
| `src/modules/dashboard/features/overview/actions.server.ts` | Agregar `fetchPurchasingCounts()`, `fetchWarehouseCounts()`, `fetchSupplierCounts()` y exportar `getDashboardPurchasingCounts()` cacheado |
| `src/modules/dashboard/features/overview/components/DashboardComponent.tsx` | Agregar secciones para las nuevas cards con Suspense independiente |
| `src/modules/dashboard/features/overview/components/CardsGrid.tsx` | Refactorizar para separar en `EmployeeEquipmentCards` (lo actual) o bien mantener y crear grids nuevos |

#### Archivos a CREAR

| Archivo | Descripcion |
|---------|-------------|
| `src/modules/dashboard/features/overview/components/PurchasingCards.tsx` | Server component async con 4 cards de compras |
| `src/modules/dashboard/features/overview/components/WarehouseCards.tsx` | Server component async con 3 cards de almacenes |
| `src/modules/dashboard/features/overview/components/SupplierCards.tsx` | Server component async con 2 cards de proveedores |

### 1.4 Dependencias

#### Prisma models requeridos

| Modelo | Campos usados |
|--------|---------------|
| `purchase_orders` | `company_id`, `status` (enum: DRAFT, PENDING_APPROVAL, APPROVED, PARTIALLY_RECEIVED, COMPLETED, CANCELLED), `total` (Decimal 12,2) |
| `purchase_invoices` | `company_id`, `status` (enum: DRAFT, CONFIRMED, PAID, PARTIAL_PAID, CANCELLED) |
| `warehouse_stocks` | `warehouse_id`, `product_id`, `quantity` (Decimal 12,3) |
| `products` | `company_id`, `min_stock` (Decimal nullable, default 0), `track_stock` (Boolean) |
| `withdrawal_orders` | `company_id`, `status` (enum: DRAFT, PENDING_APPROVAL, APPROVED, COMPLETED, CANCELLED) |
| `stock_movements` | `company_id`, `date` (Timestamptz) |
| `suppliers` | `company_id`, `status` (enum: ACTIVE, INACTIVE, BLOCKED), `credit_limit` (Decimal nullable 12,2) |

#### Componentes UI reutilizados

- `Card`, `CardHeader`, `CardTitle`, `CardContent` de `@/shared/components/ui/card`
- `Badge` de `@/shared/components/ui/badge`
- `Skeleton` de `@/shared/components/ui/skeleton`
- Iconos de `lucide-react`: ShoppingCart, Package, FileText, DollarSign, AlertTriangle, ClipboardList, ArrowUpDown, Building2, CreditCard (a definir)

#### Librerias

- `date-fns` — `startOfMonth` para filtrar movimientos del mes.
- `@prisma/client` — queries existentes, `Prisma.Decimal` para aggregate sum.

### 1.5 Restricciones

1. **No cross-module imports** — Las queries deben vivir en `src/modules/dashboard/features/overview/actions.server.ts`, no importar desde `src/modules/purchasing/`, `src/modules/warehouse/` o `src/modules/suppliers/`.
2. **Prisma Decimal** — El monto comprometido (card #4) retorna `Prisma.Decimal` del aggregate. Convertir a `Number` antes de pasar al client component.
3. **Performance** — 9 queries adicionales al cargar el dashboard. Usar `Promise.all` y `unstable_cache` con revalidacion de 60s (mismo patron actual).
4. **Routing only en app/** — No poner logica en `src/app/dashboard/page.tsx`.
5. **Server components** — Las cards son server components async (patron existente). No necesitan client-side state.

### 1.6 Riesgos

| Riesgo | Impacto | Mitigacion |
|--------|---------|------------|
| **Performance: 9 counts adicionales** | Aumenta el tiempo de carga del dashboard. Hoy son 10 queries; pasarian a ~19. | Separar en 3 `Suspense` boundaries independientes (compras, almacenes, proveedores) para streaming. Cada seccion carga independientemente. Cache de 60s con `unstable_cache`. |
| **Card #5 (bajo stock minimo): query compleja** | No se puede hacer un simple `count` porque `min_stock` esta en `products` y `quantity` en `warehouse_stocks`. Requiere join. | Usar `prisma.warehouse_stocks.findMany` con `include: { product }` filtrado por `product.company_id` y luego filtrar en JS, o usar `$queryRaw` con un JOIN directo para que sea eficiente en SQL. Preferir raw query. |
| **Card #9 (credito excedido): query mas compleja** | Requiere sumar `total` de `purchase_orders` agrupado por `supplier_id` y comparar contra `credit_limit`. No es un count simple. | Opcion A: `$queryRaw` con subquery. Opcion B: traer suppliers con credit_limit y para cada uno hacer aggregate (N+1, evitar). Opcion C: una sola raw query con LEFT JOIN + GROUP BY + HAVING. **Recomendar Opcion C.** |
| **Datos vacios** | Empresas nuevas sin OC/facturas/stock veran todos los valores en 0. | Mostrar las cards igualmente con valor 0. Considerar ocultar secciones completas si el modulo no esta habilitado (futuro). |
| **Card #4 (monto comprometido): formato moneda** | El valor es un monto en pesos, no un count. La UI actual solo muestra counts en Badge. | Formatear con `Intl.NumberFormat` y usar un estilo visual diferente (texto mas grande en vez de Badge circular). |

---

## 2. Planificacion

**Estado:** Implementacion completada

### 2.1 Fases de implementacion

#### Fase 1: Server actions — Queries de datos para los 9 indicadores

- **Objetivo:** Obtener todos los datos necesarios para las 9 cards nuevas, siguiendo el mismo patron de `fetchDashboardCounts` (Promise.all + unstable_cache 60s).
- **Tareas:**
  - [x] Crear funcion `fetchPurchasingDashboardCounts(companyId)` con 4 queries en `Promise.all`:
    - `prisma.purchase_orders.count` WHERE `company_id` AND `status = PENDING_APPROVAL` (Card #1)
    - `prisma.purchase_orders.count` WHERE `company_id` AND `status IN (APPROVED, PARTIALLY_RECEIVED)` (Card #2)
    - `prisma.purchase_invoices.count` WHERE `company_id` AND `status NOT IN (PAID, CANCELLED)` (Card #3)
    - `prisma.purchase_orders.aggregate({ _sum: { total } })` WHERE `company_id` AND `status IN (PENDING_APPROVAL, APPROVED, PARTIALLY_RECEIVED)` — convertir `Decimal` a `Number` (Card #4)
  - [x] Crear funcion `fetchWarehouseDashboardCounts(companyId)` con 3 queries en `Promise.all`:
    - Raw query con JOIN `warehouse_stocks` + `products` WHERE `products.company_id` AND `products.track_stock = true` AND `warehouse_stocks.quantity < products.min_stock` AND `products.min_stock IS NOT NULL` (Card #5)
    - `prisma.withdrawal_orders.count` WHERE `company_id` AND `status IN (DRAFT, PENDING_APPROVAL, APPROVED)` (Card #6)
    - `prisma.stock_movements.count` WHERE `company_id` AND `date >= startOfMonth(new Date())` (Card #7)
  - [x] Crear funcion `fetchSupplierDashboardCounts(companyId)` con 2 queries en `Promise.all`:
    - `prisma.suppliers.count` WHERE `company_id` AND `status = ACTIVE` (Card #8)
    - Raw query: `SELECT COUNT(*) FROM suppliers s WHERE s.company_id = $1 AND s.status = 'ACTIVE' AND s.credit_limit IS NOT NULL AND (SELECT COALESCE(SUM(po.total), 0) FROM purchase_orders po WHERE po.supplier_id = s.id AND po.status IN ('PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED')) > s.credit_limit` (Card #9)
  - [x] Crear funciones cacheadas con `unstable_cache` (revalidate: 60s):
    - `getCachedPurchasingCounts(companyId)` con tag `dashboard-purchasing-{companyId}`
    - `getCachedWarehouseCounts(companyId)` con tag `dashboard-warehouse-{companyId}`
    - `getCachedSupplierCounts(companyId)` con tag `dashboard-suppliers-{companyId}`
  - [x] Exportar 3 server actions publicas: `getDashboardPurchasingCounts()`, `getDashboardWarehouseCounts()`, `getDashboardSupplierCounts()` — cada una llama a `getActionContext()` y luego a su funcion cacheada
  - [x] Definir tipos de retorno: `PurchasingCounts { pendingApproval, approvedNotReceived, unpaidInvoices, committedAmount }`, `WarehouseCounts { lowStockProducts, pendingWithdrawals, monthMovements }`, `SupplierCounts { activeSuppliers, overCreditLimit }`
  - [x] Definir constantes `EMPTY_*` para retorno cuando no hay `companyId`
- **Archivos:**
  - MODIFICAR: `src/modules/dashboard/features/overview/actions.server.ts` — agregar las 3 funciones fetch + 3 cacheadas + 3 exports + tipos
- **Criterio de completitud:** Las 3 funciones exportadas retornan datos correctos para una empresa existente. Se puede verificar importandolas desde un componente temporal o con console.log en dev.

#### Fase 2: Componentes UI — Cards visuales en el dashboard

- **Objetivo:** Crear 3 server components (PurchasingCards, WarehouseCards, SupplierCards) e integrarlos en DashboardComponent con Suspense independiente por seccion.
- **Tareas:**
  - [x] Crear `PurchasingCards.tsx` — server component async:
    - Llama a `getDashboardPurchasingCounts()`
    - 4 cards con el patron visual existente (Card + border-l-4 + Badge + Link "ver detalle")
    - Card #4 (monto comprometido): formatear con `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` y usar texto en vez de Badge circular
    - Colores: azul para pendientes aprobacion, amarillo para aprobadas sin recibir, naranja para facturas impago, verde para monto comprometido
    - Links: `/dashboard/purchasing?status=PENDING_APPROVAL`, `/dashboard/purchasing?status=APPROVED`, `/dashboard/purchasing/invoices?status=DRAFT,CONFIRMED,PARTIAL_PAID`, `/dashboard/purchasing?status=PENDING_APPROVAL,APPROVED,PARTIALLY_RECEIVED`
    - Iconos: ShoppingCart, PackageCheck, FileText, DollarSign
    - Grid: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3` (4 cards en fila)
  - [x] Crear `PurchasingCardsSkeleton` en el mismo archivo (4 skeletons)
  - [x] Crear `WarehouseCards.tsx` — server component async:
    - Llama a `getDashboardWarehouseCounts()`
    - 3 cards: bajo stock (rojo, AlertTriangle), ORM pendientes (amarillo, ClipboardList), movimientos del mes (azul, ArrowUpDown)
    - Links: `/dashboard/products?low_stock=true`, `/dashboard/warehouse/withdrawal-orders?status=DRAFT,PENDING_APPROVAL,APPROVED`, `/dashboard/warehouse/stock-movements`
    - Grid: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3`
  - [x] Crear `WarehouseCardsSkeleton` en el mismo archivo (3 skeletons)
  - [x] Crear `SupplierCards.tsx` — server component async:
    - Llama a `getDashboardSupplierCounts()`
    - 2 cards: activos (azul, Building2), credito excedido (rojo, CreditCard)
    - Links: `/dashboard/suppliers?status=ACTIVE`, `/dashboard/suppliers?credit_exceeded=true`
    - Grid: `grid-cols-1 sm:grid-cols-2 gap-3`
  - [x] Crear `SupplierCardsSkeleton` en el mismo archivo (2 skeletons)
  - [x] Modificar `DashboardComponent.tsx`:
    - Agregar titulo de seccion `<h3>` antes de cada grupo de cards ("Empleados y Equipos", "Compras", "Almacenes", "Proveedores")
    - Agregar 3 `<Suspense>` boundaries nuevos, uno por seccion, cada uno con su Skeleton como fallback
    - Orden visual: Empleados/Equipos (existente) -> Compras -> Almacenes -> Proveedores
  - [x] Actualizar `CardsGridSkeleton` count en `CardsGrid.tsx` si es necesario, o dejar como esta ya que cada seccion tiene su propio skeleton
- **Archivos:**
  - CREAR: `src/modules/dashboard/features/overview/components/PurchasingCards.tsx`
  - CREAR: `src/modules/dashboard/features/overview/components/WarehouseCards.tsx`
  - CREAR: `src/modules/dashboard/features/overview/components/SupplierCards.tsx`
  - MODIFICAR: `src/modules/dashboard/features/overview/components/DashboardComponent.tsx`
- **Criterio de completitud:** El dashboard muestra las 4 secciones de cards con datos reales. Cada seccion carga independientemente (streaming con Suspense). Los links navegan correctamente a los listados filtrados. El monto comprometido se muestra formateado como moneda.

### 2.2 Orden de ejecucion

1. **Fase 1** primero — sin datos no hay nada que mostrar. Se puede testear con `console.log` en dev server.
2. **Fase 2** despues — consume las funciones de Fase 1. Se puede verificar visualmente en el browser.

No hay dependencias externas ni migraciones. Todo es codigo de lectura sobre tablas existentes.

### 2.3 Estimacion de complejidad

| Fase | Archivos nuevos | Archivos modificados | Lineas estimadas | Complejidad |
|------|-----------------|---------------------|------------------|-------------|
| Fase 1 | 0 | 1 | ~100 | Baja — son counts y un aggregate, el unico desafio es la raw query de credito excedido (Card #9) y bajo stock (Card #5) |
| Fase 2 | 3 | 1 | ~250 | Baja — copiar patron de CardsGrid.tsx, adaptar colores/iconos/links |
| **Total** | **3** | **2** | **~350** | **Baja** — funcionalidad repetitiva sobre patrones ya establecidos |

Tiempo estimado: ~1 hora de implementacion (ambas fases juntas).

## 3. Diseno
_Pendiente - ejecutar `/disenar dashboard-compras-almacenes`_

## 4. Implementacion

### Fase 1: Server actions (completada 2026-03-30)

Se agregaron 3 funciones fetch + 3 cacheadas + 3 exports + 3 tipos al archivo existente `actions.server.ts`:

- `fetchPurchasingDashboardCounts` / `getDashboardPurchasingCounts` — 4 queries (count OC pendientes, count OC sin recibir, count facturas impagas, SUM monto comprometido)
- `fetchWarehouseDashboardCounts` / `getDashboardWarehouseCounts` — 3 queries (raw query productos bajo stock con JOIN, count ORM pendientes, count movimientos del mes)
- `fetchSupplierDashboardCounts` / `getDashboardSupplierCounts` — 2 queries (count proveedores activos, raw query credito excedido con subquery)

Todas con `unstable_cache` revalidate 60s y tags por companyId. Tipos exportados: `PurchasingCounts`, `WarehouseCounts`, `SupplierCounts`. TypeScript check-types: OK.

### Fase 2: Componentes UI (completada 2026-03-30)

Se crearon 3 server components y se modifico DashboardComponent para integrarlos:

- `PurchasingCards.tsx` — 4 cards (OC pendientes aprobacion, OC sin recibir, facturas pendientes, monto comprometido con formato moneda ARS). Skeleton incluido.
- `WarehouseCards.tsx` — 3 cards (productos bajo stock, ORM pendientes, movimientos del mes). Skeleton incluido.
- `SupplierCards.tsx` — 2 cards (proveedores activos, credito excedido con color condicional rojo/muted). Skeleton incluido.
- `DashboardComponent.tsx` — 4 secciones con titulos h3 (Empleados y Equipos, Compras, Almacenes, Proveedores), cada una con Suspense independiente y su skeleton como fallback.

Patron visual identico al existente: Card con border-l-4, Badge con variant por color, Link "ver detalle", grid responsive. TypeScript check-types: OK.

## 5. Verificacion
_Pendiente - ejecutar `/verificar dashboard-compras-almacenes`_
