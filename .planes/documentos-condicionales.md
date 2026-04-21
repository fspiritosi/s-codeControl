# Documentos Condicionales

**Fecha de inicio:** 2026-03-30
**Estado:** Implementacion completada (3 fases completadas)
**Issue:** COD-364

---

## 1. Analisis

### 1.1 Problema

El sistema de tipos de documento tiene un campo `special` (boolean) y `conditions` (Json[]) en la tabla `document_types`, pero actualmente:

1. **No hay UI para configurar condiciones reales.** El `ConditionsSection.tsx` es solo texto informativo que lista los campos disponibles, sin inputs para seleccionarlos.
2. **Las condiciones siempre se guardan vacias.** En `DocumentTypeFormModal.tsx` linea 231: `conditions: []` se hardcodea al enviar el form.
3. **No existe logica de evaluacion.** No hay ninguna funcion que determine si un tipo de documento condicional aplica a un empleado/equipo especifico segun sus atributos.
4. **El dashboard/overview ignora condiciones.** `getDashboardCounts()` cuenta documentos vencidos/por vencer sin filtrar por condiciones, por lo que un documento condicional que no aplica a un empleado podria contarse como faltante.
5. **Las vistas de documentos por empleado/equipo no filtran.** Al mostrar documentos faltantes o requeridos, no se excluyen tipos condicionales que no aplican al recurso.

**Resultado:** El checkbox "especial" es un flag visual sin efecto funcional. Para que un tipo de documento aplique solo a ciertos empleados/equipos, no hay mecanismo real.

### 1.2 Contexto actual

#### Schema de DB (`document_types`)
- `special` Boolean -- flag existente, se mantiene como indicador de "es condicional"
- `conditions` Json[] -- array de JSON objects, existe en DB pero siempre vacio
- No hay tablas join para condiciones (a diferencia de base_erp que usa tablas pivote)

#### Modelo de condiciones en Zod (schemas.ts, linea ~792)
Ya existe un schema Zod para conditions con estructura compleja:
```typescript
conditions: z.array(z.object({
  ids: z.array(z.string()),
  values: z.array(z.string()),
  is_relation: z.boolean(),
  property_key: z.string(),
  filter_column: z.string(),
  relation_type: z.string(),
  property_label: z.string(),
  relation_table: z.string(),
  reference_values: z.array(z.object({ id: z.string(), value: z.string() })),
  is_array_relation: z.boolean(),
  column_on_relation: z.string(),
  column_on_employees: z.string(),
}))
```
Este schema es demasiado complejo y generico. Se simplificara a un formato mas directo.

#### Tipo en actions.server.ts (document types)
```typescript
conditions?: { property: string; values: string[]; label: string }[]
```
Este tipo es mas simple pero no distingue enum vs relacion.

#### Form actual (`DocumentTypeFormModal.tsx`)
- Schema local con `special: z.boolean()`
- Checkbox "special" en array de checkboxes con tooltip
- Cuando `special && applies !== 'Empresa'`, muestra `<ConditionsSection>` (solo texto)
- Al submit: `conditions: []` siempre

#### ConditionsSection.tsx
Componente puramente informativo. Recibe `applies` y muestra texto estatico.

#### Columnas de tabla (`document-type-columns.tsx`)
Columna `special` con header "Condicional" -- ya renombrada visualmente.

#### FilterComponent.tsx (lista de documentos legacy)
Tiene filtro por `special` con label "Es especial?" -- deberia actualizarse a "Condicional".

#### ShowDocument.tsx
Muestra texto "Este documento tiene consideraciones especiales" cuando `special=true`. Sin detalles de condiciones.

#### Dashboard overview (`actions.server.ts`)
`fetchDashboardCounts` cuenta documentos vencidos/por vencer sin evaluar condiciones. No hay calculo de documentos faltantes por empleado.

#### Campos de empleados disponibles para condiciones (Prisma schema)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `gender` | `gender_enum` (Masculino, Femenino, No_Declarado) | Enum directo |
| `hierarchical_position` | `String? @db.Uuid` | FK a `hierarchy` (id, name) |
| `type_of_contract` | `type_of_contract_enum` (Periodo_de_prueba, A_tiempo_indeterminado, Plazo_fijo) | Enum directo |
| `category_id` | `String? @db.Uuid` | FK a `category` (id, name, covenant_id) |
| `covenants_id` | `String? @db.Uuid` | FK a `covenant` (id, name, guild_id) |
| `guild_id` | `String? @db.Uuid` | FK a `guild` (id, name) |

