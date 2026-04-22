# Migración: Tipos de Documentos (desde base_erp)

**Estado:** Planificación completada
**Fecha:** 2026-03-19
**Prioridad:** Alta (feature actual no funciona)

---

## 1. Análisis

### 1.1 Problema actual
El formulario de crear tipos de documentos da error. La implementación actual tiene:
- Componentes monolíticos (EditDocumenTypeModal: 1700+ líneas)
- Typos en campo de DB (`explired`, `is_it_montlhy`)
- Hook complejo (`useNewDocumentType`) con lógica de preview/conteo mezclada
- Condiciones almacenadas como `Json[]` con metadata compleja
- Submit button separado del form (hack: `document.getElementById('create_new_document')?.click()`)

### 1.2 Schema de DB (NO se modifica)
```prisma
model document_types {
  id            String           @id @default(uuid()) @db.Uuid
  name          String           @unique
  applies       document_applies // enum: Persona, Equipos, Empresa
  multiresource Boolean
  mandatory     Boolean
  explired      Boolean          // typo pero es el campo real
  special       Boolean          // = isConditional
  is_active     Boolean          @default(true)
  description   String?
  company_id    String?          @db.Uuid
  private       Boolean?
  is_it_montlhy Boolean?         // typo pero es el campo real
  down_document Boolean?         // = isTermination
  conditions    Json[]
}
```
**Decisión:** Mantener el schema actual. NO crear migraciones de DB. Adaptar base_erp al schema existente.

### 1.3 Mapeo de campos base_erp → codeControl

| base_erp | codeControl DB | Notas |
|----------|---------------|-------|
| name | name | Directo |
| appliesTo (EMPLOYEE/EQUIPMENT/COMPANY) | applies (Persona/Equipos/Empresa) | Mapear enums |
| isMandatory | mandatory | |
| hasExpiration | explired | Typo en DB, mantener |
| isMonthly | is_it_montlhy | Typo en DB, mantener |
| isPrivate | private | |
| isTermination | down_document | |
| isMultiResource | multiresource | |
| isConditional | special | |
| description | description | |
| conditions (junction tables) | conditions (Json[]) | Mantener formato Json existente |

### 1.4 Archivos actuales a reemplazar
- `src/modules/documents/features/types/components/TypesDocumentAction.tsx` — trigger del modal
- `src/modules/documents/features/types/components/NewDocumentType.tsx` — form
- `src/modules/documents/features/types/components/NewDocumentType/useNewDocumentType.ts` — hook (470 líneas)
- `src/modules/documents/features/types/components/NewDocumentType/constants.ts`
- `src/modules/documents/features/types/components/NewDocumentType/helpers.ts`
- `src/modules/documents/features/types/components/NewDocumentType/SpecialConditions.tsx`
- `src/modules/documents/features/types/components/EditDocumenTypeModal.tsx` — edit (1700 líneas)
- `src/modules/documents/features/types/components/TypesDocumentsView.tsx` — lista
- `src/modules/documents/features/types/actions.server.ts` — server actions

### 1.5 Archivos de referencia (base_erp)
- `base_erp/src/modules/documents/features/document-types/list/components/_DocumentTypeFormModal.tsx`
- `base_erp/src/modules/documents/features/document-types/list/components/_ConditionsSection.tsx`
- `base_erp/src/modules/documents/features/document-types/list/components/_EmployeeConditions.tsx`
- `base_erp/src/modules/documents/features/document-types/list/components/_EquipmentConditions.tsx`
- `base_erp/src/modules/documents/features/document-types/list/components/_DocumentTypesDataTable.tsx`
- `base_erp/src/modules/documents/features/document-types/list/columns.tsx`
- `base_erp/src/modules/documents/features/document-types/list/actions.server.ts`

### 1.6 Consumidores (donde se usa TypesDocumentsView/TypesDocumentAction)
- `/dashboard/employee/page.tsx` — tab "Tipos de documentos" (personas)
- `/dashboard/equipment/page.tsx` — tab "Tipos de documentos" (equipos)
- `/dashboard/document/page.tsx` — tab "Tipos de documentos" (all)

---

## 2. Planificación

### 2.1 Fases de implementación

