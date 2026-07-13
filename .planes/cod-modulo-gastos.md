# Modulo de Gastos

**Fecha de inicio:** 2026-05-13
**Estado:** Implementacion en progreso (Fases 1-3, 5-7 de 9 completadas)

---

## 1. Analisis

### 1.1 Problema

CodeControl no tiene un modulo de gastos operativos. Las empresas necesitan registrar gastos que no son facturas de compra (servicios, viaticos, gastos bancarios, suscripciones, etc.), categorizarlos, adjuntar comprobantes y vincularlos a ordenes de pago para su cancelacion.

El modulo ya existe en baxer-n (`src/modules/commercial/features/expenses/`) y debe migrarse a CodeControl adaptandolo a las diferencias arquitectonicas entre ambos proyectos.

### 1.2 Contexto actual

**En baxer-n (fuente):**
- Modulo completo con CRUD de gastos y categorias
- Adjuntos de archivos via storage propio (S3/MinIO con `uploadFile`, `deleteFile`, `getPresignedDownloadUrl`)
- Integracion con contabilidad: `createJournalEntryForExpense`, `checkBudgetForExpense`, campo `journalEntryId`
- Integracion con ordenes de pago: `PaymentOrderItem` tiene FK a `Expense`
- Integracion con proyecciones: `_LinkToProjectionModal`
- Auth via Clerk: `auth()` para userId
- Empresa activa via `getActiveCompanyId()` (lee de cookie)
- Permisos via `checkPermission('commercial.expenses', action)` (sistema modular)
- Prisma con camelCase en JS mapeado a snake_case en DB via `@map`
- DataTable con paginacion server-side, filtros faceted, date range, text
- React Query para data fetching en modales
- React Hook Form para formularios

**En CodeControl (destino):**
- NO existen las tablas `expenses`, `expense_categories`, `expense_attachments` ni el enum `expense_status`
- Auth via Supabase: `fetchCurrentUser()` para userId
- Empresa activa via `getActionContext()` / `getRequiredActionContext()` que lee cookie `actualComp`
- Permisos via `requirePermission('permiso.code')` con codigos planos (no modular)
- Storage via Supabase Storage: `storageServer` (server) y `storage` (client), con buckets tipados
- Prisma con snake_case directo (sin `@map`, los campos JS son snake_case)
- DataTable estandar con `showFilterToggle` + filtros faceted/text/dateRange
- `payment_order_items` tiene FK `invoice_id` a `purchase_invoices` -- necesita extenderse para gastos
- Modulo `purchasing` ya tiene features para invoices, purchase-orders, receiving-notes
- Modulo `treasury` ya tiene payment-orders, pending-balances, cash-registers, bank-accounts

### 1.3 Archivos involucrados

**Archivos a CREAR en CodeControl:**

1. **Migracion de DB:**
   - `supabase/migrations/YYYYMMDDHHMMSS_add_expenses_module.sql`
     - Enum `expense_status` (DRAFT, CONFIRMED, PARTIAL_PAID, PAID, CANCELLED)
     - Tabla `expense_categories` (id, company_id, name, description, is_active, created_at, updated_at)
     - Tabla `expenses` (id, company_id, number, full_number, description, amount, date, due_date, status, notes, category_id, supplier_id, created_by, created_at, updated_at)
     - Tabla `expense_attachments` (id, expense_id, file_name, file_key, file_size, mime_type, created_at)
     - Agregar columna `expense_id` (nullable) a `payment_order_items`
     - Indices y constraints

2. **Prisma schema:**
   - `prisma/schema.prisma` -- agregar modelos `expenses`, `expense_categories`, `expense_attachments`, enum `expense_status`, y campo `expense_id` en `payment_order_items`

3. **Server actions:**
   - `src/modules/purchasing/features/expenses/actions.server.ts` -- CRUD de gastos y categorias
   - `src/modules/purchasing/features/expenses/attachment-actions.server.ts` -- adjuntos

4. **Validadores:**
   - `src/modules/purchasing/features/expenses/validators.ts` -- schemas Zod + constantes

5. **Componentes UI:**
   - `src/modules/purchasing/features/expenses/list/ExpensesList.tsx` -- server component principal
   - `src/modules/purchasing/features/expenses/list/columns.tsx` -- definicion de columnas
   - `src/modules/purchasing/features/expenses/list/components/_ExpensesTable.tsx` -- client wrapper DataTable
   - `src/modules/purchasing/features/expenses/list/components/_CreateExpenseModal.tsx` -- modal crear/editar
   - `src/modules/purchasing/features/expenses/list/components/_ExpenseDetailModal.tsx` -- modal detalle
   - `src/modules/purchasing/features/expenses/components/_ExpenseAttachments.tsx` -- seccion adjuntos
   - `src/modules/purchasing/features/expenses/components/_CategoryManagementModal.tsx` -- CRUD categorias

6. **Ruta:**
   - `src/app/dashboard/purchasing/expenses/page.tsx` -- page wrapper

7. **Barrel export:**
   - `src/modules/purchasing/features/expenses/index.ts`

**Archivos a MODIFICAR en CodeControl:**