#### Campos de equipos disponibles para condiciones

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `brand` | `BigInt` | FK a `brand_vehicles` (id BigInt, name) |
| `type_of_vehicle` | `BigInt` | FK a `types_of_vehicles` (id BigInt, name) |

**Nota importante:** Las FKs de vehicles (`brand`, `type_of_vehicle`) usan `BigInt` como PK, no UUID. Esto impacta el formato JSON de condiciones.

### 1.3 Archivos involucrados

#### Archivos a CREAR

| Archivo | Descripcion |
|---------|-------------|
| `src/shared/lib/documentConditions.ts` | Logica de evaluacion: `checkDocumentTypeAppliesToEmployee()`, `checkDocumentTypeAppliesToEquipment()`, `filterDocumentTypesForEmployee()`, `filterDocumentTypesForEquipment()` |
| `src/shared/config/documentConditions.ts` | Configuracion de campos disponibles por tipo (Persona/Equipos), mapeo de enums, helpers |
| `src/modules/documents/features/types/components/EmployeeConditions.tsx` | UI de seleccion de condiciones para empleados (gender, hierarchy, contract, category, covenant, guild) |
| `src/modules/documents/features/types/components/EquipmentConditions.tsx` | UI de seleccion de condiciones para equipos (brand, type_of_vehicle) |

#### Archivos a MODIFICAR

| Archivo | Cambios |
|---------|---------|
| `src/modules/documents/features/types/components/ConditionsSection.tsx` | Reescribir completamente: Switch de activacion + contenido colapsable con sub-componentes de condiciones |
| `src/modules/documents/features/types/components/DocumentTypeFormModal.tsx` | Integrar estado de condiciones, pasar condiciones reales al submit en vez de `[]`, cargar condiciones existentes al editar |
| `src/modules/documents/features/types/actions.server.ts` | Ajustar tipo `CreateDocumentTypeInput.conditions` al nuevo formato JSON. Validar condiciones en create/update |
| `src/shared/zodSchemas/schemas.ts` | Simplificar schema de `conditions` al nuevo formato |
| `src/modules/documents/features/manage/components/ShowDocument.tsx` | Mostrar detalle de condiciones cuando `special=true` (listar condiciones configuradas) |
| `src/modules/documents/features/list/components/FilterComponent.tsx` | Renombrar label "Es especial?" a "Condicional" |
| `src/modules/dashboard/features/overview/actions.server.ts` | Evaluar condiciones al calcular contadores (fase posterior, ver riesgos) |
| `src/shared/actions/catalogs.ts` | Agregar queries para guild, covenant y brand_vehicles si no existen |

### 1.4 Dependencias

#### Tablas de catalogos necesarias para los selects de condiciones

**Empleados:**
| Catalogo | Tabla | PK | Campos utiles | Query existente |
|----------|-------|----|---------------|-----------------|
| Posicion jerarquica | `hierarchy` | UUID | name | `fetchHierarchy()` en catalogs.ts |
| Categoria | `category` | UUID | name, covenant_id | `fetchAllCategories()` en catalogs.ts |
| Convenio | `covenant` | UUID | name, guild_id | NO existe -- crear |
| Gremio | `guild` | UUID | name | NO existe -- crear |

**Equipos:**
| Catalogo | Tabla | PK | Campos utiles | Query existente |
|----------|-------|----|---------------|-----------------|
| Tipo de vehiculo | `types_of_vehicles` | BigInt | name | `fetchAllTypesOfVehicles()` en catalogs.ts |
| Marca | `brand_vehicles` | BigInt | name | NO existe -- crear |

**Enums (no requieren query a DB):**
- `gender_enum`: Masculino, Femenino, No_Declarado
- `type_of_contract_enum`: Periodo_de_prueba, A_tiempo_indeterminado, Plazo_fijo

### 1.5 Restricciones y reglas

1. **Usar `conditions` Json[] existente** -- no crear tablas join nuevas. El formato JSON se almacena directamente en el campo `conditions` de `document_types`.

2. **Formato JSON propuesto para conditions:**
```json
[
  {
    "field": "gender",
    "values": ["Masculino", "Femenino"],
    "type": "enum"
  },
  {
    "field": "guild_id",
    "values": ["uuid-1", "uuid-2"],
    "type": "relation",
    "table": "guild"
  },
  {
    "field": "brand",
    "values": ["1", "3"],
    "type": "relation",
    "table": "brand_vehicles"
  }
]
```
Los valores de relaciones BigInt se almacenan como strings en el JSON.