#### Fase 1: Server actions CRUD
- **Objetivo:** Reescribir las actions para crear, editar, listar y eliminar tipos de documentos
- **Tareas:**
  - [ ] Reescribir `src/modules/documents/features/types/actions.server.ts` con:
    - `createDocumentType(input)` — crear con validación de nombre único por empresa, condiciones como Json[]
    - `updateDocumentType(id, input)` — editar preservando condiciones
    - `deleteDocumentType(id)` — verificar que no hay documentos asociados antes de eliminar
    - `getDocumentTypeById(id)` — para cargar datos en el modal de edición
    - `getDocumentTypesPaginated(searchParams, appliesFilter?)` — para la DataTable
    - `getDocumentTypeFacets(appliesFilter?)` — facets para filtros
    - `getAllDocumentTypesForExport(searchParams, appliesFilter?)` — para Excel
    - `updateDocumentTypeActive(id, isActive)` — toggle activo/inactivo (mantener existente)
  - [ ] Validaciones: nombre no vacío, nombre único por empresa, applies válido
  - [ ] Mapear input de form (camelCase) → DB (snake_case con typos)
- **Archivos:** `src/modules/documents/features/types/actions.server.ts`
- **Criterio:** Todas las actions compilan y manejan errores correctamente

#### Fase 2: Modal de crear/editar (form)
- **Objetivo:** Componente de form reutilizable para crear y editar, basado en base_erp
- **Tareas:**
  - [ ] Crear `src/modules/documents/features/types/components/DocumentTypeFormModal.tsx`
    - Dialog modal (no AlertDialog — para mejor UX)
    - React Hook Form + Zod schema
    - Campos: name, applies (Select), checkboxes (mandatory, explired, is_it_montlhy, private, down_document, multiresource), description (textarea)
    - Lógica: si applies='Empresa', ocultar multiresource y down_document
    - Lógica: si down_document=true, deshabilitar is_it_montlhy/explired/special/multiresource y forzar mandatory=true
    - Lógica: is_it_montlhy y explired son mutuamente excluyentes
    - Modo edición: cargar datos existentes via `getDocumentTypeById(id)`
    - Submit: llamar createDocumentType o updateDocumentType
    - Toast de éxito/error
    - Cerrar modal y refrescar datos al éxito
  - [ ] Crear `src/modules/documents/features/types/components/ConditionsSection.tsx`
    - Switch toggle "Documento condicional"
    - Si activado, mostrar sección colapsable con condiciones
    - Para Persona: gender, guild, covenants, category, hierarchical_position, type_of_contract
    - Para Equipos: brand, type_of_vehicle
    - Cada condición: Select multi-value con opciones del catálogo
    - Las opciones se cargan de las tablas de catálogo existentes (hierarchy, guilds, covenants, categories, vehicle brands, vehicle types)
  - [ ] Adaptar formato de condiciones al Json[] existente en DB
- **Archivos:** 2 nuevos componentes
- **Criterio:** Crear y editar tipos de documentos funciona sin errores

#### Fase 3: Lista con DataTable
- **Objetivo:** Reemplazar TypesDocumentsView con la nueva DataTable server-side
- **Tareas:**
  - [ ] Crear `src/modules/documents/features/types/components/document-type-columns.tsx`
    - Columnas: actions, name, applies, mandatory, explired, is_it_montlhy, multiresource, private, special, down_document, is_active
    - Badges para booleanos (Si/No)
    - Badge de applies con color
    - Actions: editar (abre modal), toggle activo, eliminar (con confirmación)
  - [ ] Crear `src/modules/documents/features/types/components/DocumentTypeRowActions.tsx`
    - Editar: abre DocumentTypeFormModal en modo edición
    - Activar/Desactivar: toggle is_active
    - Eliminar: confirmar y llamar deleteDocumentType
  - [ ] Crear `src/modules/documents/features/types/components/DocumentTypeList.tsx` (server)
    - Recibe searchParams + appliesFilter (Persona/Equipos/Empresa/all)
    - Llama getDocumentTypesPaginated
  - [ ] Crear `src/modules/documents/features/types/components/_DocumentTypeDataTable.tsx` (client)
    - Facets: applies, mandatory, is_active
    - Búsqueda por nombre
    - Toggle de filtros
    - Export Excel
  - [ ] Crear `src/modules/documents/features/types/components/TypesDocumentsView.tsx` (nuevo)
    - Recibe `searchParams` y props de filtro (personas, equipos, empresa)
    - Renderiza DocumentTypeList con el filtro apropiado
    - Botón "Crear nuevo" que abre DocumentTypeFormModal