1. `prisma/schema.prisma` -- agregar modelos y relaciones (ver arriba)
2. `src/shared/lib/storage.ts` -- agregar bucket `'expenses'` a `StorageBucket`
3. `src/shared/lib/storage-server.ts` -- agregar bucket `'expenses'` a `StorageBucket`
4. `src/modules/treasury/features/payment-orders/actions.server.ts`:
   - `getPendingPurchaseInvoices` ya existe para facturas; crear `getPendingExpenses` analogo
   - `createPaymentOrder` / `updatePaymentOrder`: items deben soportar `expense_id` ademas de `invoice_id`
   - `markPaymentOrderAsPaid`: actualizar status de gastos (PARTIAL_PAID / PAID) igual que hace con facturas
5. `src/modules/treasury/features/pending-balances/actions.server.ts` -- incluir gastos pendientes
6. `src/modules/treasury/shared/payment-order-validators.ts` -- schema de items debe aceptar `expense_id`
7. `src/modules/treasury/features/payment-orders/components/NewPaymentOrderForm.tsx` -- UI para seleccionar gastos
8. Navegacion lateral (sidebar) -- agregar link a `/dashboard/purchasing/expenses`
9. Migracion de permisos: seed con codigos `compras.gastos.view`, `compras.gastos.create`, `compras.gastos.update`, `compras.gastos.confirm`, `compras.gastos.delete`

### 1.4 Dependencias

**Del proyecto destino (ya existen):**
- `prisma` client + `getActionContext()` / `getRequiredActionContext()`
- `requirePermission()` + sistema de permisos basado en codigos
- `fetchCurrentUser()` para obtener user ID
- `storageServer` / `storage` para manejo de archivos en Supabase Storage
- `DataTable` + helpers (`parseSearchParams`, `stateToPrismaParams`, `buildFiltersWhere`, `buildTextFiltersWhere`, `buildDateRangeFiltersWhere`)
- Componentes UI de shadcn/ui (Dialog, AlertDialog, Card, Badge, Button, Form, Select, etc.)
- `usePermissions()` hook para permisos en client
- `revalidatePath` para invalidacion de cache
- Modelo `suppliers` con campos `id`, `company_id`, `business_name`, `trade_name`, `tax_id`
- Modelo `payment_order_items` existente con su relacion a `payment_orders`

**Que NO existe y debe crearse:**
- Bucket de Supabase Storage `expenses` (crear via Supabase dashboard o migracion)
- Permisos en tabla `permissions` para el modulo de gastos
- Tablas de DB (expenses, expense_categories, expense_attachments)

### 1.5 Restricciones y reglas

1. **Naming convention:** CodeControl usa snake_case en Prisma (sin `@map`). Los modelos se llaman `expenses`, `expense_categories`, `expense_attachments`. Los campos son `company_id`, `full_number`, `created_at`, etc.

2. **Sin contabilidad:** Omitir completamente:
   - Campo `journalEntryId` / `journal_entry_id` en expenses
   - Import/llamadas a `createJournalEntryForExpense`
   - Import/llamadas a `checkBudgetForExpense`
   - Logica de `accountingSettings` en `confirmExpense`
   - Retorno de `budgetWarning` en confirmacion
   - `_LinkToProjectionModal` en el detalle

3. **Sin proyecciones:** Omitir el campo `projectionLinks` y el boton "Vincular a Proyeccion" del detalle.

4. **Sin logger:** CodeControl usa `console.error/warn` en lugar de un logger estructurado. Reemplazar `logger.info/error/warn` por `console.log/error/warn`.

5. **Auth:** Reemplazar `const { userId } = await auth()` por `const user = await fetchCurrentUser()` y usar `user?.id`.

6. **Empresa activa:** Reemplazar `getActiveCompanyId()` por `getActionContext()` o `getRequiredActionContext()`.

7. **Permisos:** Reemplazar `checkPermission('commercial.expenses', 'view', { redirect: true })` por `requirePermission('compras.gastos.view')` (o el codigo que se defina).

8. **Storage:** El patron de baxer-n usa `uploadFile(buffer, fileName, { folder })` con S3. En CodeControl se usa `storageServer.upload(bucket, path, file)` con Supabase Storage. Los adjuntos deben adaptarse al patron de `purchase_invoices` (prepare + upload client-side + confirm).

9. **Rutas:** Los `revalidatePath` deben apuntar a `/dashboard/purchasing/expenses` (no `commercial`).

10. **DataTable:** Usar el mismo patron que `_InvoicesDataTable` o `_PurchaseOrdersDataTable`: `showFilterToggle`, `tableId`, `facetedFilters`, etc.

11. **Imports:** No importar de otros modulos. Si se necesita `getSuppliersForSelect`, crear la query dentro del propio modulo de expenses o usar la funcion compartida si existe en `shared/actions`.

12. **No RHF en forms simples:** El modal de categorias tiene <5 campos, podria simplificarse con useState+Zod, pero dado que la fuente ya usa RHF y funciona, se mantiene por consistencia interna del modulo.

### 1.6 Riesgos identificados

