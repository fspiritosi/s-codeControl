# Migración de DataTables a componente server-side

**Estado:** Planificación completada
**Fecha:** 2026-03-19
**Scope inicial:** Tabla de empleados (modelo para migrar las demás)

---

## 1. Análisis

### 1.1 Estado actual de la tabla de empleados

**Componente:** `src/modules/employees/features/list/components/data-table.tsx` (720 líneas)
**Columnas:** `src/modules/employees/features/list/components/columns.tsx` (631 líneas)

**Problemas identificados:**
- Todo es client-side: se cargan TODOS los empleados al cliente y se filtra en memoria
- Componente monolítico de 720 líneas con tabla, filtros, persistencia y lógica de roles mezclados
- Persistencia en `sessionStorage` + `localStorage` (frágil, no portable)
- 18 filtros tipo Select generados dinámicamente desde los datos cargados
- Columna `actions` de 300 líneas inline con dialogs de baja/reintegración
- Violación de regla "no cross-module imports": `documents` y `company` importan directamente de `employees`

**Consumidores actuales (3):**
1. `src/modules/documents/features/list/components/EmployeeListTabs.tsx` — server component que pasa data al client
2. `src/modules/company/features/customers/components/CustomerComponent.tsx` — client component que filtra por `allocated_to`
3. `src/app/dashboard/employee/page.tsx` → `EmployeeListTabs`

**Datos del store:** Los datos vienen de `fetchAllEmployees()` → store Zustand → se pasan como prop `data`.

### 1.2 Componente DataTable nuevo (de base_erp)

**Ubicación:** `src/shared/components/common/DataTable/`
**Patrón:** 3 capas (page → server component → client component)

**Características:**
- Paginación, sorting y filtrado server-side (Prisma)
- Estado sincronizado con URL (searchParams)
- Filtros faceted con conteos del server
- Filtros de texto y rango de fecha
- Visibilidad de columnas y filtros persistida en DB
- Export a Excel con branding
- Helpers de Prisma listos (`parseSearchParams`, `stateToPrismaParams`, `buildSearchWhere`, etc.)

### 1.3 Columnas de empleados a mantener

**Visibles por defecto:** `full_name`, `status`, `cuil`, `document_number`, `document_type`, `hierarchical_position`, `company_position`, `normal_hours`, `type_of_contract`, `allocated_to`

**Todas las columnas definidas:** 34 (incluyendo `actions`, `picture`, `showUnavaliableEmployees`)

**Filtros actuales (18):** `document_type`, `hierarchical_position`, `type_of_contract`, `allocated_to`, `nationality`, `birthplace`, `gender`, `marital_status`, `level_of_education`, `province`, `affiliate_status`, `city`, `hierrical_position`, `workflow_diagram`, `status`, `guild`, `covenants`, `category`

### 1.4 Server actions existentes

- `fetchAllEmployeesWithRelations()` — trae todo con relations (guild, covenant, category, city, province, etc.)
- `fetchAllEmployees(role?)` — trae todo, lógica especial para Invitado
- `fetchEmployeesWithDocs(companyId)` — trae con documentos
- No existe ninguna action paginada

---

## 2. Planificación

### 2.1 Fases de implementación

#### Fase 1: Server action paginada para empleados
- **Objetivo:** Crear la action que alimente la nueva DataTable con paginación, sorting, filtrado y facets
- **Tareas:**
  - [ ] Crear `getEmployeesPaginated(searchParams)` en `src/modules/employees/features/list/actions.server.ts`
    - Usar `parseSearchParams()` y `stateToPrismaParams()` de los helpers
    - Usar `buildSearchWhere()` para búsqueda global (campos: `firstname`, `lastname`, `cuil`, `document_number`, `email`)
    - Usar `buildFiltersWhere()` para filtros faceted
    - Include relations: `guild_rel`, `covenants_rel`, `category_rel`, `city_rel`, `province_rel`, `workflow_diagram_rel`, `hierarchy_rel`, `birthplace_rel`, `contractor_employee` (con `contractor`)
    - Retornar `{ data, total }` tipado
  - [ ] Crear `getEmployeeFacets()` que retorne `Record<string, Map<string, number>>` con conteos agrupados para los filtros principales (`status`, `type_of_contract`, `hierarchical_position`, `document_type`, `gender`, `allocated_to`)
  - [ ] Crear `getAllEmployeesForExport(searchParams)` — misma query que paginada pero sin `skip`/`take`, para export Excel
- **Archivos:** `src/modules/employees/features/list/actions.server.ts`
- **Criterio de completitud:** `npm run check-types` pasa, las 3 funciones exportan correctamente