- **Archivos:** 5-6 nuevos componentes
- **Criterio:** Lista paginada con filtros, crear/editar/eliminar funcional

#### Fase 4: Integración en pages
- **Objetivo:** Conectar la nueva implementación en las 3 pages que la usan
- **Tareas:**
  - [ ] Actualizar `/dashboard/employee/page.tsx` — tab "Tipos de documentos" usa nuevo TypesDocumentsView
  - [ ] Actualizar `/dashboard/equipment/page.tsx` — idem
  - [ ] Actualizar `/dashboard/document/page.tsx` — idem
  - [ ] Pasar searchParams a TypesDocumentsView
  - [ ] Eliminar TypesDocumentAction (el botón "Crear nuevo" está en TypesDocumentsView)
  - [ ] Verificar que el filtro de applies funciona correctamente en cada page
- **Archivos:** 3 pages + eliminar TypesDocumentAction
- **Criterio:** Las 3 pages renderizan la nueva lista y permiten CRUD

#### Fase 5: Limpieza y verificación
- **Objetivo:** Eliminar código viejo, verificar todo
- **Tareas:**
  - [ ] Eliminar archivos viejos:
    - `NewDocumentType.tsx` y su directorio (`useNewDocumentType.ts`, `constants.ts`, `helpers.ts`, `SpecialConditions.tsx`)
    - `EditDocumenTypeModal.tsx` (1700 líneas)
    - `TypesDocumentAction.tsx`
    - `TypesDocumentsView.tsx` viejo
  - [ ] npm run check-types
  - [ ] Verificar en browser: crear, editar, eliminar, activar/desactivar
  - [ ] Verificar que los tipos de documentos existentes se muestran correctamente
  - [ ] Verificar condiciones en modo edición
  - [ ] Commit
- **Archivos:** Eliminar ~2500 líneas de código viejo
- **Criterio:** 0 errores, CRUD completo funcional, condiciones ok

### 2.2 Orden de ejecución
```
Fase 1 (actions) → Fase 2 (form modal) → Fase 3 (lista DataTable) → Fase 4 (pages) → Fase 5 (limpieza)
```
- Fases 1 y 3 (actions + columnas/lista) son parcialmente independientes
- Fase 2 depende de Fase 1 (actions)
- Fase 4 depende de 2 y 3
- Fase 5 depende de 4

### 2.3 Estimación de complejidad
- Fase 1: **media** — CRUD con Prisma, mapeo de campos, validaciones
- Fase 2: **alta** — form con lógica condicional, condiciones dinámicas, modo edición
- Fase 3: **media** — seguir patrón de DataTable ya establecido
- Fase 4: **baja** — integración mecánica en pages
- Fase 5: **baja** — limpieza y verificación

### 2.4 Decisiones de diseño

#### Condiciones: mantener formato Json[]
Las condiciones se guardan como `Json[]` en la DB. NO migramos a tablas de junction (como base_erp) porque:
- Requeriría migraciones de DB y migración de datos existentes
- El formato Json funciona para la funcionalidad requerida
- El schema actual tiene `conditions Json[]` y hay datos existentes

El formato de cada condición en el array es:
```typescript
{
  property: string;       // 'gender', 'guild', 'brand', etc.
  values: string[];       // Valores seleccionados (IDs o strings)
  label: string;          // Nombre para mostrar: 'Género', 'Gremio', etc.
}
```

Simplificamos el formato actual (que tiene metadata excesiva como `relation_type`, `column_on_employees`, etc.) a un formato más limpio pero compatible.

#### Form: Dialog en vez de AlertDialog
Base_erp usa Dialog para el modal. Es mejor UX porque:
- Permite scroll interno
- Tiene botón de cierre X
- No depende de hacks como `document.getElementById().click()`

#### Catálogos para condiciones
Las opciones de los selects de condiciones se cargan de las tablas existentes:
- Género: valores fijos del enum
- Gremio: `guilds` table
- Convenio: `covenants` table
- Categoría: `categories` table
- Posición jerárquica: `hierarchy` table
- Tipo de contrato: valores del enum
- Marca (equipos): `brand_vehicles` table
- Tipo de vehículo: `type_of_vehicles` table

Se crean server actions para cargar estos catálogos.