1. **Extension de `payment_order_items`:**
   - Actualmente `invoice_id` es nullable y es la unica FK de "documento origen". Agregar `expense_id` nullable crea un item que puede apuntar a factura O gasto (polimorfismo por FK).
   - Necesita un CHECK constraint: `invoice_id IS NOT NULL OR expense_id IS NOT NULL` (al menos uno debe estar presente), o permitir items sin documento (ya es posible hoy -- invoice_id es nullable).
   - La logica de `markPaymentOrderAsPaid` debe recorrer tambien gastos para actualizar su status, no solo facturas.
   - La logica de `cancelPaymentOrder` no necesita cambios si los gastos no generan movimientos adicionales.

2. **Saldos pendientes:**
   - `pending-balances` actualmente solo muestra facturas. Debe extenderse para incluir gastos con status CONFIRMED o PARTIAL_PAID, o crear una vista separada.
   - Decidir si se mezclan en la misma tabla o se muestran en pestanas separadas.

3. **Numeracion secuencial:**
   - `GTO-00001` formato. Verificar que no colisione con otro prefijo existente.
   - Usar transaccion o advisory lock para evitar race conditions en la generacion de numero, al igual que hace `payment_orders` con `OP-XXXXX`.

4. **Storage bucket:**
   - El bucket `expenses` debe crearse en Supabase con las politicas RLS adecuadas. Si no se hace antes del deploy, los uploads fallan silenciosamente.

5. **Permisos:**
   - Los codigos de permiso deben insertarse en la tabla `permissions` y asignarse a los roles existentes via migracion seed. Si no se hace, ningun usuario podra acceder al modulo.

6. **Migracion de datos:**
   - No aplica (CodeControl no tiene datos existentes de gastos). Solo creacion de tablas nuevas.

7. **Patron de adjuntos:**
   - baxer-n envia el archivo como `number[]` (array de bytes) al server action. Esto funciona pero es ineficiente para archivos grandes.
   - CodeControl usa el patron de 2 pasos: prepare (server) -> upload (client directo a Supabase) -> confirm (server). Es preferible adaptar al patron de CodeControl.
   - Alternativa pragmatica: si los adjuntos de gastos son pequenos (<5MB), el patron de baxer-n funciona y es mas simple de migrar. Decidir en fase de diseno.

8. **Proveedor opcional:**
   - En baxer-n, el proveedor es opcional en gastos (`supplierId: String?`). En el formulario de OP de CodeControl, el proveedor es requerido para filtrar facturas. Las OPs de gastos sin proveedor necesitan un flujo diferente o que el proveedor sea requerido en gastos que se vinculen a OPs.

---

## 2. Planificacion

### Fase 1: Modelo de datos
**Objetivo:** Crear las tablas, enum y relaciones en la DB + actualizar Prisma schema.

**Tarea 1.1 — Migracion SQL**
- Crear `supabase/migrations/YYYYMMDDHHMMSS_add_expenses_module.sql`
- Contenido:
  - Enum `expense_status`: `'DRAFT'`, `'CONFIRMED'`, `'PARTIAL_PAID'`, `'PAID'`, `'CANCELLED'`
  - Tabla `expense_categories`:
    - `id UUID PK DEFAULT gen_random_uuid()`
    - `company_id UUID NOT NULL FK -> companies(id)`
    - `name TEXT NOT NULL`
    - `description TEXT`
    - `is_active BOOLEAN DEFAULT true`
    - `created_at TIMESTAMPTZ DEFAULT now()`
    - `updated_at TIMESTAMPTZ DEFAULT now()`
    - `UNIQUE(company_id, name)`
  - Tabla `expenses`:
    - `id UUID PK DEFAULT gen_random_uuid()`
    - `company_id UUID NOT NULL FK -> companies(id)`
    - `number INT NOT NULL`
    - `full_number TEXT NOT NULL` (formato `GTO-00001`)
    - `description TEXT NOT NULL`
    - `amount DECIMAL(15,2) NOT NULL`
    - `date DATE NOT NULL`
    - `due_date DATE`
    - `status expense_status DEFAULT 'DRAFT'`
    - `notes TEXT`
    - `category_id UUID NOT NULL FK -> expense_categories(id)`
    - `supplier_id UUID FK -> suppliers(id)` (nullable)
    - `created_by UUID NOT NULL`
    - `created_at TIMESTAMPTZ DEFAULT now()`
    - `updated_at TIMESTAMPTZ DEFAULT now()`
    - `UNIQUE(company_id, number)`
    - Indices: `(company_id)`, `(category_id)`, `(supplier_id)`, `(status)`
  - Tabla `expense_attachments`:
    - `id UUID PK DEFAULT gen_random_uuid()`
    - `expense_id UUID NOT NULL FK -> expenses(id) ON DELETE CASCADE`
    - `file_name TEXT NOT NULL`
    - `file_key TEXT NOT NULL` (path en Supabase Storage)
    - `file_size INT`
    - `mime_type TEXT`
    - `created_at TIMESTAMPTZ DEFAULT now()`
    - Indice: `(expense_id)`
  - ALTER `payment_order_items`: agregar columna `expense_id UUID` nullable FK -> `expenses(id)`
    - Indice: `(expense_id)`
  - Crear bucket de Storage `expenses` (via SQL `insert into storage.buckets`)
  - Insertar permisos en tabla `permissions`: `compras.gastos.view`, `compras.gastos.create`, `compras.gastos.update`, `compras.gastos.confirm`, `compras.gastos.delete`
  - Asignar permisos a roles existentes (Admin, CodeControlClient) via seed en la misma migracion