#### Fase 2: Definición de columnas (nuevo formato)
- **Objetivo:** Reescribir las columnas con el formato del nuevo DataTable (`meta.title`, `DataTableColumnHeader`, etc.)
- **Tareas:**
  - [ ] Crear `src/modules/employees/features/list/components/employee-columns.tsx` (nuevo archivo, no tocar el viejo aún)
    - Cada columna con `meta: { title: 'Nombre Columna' }`
    - Columna `actions` extraída como componente separado `EmployeeRowActions.tsx`
    - Columna `status` con Badge y el mapeo correcto (Avalado→success, etc.)
    - Columna `picture` con avatar
    - Columna `allocated_to` con resolución de nombre vía accessor
    - Columna `full_name` con link a detalle
    - Columnas de fecha formateadas con `date-fns`
  - [ ] Crear `src/modules/employees/features/list/components/EmployeeRowActions.tsx`
    - Extraer los dialogs de baja/reintegración del monolito
    - Mantener la lógica de roles
- **Archivos:** 2 nuevos archivos en `src/modules/employees/features/list/components/`
- **Criterio de completitud:** Las columnas son un array exportable, `EmployeeRowActions` funciona standalone

#### Fase 3: Componentes de vista (server + client wrappers)
- **Objetivo:** Crear los wrappers siguiendo el patrón de 3 capas del nuevo DataTable
- **Tareas:**
  - [ ] Crear `src/modules/employees/features/list/components/EmployeeList.tsx` (Server Component)
    - Recibe `searchParams` del page
    - Llama `getEmployeesPaginated(searchParams)`
    - Renderiza `_EmployeeDataTable` pasando `data`, `totalRows`, `searchParams`
  - [ ] Crear `src/modules/employees/features/list/components/_EmployeeDataTable.tsx` (Client Component)
    - `'use client'`
    - Carga facets (puede ser con useEffect + server action, o con react-query si se agrega)
    - Configura `facetedFilters` con las opciones y conteos
    - Renderiza `<DataTable>` del nuevo componente
    - Props: `data`, `totalRows`, `searchParams`, `role`
    - `initialColumnVisibility` basada en las columnas visibles por defecto
    - `tableId: 'employees-list'` para persistencia
  - [ ] Configurar `exportConfig` para descarga Excel de empleados
- **Archivos:** 2 nuevos archivos en `src/modules/employees/features/list/components/`
- **Criterio de completitud:** Renderiza la tabla con datos, paginación y filtros funcionan, export funciona

#### Fase 4: Integrar en la page y migrar consumidores
- **Objetivo:** Conectar la nueva tabla en la ruta `/dashboard/employee` y migrar/adaptar los otros consumidores
- **Tareas:**
  - [ ] Modificar `src/app/dashboard/employee/page.tsx` para pasar `searchParams` a `EmployeeListTabs`
  - [ ] Modificar `EmployeeListTabs.tsx` para usar `EmployeeList` (server component nuevo) en vez de `EmployeesTable`
  - [ ] Para `CustomerComponent.tsx` (company module): mantener la tabla vieja temporalmente con un import desde `shared/` o crear variante client-side — evaluar en el momento
  - [ ] Verificar lógica de rol `"Invitado"` en la nueva implementación
  - [ ] Verificar tabs activos/inactivos (filtrar por `is_active` server-side)
- **Archivos:** `page.tsx`, `EmployeeListTabs.tsx`, posiblemente `CustomerComponent.tsx`
- **Criterio de completitud:** `/dashboard/employee` funciona con la nueva tabla, tabs activos/inactivos ok, filtros y paginación server-side

#### Fase 5: Limpieza y verificación
- **Objetivo:** Eliminar código viejo, verificar que nada se rompió
- **Tareas:**
  - [ ] Eliminar `data-table.tsx` viejo (720 líneas) si ya no tiene consumidores
  - [ ] Eliminar `columns.tsx` viejo si fue reemplazado completamente
  - [ ] Actualizar barrel export `src/modules/employees/index.ts` con las nuevas exports
  - [ ] `npm run check-types`
  - [ ] Verificar visual en browser: light mode y dark mode
  - [ ] Verificar que `CustomerComponent` sigue funcionando (si se mantuvo la tabla vieja para ese caso)
  - [ ] Commit
- **Archivos:** Eliminar viejos, actualizar `index.ts`
- **Criterio de completitud:** 0 errores TypeScript, 0 errores en consola, tabla funcional en browser

### 2.2 Orden de ejecución

```
Fase 1 (server action) → Fase 2 (columnas) → Fase 3 (wrappers) → Fase 4 (integración) → Fase 5 (limpieza)
```

- Fases 1 y 2 son independientes entre sí y pueden hacerse en paralelo
- Fase 3 depende de 1 y 2
- Fase 4 depende de 3
- Fase 5 depende de 4