3. **Logica de evaluacion (adaptar de base_erp):**
   - Si `special === false`, el documento aplica a todos.
   - Cada grupo de condiciones (cada entry del array) funciona como OR: el recurso debe cumplir al menos un valor del array `values`.
   - Entre grupos es AND: debe cumplir al menos una condicion de cada grupo con valores.
   - Grupos con `values: []` no restringen (se ignoran).

4. **No cross-module imports** -- la logica de evaluacion va en `src/shared/lib/` y la config en `src/shared/config/`.

5. **`database.types.ts` no se edita** -- los tipos de condiciones se definen manualmente.

6. **Compatibilidad con datos existentes** -- todos los `document_types` actuales tienen `conditions: []`, lo que equivale a "aplica a todos" (sin restricciones). La migracion es transparente.

7. **Campo `special` se mantiene** -- sigue siendo el boolean que indica si el tipo tiene condiciones. No se renombra en DB. En la UI ya se muestra como "Condicional".

### 1.6 Riesgos identificados

1. **Condiciones vacias = aplica a todos.** Un tipo con `special=true` pero `conditions=[]` aplica a todos los recursos. La UI debe advertir esta situacion (condicional sin condiciones configuradas).

2. **Empleados/equipos con datos incompletos.** Si un empleado no tiene `gender` o `guild_id` definido, y hay una condicion sobre ese campo, el empleado NO cumple la condicion (no aplica). Esto es el comportamiento correcto pero puede confundir al usuario.

3. **Performance de evaluacion en dashboard.** El dashboard actualmente hace counts con queries SQL. Evaluar condiciones JSON requiere traer los datos a JS y filtrar en memoria. Para empresas con muchos empleados y tipos de documento, esto puede ser lento. **Mitigacion:** usar cache (`unstable_cache`) y evaluar solo tipos condicionales (la mayoria de tipos no tienen condiciones).

4. **BigInt en conditions de equipos.** Los IDs de `brand_vehicles` y `types_of_vehicles` son BigInt en Prisma. En JSON se almacenan como string. La funcion de evaluacion debe comparar con `String()` conversion. Prisma devuelve BigInt que necesita conversion.

5. **Consistencia de datos al eliminar catalogos.** Si se elimina un guild que esta referenciado en conditions de un document_type, la condicion queda con un UUID huerfano. No bloquea, pero la condicion deja de matchear. **Mitigacion futura:** limpiar conditions al desactivar/eliminar catalogos.

6. **No hay calculo de "documentos faltantes" actual.** El dashboard solo cuenta documentos existentes vencidos/por vencer. No calcula cuantos documentos faltan por subir. Implementar condiciones en el calculo de faltantes es una feature adicional que puede ir en una fase posterior.

7. **El Zod schema existente en `schemas.ts` es muy diferente al formato propuesto.** Al simplificar, hay que verificar que no haya otros consumidores del schema actual antes de cambiarlo.

---

## 2. Planificacion

### 2.1 Fases de implementacion

#### Fase 1: Logica core, configuracion y catalogos
- **Objetivo:** Tener la infraestructura de evaluacion de condiciones y los catalogos necesarios disponibles, sin tocar la UI todavia.
- **Tareas:**
  - [x] Crear `src/shared/config/documentConditions.ts` — configuracion de campos disponibles por tipo (Persona/Equipos), mapeo de enums, helpers. Adaptar de base_erp pero con los campos y enums de s-codeControl (`gender_enum`, `type_of_contract_enum`, campos de empleado: `guild_id`, `covenants_id`, `category_id`, `hierarchical_position`; campos de equipo: `brand`, `type_of_vehicle`). Usar `'Persona'` y `'Equipos'` como valores de applies (no EMPLOYEE/EQUIPMENT como en base_erp).
  - [x] Crear `src/shared/lib/documentConditions.ts` — funciones `checkDocumentAppliesToEmployee()`, `checkDocumentAppliesToEquipment()`, `filterDocumentTypesForEmployee()`, `filterDocumentTypesForEquipment()`. Adaptar de base_erp pero usando el formato JSON simplificado `[{ field, values, type }]` en vez de la interfaz tipada de base_erp. La conversion de BigInt a string para brand/type_of_vehicle se hace dentro de las funciones.
  - [x] Agregar queries de catalogos faltantes en `src/shared/actions/catalogs.ts`: `fetchAllGuilds()`, `fetchAllCovenants()`, `fetchAllBrandVehicles()`, `fetchAllHierarchies()`. Las queries de categories y types_of_vehicles ya existian.
  - [x] Simplificar el schema Zod de conditions en `src/shared/zodSchemas/schemas.ts` al formato `[{ field: string, values: string[], type: 'enum' | 'relation' }]`. Verificado que no hay otros consumidores del schema.