**Tarea 1.2 — Actualizar Prisma schema**
- Modificar `prisma/schema.prisma`:
  - Agregar enum `expense_status` (DRAFT, CONFIRMED, PARTIAL_PAID, PAID, CANCELLED)
  - Agregar modelo `expense_categories` con campos snake_case, relaciones a `companies` y `expenses[]`
  - Agregar modelo `expenses` con campos snake_case, relaciones a `expense_categories`, `suppliers?`, `companies`, `expense_attachments[]`, `payment_order_items[]`
  - Agregar modelo `expense_attachments` con campos snake_case, relacion a `expenses` (onDelete: Cascade)
  - En modelo `payment_order_items`: agregar campo `expense_id String? @db.Uuid`, relacion `expense expenses? @relation(fields: [expense_id], references: [id])`, indice `@@index([expense_id])`
  - En modelo `suppliers`: agregar relacion `expenses expenses[]`
  - En modelo `companies`: agregar relaciones `expense_categories expense_categories[]` y `expenses expenses[]`

**Tarea 1.3 — Regenerar tipos**
- Ejecutar `npm run gentypes` y `npx prisma generate` para actualizar tipos

---

### Fase 2: Validators [COMPLETADA]
**Objetivo:** Crear schemas Zod y constantes para gastos y categorias.

**Tarea 2.1 — Crear validators** [x]
- Crear `src/modules/purchasing/features/expenses/validators.ts`
- Contenido:
  - Constante `EXPENSE_STATUS_LABELS: Record<string, string>` con etiquetas en espanol (Borrador, Confirmado, Parcialmente pagado, Pagado, Anulado)
  - Schema `expenseFormSchema` (adaptado de baxer-n, campos snake_case):
    - `description: z.string().min(1)`
    - `amount: z.string().regex(/^\d+(\.\d{1,3})?$/)` (3 decimales, consistente con facturas)
    - `date: z.date()`
    - `due_date: z.date().optional().nullable()`
    - `category_id: z.string().uuid()`
    - `supplier_id: z.string().uuid().optional().nullable().or(z.literal(''))`
    - `notes: z.string().optional().nullable()`
  - Type `ExpenseFormInput = z.infer<typeof expenseFormSchema>`
  - Schema `expenseCategoryFormSchema`:
    - `name: z.string().min(1)`
    - `description: z.string().optional().nullable()`
  - Type `ExpenseCategoryFormInput = z.infer<typeof expenseCategoryFormSchema>`

---

### Fase 3: Server actions (CRUD gastos y categorias) [COMPLETADA]
**Objetivo:** Migrar las funciones de baxer-n adaptandolas a CodeControl.

**Tarea 3.1 — Crear actions.server.ts** [x]
- Crear `src/modules/purchasing/features/expenses/actions.server.ts`
- Funciones a implementar (todas con `'use server'`, `getActionContext()`, `requirePermission()`):

  **Categorias:**
  - `getExpenseCategories()` — categorias activas para select
  - `getAllExpenseCategories()` — todas (incluye inactivas + count de gastos) para gestion
  - `createExpenseCategory(data: ExpenseCategoryFormInput)` — crear, detectar P2002 duplicado
  - `updateExpenseCategory(id, data: ExpenseCategoryFormInput)` — actualizar
  - `toggleExpenseCategory(id)` — activar/desactivar

  **Gastos CRUD:**
  - `getExpensesPaginated(searchParams: DataTableSearchParams)` — listado paginado con filtros:
    - Faceted: `status`, `category_id`
    - Text: `full_number`, `supplier` (busca en `suppliers.business_name`)
    - DateRange: `date`, `due_date`
    - Global search: `full_number`, `description`, `supplier.business_name`, `category.name`
    - Select: `id`, `number`, `full_number`, `description`, `amount`, `date`, `due_date`, `status`, `created_at`, `category(id, name)`, `supplier(id, business_name)`, `_count(attachments, payment_order_items)`
    - Convertir `amount` a `Number`, normalizar fechas con `normalizeDbDate`
  - `getExpenseById(id)` — detalle con adjuntos, items de OP, calculo de `paidAmount` / `pendingAmount`
  - `createExpense(data: ExpenseFormInput)` — crear como DRAFT, numerar secuencialmente (`GTO-XXXXX`)
  - `updateExpense(id, data: ExpenseFormInput)` — solo DRAFT
  - `confirmExpense(id)` — cambiar a CONFIRMED (sin contabilidad, sin budget check)
  - `cancelExpense(id)` — solo DRAFT/CONFIRMED sin pagos confirmados
  - `deleteExpense(id)` — solo DRAFT, eliminar registro
  - `getExpenseFacetCounts()` — conteos por status y category_id para filtros faceted

  **Para Ordenes de Pago:**
  - `getPendingExpenses(supplierId?: string)` — gastos CONFIRMED/PARTIAL_PAID, calcula saldo pendiente. Si no se pasa `supplierId`, devuelve todos los de la empresa (para gastos sin proveedor). Retorna: `id, full_number, description, category_name, supplier_name, date, due_date, total, paid_amount, pending_amount, status`

  **Adaptaciones clave vs baxer-n:**
  - `auth()` -> `fetchCurrentUser()` para `user?.id`
  - `getActiveCompanyId()` -> `getActionContext()` para `companyId`
  - `checkPermission(...)` -> `requirePermission('compras.gastos.xxx')`
  - `logger.xxx(...)` -> `console.xxx(...)`
  - `revalidatePath('/dashboard/commercial/expenses')` -> `revalidatePath('/dashboard/purchasing?tab=expenses')`
  - Omitir todo lo de `journalEntry`, `accountingSettings`, `checkBudgetForExpense`, `createJournalEntryForExpense`
  - Omitir `projectionLinks` en `getExpenseById`
  - Prisma: campos en snake_case (`company_id`, `full_number`, `category_id`, etc.)