### 2.3 Estimación de complejidad
- Fase 1: **media** — queries Prisma con helpers, patrón conocido
- Fase 2: **media** — 34 columnas para definir, pero mecánico
- Fase 3: **media** — seguir patrón de DOCS.md, principal complejidad en facets
- Fase 4: **media-alta** — integrar con page/tabs existentes, manejar caso CustomerComponent
- Fase 5: **baja** — limpieza mecánica

### 2.4 Notas para migrar otras tablas

Este plan sirve como template. Para migrar cualquier otra tabla (equipos, documentos, etc.):

1. **Copiar la estructura de fases** — siempre es: action paginada → columnas → wrappers → integración → limpieza
2. **Server action paginada** — siempre sigue el mismo patrón:
   - `parseSearchParams()` → `stateToPrismaParams()` → `buildSearchWhere()` + `buildFiltersWhere()`
   - Retornar `{ data, total }`
3. **Columnas** — siempre necesitan `meta: { title }`, acciones en componente separado
4. **Wrappers** — siempre: Server Component (fetch) + Client Component (`'use client'`, facets, `<DataTable>`)
5. **Los filtros faceted** cambian por tabla, pero el patrón es idéntico: `groupBy` en Prisma, retornar `{ value, count }[]`
6. **El export config** siempre necesita `fetchAllData` (sin paginación) + `options` + `formatters` opcionales
7. **Priorizar base_erp** sobre la implementación actual cuando hay diferencias

### 2.5 Lecciones aprendidas (empleados)

Estas notas aplican a TODAS las migraciones futuras:

#### Prisma `groupBy` con enums
- **NO usar** `{ [field]: { not: null } }` en el `where` del `groupBy` — falla con campos de tipo enum en Prisma 7+
- En su lugar, ejecutar `groupBy` sin filtro de null en el where y **filtrar nulls/vacíos en el resultado** con `.filter(item => item[field] != null && item[field] !== '')`

#### Formato `_count` en Prisma 7
- `groupBy({ _count: { _all: true } })` retorna `{ _count: { _all: number } }`, no `{ _count: number }`
- Siempre acceder como: `item._count?._all ?? item._count ?? 0` para compatibilidad

#### Campos computados (ej: `full_name`)
- Prisma no tiene campos calculados. Si la tabla no tiene un campo `full_name`, usar `accessorFn` en la columna:
  ```ts
  { id: 'full_name', accessorFn: (row) => `${row.lastname ?? ''} ${row.firstname ?? ''}`.trim() }
  ```
- Los campos con `accessorFn` necesitan `id` explícito

#### Campos FK que muestran UUID (ej: `hierarchical_position`)
- Si una columna muestra un UUID en vez del nombre, agregar un cell renderer que lea la relación:
  ```ts
  cell: ({ row }) => row.original.hierarchy_rel?.name ?? row.getValue('hierarchical_position')
  ```

#### `command.tsx` y cmdk v1
- El `command.tsx` de shadcn viejo usa `data-[disabled]` que matchea cualquier valor — en cmdk v1 todos los items tienen `data-disabled=""` por defecto, causando que se vean disabled
- **Siempre usar** `data-[disabled=true]` y `data-[selected=true]` en CommandItem
- Si los filtros faceted se ven disabled/grayed-out, verificar el `command.tsx` del proyecto

#### Filtros: configuración completa
- Definir TODOS los filtros disponibles como un array `FILTER_DEFINITIONS`
- Usar `showFilterToggle={true}` para que el usuario elija cuáles ver
- Definir `initialFilterVisibility` con solo los filtros principales visibles por defecto
- Los filtros faceted necesitan `options` + `externalCounts` del server
- Para columnas de texto libre (ej: `company_position`, `allocated_to`), usar `type: 'text'` en vez de faceted

#### Patrón del client wrapper (`_XxxDataTable.tsx`)
- Cargar facets con `useEffect` + server action
- Construir `facetedFilters` con `useMemo` dependiente de los facets
- Los filtros se renderizan SOLO si la columna existe en TanStack (`table.getColumn(columnId)`)
- Las columnas hidden siguen registradas en TanStack, así que sus filtros funcionan

#### Page → searchParams
- El page de Next.js debe recibir `searchParams` como prop y pasarlos al server component
- En Next.js 15+, `searchParams` es una Promise: `const resolved = await searchParams`

---

## 3. Diseño Técnico

_Pendiente — ejecutar `/disenar migracion-datatables`_

## 4. Implementación

_Pendiente — ejecutar `/implementar migracion-datatables`_

## 5. Verificación

_Pendiente — ejecutar `/verificar migracion-datatables`_