- **Archivos:**
  - Crear: `src/shared/config/documentConditions.ts`, `src/shared/lib/documentConditions.ts`
  - Modificar: `src/shared/actions/catalogs.ts`, `src/shared/zodSchemas/schemas.ts`
- **Criterio de completitud:** Las funciones de evaluacion retornan resultados correctos para casos basicos (special=false aplica a todos, conditions vacias aplica a todos, condiciones con valores filtran correctamente). Los catalogos devuelven datos. Se puede probar con `npm run check-types`.

#### Fase 2: UI de configuracion de condiciones
- **Objetivo:** El formulario de tipos de documento permite configurar condiciones reales que se guardan en la DB.
- **Tareas:**
  - [x] Crear `src/modules/documents/features/types/components/EmployeeConditions.tsx` — sub-componente con multi-selects para: genero (enum, chips), posicion jerarquica (relation, combobox multi), tipo de contrato (enum, chips), categoria (relation, combobox multi), convenio (relation, combobox multi), gremio (relation, combobox multi). Cada grupo carga su catalogo on-mount. Recibe `value` y `onChange` para el array de conditions.
  - [x] Crear `src/modules/documents/features/types/components/EquipmentConditions.tsx` — sub-componente con multi-selects para: marca de vehiculo (relation, combobox multi con BigInt->string), tipo de vehiculo (relation, combobox multi con BigInt->string).
  - [x] Reescribir `src/modules/documents/features/types/components/ConditionsSection.tsx` — reemplazar texto estatico por contenido real. Recibe `applies`, `value` (array de conditions) y `onChange`. Segun `applies` renderiza `EmployeeConditions` o `EquipmentConditions`. Incluir un aviso visual si `special=true` pero no hay condiciones configuradas.
  - [x] Modificar `src/modules/documents/features/types/components/DocumentTypeFormModal.tsx`:
    - Agregar estado local para conditions (useState, no RHF — es un JSON complejo que no encaja bien en el schema Zod del form).
    - Pasar conditions al `<ConditionsSection>` con value/onChange.
    - Al cargar datos de edicion (`getDocumentTypeById`), parsear `conditions` del docType y setear el estado.
    - En `onSubmit`, pasar las conditions reales en vez de `[]`.
    - Cuando `special` se desactiva, limpiar conditions a `[]`.
  - [x] Modificar `src/modules/documents/features/types/actions.server.ts`:
    - Actualizar tipo `CreateDocumentTypeInput.conditions` al formato `{ field: string; values: string[]; type: 'enum' | 'relation' }[]`.
    - Cuando `special=false`, forzar `conditions: []` en create/update.
    - Validar que conditions solo contenga campos validos para el `applies` del tipo.
- **Archivos:**
  - Crear: `EmployeeConditions.tsx`, `EquipmentConditions.tsx`
  - Modificar: `ConditionsSection.tsx`, `DocumentTypeFormModal.tsx`, `actions.server.ts` (types)
- **Criterio de completitud:** Se puede crear un tipo de documento condicional para Persona, seleccionar genero=Masculino + gremio=X, guardar, cerrar el modal, reabrir y ver las condiciones cargadas. Idem para Equipos con marca y tipo. En la DB el campo `conditions` tiene los JSON correctos.