**Tarea 3.2 — Funcion auxiliar getSuppliersForExpenses** [x]
- Dentro del mismo `actions.server.ts`, agregar:
  - `getSuppliersForExpenses()` — query local al modulo (no importar de otro modulo). Devuelve proveedores `{ id, code, business_name, tax_id }` ordenados por `business_name`

---

### Fase 4: Attachment actions
**Objetivo:** CRUD de adjuntos adaptado a Supabase Storage.

**Tarea 4.1 — Agregar bucket 'expenses' a StorageBucket**
- Modificar `src/shared/lib/storage.ts`: agregar `'expenses'` al union type `StorageBucket`
- Modificar `src/shared/lib/storage-server.ts`: agregar `'expenses'` al union type `StorageBucket`

**Tarea 4.2 — Crear attachment-actions.server.ts**
- Crear `src/modules/purchasing/features/expenses/attachment-actions.server.ts`
- Funciones:
  - `prepareExpenseAttachmentUpload(expenseId, fileName, fileSize, mimeType)` — valida que el gasto exista y pertenezca a la empresa, genera `fileKey` como `{company_id}/{expense_id}/{uuid}-{fileName}`, crea registro en `expense_attachments` con el key, retorna `{ attachmentId, fileKey, bucket: 'expenses' }` para que el client haga el upload directo
  - `confirmExpenseAttachmentUpload(attachmentId)` — (opcional, si se necesita marcar como completado)
  - `deleteExpenseAttachment(attachmentId)` — elimina registro de DB + archivo de Storage (`storageServer.remove('expenses', [fileKey])`)
  - `getExpenseAttachmentUrl(attachmentId)` — genera signed URL temporal via `storageServer.createSignedUrl('expenses', fileKey, 3600)`

---

### Fase 5: Columnas y DataTable
**Objetivo:** Definir columnas para TanStack Table + wrapper DataTable.

**Tarea 5.1 — Crear columns.tsx**
- Crear `src/modules/purchasing/features/expenses/list/columns.tsx`
- Columnas:
  - `full_number` — font-mono, link al detalle (modal)
  - `description` — truncated
  - `category` — `category.name`
  - `supplier` — `supplier.business_name` o "Sin proveedor"
  - `amount` — font-mono, alineado a la derecha, formato moneda
  - `date` — formato dd/MM/yyyy
  - `due_date` — formato dd/MM/yyyy o "-"
  - `status` — Badge con color segun estado (DRAFT=outline, CONFIRMED=default, PARTIAL_PAID=amber, PAID=green, CANCELLED=destructive)
  - `attachments` — icono Paperclip + count si > 0
  - `actions` — menu con Editar (solo DRAFT), Confirmar (solo DRAFT), Cancelar (DRAFT/CONFIRMED), Eliminar (solo DRAFT)

**Tarea 5.2 — Crear _ExpensesTable.tsx (client wrapper)**
- Crear `src/modules/purchasing/features/expenses/list/components/_ExpensesTable.tsx`
- Patron identico a `_InvoicesDataTable` o `_PurchaseOrdersDataTable`:
  - Props: `data, total, facets, categories`
  - `showFilterToggle`, `tableId: 'expenses'`
  - Filtros faceted: `status` (con labels), `category_id` (con names de categorias)
  - Filtros text: `full_number`, `supplier`
  - Filtros dateRange: `date`, `due_date`
  - Boton "Gestionar categorias" que abre `_CategoryManagementModal`
  - Boton "Nuevo gasto" que abre `_CreateExpenseModal`

---

### Fase 6: Componentes UI
**Objetivo:** Modales de creacion/edicion, detalle, categorias y adjuntos.

**Tarea 6.1 — _CreateExpenseModal.tsx**
- Crear `src/modules/purchasing/features/expenses/list/components/_CreateExpenseModal.tsx`
- Dialog con form (React Hook Form + Zod):
  - Campos: descripcion, monto, fecha, fecha vto (opcional), categoria (select), proveedor (SearchableSelect, opcional), notas (textarea, opcional)
  - Modo crear / editar (si recibe `expenseId`, carga datos con `getExpenseById`)
  - Submit: `createExpense` o `updateExpense`
  - Cerrar al exito + toast