#### Fase 3: Evaluacion e integracion en vistas
- **Objetivo:** Las condiciones afectan la logica de negocio: los documentos condicionales solo aparecen como requeridos para recursos que cumplen las condiciones.
- **Tareas:**
  - [x] Modificar `src/modules/documents/features/manage/components/ShowDocument.tsx` — cuando `special=true`, mostrar las condiciones configuradas (listar campo + valores seleccionados) en vez del texto generico "consideraciones especiales".
  - [x] Modificar `src/modules/documents/features/manage/components/ShowCompanyDocument.tsx` — idem para documentos de empresa.
  - [x] Modificar `src/modules/documents/features/list/components/FilterComponent.tsx` — renombrar label "Es especial?" a "Condicional".
  - [x] Agregar server actions `fetchDocumentTypesForEmployee()` y `fetchDocumentTypesForEquipment()` en `upload/actions.server.ts` — permiten obtener tipos de documento filtrados por condiciones para un recurso especifico.
  - [x] Modificar `src/modules/dashboard/features/overview/actions.server.ts` — en `fetchDashboardCounts`, para documentos vencidos/por vencer de tipos condicionales, verificar que el tipo realmente aplique al recurso. Estrategia: separar el count en dos queries (tipos no condicionales con count SQL directo + tipos condicionales evaluados en JS). Usar `unstable_cache` existente para mitigar performance.
  - [~] Modificar `src/shared/components/common/MissingDocumentList.tsx` — NO se modifico: este componente muestra documentos pendientes ya creados en DB (no calcula faltantes por tipo). El filtrado condicional debe aplicarse al momento de crear alertas/pendientes, no al mostrarlos.
  - [~] Modificar upload UI (`NewDocumentNoMulti.tsx`, `NewDocumentMulti.tsx`) — NO se modifico: requiere refactor del flujo (el usuario elige empleado despues de ver tipos). Las server actions `fetchDocumentTypesForEmployee/Equipment` estan listas para ser integradas cuando se refactorice el flujo de seleccion.
- **Archivos:**
  - Modificar: `ShowDocument.tsx`, `ShowCompanyDocument.tsx`, `FilterComponent.tsx`, `upload/actions.server.ts`, `dashboard/overview/actions.server.ts`
- **Criterio de completitud:** Un tipo de documento condicional (ej: "solo para genero Masculino") no aparece como faltante para un empleado de genero Femenino. El dashboard no cuenta como vencido un documento condicional que no aplica. La vista de ShowDocument muestra los criterios de la condicion.

### 2.2 Orden de ejecucion

1. **Fase 1** primero — es fundacional, no rompe nada existente (solo agrega archivos nuevos y queries).
2. **Fase 2** segundo — depende de los catalogos y config de Fase 1. Al completar, las condiciones se guardan pero todavia no tienen efecto funcional (retrocompatible: conditions vacias = aplica a todos).
3. **Fase 3** tercero — depende de las funciones de evaluacion (Fase 1) y de que haya datos de condiciones reales para probar (Fase 2).

Cada fase deja el sistema funcional. Si se deployan Fase 1+2 sin Fase 3, el unico efecto es que ahora se pueden configurar condiciones pero todavia no filtran (mismo comportamiento actual). No hay regresion.

### 2.3 Estimacion de complejidad

| Fase | Archivos nuevos | Archivos modificados | Lineas estimadas | Complejidad |
|------|----------------|---------------------|------------------|-------------|
| Fase 1 | 2 | 2 | ~200 | Baja — logica pura sin UI, adaptacion directa de base_erp |
| Fase 2 | 2 | 3 | ~400 | Media — UI de multi-selects con carga de catalogos, state management de conditions en el form |
| Fase 3 | 0 | 6-7 | ~250 | Media-Alta — integrar evaluacion en multiples puntos, refactor de queries de dashboard, testing de edge cases |

**Total estimado:** ~850 lineas, 4 archivos nuevos, 10-12 archivos modificados.

**Riesgo principal de Fase 3:** El dashboard hace counts SQL puros. Integrar evaluacion de condiciones requiere traer datos a JS para tipos condicionales, lo que cambia la arquitectura de la query. Si hay pocos tipos condicionales el impacto es minimo; si son muchos, puede requerir optimizacion adicional.

## 3. Diseno
_Pendiente - ejecutar `/disenar documentos-condicionales`_

## 4. Implementacion

### Fase 1: Logica core, configuracion y catalogos (completada 2026-03-30)

**Archivos creados:**
- `src/shared/config/documentConditions.ts` — Configuracion de campos disponibles por tipo (Persona: gender, type_of_contract, hierarchical_position, category_id, covenants_id, guild_id; Equipos: brand, type_of_vehicle). Exporta `EMPLOYEE_CONDITIONS`, `EQUIPMENT_CONDITIONS`, `getConditionsForApplies()`, `supportsConditions()`.
- `src/shared/lib/documentConditions.ts` — Funciones de evaluacion: `checkDocumentAppliesToEmployee()`, `checkDocumentAppliesToEquipment()`, `filterDocumentTypesForEmployee()`, `filterDocumentTypesForEquipment()`. Usa formato JSON simplificado `[{ field, values, type }]`. Maneja conversion BigInt a string para campos de equipos.

**Archivos modificados:**
- `src/shared/actions/catalogs.ts` — Agregados: `fetchAllGuilds()`, `fetchAllCovenants()`, `fetchAllBrandVehicles()`, `fetchAllHierarchies()`. Todos con `is_active: true`, BigInt convertido a string en brand_vehicles.
- `src/shared/zodSchemas/schemas.ts` — Schema de conditions simplificado de 11 campos por condicion a 3 campos: `{ field, values, type }`.

**Verificacion:** `npm run check-types` pasa sin errores.

### Fase 2: UI de configuracion de condiciones (completada 2026-03-30)

**Archivos creados:**
- `src/modules/documents/features/types/components/EmployeeConditions.tsx` — Componente client con 6 campos de condiciones para empleados. Enums (gender, type_of_contract) como chips toggleables. Relaciones (hierarchical_position, category_id, covenants_id, guild_id) como multi-select con Popover+Command (usa MultiSelect de shared/ui). Carga catalogos on-mount via fetchAll* de catalogs.ts. Grid de 2 columnas.
- `src/modules/documents/features/types/components/EquipmentConditions.tsx` — Componente client con 2 campos de condiciones para equipos. Multi-select para brand y type_of_vehicle. IDs BigInt convertidos a string.

**Archivos modificados:**
- `src/modules/documents/features/types/components/ConditionsSection.tsx` — Reescrito completamente. Switch de activacion con badge de count de condiciones activas. Card colapsable con descripcion y aviso visual si condicional sin condiciones. Renderiza EmployeeConditions o EquipmentConditions segun applies.
- `src/modules/documents/features/types/components/DocumentTypeFormModal.tsx` — Estado local `conditions` con useState. Parseo de conditions desde DB al editar. Condiciones reales en el payload al submit. Limpieza de conditions al desactivar special o activar down_document. ConditionsSection integrado con Switch propio (ya no checkbox separado para special).
- `src/modules/documents/features/types/actions.server.ts` — Tipo de conditions actualizado a `{ field, values, type }[]`. Logica de forzar conditions=[] cuando special=false en create y update.
- `src/modules/documents/features/types/components/document-type-columns.tsx` — Columna "Condicional" ahora muestra badge con count de condiciones activas junto al "Si".

**Verificacion:** `npm run check-types` pasa sin errores.

### Fase 3: Evaluacion e integracion en vistas (completada 2026-03-30)

**Archivos modificados:**
- `src/modules/documents/features/manage/components/ShowDocument.tsx` — Reemplazado texto generico "consideraciones especiales" por componente `ConditionsSummary` que muestra campo + valores de cada condicion activa. Si no hay condiciones configuradas, muestra aviso amarillo "Sin condiciones configuradas (aplica a todos)".
- `src/modules/documents/features/manage/components/ShowCompanyDocument.tsx` — Idem, misma mejora con `ConditionsSummary`.
- `src/modules/documents/features/list/components/FilterComponent.tsx` — Renombrado placeholder "Es especial?" a "Condicional".
- `src/modules/dashboard/features/overview/actions.server.ts` — Separado el conteo en dos: tipos no condicionales (count SQL directo, rapido) + tipos condicionales (fetch con datos de empleado/equipo, evaluacion en JS con `checkDocumentAppliesToEmployee/Equipment`). Funcion auxiliar `countConditionalDocs` hace la evaluacion. Los resultados se suman. Cache via `unstable_cache` se mantiene.
- `src/modules/documents/features/upload/actions.server.ts` — Agregadas server actions `fetchDocumentTypesForEmployee()` y `fetchDocumentTypesForEquipment()` que obtienen tipos de documento y filtran por condiciones del recurso. Listas para ser consumidas desde los componentes de upload.

**Integraciones parciales / pendientes:**
- `MissingDocumentList.tsx`: No requiere cambios -- muestra documentos pendientes ya existentes en DB, no calcula faltantes por tipo de documento. El filtrado condicional debe aplicarse al crear alertas.
- Upload UI (`NewDocumentNoMulti.tsx`, `NewDocumentMulti.tsx`, `UploadDocument.tsx`): Las server actions estan creadas pero no se integraron en los componentes de UI porque requieren un refactor del flujo de seleccion (el usuario elige empleado/equipo despues de ver la lista de tipos). Para integrar: cuando el usuario selecciona un empleado, llamar a `fetchDocumentTypesForEmployee(employeeId, companyId)` en vez de `fetchAllDocumentTypes()` filtrado client-side.

**Verificacion:** `npm run check-types` pasa sin errores.

## 5. Verificacion
_Pendiente - ejecutar `/verificar documentos-condicionales`_