**Tarea 6.2 — _ExpenseDetailModal.tsx**
- Crear `src/modules/purchasing/features/expenses/list/components/_ExpenseDetailModal.tsx`
- Dialog con detalle del gasto:
  - Header: numero, status badge, botones de accion (Editar, Confirmar, Cancelar, Eliminar segun status)
  - Info: descripcion, monto, fecha, vto, categoria, proveedor, notas
  - Seccion "Adjuntos" usando `_ExpenseAttachments`
  - Seccion "Ordenes de pago" si hay items de OP vinculados (numero de OP, monto, status)
  - Resumen: total, pagado, pendiente

**Tarea 6.3 — _ExpenseAttachments.tsx**
- Crear `src/modules/purchasing/features/expenses/components/_ExpenseAttachments.tsx`
- Componente para la seccion de adjuntos dentro del detalle:
  - Lista de adjuntos existentes (nombre, tamano, boton descargar, boton eliminar)
  - Boton "Agregar adjunto" con input file hidden
  - Upload: llama `prepareExpenseAttachmentUpload` -> sube a Supabase Storage via `storage.upload('expenses', fileKey, file)` -> confirma
  - Descarga: llama `getExpenseAttachmentUrl` -> abre en nueva ventana
  - Eliminar: confirma con AlertDialog -> llama `deleteExpenseAttachment`

**Tarea 6.4 — _CategoryManagementModal.tsx**
- Crear `src/modules/purchasing/features/expenses/components/_CategoryManagementModal.tsx`
- Dialog con tabla de categorias:
  - Lista con nombre, descripcion, estado (activo/inactivo), count de gastos
  - Botones: crear nueva, editar, toggle activa/inactiva
  - Form inline o sub-dialog para crear/editar (nombre + descripcion)
  - Usa `getAllExpenseCategories`, `createExpenseCategory`, `updateExpenseCategory`, `toggleExpenseCategory`

---

### Fase 7: Lista y pagina
**Objetivo:** Server component que carga datos + integracion en la ruta.

**Tarea 7.1 — Crear ExpensesList.tsx (server component)**
- Crear `src/modules/purchasing/features/expenses/list/ExpensesList.tsx`
- Llama `getExpensesPaginated(searchParams)`, `getExpenseFacetCounts()`, `getExpenseCategories()`
- Pasa data + total + facets + categories a `_ExpensesTable`

**Tarea 7.2 — Crear barrel export**
- Crear `src/modules/purchasing/features/expenses/index.ts`
- Exportar `ExpensesList`

**Tarea 7.3 — Agregar tab "Gastos" en la pagina de Compras**
- Modificar `src/app/dashboard/purchasing/page.tsx`:
  - Agregar `'expenses'` a `VALID_TABS`
  - Importar `ExpensesList` desde el barrel
  - Agregar `<UrlTabsTrigger value="expenses">Gastos</UrlTabsTrigger>` despues de "Remitos de recepcion"
  - Agregar `<UrlTabsContent value="expenses">` con Card wrapping `ExpensesList`
  - NO necesita boton "Nuevo" en el header (lo maneja el DataTable)

---

### Fase 8: Integracion con Ordenes de Pago
**Objetivo:** Permitir que las OPs paguen gastos ademas de facturas.

**Tarea 8.1 — Extender validator de items de OP**
- Modificar `src/modules/treasury/shared/payment-order-validators.ts`:
  - En `paymentOrderItemSchema`: agregar `expense_id: z.string().uuid().optional().nullable()`
  - Refine: al menos uno de `invoice_id` o `expense_id` debe estar presente, o ambos null (item libre)

**Tarea 8.2 — Extender createPaymentOrder y updatePaymentOrder**
- Modificar `src/modules/treasury/features/payment-orders/actions.server.ts`:
  - En `createPaymentOrder`: en el `items.create`, agregar `expense_id: i.expense_id || null`
  - En `updatePaymentOrder`: idem en el `items.create`
  - Crear funcion `getPendingExpenses(supplierId?: string)` dentro del mismo archivo (no importar del modulo purchasing). Query: gastos CONFIRMED/PARTIAL_PAID de la empresa, opcionalmente filtrados por `supplier_id`. Calcula saldo pendiente = total - sum(items de OP PAID). Retorna misma estructura que `getPendingPurchaseInvoices` adaptada.

**Tarea 8.3 — Extender markPaymentOrderAsPaid**
- Modificar `src/modules/treasury/features/payment-orders/actions.server.ts`:
  - En `markPaymentOrderAsPaid`: despues del loop de `invoiceIds`, agregar loop analogo para `expenseIds`:
    - Extraer `expense_id` de items (filtrar nulls, deduplicar)
    - Para cada `expenseId`: query aggregate de items con `expense_id` y `payment_order.status === 'PAID'`
    - Comparar paidSum con total del gasto
    - Actualizar status a `PAID` o `PARTIAL_PAID` segun corresponda

**Tarea 8.4 — Extender getPaymentOrderById**
- Modificar `src/modules/treasury/features/payment-orders/actions.server.ts`:
  - En el `include.items.include`: agregar `expense: { select: { id: true, full_number: true, date: true, amount: true } }`
  - En el mapeo de items: agregar `expense` al retorno

**Tarea 8.5 — Extender NewPaymentOrderForm para gastos**
- Modificar `src/modules/treasury/features/payment-orders/components/NewPaymentOrderForm.tsx`:
  - Agregar interface `ExpenseOption` (id, full_number, description, category_name, date, total, already_paid, remaining)
  - Agregar estado `pendingExpenses` y cargarlo en el useEffect del proveedor (llamar `getPendingExpenses(supplierId)`)
  - Agregar seccion "Gastos pendientes del proveedor" (similar a facturas pendientes) con tabla:
    - Columnas: Numero, Descripcion, Categoria, Fecha, Total, Pagado, Saldo, Agregar
  - Extender `ItemDraft` con `expense_id: string | null` y `expense_label: string | null`
  - Funcion `addExpenseItem(expense)` que agrega item con `expense_id` y amount = remaining
  - En el payload de submit: pasar `expense_id` en cada item
  - Agregar tambien una seccion/boton para ver gastos SIN proveedor (cuando no hay `supplierId` seleccionado o como tab adicional)

**Tarea 8.6 — Extender pending-balances para incluir gastos**
- Modificar `src/modules/treasury/features/pending-balances/actions.server.ts`:
  - Crear funcion `listPendingExpenses(filters)` analoga a `listPendingInvoices` pero consultando `expenses` con status CONFIRMED/PARTIAL_PAID
  - O bien extender `listPendingInvoices` para que retorne un campo `type: 'invoice' | 'expense'` y mezcle ambos resultados
  - Opcion recomendada: funcion separada `listPendingExpenses` con su propia interfaz `PendingExpenseRow` para no romper la existente. La UI puede usar tabs "Facturas" / "Gastos"

---

### Fase 9: Verificacion
**Objetivo:** Validar que todo compile, los tipos sean correctos y la funcionalidad basica funcione.

**Tarea 9.1 — Check de tipos**
- Ejecutar `npm run check-types` y corregir errores

**Tarea 9.2 — Build**
- Ejecutar `npm run build` y corregir errores

**Tarea 9.3 — Lint**
- Ejecutar `npm run lint` y corregir warnings/errores

**Tarea 9.4 — Pruebas manuales**
- Verificar que la tab "Gastos" aparece en `/dashboard/purchasing`
- Crear una categoria de gastos
- Crear un gasto en borrador
- Confirmar el gasto
- Adjuntar un archivo y descargarlo
- Crear una OP que incluya el gasto como item
- Marcar la OP como pagada y verificar que el gasto pasa a PAID
- Cancelar un gasto sin pagos

**Tarea 9.5 — Aplicar migracion**
- Ejecutar `npx supabase migration up` en local
- Ejecutar `npx prisma generate`
- Verificar que el schema quede sincronizado

---

### Resumen de archivos

**Archivos a CREAR (12):**
1. `supabase/migrations/YYYYMMDDHHMMSS_add_expenses_module.sql`
2. `src/modules/purchasing/features/expenses/validators.ts`
3. `src/modules/purchasing/features/expenses/actions.server.ts`
4. `src/modules/purchasing/features/expenses/attachment-actions.server.ts`
5. `src/modules/purchasing/features/expenses/list/columns.tsx`
6. `src/modules/purchasing/features/expenses/list/components/_ExpensesTable.tsx`
7. `src/modules/purchasing/features/expenses/list/components/_CreateExpenseModal.tsx`
8. `src/modules/purchasing/features/expenses/list/components/_ExpenseDetailModal.tsx`
9. `src/modules/purchasing/features/expenses/list/ExpensesList.tsx`
10. `src/modules/purchasing/features/expenses/components/_ExpenseAttachments.tsx`
11. `src/modules/purchasing/features/expenses/components/_CategoryManagementModal.tsx`
12. `src/modules/purchasing/features/expenses/index.ts`

**Archivos a MODIFICAR (7):**
1. `prisma/schema.prisma` — modelos + enum + relaciones (Fase 1)
2. `src/shared/lib/storage.ts` — bucket 'expenses' (Fase 4)
3. `src/shared/lib/storage-server.ts` — bucket 'expenses' (Fase 4)
4. `src/app/dashboard/purchasing/page.tsx` — tab Gastos (Fase 7)
5. `src/modules/treasury/shared/payment-order-validators.ts` — expense_id en items (Fase 8)
6. `src/modules/treasury/features/payment-orders/actions.server.ts` — getPendingExpenses, expense_id en create/update, markAsPaid con gastos (Fase 8)
7. `src/modules/treasury/features/payment-orders/components/NewPaymentOrderForm.tsx` — seccion gastos pendientes (Fase 8)
8. `src/modules/treasury/features/pending-balances/actions.server.ts` — listPendingExpenses (Fase 8)

### Orden de ejecucion

```
Fase 1 (DB + Prisma) ──> Fase 2 (Validators) ──> Fase 3 (Server actions) ──┐
                                                                             ├──> Fase 7 (Page) ──> Fase 9
Fase 4 (Attachments) ──> Fase 5 (Columns/Table) ──> Fase 6 (UI Modales) ──┘
                                                                             │
                                                                             └──> Fase 8 (Integracion OP)
```

Las fases 1-2 son prerrequisito de todo. Las fases 3-6 pueden ejecutarse en paralelo parcialmente (3 y 4 son independientes; 5 y 6 dependen de 3). La fase 7 integra todo. La fase 8 es independiente de las fases 5-7 pero requiere fase 1 y 3. La fase 9 va al final.

## 3. Diseno
_Pendiente - ejecutar `/disenar cod-modulo-gastos`_

## 4. Implementacion

### Fase 2 — Validators (2026-05-15)
- Creado `src/modules/purchasing/features/expenses/validators.ts`
- Schemas: `expenseFormSchema` (amount como string con regex 3 decimales, date como Date, campos snake_case), `expenseCategoryFormSchema`
- Constantes: `EXPENSE_STATUSES`, `EXPENSE_STATUS_LABELS`
- Types exportados: `ExpenseFormInput`, `ExpenseCategoryFormInput`

### Fase 3 — Server actions (2026-05-15)
- Creado `src/modules/purchasing/features/expenses/actions.server.ts`
- Adaptado de baxer-n con: `getActionContext()` en vez de `getActiveCompanyId()`, `requirePermission('compras.gastos.xxx')` en vez de `checkPermission()`, `fetchCurrentUser()` en vez de `auth()`, campos snake_case, sin logger/contabilidad/budget/proyecciones
- Categorias: `getExpenseCategories`, `getAllExpenseCategories`, `createExpenseCategory`, `updateExpenseCategory`, `toggleExpenseCategory`
- Gastos CRUD: `getExpensesPaginated` (DataTable pattern con faceted/text/dateRange filters, sort por relaciones), `getExpenseFacetCounts`, `getExpenseById` (con adjuntos, items OP, calculo paidAmount/pendingAmount), `createExpense` (auto-numeracion GTO-XXXXX), `updateExpense` (solo DRAFT), `confirmExpense` (DRAFT->CONFIRMED), `cancelExpense` (verifica sin pagos confirmados), `deleteExpense` (solo DRAFT, hard delete)
- Para OP: `getPendingExpenses(supplierId?)` con calculo de saldo pendiente
- Export: `getAllExpensesForExport`
- Auxiliar: `getSuppliersForExpenses` (query local, sin importar de otro modulo)

### Fases 5, 6 y 7 — Columnas, UI y Pagina (2026-05-15)

**Fase 5 — Columnas y DataTable:**
- Creado `src/modules/purchasing/features/expenses/list/columns.tsx` — columnas: full_number (link clickable), description (truncated), category.name, supplier.business_name, date/due_date (dd/MM/yyyy con overdue en rojo), amount (moneda $), status (Badge con colores por estado), actions (dropdown con ver/editar/confirmar/cancelar/eliminar segun status). Usa date-fns en vez de moment.
- Creado `src/modules/purchasing/features/expenses/list/components/_ExpensesDataTable.tsx` — client wrapper con filtros faceted (status, category_id), text (full_number, description, supplier), dateRange (date, due_date). Incluye AlertDialogs para confirmar/cancelar/eliminar, modales de detalle y edicion, export config, showFilterToggle, tableId='expenses-list'.

**Fase 6 — Componentes UI:**
- Creado `src/modules/purchasing/features/expenses/list/components/_CreateExpenseModal.tsx` — Dialog con RHF+Zod, campos: description, amount, date, due_date, category_id (SearchableSelect), supplier_id (SearchableSelect, opcional), notes. Modo crear/editar. Carga catalogos con useEffect (sin React Query). Boton gestionar categorias integrado.
- Creado `src/modules/purchasing/features/expenses/list/components/_ExpenseDetailModal.tsx` — Dialog read-only con info general, resumen financiero (total/pagado/pendiente), ordenes de pago vinculadas, adjuntos. Acciones: confirmar (solo DRAFT), cancelar (DRAFT/CONFIRMED sin pagos). Sin proyecciones ni contabilidad.
- Creado `src/modules/purchasing/features/expenses/components/_CategoryManagementModal.tsx` — Dialog con CRUD de categorias: form inline para crear, lista con edicion in-place, toggle activa/inactiva, count de gastos. Usa useState+useEffect (sin React Query).

**Fase 7 — Lista y Pagina:**
- Creado `src/modules/purchasing/features/expenses/list/ExpensesList.tsx` — server component que fetch getExpensesPaginated + getExpenseFacetCounts + getExpenseCategories, pasa datos a _ExpensesDataTable.
- Creado `src/modules/purchasing/features/expenses/index.ts` — barrel export de ExpensesList.
- Modificado `src/app/dashboard/purchasing/page.tsx` — agregado tab "Gastos" (value="expenses") con Suspense + ExpensesList. VALID_TABS extendido con 'expenses'.

**Verificacion:** `npm run check-types` pasa sin errores.

## 5. Verificacion
_Pendiente - ejecutar `/verificar cod-modulo-gastos`_
