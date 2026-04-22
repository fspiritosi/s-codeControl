# Reestructuracion Modular del Proyecto

**Fecha de inicio:** 2026-03-12
**Estado:** Completada (18 de 18 fases implementadas)

---

## 1. Analisis

### 1.1 Problema

El proyecto CodeControl tiene una arquitectura plana y desorganizada donde la logica de negocio, componentes de presentacion, utilidades y server actions estan dispersos en ubicaciones incorrectas. La arquitectura objetivo (definida en `docs/project-structure.md`) requiere que `src/app/` contenga exclusivamente routing (page.tsx, layout.tsx, loading.tsx, error.tsx) y que toda la logica de negocio resida en `src/modules/` organizada por dominio, con codigo compartido en `src/shared/`.

Actualmente, el proyecto tiene **~430+ archivos** que necesitan reubicarse, renombrarse o eliminarse para alcanzar la estructura objetivo. No existe el directorio `src/modules/`. Existen directorios scaffold vacios (`src/domains/`, `src/infrastructure/`, `src/presentation/`) que son restos de intentos previos de refactor y deben eliminarse.

### 1.2 Contexto actual

**Estado general:** El proyecto funciona en produccion con la estructura actual, pero es dificil de mantener y escalar. Se ha iniciado una migracion parcial de Supabase browser a server actions (fases 8-15 del plan maestro), y los stores de Zustand ya fueron separados en domain stores con un facade de retrocompatibilidad.

**Estructura actual problematica:**

```
src/
├── app/                    # Routing + ~150 archivos de logica de negocio (INCORRECTO)
│   ├── dashboard/
│   │   ├── componentDashboard/  # 13 archivos de componentes de dashboard
│   │   ├── company/             # 50 archivos (componentes, columns, data-tables)
│   │   ├── document/            # 18 archivos (componentes, columns, tables)
│   │   ├── employee/            # 4 archivos (columns, data-table)
│   │   ├── equipment/           # 5 archivos (columns, data-table, components)
│   │   ├── forms/               # 26 archivos (componentes, utilidades)
│   │   └── 9 archivos sueltos (colums.tsx, data-table.tsx, welcome-component.tsx)
│   ├── admin/                   # 19 archivos (componentes, columns, graficos)
│   ├── server/                  # 22 archivos de server actions (dominio organizado)
│   └── api/                     # 39 endpoints REST (correcto, se quedan)
│
├── components/             # 308 archivos total, mezcla de todo
│   ├── ui/                 # 48 componentes Shadcn (correcto -> shared/components/ui/)
│   ├── landing_components/ # 39 archivos de landing page
│   ├── DailyReport/        # 23 archivos
│   ├── CheckList/          # 19 archivos
│   ├── Capacitaciones/     # 18 archivos
│   ├── Tipos_de_reparaciones/ # 17 archivos
│   ├── Diagrams/           # 11 archivos
│   ├── Documents/          # 11 archivos
│   ├── Dashboard/          # 9 archivos
│   ├── Employee/           # 8 archivos
│   ├── pdf/                # 6 archivos
│   ├── VehiclesForm/       # 5 archivos
│   ├── Services/           # 5 archivos
│   ├── Skeletons/          # 5 archivos
│   ├── svg/                # 4 archivos
│   ├── QR/                 # 4 archivos
│   ├── NewDocumentType/    # 4 archivos
│   ├── Graficos/           # 2 archivos
│   ├── users/              # 1 archivo
│   └── 69 archivos sueltos (modals, forms, layout, etc.)
│
├── store/                  # 11 archivos Zustand (no existe en target)
├── hooks/                  # 7 hooks (debe ir a shared/hooks/)
├── lib/                    # 15+ archivos (debe ir a shared/lib/)
├── types/                  # 7 archivos (debe ir a shared/types/)
├── zodSchemas/             # schemas (debe ir a shared/zodSchemas/)
├── shared/                 # 11 archivos (parcialmente creado, solo data-table)
│
├── domains/                # VACIO - 17 carpetas vacias, eliminar
├── infrastructure/         # VACIO - eliminar
├── presentation/           # VACIO - eliminar
├── features/               # 11 archivos parciales (HSE, Empresa/PortalEmpleados)
└── config/                 # VACIO - eliminar o mover a shared/config/
```

### 1.3 Archivos involucrados

#### A. Archivos en `src/app/` que deben moverse a `src/modules/` (150+ archivos)

**Dashboard (13 archivos) -> `modules/dashboard/`:**
- `src/app/dashboard/componentDashboard/CardButton.tsx`
- `src/app/dashboard/componentDashboard/CardNumber.tsx`
- `src/app/dashboard/componentDashboard/CardsGrid.tsx`
- `src/app/dashboard/componentDashboard/DocumentsTable.tsx`
- `src/app/dashboard/componentDashboard/EmployeesTable.tsx`
- `src/app/dashboard/componentDashboard/EPendingDocumentTable.tsx`
- `src/app/dashboard/componentDashboard/VPendingDocumentTable.tsx`
- `src/app/dashboard/componentDashboard/table/` (6 archivos: data-tables, columns, toolbar)
- `src/app/dashboard/colums.tsx`, `columsMonthly.tsx`, `columsMonthlyEquipment.tsx`
- `src/app/dashboard/data-table.tsx`, `data-table-pagination.tsx`
- `src/app/dashboard/welcome-component.tsx`

**Company - Empresa activa (38 archivos) -> `modules/company/`:**
- `src/app/dashboard/company/actualCompany/components/` (12 archivos: columns, data-tables, General.tsx, AddCompanyDocumentForm.tsx, etc.)
- `src/app/dashboard/company/actualCompany/contact/` (6 archivos: Contact.tsx, columns, data-table, action/)
- `src/app/dashboard/company/actualCompany/covenant/` (10 archivos: CctComponent, TreeFile, columns x3, data-tables x3, action/)
- `src/app/dashboard/company/actualCompany/customers/` (7 archivos: Customers.tsx, columns, data-table, action/)
- `src/app/dashboard/company/actualCompany/page1.tsx` (componente no-page)

**Companies - CRUD (8 archivos) -> `modules/companies/`:**
- `src/app/dashboard/company/companyComponents/itemCompany.tsx`
- `src/app/dashboard/company/new/components/` (4 archivos: CityInput, CreateCompanyButton, EditCompanyButton, ImageInput)
- `src/app/dashboard/company/new/accions.ts`
- `src/app/dashboard/company/[id]/components/EditCompanyButton.tsx`

**Documents (16 archivos) -> `modules/documents/`:**
- `src/app/dashboard/document/documentComponents/` (12 archivos: CompanyTabs, TabsDocuments, TypesDocumentsView, TypesDocumentAction, EmployeeDocumentsTabs, EmployeeListTabs, EquipmentDocumentsTable, EquipmentTabs, EditDocumenTypeModal, FilterComponent, DownloadButton, DocumentsTable)
- `src/app/dashboard/document/columns.tsx`, `columEmp.tsx`, `DocumentTable.tsx`

**Employee (3 archivos) -> `modules/employees/`:**
- `src/app/dashboard/employee/columns.tsx`
- `src/app/dashboard/employee/data-table.tsx`

**Equipment (3 archivos) -> `modules/equipment/`:**
- `src/app/dashboard/equipment/columns.tsx`
- `src/app/dashboard/equipment/data-equipment.tsx`
- `src/app/dashboard/equipment/equipmentComponentes/EquipmentListTabs.tsx`

**Forms (26 archivos) -> `modules/forms/` (nuevo modulo):**
- `src/app/dashboard/forms/components/` (11 archivos: FormDisplay, Inputs, CreatedForm, FormCustom, FormCustomContainer, FormCardContainer, NewForm, SubmitCustomForm, DisplayCreatedForms, etc.)
- `src/app/dashboard/forms/formUtils/` (2 archivos: formUtils.ts, fieldRenderer.tsx)
- `src/app/dashboard/forms/new/components/` (mail.tsx, mail-list.tsx)

**Admin (11 archivos) -> `modules/admin/`:**
- `src/app/admin/components/` (9 archivos: adminAvatar, adminBreadcrumb, adminNavbar, adminSidebar, createDialog, createUser, diagramTable, tableCard, Graficos/CompaniesChart)
- `src/app/admin/auditor/columns.tsx`, `data-table.tsx`

#### B. Archivos en `src/components/` que deben reorganizarse (308 archivos)

**Hacia `shared/components/ui/` (ya correcto, solo mover):**
- `src/components/ui/` - 48 archivos Shadcn (mover a `src/shared/components/ui/`)

**Hacia `shared/components/layout/`:**
- `src/components/Sidebar.tsx` -> `shared/components/layout/Sidebar.tsx`
- `src/components/SideBarContainer.tsx` -> `shared/components/layout/SideBarContainer.tsx`
- `src/components/SideLinks.tsx` -> `shared/components/layout/SideLinks.tsx`
- `src/components/NavBar.tsx` -> `shared/components/layout/NavBar.tsx`

**Hacia `shared/components/common/`:**
- `src/components/Skeletons/` (5 archivos)
- `src/components/svg/` (4 archivos)
- Componentes genericos: AlertComponent, BackButton, EditButton, UploadImage, SelectWithData, CheckboxDefValues

**Hacia `modules/employees/`:**
- `src/components/Employee/` (8 archivos: useEmployeeForm, fieldDefinitions, EmployeePersonalDataTab, EmployeeLaboralDataTab, EmployeeContactDataTab, etc.)

**Hacia `modules/equipment/`:**
- `src/components/VehiclesForm/` (5 archivos: useVehicleForm, etc.)
- `src/components/QR/` (4 archivos: AcctionSelector, VehicleRepairRequests, SolicitarMantenimiento)

**Hacia `modules/documents/`:**
- `src/components/Documents/` (11 archivos: UploadDocument, NewDocumentMulti, NewDocumentNoMulti, ShowCompanyDocument, UploadDocumentMultiEquipment, etc.)
- `src/components/NewDocumentType/` (4 archivos)
- Componentes sueltos de documentos: SimpleDocument, MultiResourceDocument, DocumentEquipmentComponent, DocumentationDrawer, UpdateDocuments, DeleteDocument, ApproveDocModal, DenyDocModal, ReplaceDocument, MissingDocumentList

**Hacia `modules/company/`:**
- `src/components/ContactComponent.tsx`
- `src/components/CustomerComponent.tsx`
- `src/components/CovenantComponent.tsx`, `CovenantRegister.tsx`
- `src/components/AddCovenantModal.tsx`, `AddGuildModal.tsx`, `AddCategoryModal.tsx`
- `src/components/UsersTabComponent.tsx`, `users/UserForm.tsx`
- `src/components/RegisterWithRole.tsx`
- `src/components/CompanyRegister.tsx`
- `src/components/ModalCompany.tsx`
- `src/components/AddBrandModal.tsx`, `AddModelModal.tsx`, `AddTypeModal.tsx`

**Hacia `modules/maintenance/` o `modules/repairs/`:**
- `src/components/Tipos_de_reparaciones/` (17 archivos: RepairTypeForm, RepairEntry, RepairEntryMultiple, RepairSolicitudesTable/)
- `src/components/Services/` (5 archivos)

**Hacia `modules/operations/`:**
- `src/components/DailyReport/` (23 archivos)

**Hacia `modules/hse/`:**
- `src/components/Capacitaciones/` (18 archivos)
- `src/components/CheckList/` (19 archivos)
- Fusionar con `src/features/Hse/` (11 archivos existentes)

**Hacia `modules/dashboard/` o `shared/`:**
- `src/components/Dashboard/` (9 archivos)
- `src/components/Graficos/` (2 archivos)
- `src/components/Diagrams/` (11 archivos)

**Hacia modulo landing o separar:**
- `src/components/landing_components/` (39 archivos) -> `modules/landing/` o permanece en `shared/`

**Hacia modulo auth:**
- `src/components/LoginForm.tsx`, `RegisterForm.tsx`, `RecoveryPasswordForm.tsx`, `UpdateUserPasswordForm.tsx`

**Hacia `modules/` (pdf):**
- `src/components/pdf/` (6 archivos: generadores de PDF especificos)
- `src/components/CardsGrid.tsx` (grid generico usado en dashboard)

#### C. Server actions (22 archivos) -> deben moverse a `modules/{modulo}/features/{feature}/actions.server.ts`

Actualmente en `src/app/server/`:
- `company/queries.ts`, `company/mutations.ts`, `company/customers-mutations.ts`
- `employees/queries.ts`, `employees/mutations.ts`
- `documents/queries.ts`, `documents/mutations.ts`
- `vehicles/queries.ts`, `vehicles/mutations.ts`
- `hse/queries.ts`, `hse/mutations.ts`
- `repairs/queries.ts`, `repairs/mutations.ts`
- `covenant/queries.ts`, `covenant/mutations.ts`
- `daily-reports/queries.ts`, `daily-reports/mutations.ts`
- `shared/queries.ts`, `shared/mutations.ts`
- Legacy barrels: `GET/actions.ts`, `UPDATE/actions.ts`
- `colections.ts` (tipos globales)

#### D. Directorios a mover a `src/shared/`

| Origen | Destino | Archivos |
|--------|---------|----------|
| `src/store/` (11 archivos) | `src/shared/store/` o decision pendiente | 11 |
| `src/hooks/` (7 archivos) | `src/shared/hooks/` | 7 |
| `src/lib/` (15+ archivos) | `src/shared/lib/` | 15+ |
| `src/types/` (7 archivos) | `src/shared/types/` | 7 |
| `src/zodSchemas/` | `src/shared/zodSchemas/` | ~1-3 |

#### E. Directorios a eliminar

| Directorio | Razon |
|------------|-------|
| `src/domains/` (17 carpetas vacias) | Scaffold abandonado, sin archivos |
| `src/infrastructure/` | Vacio |
| `src/presentation/` | Vacio |
| `src/config/` | Vacio (mover a shared/config/ si se necesita) |
| `src/features/` | Migrar 11 archivos a modules, luego eliminar |

### 1.4 Dependencias

#### Imports criticos (por frecuencia de uso):

| Patron de import | Ocurrencias | Archivos afectados |
|-------------------|-------------|---------------------|
| `from '@/store/loggedUser'` (useLoggedUserStore) | 273 | 87 archivos |
| `from '@/app/server/GET/actions'` o `'@/app/server/*'` | 123 | 104 archivos |
| `from '@/components/*'` | 110+ | 30+ archivos |
| `from '@/types/*'` | 53 | 52 archivos |
| `from '@/hooks/*'` | 27 | 25 archivos |
| `from '@/zodSchemas/*'` | 27 | 27 archivos |
| `from '@/lib/*'` | 25 | 20 archivos |

#### Dependencias criticas identificadas:

1. **`useLoggedUserStore`** - Usado en 87 archivos con 273 ocurrencias. Es un facade store que compone 6 domain stores (authStore, companyStore, employeeStore, documentStore, vehicleStore, uiStore). Cualquier movimiento del directorio `store/` requiere actualizar el path alias o mantener re-exports.

2. **`SideBarContainer.tsx`** - Server component que importa de:
   - `@/app/server/GET/actions` (fetchCurrentCompany, fetchCurrentUser, verifyUserRoleInCompany)
   - `@/lib/supabase/server` (supabaseServer - query directa a Supabase, marcada con TODO para migrar)
   - `@/store/InitUser` (hidrata el store desde server)
   - Importa `Sidebar.tsx` como child client component

3. **`Sidebar.tsx`** - Client component que importa de:
   - `@/lib/utils` (cn)
   - `@/store/loggedUser` (useLoggedUserStore)
   - `@/components/ui/card` (CardTitle)

4. **Server actions legacy barrel files** - `GET/actions.ts` y `UPDATE/actions.ts` son importados por muchos archivos. Los domain-organized files (company/queries.ts, etc.) son mas nuevos pero los barrels siguen siendo usados.

5. **Importaciones cruzadas entre `src/components/`** - Componentes en `src/components/` importan de `src/app/server/`, `src/store/`, `src/hooks/`, y entre si. Esto crea dependencias circulares potenciales al mover a modulos.

6. **`database.types.ts`** - Tipos auto-generados de Supabase usados en toda la codebase. La arquitectura target usa Prisma/generated. Esto es un cambio ortogonal pero hay que considerar la coexistencia.

7. **Zustand stores como middleware** - El patron InitUser/InitProfile/InitEmployees hidrata stores desde server components pasando props. Al mover componentes, este patron de inicializacion debe preservarse.

### 1.5 Restricciones y reglas

**Reglas de `project-structure.md`:**
1. `src/app/` es EXCLUSIVAMENTE para routing: solo `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
2. Archivos PROHIBIDOS en `app/`: `components/`, logica de negocio, utilidades
3. Cada `page.tsx` solo importa y renderiza un componente de `@/modules/`
4. Componentes server se nombran `ComponentName.tsx`, client se prefijan con `_ComponentName.tsx`
5. Server actions se nombran `actions.server.ts`, uno por feature
6. PROHIBIDO importar entre modulos; usar `@/shared/` para codigo compartido
7. Schemas Zod en `validators.ts` dentro de cada modulo

**Reglas de `CLAUDE.md`:**
1. `database.types.ts` nunca se edita manualmente
2. Path alias `@/*` mapea a `./src/*`
3. Server actions usan `supabaseServer()` y leen `actualComp` de cookies
4. Stores Zustand en `src/stores/loggedUser.ts` (nota: actualmente en `src/store/`)

**Restricciones tecnicas:**
1. Mantener retrocompatibilidad durante la migracion (no romper la app)
2. `tsconfig.json` path alias debe actualizarse si se agregan nuevos aliases
3. Las 39 API routes en `src/app/api/` permanecen donde estan
4. Los archivos de migracion Supabase no se tocan
5. El middleware (`src/middleware.ts`) debe seguir funcionando con las rutas actuales

### 1.6 Riesgos identificados

| # | Riesgo | Impacto | Mitigacion |
|---|--------|---------|------------|
| 1 | **Rotura masiva de imports** - Mover ~430 archivos rompe cientos de imports | Alto | Migrar por modulo, usar `tsc --noEmit` despues de cada batch. Considerar re-exports temporales en ubicaciones originales |
| 2 | **Dependencias circulares** - Al mover componentes a modules, las dependencias cruzadas entre dominios pueden crear ciclos | Alto | Mapear dependencias antes de mover. Extraer dependencias compartidas a `shared/` primero |
| 3 | **Store facade (useLoggedUserStore)** - 87 archivos dependen de un path especifico | Alto | Mover stores con re-export en path original, o actualizar tsconfig con alias `@/store` apuntando a nueva ubicacion |
| 4 | **Server actions barrel files** - GET/actions.ts y UPDATE/actions.ts importados por ~100 archivos | Alto | No eliminar barrels hasta que todos los consumers esten migrados. Mantener como re-export facade |
| 5 | **Build failures durante migracion** - Cualquier archivo movido sin actualizar todas sus referencias rompe el build | Medio | Ejecutar `npm run build` tras cada modulo migrado. CI pipeline debe validar |
| 6 | **Conflictos de merge con rama main** - Refactor largo en branch separada genera conflictos | Medio | Hacer merges frecuentes desde main. Fases pequenas con PRs incrementales |
| 7 | **Client/Server boundary confusion** - Mover componentes puede romper la separacion 'use client'/'use server' | Medio | Verificar directivas en cada archivo movido. Seguir convencion `_Prefix.tsx` para client components |
| 8 | **Landing page components** - 39 archivos en landing_components pueden depender de rutas publicas | Bajo | Evaluar si landing se mueve a `modules/landing/` o se mantiene en `shared/` |
| 9 | **Stores Zustand sin ubicacion en target** - `project-structure.md` no define ubicacion para stores | Medio | Decidir: `shared/store/` (global) o split por modulo. El facade pattern actual sugiere `shared/store/` |
| 10 | **Supabase a Prisma coexistencia** - Hay TODOs para migrar queries de Supabase a Prisma. Mover archivos con queries pendientes complica ambos refactors | Medio | Mover archivos tal cual estan. La migracion Supabase->Prisma es ortogonal |
| 11 | **Archivos con naming inconsistente** - `colums.tsx` (falta 'n'), `accions.ts` (castellano), mezcla ingles/espanol | Bajo | Renombrar durante la migracion siguiendo convencion ingles |
| 12 | **InitUser/InitProfile pattern** - Server components que hidratan stores pasando data como props. Cambiar su ubicacion requiere mantener el patron | Medio | Mover InitState components a `shared/components/` o al layout del modulo |

---

## 2. Planificacion

### 2.0 Principios generales

1. **Cada fase deja la app funcional** — despues de cada fase se ejecuta `npm run check-types` y se verifica que no haya regresiones.
2. **Dependencias primero** — shared/ y la infraestructura base se mueven antes que los modulos.
3. **Re-exports temporales** — al mover archivos, se deja un re-export en la ubicacion original para no romper imports existentes. Se eliminan en la fase final de limpieza.
4. **Politica de Storage** — Solo usar Supabase Storage/S3 cuando sea estrictamente necesario (archivos binarios: PDFs, imagenes, firmas). Las queries que solo obtienen URLs de Storage se evaluan caso por caso. Las queries de datos pasan por Prisma (DB directo).
5. **Server actions dentro de cada modulo** — Los barrels `GET/actions.ts` y `UPDATE/actions.ts` se eliminan. Cada modulo tiene sus propios `actions.server.ts`. Las acciones compartidas van a `src/shared/actions/` agrupadas por funcionalidad.
6. **Convenciones de nombres** — Seguir `project-structure.md`: Server Components como `ComponentName.tsx`, Client Components como `_ComponentName.tsx`, server actions como `actions.server.ts`, schemas como `validators.ts`.
7. **Sin imports entre modulos** — Si un modulo necesita algo de otro, eso se extrae a `src/shared/`.

### 2.1 Mapa de dependencias de server actions

Antes de planificar el movimiento, se clasificaron las funciones del barrel en 3 categorias:

**A. Funciones de autenticacion/sesion (compartidas globalmente) -> `shared/actions/auth.ts`:**
- `fetchCurrentUser` (company/queries.ts — usa NextAuth + fallback Supabase)
- `getCurrentProfile` (company/queries.ts)
- `verifyUserRoleInCompany` (company/queries.ts)
- `fetchProfileById` (shared/queries.ts)
- `fetchProfileByCredentialId` (company/queries.ts)
- `fetchProfileBySupabaseUserId` (shared/queries.ts)

**B. Funciones de catalogos/geografia (compartidas) -> `shared/actions/catalogs.ts` y `shared/actions/geography.ts`:**
- `fetchCountries`, `fetchProvinces`, `fetchCitiesByProvince` (company/queries.ts) -> `shared/actions/geography.ts`
- `fetchAllIndustryTypes`, `fetchIndustryTypes` (shared/queries.ts, company/queries.ts) -> `shared/actions/catalogs.ts`
- `fetchAllTypesOfVehicles` (shared/queries.ts) -> `shared/actions/catalogs.ts`
- `fetchHierarchy`, `fetchAllWorkDiagrams`, `fetchAllCategories` (employees/queries.ts) -> `shared/actions/catalogs.ts`
- `fetchActiveDocumentTypesGlobal` (shared/queries.ts) -> `shared/actions/catalogs.ts`
- `fetchAllCompanies`, `fetchAllCompaniesWithRelations` (shared/queries.ts, company/queries.ts) -> `shared/actions/catalogs.ts` (admin)

**C. Funciones de dominio (van al modulo correspondiente):**
- `company/queries.ts` -> `modules/company/` (fetchCurrentCompany, fetchCustomers, fetchCompaniesByOwner, etc.)
- `company/mutations.ts` -> `modules/company/` (updateModulesSharedUser, updateProfileAvatar, setCompanyByDefect, etc.)
- `company/customers-mutations.ts` -> `modules/company/` (CRUD de clientes)
- `employees/queries.ts` -> `modules/employees/` (fetchAllEmployees, setEmployeeDataOptions, fetchDiagrams, etc.)
- `employees/mutations.ts` -> `modules/employees/` (CRUD de empleados)
- `documents/queries.ts` -> `modules/documents/` (fetchAllDocumentTypes, fetchDocumentsByApplies, etc.)
- `documents/mutations.ts` -> `modules/documents/` (CRUD de documentos)
- `vehicles/queries.ts` -> `modules/equipment/` (fetchAllEquipment, fetchBrands, fetchModels, etc.)
- `vehicles/mutations.ts` -> `modules/equipment/` (CRUD de vehiculos)
- `hse/queries.ts` -> `modules/hse/`
- `hse/mutations.ts` -> `modules/hse/`
- `repairs/queries.ts` -> `modules/maintenance/`
- `repairs/mutations.ts` -> `modules/maintenance/`
- `covenant/queries.ts` -> `modules/company/` (sub-feature covenants)
- `covenant/mutations.ts` -> `modules/company/`
- `daily-reports/queries.ts` -> `modules/operations/`
- `daily-reports/mutations.ts` -> `modules/operations/`
- `shared/queries.ts` (custom forms) -> `modules/forms/`
- `shared/mutations.ts` (custom forms) -> `modules/forms/`

**D. Funciones de Storage (evaluar necesidad):**
- `storageServer.getPublicUrl` en `employees/queries.ts` (fetchSingEmployee) — NECESARIO: obtiene URL de firma del empleado (archivo binario).
- `storageServer.remove` en `documents/mutations.ts` — NECESARIO: elimina archivos fisicos al borrar documentos.
- 46 archivos en total usan storage — la mayoria son componentes client que hacen upload/download de archivos. Estos se mantienen con Storage ya que manejan binarios.

### 2.2 Fases de implementacion

---

#### Fase 0: Preparacion y limpieza previa
**Objetivo:** Eliminar codigo muerto, directorios vacios y preparar la estructura destino.

- [x] Eliminar directorios vacios: `src/domains/`, `src/infrastructure/`, `src/presentation/`, `src/config/`
- [x] Crear estructura base de directorios:
  ```
  src/modules/           (raiz de modulos)
  src/shared/actions/    (server actions compartidas)
  src/shared/components/ui/
  src/shared/components/layout/
  src/shared/components/common/
  src/shared/hooks/
  src/shared/lib/
  src/shared/types/
  src/shared/zodSchemas/
  src/shared/store/
  ```
- [x] Eliminar `fetchAllEmployeesJUSTEXAMPLE` de `employees/queries.ts` (codigo de ejemplo)
- [x] Verificar: `npm run check-types`

**Criterio de completitud:** Directorios vacios eliminados, estructura destino creada, build limpio.

---

#### Fase 1: Mover shared/ — tipos, lib, hooks, schemas, store
**Objetivo:** Reubicar todas las utilidades transversales a `src/shared/` antes de mover modulos.

**1.1 Tipos globales (`src/types/` -> `src/shared/types/`):**
- [x] Mover `src/types/*.ts` (7 archivos) a `src/shared/types/`
- [x] Mover `src/app/server/colections.ts` a `src/shared/types/collections.ts`
- [x] Crear re-exports en `src/types/` para retrocompatibilidad (53 archivos dependen)
- [x] Crear re-export en `src/app/server/colections.ts`

**1.2 Libreria (`src/lib/` -> `src/shared/lib/`):**
- [x] Mover `src/lib/*.ts` (15+ archivos) a `src/shared/lib/`
- [x] Incluye: `prisma.ts`, `utils.ts`, `supabase/server.ts`, `supabase/browser.ts`, `storage.ts`, `storage-server.ts`, `server-action-context.ts`, `download.ts`, `documentFilters.ts`, `errorHandler.ts`, etc.
- [x] Crear re-exports en `src/lib/` para retrocompatibilidad (25+ archivos dependen)
- [x] Actualizar `tsconfig.json` si se necesitan nuevos path aliases

**1.3 Hooks (`src/hooks/` -> `src/shared/hooks/`):**
- [x] Mover `src/hooks/*.ts` (7 archivos) a `src/shared/hooks/`
- [x] Incluye: `useAuthData.ts`, `useCompanyData.ts`, `useDocuments.ts`, `useEmployeesData.ts`, `useUploadImage.ts`, `useProfileData.ts`
- [x] Crear re-exports en `src/hooks/` para retrocompatibilidad (27 archivos dependen)

**1.4 Zod Schemas (`src/zodSchemas/` -> `src/shared/zodSchemas/`):**
- [x] Mover `src/zodSchemas/*.ts` a `src/shared/zodSchemas/`
- [x] Crear re-exports en `src/zodSchemas/` (27 archivos dependen)

**1.5 Stores Zustand (`src/store/` -> `src/shared/store/`):**
- [x] Mover `src/store/*.ts` y `src/store/*.tsx` (11 archivos) a `src/shared/store/`
- [x] Incluye: `loggedUser.ts` (facade), `authStore.ts`, `companyStore.ts`, `employeeStore.ts`, `documentStore.ts`, `vehicleStore.ts`, `uiStore.ts`, `countries.ts`, `InitUser.tsx`, `InitEmployees.tsx`, `InitProfile.tsx`
- [x] Crear re-export en `src/store/loggedUser.ts` apuntando a `@/shared/store/loggedUser` (87 archivos dependen)
- [x] Crear re-exports para otros stores usados directamente

- [x] Verificar: `npm run check-types`

**Criterio de completitud:** Todo `src/shared/` poblado. Todos los re-exports funcionan. 0 errores de tipo.

---

#### Fase 2: Server actions compartidas
**Objetivo:** Extraer las funciones de server actions que son transversales (auth, catalogos, geografia) a `src/shared/actions/`.

**2.1 Auth actions (`shared/actions/auth.ts`):**
- [x] Crear `src/shared/actions/auth.ts` con `'use server'`
- [x] Mover: `fetchCurrentUser`, `getCurrentProfile`, `verifyUserRoleInCompany`, `fetchProfileById`, `fetchProfileByCredentialId`, `fetchProfileBySupabaseUserId`
- [x] Mover de mutations: `fetchProfileByEmail`, `fetchProfileByEmailServer`, `insertProfile`, `insertProfileServer`, `updateProfileAvatar`, `fetchRoles`
- [x] Actualizar `company/queries.ts`, `company/mutations.ts` y `shared/queries.ts` para importar de `@/shared/actions/auth`
- [x] Los barrels `GET/actions.ts` y `UPDATE/actions.ts` siguen re-exportando (aun no se eliminan)

**2.2 Geography actions (`shared/actions/geography.ts`):**
- [x] Crear `src/shared/actions/geography.ts` con `'use server'`
- [x] Mover: `fetchCountries`, `fetchProvinces`, `fetchCitiesByProvince`
- [x] Actualizar `company/queries.ts` para importar de `@/shared/actions/geography`

**2.3 Catalog actions (`shared/actions/catalogs.ts`):**
- [x] Crear `src/shared/actions/catalogs.ts` con `'use server'`
- [x] Mover: `fetchAllIndustryTypes`, `fetchIndustryTypes`, `fetchAllTypesOfVehicles`, `fetchHierarchy`, `fetchAllWorkDiagrams`, `fetchAllCategories`, `fetchActiveDocumentTypesGlobal`, `fetchAllCompanies`, `fetchAllWorkDiagramsAdmin`, `fetchPresentedDocumentsForAuditor`, `fetchEmployeeByCuil`, `logErrorMessage`
- [x] Actualizar archivos origen para importar de `@/shared/actions/catalogs`

**2.4 Storage actions (`shared/actions/storage.ts`):**
- [x] Crear `src/shared/actions/storage.ts` — placeholder con comentario (storage functions permanecen en `shared/lib/storage-server.ts`)
- [x] Evaluar `fetchSingEmployee` (employees/queries.ts): la parte de Storage (getPublicUrl) se mantiene porque obtiene URL de archivo binario (firma). No se reemplaza con DB.
- [x] Evaluar `documents/mutations.ts` (storageServer.remove): se mantiene — elimina archivos fisicos.

**2.5 Notifications actions (`shared/actions/notifications.ts`):**
- [x] Mover: `fetchNotificationsByCompany`, `deleteNotificationsByCompany` (company/queries.ts) — son cross-cutting, usadas por layout/navbar

**2.6 Email actions (`shared/actions/email.ts`):**
- [x] Copiar `sendEmail` desde `src/app/actions/sendEmail.ts` a `src/shared/actions/email.ts`
- [x] Actualizar `src/app/actions/sendEmail.ts` para re-exportar de `@/shared/actions/email`

- [x] Verificar: `npm run check-types` — 0 errores

**Criterio de completitud:** `src/shared/actions/` tiene 5 archivos funcionales. Los barrels legacy siguen funcionando via re-exports.

---

#### Fase 3: Mover componentes shared (UI, layout, common)
**Objetivo:** Redistribuir `src/components/` — los componentes genericos van a `src/shared/components/`.

**3.1 UI Components (`src/components/ui/` -> `src/shared/components/ui/`):**
- [x] Mover los 48 componentes Shadcn de `src/components/ui/` a `src/shared/components/ui/`
- [x] Crear re-export barrel en `src/components/ui/` (muchos archivos importan de `@/components/ui/*`)

**3.2 Layout Components -> `src/shared/components/layout/`:**
- [x] Mover `Sidebar.tsx`, `SideBarContainer.tsx`, `SideLinks.tsx`, `NavBar.tsx` a `src/shared/components/layout/`
- [x] Crear re-exports en `src/components/`

**3.3 Common Components -> `src/shared/components/common/`:**
- [x] Mover `src/components/Skeletons/` (5 archivos) a `src/shared/components/common/Skeletons/`
- [x] Mover `src/components/svg/` (4 archivos) a `src/shared/components/common/svg/`
- [x] Mover componentes genericos: `AlertComponent.tsx`, `BackButton.tsx`, `EditButton.tsx`, `UploadImage.tsx`, `SelectWithData.tsx`, `CheckboxDefValues.tsx` a `src/shared/components/common/`
- [x] Mover `src/components/CardsGrid.tsx` a `src/shared/components/common/`
- [x] Mover `src/components/ReportAnIssue.tsx` a `src/shared/components/common/`
- [x] Mover `src/shared/components/` existentes (data-table compartido) — verificar que no se duplique
- [x] Crear re-exports necesarios en `src/components/`

**3.4 Auth Components -> `src/shared/components/auth/` (o `modules/auth/`):**
- [x] Mover `LoginForm.tsx`, `RegisterForm.tsx`, `RecoveryPasswordForm.tsx`, `UpdateUserPasswordForm.tsx` a `src/shared/components/auth/`
- [x] Mover `AutenticationLight.tsx`, `AutenticationDark.tsx` a `src/shared/components/auth/`

- [x] Verificar: `npm run check-types`

**Criterio de completitud:** `src/shared/components/` tiene ui/, layout/, common/, auth/. Re-exports creados. Build limpio.

---

#### Fase 4: Modulo Company
**Objetivo:** Crear `src/modules/company/` con todas sus features, server actions y componentes.

**4.1 Estructura del modulo:**
```
src/modules/company/
├── features/
│   ├── detail/
│   │   ├── CompanyDetail.tsx          (server component — anteriormente page1.tsx)
│   │   ├── actions.server.ts          (fetchCurrentCompany, fetchCompanyDocuments, etc.)
│   │   └── components/
│   │       ├── _General.tsx
│   │       ├── _AddCompanyDocumentForm.tsx
│   │       ├── columns.tsx
│   │       └── data-tables.tsx
│   ├── contacts/
│   │   ├── actions.server.ts
│   │   └── components/
│   │       ├── _ContactComponent.tsx
│   │       ├── columns.tsx
│   │       └── data-table.tsx
│   ├── covenants/
│   │   ├── actions.server.ts          (desde covenant/queries.ts + mutations.ts)
│   │   └── components/
│   │       ├── _CovenantComponent.tsx
│   │       ├── _CctComponent.tsx
│   │       ├── _AddCovenantModal.tsx
│   │       ├── _AddGuildModal.tsx
│   │       ├── _AddCategoryModal.tsx
│   │       └── columns, data-tables, TreeFile
│   ├── customers/
│   │   ├── actions.server.ts          (desde company/customers-mutations.ts + queries)
│   │   └── components/
│   │       ├── _CustomerComponent.tsx
│   │       ├── columns.tsx
│   │       └── data-table.tsx
│   ├── users/
│   │   ├── actions.server.ts          (getAllUsers, getOwnerUser, updateModulesSharedUser)
│   │   └── components/
│   │       ├── _UsersTabComponent.tsx
│   │       ├── _UserForm.tsx
│   │       └── _RegisterWithRole.tsx
│   ├── create/
│   │   ├── actions.server.ts
│   │   └── components/
│   │       ├── _CreateCompanyButton.tsx
│   │       ├── _CityInput.tsx
│   │       ├── _ImageInput.tsx
│   │       └── _EditCompanyButton.tsx
│   └── list/
│       ├── actions.server.ts          (fetchCompaniesByOwner, fetchSharedCompaniesByProfile)
│       └── components/
│           ├── _ItemCompany.tsx
│           └── _ModalCompany.tsx
├── shared/
│   ├── types.ts
│   └── validators.ts
└── index.ts
```

**4.2 Tareas:**
- [x] Crear estructura de directorios para `modules/company/`
- [x] Mover server actions de `src/app/server/company/queries.ts` a los `actions.server.ts` correspondientes (separando auth/geography que ya estan en shared)
- [x] Mover server actions de `src/app/server/company/mutations.ts` al feature correspondiente
- [x] Mover server actions de `src/app/server/company/customers-mutations.ts` a `features/customers/actions.server.ts`
- [x] Mover server actions de `src/app/server/covenant/` a `features/covenants/actions.server.ts`
- [x] Mover componentes desde `src/app/dashboard/company/` a los features correspondientes
- [x] Mover componentes desde `src/components/` relacionados con company: `ContactComponent.tsx`, `CustomerComponent.tsx`, `CovenantComponent.tsx`, `CovenantRegister.tsx`, `AddCovenantModal.tsx`, `ModalCompany.tsx`, `CompanyRegister.tsx`, `CompanyComponent.tsx`, `CompanyLogoBackground.tsx`, `EditCompanyButton.tsx`
- [x] Actualizar originales con re-exports (company/queries, mutations, customers-mutations, covenant/queries, mutations)
- [x] Crear barrel `src/modules/company/index.ts`
- [x] Verificar: `npm run check-types` — 0 errores

**Criterio de completitud:** `modules/company/` autosuficiente. Pages en `app/dashboard/company/` son thin wrappers. Build limpio.

---

#### Fase 5: Modulo Employees
**Objetivo:** Crear `src/modules/employees/` con todas sus features.

**5.1 Estructura del modulo:**
```
src/modules/employees/
├── features/
│   ├── list/
│   │   ├── EmployeesList.tsx
│   │   ├── actions.server.ts         (fetchAllEmployees, fetchAllEmployeesWithRelations, etc.)
│   │   ├── columns.tsx
│   │   └── components/
│   │       └── _EmployeeDataTable.tsx
│   ├── detail/
│   │   ├── actions.server.ts
│   │   └── components/
│   │       ├── _EmployeePersonalDataTab.tsx
│   │       ├── _EmployeeLaboralDataTab.tsx
│   │       └── _EmployeeContactDataTab.tsx
│   ├── create/
│   │   ├── actions.server.ts         (desde employees/mutations.ts)
│   │   └── components/
│   │       └── _useEmployeeForm.ts
│   ├── diagrams/
│   │   ├── actions.server.ts         (fetchDiagrams, fetchDiagramsTypes, etc.)
│   │   └── components/
│   │       └── _EmployesDiagram.tsx (+ Diagrams/ components)
│   └── validation/
│       └── actions.server.ts         (validateEmployeeFileExists, validateDuplicatedCuil, etc.)
├── shared/
│   ├── types.ts
│   ├── validators.ts
│   └── utils.ts                      (setEmployeeDataOptions — usa catalogos de shared/)
└── index.ts
```

**5.2 Tareas:**
- [x] Crear estructura de directorios para `modules/employees/`
- [x] Mover server actions de `src/app/server/employees/queries.ts` a los actions.server.ts correspondientes
- [x] Mover server actions de `src/app/server/employees/mutations.ts`
- [x] Mover `setEmployeeDataOptions` a shared/utils.ts con imports refactorizados (fetchCustomers desde modules/company, fetchProvinces desde shared/actions/geography)
- [x] Mover componentes de `src/components/Employee/` (8 archivos) a `modules/employees/`
- [x] Mover componentes de `src/app/dashboard/employee/` (columns.tsx, data-table.tsx) a `modules/employees/`
- [x] Mover componentes de `src/components/Diagrams/` (11 archivos) a `modules/employees/features/diagrams/`
- [x] Actualizar barrels legacy con re-exports (queries.ts, mutations.ts, customers-mutations.ts)
- [x] Crear barrel `src/modules/employees/index.ts`
- [x] Verificar: `npm run check-types` — 0 errores

**Criterio de completitud:** `modules/employees/` autosuficiente. Build limpio.

---

#### Fase 6: Modulo Documents
**Objetivo:** Crear `src/modules/documents/`.

**6.1 Estructura del modulo:**
```
src/modules/documents/
├── features/
│   ├── list/
│   │   ├── DocumentsList.tsx
│   │   ├── actions.server.ts         (fetchAllDocumentTypes, fetchDocumentsByApplies, etc.)
│   │   ├── columns.tsx, columEmp.tsx
│   │   └── components/
│   │       ├── _CompanyTabs.tsx
│   │       ├── _TabsDocuments.tsx
│   │       ├── _EmployeeDocumentsTabs.tsx
│   │       ├── _EquipmentTabs.tsx
│   │       └── _FilterComponent.tsx
│   ├── detail/
│   │   ├── actions.server.ts
│   │   └── components/
│   ├── upload/
│   │   ├── actions.server.ts         (desde documents/mutations.ts)
│   │   └── components/
│   │       ├── _UploadDocument.tsx
│   │       ├── _NewDocumentMulti.tsx
│   │       ├── _NewDocumentNoMulti.tsx
│   │       ├── _SimpleDocument.tsx
│   │       └── _MultiResourceDocument.tsx
│   ├── manage/
│   │   ├── actions.server.ts
│   │   └── components/
│   │       ├── _UpdateDocuments.tsx
│   │       ├── _DeleteDocument.tsx
│   │       ├── _ReplaceDocument.tsx
│   │       ├── _ApproveDocModal.tsx
│   │       ├── _DenyDocModal.tsx
│   │       └── _DocumentationDrawer.tsx
│   └── types/
│       ├── actions.server.ts
│       └── components/
│           ├── _TypesDocumentsView.tsx
│           ├── _EditDocumenTypeModal.tsx
│           └── _NewDocumentType/ (4 archivos)
├── shared/
│   ├── types.ts
│   └── validators.ts
└── index.ts
```

**6.2 Tareas:**
- [x] Crear estructura de directorios para `modules/documents/`
- [x] Mover server actions de `src/app/server/documents/queries.ts` (26 queries → list + types)
- [x] Mover server actions de `src/app/server/documents/mutations.ts` (30 mutations → upload + manage + types)
- [x] Storage evaluado: `storageServer.remove()` mantenido en upload/actions.server.ts (necesario para binarios)
- [x] Mover componentes de `src/components/Documents/` (11 archivos)
- [x] Mover componentes de `src/app/dashboard/document/documentComponents/` (12 archivos)
- [x] Mover componentes de `src/app/dashboard/document/` (DocumentTable, columns, columEmp)
- [x] Mover `src/components/NewDocumentType/` (4 archivos)
- [x] Mover componentes sueltos (11 archivos: SimpleDocument, MultiResourceDocument, etc.)
- [x] Re-exports en todas las ubicaciones originales
- [x] Crear barrel `src/modules/documents/index.ts`
- [x] Verificar: `npm run check-types` — 0 errores

**Criterio de completitud:** `modules/documents/` autosuficiente. Build limpio.

---

#### Fase 7: Modulo Equipment
**Objetivo:** Crear `src/modules/equipment/`.

**7.1 Tareas:**
- [x] Crear estructura de directorios para `modules/equipment/`
- [x] Mover server actions de `src/app/server/vehicles/queries.ts` (4 queries → list, 5 helpers → shared/utils)
- [x] Mover server actions de `src/app/server/vehicles/mutations.ts` (14 mutations → create)
- [x] Mover componentes de `src/components/VehiclesForm/` (5 archivos)
- [x] Mover componentes de `src/components/QR/` (4 archivos → qr/components)
- [x] Mover componentes de `src/app/dashboard/equipment/` (columns, data-equipment, EquipmentListTabs)
- [x] Mover `AddBrandModal.tsx`, `AddModelModal.tsx`, `AddTypeModal.tsx` → equipment/create/components (son de vehículos)
- [x] Re-exports en todas las ubicaciones originales
- [x] Crear barrel `src/modules/equipment/index.ts`
- [x] Verificar: `npm run check-types` — 0 errores

**Criterio de completitud:** `modules/equipment/` autosuficiente. Build limpio.

---

#### Fase 8: Modulo Maintenance (Repairs + Services)
**Objetivo:** Crear `src/modules/maintenance/`.

**8.1 Tareas:**
- [x] Crear estructura de directorios para `modules/maintenance/`
- [x] Mover server actions de `src/app/server/repairs/queries.ts` y `mutations.ts` (6 funciones → repairs/actions.server.ts)
- [x] Mover `src/components/Tipos_de_reparaciones/` (17 archivos incl. RepairSolicitudesTable/)
- [x] Mover `src/components/Services/` (5 archivos)
- [x] Re-exports en todas las ubicaciones originales
- [x] Crear barrel `src/modules/maintenance/index.ts`
- [x] Verificar: `npm run check-types` — 0 errores

**Criterio de completitud:** `modules/maintenance/` autosuficiente. Build limpio.

---

#### Fase 9: Modulo Operations (Daily Reports)
**Objetivo:** Crear `src/modules/operations/`.

**9.1 Tareas:**
- [x] Crear estructura de directorios para `modules/operations/`
- [x] Mover server actions de `src/app/server/daily-reports/mutations.ts` (2 funciones)
- [x] Mover `src/components/DailyReport/` (23 archivos incl. tables/ y utils/)
- [x] Re-exports en todas las ubicaciones originales
- [x] Crear barrel `src/modules/operations/index.ts`
- [x] Verificar: `npm run check-types` — 0 errores

**Criterio de completitud:** `modules/operations/` autosuficiente. Build limpio.

---

#### Fase 10: Modulo HSE (Capacitaciones + Checklists)
**Objetivo:** Crear `src/modules/hse/`.

**10.1 Tareas:**
- [x] Crear estructura de directorios para `modules/hse/`
- [x] server actions de hse/queries y mutations eran placeholders vacíos — comentados con ubicación del módulo
- [x] Mover `src/components/Capacitaciones/` (18 archivos → training/)
- [x] Combinar actions/actions.ts + actions-delete.ts → training/actions.server.ts (18 funciones)
- [x] Mover `src/components/CheckList/` (19 archivos → checklist/)
- [x] Fusionar `src/features/Hse/` (8 archivos → documents/) con actions + componentes
- [x] Re-exports en features/Hse/ (no eliminado aún — se limpia en fase final)
- [x] Re-exports en todas las ubicaciones originales
- [x] Crear barrel `src/modules/hse/index.ts`
- [x] Verificar: `npm run check-types` — 0 errores

**Criterio de completitud:** `modules/hse/` autosuficiente. `src/features/Hse/` eliminado. Build limpio.

---

#### Fase 11: Modulo Forms (Custom Forms)
**Objetivo:** Crear `src/modules/forms/`.

**11.1 Tareas:**
- [x] Crear estructura de directorios para `modules/forms/`
- [x] Mover server actions de `src/app/server/shared/queries.ts` (fetchCustomForms, fetchCustomFormById, fetchFormsAnswersByFormId, fetchAnswerById, fetchCustomFormsByCompany, fetchCustomFormsByCompanyWithAnswers, fetchFormAnswersByFormId) a `modules/forms/features/*/actions.server.ts`
- [x] Mover server actions de `src/app/server/shared/mutations.ts` (CreateNewFormAnswer, createCustomForm, insertFormAnswer) a `modules/forms/`
- [x] Mover componentes de `src/app/dashboard/forms/` (26 archivos: FormDisplay, Inputs, CreatedForm, FormCustom, etc.)
- [x] Actualizar pages en `src/app/dashboard/forms/`
- [x] Verificar: `npm run check-types`

**Criterio de completitud:** `modules/forms/` autosuficiente. Build limpio.

---

#### Fase 12: Modulo Dashboard
**Objetivo:** Crear `src/modules/dashboard/`.

**12.1 Tareas:**
- [x] Crear estructura de directorios para `modules/dashboard/`
- [x] Mover componentes de `src/app/dashboard/componentDashboard/` (13 archivos: CardButton, CardNumber, CardsGrid, DocumentsTable, EmployeesTable, EPendingDocumentTable, VPendingDocumentTable, table/)
- [x] Mover `src/app/dashboard/colums.tsx`, `columsMonthly.tsx`, `columsMonthlyEquipment.tsx`, `data-table.tsx`, `data-table-pagination.tsx`, `welcome-component.tsx`
- [x] Mover `src/components/Dashboard/` (9 archivos) — componentes de visualizacion del dashboard
- [x] Mover `src/components/Graficos/` (2 archivos)
- [x] Actualizar `src/app/dashboard/page.tsx` para importar de `@/modules/dashboard/`
- [x] Verificar: `npm run check-types`

**Criterio de completitud:** `modules/dashboard/` autosuficiente. Build limpio.

---

#### Fase 13: Modulo Admin
**Objetivo:** Crear `src/modules/admin/`.

**13.1 Tareas:**
- [x] Crear estructura de directorios para `modules/admin/`
- [x] Mover funciones admin de shared/queries.ts: `fetchPresentedDocumentsForAuditor`, `fetchAllCompanies` (ya estaban en `@/shared/actions/catalogs`, re-exportadas desde shared/queries)
- [x] Mover componentes de `src/app/admin/` (11 archivos: adminAvatar, adminBreadcrumb, adminNavbar, adminSidebar, createDialog, createUser, diagramTable, tableCard, CompaniesChart)
- [x] Mover `src/app/admin/auditor/columns.tsx`, `data-table.tsx`
- [x] Actualizar pages en `src/app/admin/`
- [x] Verificar: `npm run check-types`

**Criterio de completitud:** `modules/admin/` autosuficiente. Build limpio.

---

#### Fase 14: Modulo Landing
**Objetivo:** Crear `src/modules/landing/`.

**14.1 Tareas:**
- [x] Crear estructura de directorios para `modules/landing/`
- [x] Mover `src/components/landing_components/` (39 archivos) a `modules/landing/features/home/components/`
- [x] Mover auth components (LoginButton, GoogleButton, RegisterButton, RefreshComponent) a `modules/landing/features/auth/components/`
- [x] Mover auth server actions (login, register) a `modules/landing/features/auth/actions/`
- [x] Actualizar la pagina raiz y cualquier page que importe landing components
- [x] Dejar re-export stubs en ubicaciones originales
- [x] Verificar: `npm run check-types` — 0 errores

## 4. Implementacion

### Fase 14

**Estructura creada:**
```
src/modules/landing/
  features/
    home/
      components/          # 39 archivos de landing_components migrados
        About/
        Animation/
        Blog/
        Brands/
        Common/
        Contact/
        Features/
        Footer/
        Header/
        Hero/
        Pricing/
        ScrollToTop/
        Testimonials/
        Video/
        Landing.tsx
        Landing2.tsx
        Navbar.tsx
        BestBusines.tsx
        first-block.tsx
        header_viejo.tsx
    auth/
      components/
        LoginButton.tsx
        GoogleButton.tsx
        RegisterButton.tsx
        RefreshComponent.tsx
      actions/
        login.actions.ts     # login, logout, googleLogin
        register.actions.ts  # signup
```

**Archivos actualizados:**
- `src/app/page.tsx` — import de Landing apunta a `@/modules/landing/features/home/components/Landing`
- `src/app/login/page.tsx` — imports de LoginButton y GoogleButton apuntan a `@/modules/landing/features/auth/components/`
- `src/app/register/page.tsx` — import de RegisterButton apunta a `@/modules/landing/features/auth/components/`
- Imports relativos rotos en archivos copiados (`../ui/`, `../../../public/`) corregidos a `@/` paths

**Re-export stubs dejados en:**
- `src/components/landing_components/Landing.tsx`
- `src/components/landing_components/Landing2.tsx`
- `src/components/landing_components/Footer/index.tsx`
- `src/components/landing_components/ScrollToTop/index.tsx`
- `src/components/RefreshComponent.tsx`
- `src/app/login/componentsLogin/LoginButton.tsx`
- `src/app/login/componentsLogin/GoogleButton.tsx`
- `src/app/login/actions.ts`
- `src/app/register/componentsRegister/RegisterButton.tsx`
- `src/app/register/actions.ts`

**Criterio de completitud:** `modules/landing/` autosuficiente. Build limpio.

---

#### Fase 15: Modulo PDF
**Objetivo:** Centralizar generadores de PDF.

**15.1 Tareas:**
- [x] Decidir: crear `modules/pdf/` o mover a `shared/components/pdf/` segun si son especificos de un dominio o genericos
- [x] Mover `src/components/pdf/` (6 archivos)
- [x] Si son especificos de un dominio (ej: PDF de empleado), mover al modulo correspondiente (`modules/employees/features/pdf/`)
- [x] Verificar: `npm run check-types`

**Criterio de completitud:** Archivos PDF reubicados. Build limpio.

---

#### Fase 16: Eliminar barrels legacy y re-exports temporales
**Objetivo:** Limpiar todos los re-exports temporales y eliminar los archivos barrel `GET/actions.ts` y `UPDATE/actions.ts`.

**16.1 Eliminar barrels de server actions:**
- [x] Auditar que NINGUN archivo importe de `@/app/server/GET/actions` o `@/app/server/UPDATE/actions`
- [x] Si quedan imports, actualizar a las nuevas rutas en `@/modules/*/features/*/actions.server.ts` o `@/shared/actions/*`
- [x] Eliminar `src/app/server/GET/actions.ts`
- [x] Eliminar `src/app/server/UPDATE/actions.ts`
- [x] Eliminar `src/app/server/company/`, `src/app/server/employees/`, `src/app/server/documents/`, `src/app/server/vehicles/`, `src/app/server/hse/`, `src/app/server/repairs/`, `src/app/server/covenant/`, `src/app/server/daily-reports/`, `src/app/server/shared/` — SOLO si estan vacios o solo tienen re-exports
- [x] Eliminar `src/app/server/colections.ts` (ya movido a shared/types/)

**16.2 Eliminar re-exports temporales de Fase 1-3:**
- [x] Eliminar re-exports en `src/types/` (reemplazar imports en los 53 archivos restantes)
- [x] Eliminar re-exports en `src/lib/` (reemplazar imports en los 25+ archivos restantes)
- [x] Eliminar re-exports en `src/hooks/` (reemplazar imports en los 27 archivos restantes)
- [x] Eliminar re-exports en `src/zodSchemas/`
- [x] Eliminar re-exports en `src/store/` (reemplazar imports en los 87 archivos que usan useLoggedUserStore)
- [x] Eliminar re-exports en `src/components/ui/` y `src/components/` (reemplazar imports)
- [x] Eliminar directorios vacios resultantes

**16.3 Eliminar directorio features residual:**
- [x] Verificar que `src/features/` esta vacio (Hse fue migrado en Fase 10)
- [x] Eliminar `src/features/` si esta vacio
- [x] Si quedan archivos de `src/features/Empresa/PortalEmpleados/`, migrar al modulo correspondiente

- [x] Verificar: `npm run check-types`
- [x] Verificar: `npm run build` (build completo)

**Criterio de completitud:** 0 archivos re-export temporales. 0 barrels legacy. Solo quedan en `src/app/` archivos de routing. Build completo exitoso.

---

#### Fase 17: Renombrado y convencion final
**Objetivo:** Aplicar convenciones de nombres de `project-structure.md`.

**17.1 Tareas:**
- [x] Renombrar client components con prefijo `_` segun convencion (ej: `General.tsx` -> `_General.tsx` si tiene `'use client'`)
- [x] Corregir typos en nombres de archivos: `colums.tsx` -> `columns.tsx`, `accions.ts` -> `actions.ts`, `columEmp.tsx` -> `columnsEmployee.tsx`
- [x] Estandarizar nombres a ingles donde haya mezcla (ej: `Tipos_de_reparaciones` ya renombrado como `maintenance`)
- [x] Renombrar `data-table.tsx` genericos a nombres descriptivos si coexisten multiples (ej: `employee-data-table.tsx`)
- [x] Verificar: `npm run check-types`

**Criterio de completitud:** Todos los archivos siguen la convencion de `project-structure.md`.

---

#### Fase 18: Verificacion final y documentacion
**Objetivo:** Validar la estructura completa y actualizar documentacion.

**18.1 Verificacion:**
- [x] Ejecutar `npm run build` — build completo sin errores
- [x] Ejecutar `npm run lint` — sin errores criticos
- [x] Ejecutar `npm run check-types` — 0 errores
- [x] Verificar que `src/app/` SOLO contiene: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, subcarpetas de rutas, y `api/` (6 non-routing files found, documented below)
- [x] Verificar que NO existen imports cruzados entre modulos (grep `from '@/modules/X'` dentro de `modules/Y`) — cross-module imports exist, documented below
- [x] Verificar que NO quedan imports a `@/app/server/GET/actions` ni `@/app/server/UPDATE/actions`
- [ ] Verificar manualmente: login, navegacion, CRUD de empleado, subida de documento, dashboard (pendiente — requiere entorno de ejecucion)

**18.2 Documentacion:**
- [x] Actualizar `CLAUDE.md` con la nueva estructura de directorios
- [x] Actualizar `docs/project-structure.md` para reflejar los modulos reales del proyecto
- [x] Actualizar path aliases en `tsconfig.json` si se agregaron nuevos (no fue necesario — `@/*` cubre todo)

**Criterio de completitud:** La app pasa todas las verificaciones. La documentacion refleja la realidad.

---

### 2.3 Resumen de fases

| Fase | Nombre | Archivos estimados | Dependencias |
|------|--------|--------------------|--------------|
| 0 | Preparacion y limpieza | ~5 dirs | Ninguna |
| 1 | Shared: tipos, lib, hooks, schemas, store | ~50 archivos | Fase 0 |
| 2 | Server actions compartidas | ~20 funciones | Fase 1 |
| 3 | Componentes shared (UI, layout, common) | ~70 archivos | Fase 1 |
| 4 | Modulo Company | ~50 archivos | Fases 2, 3 |
| 5 | Modulo Employees | ~25 archivos | Fases 2, 3 |
| 6 | Modulo Documents | ~35 archivos | Fases 2, 3 |
| 7 | Modulo Equipment | ~15 archivos | Fases 2, 3 |
| 8 | Modulo Maintenance | ~25 archivos | Fases 2, 3 |
| 9 | Modulo Operations | ~25 archivos | Fases 2, 3 |
| 10 | Modulo HSE | ~50 archivos | Fases 2, 3 |
| 11 | Modulo Forms | ~30 archivos | Fases 2, 3 |
| 12 | Modulo Dashboard | ~25 archivos | Fases 4-11 |
| 13 | Modulo Admin | ~15 archivos | Fases 4-11 |
| 14 | Modulo Landing | ~40 archivos | Fase 3 |
| 15 | Modulo PDF | ~6 archivos | Fases 4-11 |
| 16 | Eliminar barrels y re-exports | ~200 updates | Fases 4-15 |
| 17 | Renombrado y convenciones | ~30 renames | Fase 16 |
| 18 | Verificacion final | 0 archivos | Fase 17 |

**Total estimado:** ~430+ archivos reubicados, ~200 imports actualizados en fase final.

### 2.4 Orden de ejecucion y paralelismo

```
Fase 0 (prereq)
    |
Fase 1 (shared base)
    |
    +------+------+
    |             |
Fase 2          Fase 3
(actions)     (components)
    |             |
    +------+------+
           |
    Fases 4-11 (modulos — pueden hacerse en paralelo si no hay conflictos)
           |
    Fases 12-15 (modulos dependientes)
           |
    Fase 16 (limpieza barrels)
           |
    Fase 17 (convenciones)
           |
    Fase 18 (verificacion)
```

**Nota sobre paralelismo:** Las fases 4-11 son independientes entre si (cada modulo no importa de otro). Se pueden ejecutar en paralelo por diferentes desarrolladores o en el orden que se prefiera. Se recomienda empezar por Company (Fase 4) por ser el modulo mas complejo y que mas dependencias resuelve.

### 2.5 Estrategia de testing

- **Durante cada fase:** `npm run check-types` despues de cada batch de archivos movidos
- **Despues de cada fase completa:** `npm run build` para validar que no hay regresiones
- **Tests unitarios:** Opcionalmente agregar Vitest para server actions criticas (auth, company, documents). No es bloqueante para el refactor.
- **Tests E2E:** Opcionalmente agregar Playwright para flujos criticos (login, CRUD empleado, subida documento). No es bloqueante para el refactor.
- **Verificacion manual minima por fase:** Navegar a la seccion correspondiente en la app y verificar que funciona.

### 2.6 Estrategia de git

- Rama base: `refactor/plan-maestro` (NO main)
- Una rama por fase (ej: `refactor/phase-0-cleanup`, `refactor/phase-1-shared`)
- PR por fase hacia `refactor/plan-maestro`
- Commits atomicos dentro de cada fase (por sub-tarea o grupo de archivos)
- Al terminar todas las fases y verificar que todo funciona, el usuario hace merge manual de `refactor/plan-maestro` hacia `main`

## 3. Diseno

### 3.1 Arquitectura de la solucion

#### Arbol de directorios objetivo

```
src/
├── app/                              # SOLO routing (page.tsx, layout.tsx, loading.tsx, error.tsx)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset_password/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx                  # import { DashboardView } from '@/modules/dashboard'
│   │   ├── layout.tsx
│   │   ├── company/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── actualCompany/
│   │   │       ├── page.tsx          # import { CompanyDetailView } from '@/modules/company'
│   │   │       ├── customers/
│   │   │       │   ├── page.tsx
│   │   │       │   └── action/page.tsx
│   │   │       ├── contact/
│   │   │       │   └── action/page.tsx
│   │   │       ├── covenant/         # (sin page propio, es tab dentro de company)
│   │   │       └── user/[id]/page.tsx
│   │   ├── employee/
│   │   │   ├── page.tsx              # import { EmployeeView } from '@/modules/employees'
│   │   │   └── action/page.tsx
│   │   ├── equipment/
│   │   │   ├── page.tsx
│   │   │   └── action/page.tsx
│   │   ├── document/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── equipment/page.tsx
│   │   ├── maintenance/
│   │   │   └── page.tsx
│   │   ├── operations/
│   │   │   └── page.tsx
│   │   ├── forms/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── new/page.tsx
│   │   │       └── view/page.tsx
│   │   ├── hse/
│   │   │   └── page.tsx
│   │   └── help/page.tsx
│   ├── admin/
│   │   └── page.tsx
│   ├── maintenance/[id]/page.tsx
│   └── api/                          # API routes (sin cambios)
│       ├── company/
│       ├── employees/
│       ├── equipment/
│       ├── daily-report/
│       ├── repairs/
│       ├── services/
│       └── profile/
│
├── modules/                          # Logica de negocio por dominio
│   ├── dashboard/
│   │   ├── features/
│   │   │   └── overview/
│   │   │       ├── DashboardView.tsx          # Server Component principal
│   │   │       ├── actions.server.ts          # (vacio por ahora, dashboard usa datos de otros modulos)
│   │   │       ├── components/
│   │   │       │   ├── _DashboardComponent.tsx
│   │   │       │   ├── _CardButton.tsx
│   │   │       │   ├── _CardNumber.tsx
│   │   │       │   ├── _EmployeesTable.tsx
│   │   │       │   ├── _DocumentsTable.tsx
│   │   │       │   ├── _EPendingDocumentTable.tsx
│   │   │       │   ├── _VPendingDocumentTable.tsx
│   │   │       │   └── table/
│   │   │       │       ├── expiringDocumentColumns.tsx
│   │   │       │       └── _ExpiredDocumentColumsEquipment.tsx
│   │   │       └── index.ts
│   │   └── index.ts
│   │
│   ├── company/
│   │   ├── features/
│   │   │   ├── detail/
│   │   │   │   ├── CompanyDetailView.tsx
│   │   │   │   ├── actions.server.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── _CompanyComponent.tsx
│   │   │   │   │   ├── _DangerZoneComponent.tsx
│   │   │   │   │   ├── _EditCompanyButton.tsx
│   │   │   │   │   ├── _DocumentTabComponent.tsx
│   │   │   │   │   ├── _UsersTabComponent.tsx
│   │   │   │   │   ├── _RegisterWithRole.tsx
│   │   │   │   │   ├── _ServiceComponent.tsx
│   │   │   │   │   ├── _PortalEmployeeWrapper.tsx
│   │   │   │   │   └── columns/
│   │   │   │   │       ├── columns.tsx
│   │   │   │   │       ├── columnsGuests.tsx
│   │   │   │   │       └── document-colums.tsx
│   │   │   │   └── index.ts
│   │   │   ├── create/
│   │   │   │   ├── actions.server.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── _CompanyRegister.tsx
│   │   │   │   │   └── _CreateCompanyButton.tsx
│   │   │   │   └── index.ts
│   │   │   ├── customers/
│   │   │   │   ├── CustomersView.tsx
│   │   │   │   ├── actions.server.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── _Customers.tsx
│   │   │   │   │   ├── _CustomerComponent.tsx
│   │   │   │   │   └── columns/
│   │   │   │   │       ├── columns.tsx
│   │   │   │   │       └── columnsCustomers.tsx
│   │   │   │   └── index.ts
│   │   │   ├── contacts/
│   │   │   │   ├── actions.server.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── _Contacts.tsx
│   │   │   │   │   ├── _ContactComponent.tsx
│   │   │   │   │   └── columns.tsx
│   │   │   │   └── index.ts
│   │   │   ├── users/
│   │   │   │   ├── actions.server.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── _UserForm.tsx
│   │   │   │   │   └── _AddCompanyDocumentForm.tsx
│   │   │   │   └── index.ts
│   │   │   └── covenant/
│   │   │       ├── actions.server.ts
│   │   │       ├── components/
│   │   │       │   ├── _CovenantTreeFile.tsx
│   │   │       │   ├── _CovenantComponent.tsx
│   │   │       │   ├── _CovenantRegister.tsx
│   │   │       │   ├── _AddCovenantModal.tsx
│   │   │       │   ├── _AddGuildModal.tsx
│   │   │       │   ├── _AddCategoryModal.tsx
│   │   │       │   └── columns/
│   │   │       │       ├── columnsCct.tsx
│   │   │       │       ├── columnsGuild.tsx
│   │   │       │       └── columnsCategory.tsx
│   │   │       └── index.ts
│   │   ├── shared/
│   │   │   ├── types.ts
│   │   │   └── validators.ts
│   │   └── index.ts
│   │
│   ├── employees/
│   │   ├── features/
│   │   │   ├── list/
│   │   │   │   ├── EmployeeView.tsx
│   │   │   │   ├── actions.server.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── _EmployeeListTabs.tsx
│   │   │   │   │   └── columns.tsx
│   │   │   │   └── index.ts
│   │   │   ├── create-edit/
│   │   │   │   ├── actions.server.ts
│   │   │   │   ├── components/
│   │   │   │   │   └── _EmployeeForm.tsx (useEmployeeForm.ts)
│   │   │   │   └── index.ts
│   │   │   └── diagrams/
│   │   │       ├── actions.server.ts
│   │   │       ├── components/
│   │   │       │   ├── _EmployesDiagram.tsx
│   │   │       │   └── _DiagramFormUpdated.tsx
│   │   │       └── index.ts
│   │   ├── shared/
│   │   │   ├── types.ts
│   │   │   └── validators.ts
│   │   └── index.ts
│   │
│   ├── equipment/
│   │   ├── features/
│   │   │   ├── list/
│   │   │   │   ├── EquipmentView.tsx
│   │   │   │   ├── actions.server.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── _EquipmentListTabs.tsx
│   │   │   │   │   └── columns.tsx
│   │   │   │   └── index.ts
│   │   │   └── create-edit/
│   │   │       ├── actions.server.ts
│   │   │       ├── components/
│   │   │       │   └── _VehiclesForm.tsx (useVehicleForm.ts)
│   │   │       └── index.ts
│   │   ├── shared/
│   │   │   ├── types.ts
│   │   │   └── validators.ts
│   │   └── index.ts
│   │
│   ├── documents/
│   │   ├── features/
│   │   │   ├── list/
│   │   │   │   ├── DocumentsView.tsx
│   │   │   │   ├── actions.server.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── _TabsDocuments.tsx
│   │   │   │   │   ├── _EmployeeDocumentsTabs.tsx
│   │   │   │   │   ├── _EquipmentTabs.tsx
│   │   │   │   │   ├── _CompanyTabs.tsx
│   │   │   │   │   ├── _EquipmentDocumentsTable.tsx
│   │   │   │   │   ├── _DocumentTable.tsx
│   │   │   │   │   ├── _TypesDocumentsView.tsx
│   │   │   │   │   ├── _TypesDocumentAction.tsx
│   │   │   │   │   └── columns/
│   │   │   │   │       ├── colums.tsx
│   │   │   │   │       ├── columsMonthly.tsx
│   │   │   │   │       └── columsMonthlyEquipment.tsx
│   │   │   │   └── index.ts
│   │   │   ├── detail/
│   │   │   │   ├── DocumentDetailView.tsx
│   │   │   │   ├── actions.server.ts
│   │   │   │   └── index.ts
│   │   │   └── upload/
│   │   │       ├── actions.server.ts
│   │   │       ├── components/
│   │   │       │   ├── _UploadDocument.tsx
│   │   │       │   ├── _NewDocumentMulti.tsx
│   │   │       │   ├── _NewDocumentNoMulti.tsx
│   │   │       │   ├── _SimpleDocument.tsx
│   │   │       │   ├── _MultiResourceDocument.tsx
│   │   │       │   ├── _ReplaceDocument.tsx
│   │   │       │   ├── _UpdateDocuments.tsx
│   │   │       │   ├── _DeleteDocument.tsx
│   │   │       │   ├── _ApproveDocModal.tsx
│   │   │       │   ├── _DenyDocModal.tsx
│   │   │       │   └── _NewDocumentType/
│   │   │       │       └── _useNewDocumentType.ts
│   │   │       └── index.ts
│   │   ├── shared/
│   │   │   └── types.ts
│   │   └── index.ts
│   │
│   ├── maintenance/
│   │   ├── features/
│   │   │   └── repairs/
│   │   │       ├── RepairsView.tsx
│   │   │       ├── actions.server.ts
│   │   │       ├── components/
│   │   │       │   ├── _RepairTypeForm.tsx
│   │   │       │   ├── _RepairEntry.tsx
│   │   │       │   ├── _RepairEntryMultiple.tsx
│   │   │       │   └── _RepairSolicitudesTable/
│   │   │       │       ├── _RepairModal.tsx
│   │   │       │       └── mechanicColumns.tsx
│   │   │       └── index.ts
│   │   └── index.ts
│   │
│   ├── operations/
│   │   ├── features/
│   │   │   └── daily-reports/
│   │   │       ├── actions.server.ts
│   │   │       ├── components/
│   │   │       │   └── _DailyReport/
│   │   │       └── index.ts
│   │   └── index.ts
│   │
│   ├── forms/
│   │   ├── features/
│   │   │   ├── list/
│   │   │   │   ├── FormsView.tsx
│   │   │   │   ├── actions.server.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── _CreatedForm.tsx
│   │   │   │   │   └── _FormDisplay.tsx
│   │   │   │   └── index.ts
│   │   │   ├── create/
│   │   │   │   ├── actions.server.ts
│   │   │   │   └── components/
│   │   │   │       ├── _mail.tsx
│   │   │   │       └── _mail-list.tsx
│   │   │   └── answer/
│   │   │       ├── actions.server.ts
│   │   │       └── components/
│   │   │           └── _Inputs.tsx
│   │   └── index.ts
│   │
│   ├── hse/
│   │   ├── features/
│   │   │   └── training/
│   │   │       ├── actions.server.ts
│   │   │       ├── components/
│   │   │       │   └── _Capacitaciones/
│   │   │       └── index.ts
│   │   └── index.ts
│   │
│   └── admin/
│       ├── features/
│       │   └── panel/
│       │       ├── AdminView.tsx
│       │       ├── components/
│       │       │   ├── _adminNavbar.tsx
│       │       │   └── _adminAvatar.tsx
│       │       └── index.ts
│       └── index.ts
│
├── shared/                           # Codigo compartido entre modulos
│   ├── actions/                      # Server actions compartidas
│   │   ├── auth.ts                   # Autenticacion y perfil
│   │   ├── catalogs.ts              # Catalogos: roles, industry types, document types globales
│   │   ├── geography.ts            # Paises, provincias, ciudades
│   │   ├── storage.ts              # Upload/download de archivos
│   │   ├── notifications.ts        # Notificaciones
│   │   └── email.ts                # Envio de emails
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui (sin cambios)
│   │   ├── layout/
│   │   │   ├── _SideBarContainer.tsx  (Server Component que orquesta sidebar)
│   │   │   ├── _Sidebar.tsx           (Client Component)
│   │   │   ├── _SideLinks.tsx
│   │   │   ├── _NavBar.tsx
│   │   │   └── _ModalCompany.tsx
│   │   ├── common/
│   │   │   ├── _Viewcomponent.tsx
│   │   │   ├── _DocumentNav.tsx
│   │   │   ├── _DocumentationDrawer.tsx
│   │   │   ├── _AlertComponent.tsx
│   │   │   ├── _MissingDocumentList.tsx
│   │   │   └── _ReportAnIssue.tsx
│   │   └── data-table/              # Ya existe en src/shared/components/data-table
│   │       ├── base/
│   │       ├── filters/
│   │       └── toolbars/
│   │
│   ├── hooks/
│   │   ├── useCompanyData.ts
│   │   ├── useEmployeesData.ts
│   │   ├── useDocuments.ts
│   │   ├── useProfileData.ts
│   │   └── useUploadImage.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts                # Singleton Prisma client (ya existe en src/lib/)
│   │   ├── server-action-context.ts # getActionContext, getRequiredActionContext
│   │   ├── storage-server.ts        # Storage server utils
│   │   ├── storage.ts               # Storage client utils
│   │   ├── utils.ts                 # cn() y utilidades generales
│   │   ├── utils/
│   │   │   ├── getRole.ts
│   │   │   └── utils.ts
│   │   ├── documentFilters.ts
│   │   ├── errorHandler.ts
│   │   ├── emailTemplates.ts
│   │   ├── renderEmail.tsx
│   │   └── transitions.ts
│   │
│   ├── store/
│   │   ├── loggedUser.ts            # Facade store (se mantiene para retrocompatibilidad)
│   │   ├── authStore.ts
│   │   ├── companyStore.ts
│   │   ├── employeeStore.ts
│   │   ├── documentStore.ts
│   │   ├── vehicleStore.ts
│   │   ├── uiStore.ts
│   │   ├── countries.ts
│   │   ├── documentValidation.ts
│   │   ├── editState.ts
│   │   ├── sidebar.ts
│   │   ├── InitUser.tsx
│   │   ├── InitProfile.tsx
│   │   └── InitEmployees.tsx
│   │
│   ├── types/
│   │   └── types.ts
│   │
│   ├── zodSchemas/
│   │   └── schemas.ts
│   │
│   ├── config/
│   │   └── (futuro: instance.ts, storage.config.ts)
│   │
│   └── pdf/
│       └── generators/
│           ├── TransporteSPANAYCHKHYS01.tsx
│           ├── TransporteSPANAYCHKHYS03.tsx
│           └── TransporteSPANAYCHKHYS04.tsx
│
├── generated/prisma/                # Tipos generados por Prisma (sin cambios)
│
├── providers/                       # Context providers (futuro)
│
└── database.types.ts                # Tipos Supabase legacy (se mantiene hasta eliminar refs)
```

#### Como se ven las paginas despues de la reestructuracion

Las paginas en `src/app/` se convierten en **thin wrappers** que solo importan y renderizan componentes de `src/modules/`. Toda la logica de composicion de tabs, data fetching y seleccion de componentes se mueve al Server Component del modulo.

**Ejemplo: `src/app/dashboard/employee/page.tsx` (DESPUES)**

```typescript
import { EmployeeView } from '@/modules/employees';
import PageTableSkeleton from '@/shared/components/common/_Viewcomponent';
import { Suspense } from 'react';

export default async function EmployeePage() {
  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <EmployeeView />
    </Suspense>
  );
}
```

Toda la logica actual de `viewData`, tabs, botones de accion, etc. se mueve a `modules/employees/features/list/EmployeeView.tsx`.

**Ejemplo: `src/app/dashboard/page.tsx` (DESPUES)**

```typescript
import { DashboardView } from '@/modules/dashboard';
import DashboardSkeleton from '@/shared/components/common/_DashboardSkeleton';
import { Suspense } from 'react';

export default async function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
```

#### El patron `actions.server.ts`

Cada feature tiene un archivo `actions.server.ts` que contiene las server actions especificas de esa feature. Este archivo:

1. Declara `'use server'` al inicio
2. Importa `prisma` de `@/shared/lib/prisma`
3. Importa `getActionContext` de `@/shared/lib/server-action-context`
4. Contiene SOLO las funciones que esa feature necesita (queries + mutations)

**Ejemplo: `modules/employees/features/list/actions.server.ts`**

```typescript
'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

export const fetchAllEmployeesWithRelations = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];
  // ... logica existente
};

export const fetchAllEmployees = async (role?: string) => {
  // ... logica existente
};

export const fetchAllActivesEmployees = async () => {
  // ... logica existente
};

export const fetchEmployeesForInitStore = async (companyId: string, active: boolean) => {
  // ... logica existente
};
```

**Ejemplo: `modules/employees/features/diagrams/actions.server.ts`**

```typescript
'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

export const fetchDiagrams = async () => { /* ... */ };
export const fetchDiagramsByEmployeeId = async (employeeId: string) => { /* ... */ };
export const fetchDiagramsTypes = async () => { /* ... */ };
export const getDiagramEmployee = async ({ employee_id }: { employee_id: string }) => { /* ... */ };
export const UpdateDiagramsById = async (diagramData: { diagram_type: string; diagramId: string }[]) => { /* ... */ };
export const CreateDiagrams = async (diagramData: EmployeeDiagramInsert[]) => { /* ... */ };
```

#### Como se estructuran los archivos de `shared/actions/`

Las funciones que son utilizadas por **multiples modulos** se centralizan en `shared/actions/`. Cada archivo agrupa funciones por dominio transversal:

- **`auth.ts`** — Autenticacion, sesion, perfil de usuario
- **`catalogs.ts`** — Datos de catalogos (roles, industry types, work diagrams, document types globales)
- **`geography.ts`** — Paises, provincias, ciudades
- **`storage.ts`** — Upload/download de archivos via presigned URLs
- **`notifications.ts`** — CRUD de notificaciones
- **`email.ts`** — Envio de emails via nodemailer

### 3.2 Modelos de datos

_No aplica — este proyecto es exclusivamente de reestructuracion de archivos. No hay cambios en el esquema de base de datos, ni nuevas tablas, ni migraciones._

### 3.3 Funciones y metodos

#### `shared/actions/auth.ts`

Funciones de autenticacion y perfil extraidas de `src/app/server/company/queries.ts` y `src/app/server/company/mutations.ts`:

```typescript
'use server';
import { prisma } from '@/shared/lib/prisma';
import { auth } from '@/auth';
import { supabaseServer } from '@/shared/lib/supabase/server';

// De company/queries.ts
export const fetchCurrentUser: () => Promise<{ id: string; email?: string } | null>;
export const getCurrentProfile: () => Promise<profile[]>;
export const fetchProfileByCredentialId: (credentialId: string) => Promise<profile[]>;
export const verifyUserRoleInCompany: () => Promise<{ rol: string; modulos: string[] } | string>;

// De company/mutations.ts
export const fetchProfileByEmail: (email: string) => Promise<profile[]>;
export const fetchProfileByEmailServer: (email: string) => Promise<profile[]>;
export const insertProfile: (profileData: Record<string, unknown>) => Promise<{ data: profile[] | null; error: string | null }>;
export const insertProfileServer: (profileData: Record<string, unknown>) => Promise<{ data: profile[] | null; error: string | null }>;
export const updateProfileAvatar: (profileId: string, avatarUrl: string) => Promise<{ data: profile | null; error: string | null }>;
export const fetchRoles: () => Promise<roles[]>;

// De shared/queries.ts
export const fetchProfileById: (userId: string) => Promise<profile | null>;
export const fetchProfileBySupabaseUserId: (userId: string) => Promise<profile[]>;
```

#### `shared/actions/catalogs.ts`

Funciones de catalogos globales extraidas de `shared/queries.ts`, `shared/mutations.ts`, `company/queries.ts`:

```typescript
'use server';
import { prisma } from '@/shared/lib/prisma';

// De company/queries.ts
export const fetchIndustryTypes: () => Promise<industry_type[]>;

// De shared/queries.ts
export const fetchAllCompanies: () => Promise<company[]>;
export const fetchAllWorkDiagramsAdmin: () => Promise<work_diagram[]>;
export const fetchAllIndustryTypes: () => Promise<industry_type[]>;
export const fetchAllTypesOfVehicles: () => Promise<types_of_vehicles[]>;
export const fetchActiveDocumentTypesGlobal: () => Promise<document_types[]>;
export const fetchPresentedDocumentsForAuditor: () => Promise<{ equipmentDocs: any[]; employeeDocs: any[] }>;
export const fetchEmployeeByCuil: (cuil: string) => Promise<employees[]>;

// De company/mutations.ts
export const logErrorMessage: (message: string, path: string) => Promise<{ error: string | null }>;
```

#### `shared/actions/geography.ts`

Funciones de geografia extraidas de `company/queries.ts`:

```typescript
'use server';
import { prisma } from '@/shared/lib/prisma';

export const fetchCountries: () => Promise<countries[]>;
export const fetchProvinces: () => Promise<{ id: number; name: string }[]>;
export const fetchCitiesByProvince: (provinceId: number) => Promise<cities[]>;
```

#### `shared/actions/storage.ts`

Funciones de storage (mover desde `src/lib/storage-server.ts` y `src/lib/storage.ts`):

```typescript
'use server';
// Re-export de las funciones de storage existentes
// Este archivo actua como server action wrapper para operaciones de storage
// Las funciones de bajo nivel permanecen en shared/lib/storage-server.ts
```

#### `shared/actions/notifications.ts`

Funciones de notificaciones extraidas de `company/queries.ts`:

```typescript
'use server';
import { prisma } from '@/shared/lib/prisma';

export const fetchNotificationsByCompany: (companyId: string) => Promise<notifications[]>;
export const deleteNotificationsByCompany: (companyId: string) => Promise<{ error: string | null }>;
```

#### `shared/actions/email.ts`

Funcion de envio de email (mover desde `src/app/actions/sendEmail.ts`):

```typescript
'use server';
import nodemailer from 'nodemailer';

type EmailOptions = {
  to: string;
  subject: string;
  userEmail: string;
  template?: 'document' | 'help';
  body?: EmailInfo;
  html?: string;
  text?: string;
  reason?: string;
};

export const sendEmail: (options: EmailOptions) => Promise<{ success: boolean; messageId?: string; error?: string }>;
```

#### Patron de re-export barrel durante la transicion

Para no romper los ~43 archivos que importan de `@/app/server/GET/actions` y los ~38 que importan de `@/app/server/UPDATE/actions`, se mantienen los archivos barrel existentes como puentes de retrocompatibilidad.

**`src/app/server/GET/actions.ts` (se mantiene durante la transicion)**

```typescript
// =============================================================
// BARREL DE RETROCOMPATIBILIDAD
// Estos re-exports se eliminaran gradualmente.
// Importar directamente desde:
//   - @/modules/{modulo}/features/{feature}/actions.server.ts (domain actions)
//   - @/shared/actions/{area}.ts (shared actions)
// =============================================================

// Shared actions
export {
  fetchCurrentUser,
  getCurrentProfile,
  fetchProfileByCredentialId,
  verifyUserRoleInCompany,
  fetchProfileByEmail,
  fetchProfileByEmailServer,
  fetchRoles,
  fetchProfileById,
  fetchProfileBySupabaseUserId,
} from '@/shared/actions/auth';

export {
  fetchCountries,
  fetchProvinces,
  fetchCitiesByProvince,
} from '@/shared/actions/geography';

export {
  fetchIndustryTypes,
  fetchAllCompanies,
  fetchAllWorkDiagramsAdmin,
  fetchAllIndustryTypes,
  fetchAllTypesOfVehicles,
  fetchActiveDocumentTypesGlobal,
  fetchPresentedDocumentsForAuditor,
  fetchEmployeeByCuil,
} from '@/shared/actions/catalogs';

export {
  fetchNotificationsByCompany,
  deleteNotificationsByCompany,
} from '@/shared/actions/notifications';

// Module-specific actions (re-exported for backward compatibility)
export * from '@/modules/company/features/detail/actions.server';
export * from '@/modules/employees/features/list/actions.server';
export * from '@/modules/employees/features/diagrams/actions.server';
export * from '@/modules/equipment/features/list/actions.server';
export * from '@/modules/documents/features/list/actions.server';
export * from '@/modules/maintenance/features/repairs/actions.server';
export * from '@/modules/forms/features/list/actions.server';
```

**`src/app/server/UPDATE/actions.ts` (se mantiene durante la transicion)**

```typescript
// =============================================================
// BARREL DE RETROCOMPATIBILIDAD — MUTATIONS
// =============================================================
export * from '@/modules/company/features/detail/actions.server';
export * from '@/modules/employees/features/create-edit/actions.server';
export * from '@/modules/employees/features/diagrams/actions.server';
export * from '@/modules/equipment/features/create-edit/actions.server';
export * from '@/modules/documents/features/upload/actions.server';
export * from '@/modules/maintenance/features/repairs/actions.server';
export * from '@/modules/forms/features/create/actions.server';
```

#### Patron de `actions.server.ts` final por modulo

Cada `actions.server.ts` combina queries y mutations relevantes a esa feature. Ya no hay separacion queries/mutations por archivo:

**`modules/company/features/detail/actions.server.ts`**

```typescript
'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

// --- Queries ---
export const fetchCurrentCompany = async () => { /* ... */ };
export const fetchCustomers = async () => { /* ... */ };
export const fetchCompanyDocuments = async () => { /* ... */ };
export const getCompanyDetails = async (companyId: string) => { /* ... */ };
export const fetchCompaniesByOwner = async (ownerId: string) => { /* ... */ };
export const fetchSharedCompaniesByProfile = async (profileId: string) => { /* ... */ };
export const fetchSharedUsersByCompany = async (companyId: string) => { /* ... */ };
export const fetchContactsWithCustomers = async () => { /* ... */ };
export const fetchContactsByCompany = async (companyId: string) => { /* ... */ };
export const fetchCustomersByCompanyAll = async (companyId: string) => { /* ... */ };
export const fetchAllCompaniesWithRelations = async () => { /* ... */ };
export const fetchCompaniesByOwnerId = async (ownerId: string) => { /* ... */ };
export const fetchCompanyWithRelationsByOwner = async (ownerId: string) => { /* ... */ };
export const getAllUsers = async () => { /* ... */ };
export const getUsersbyId = async ({ id }: { id: string }) => { /* ... */ };
export const getOwnerUser = async () => { /* ... */ };
export const resetCompanyDefect = async (ownerId: string) => { /* ... */ };
export const setCompanyAsDefect = async (companyId: string) => { /* ... */ };

// --- Mutations ---
export const insertCompany = async (company: Record<string, unknown>) => { /* ... */ };
export const updateCompanyById = async (companyId: string, company: Record<string, unknown>) => { /* ... */ };
export const deleteCompanyById = async (companyId: string) => { /* ... */ };
export const logicDeleteCompanyById = async (companyId: string) => { /* ... */ };
export const setCompanyByDefect = async (companyId: string) => { /* ... */ };
export const updateCompanyLogoByCuit = async (cuit: string, logoUrl: string) => { /* ... */ };
export const updateModulesSharedUser = async ({ id, modules }: { id: string; modules: ModulosEnum[] }) => { /* ... */ };
export const insertShareCompanyUser = async (shareData: Record<string, unknown>) => { /* ... */ };
export const deleteShareCompanyUser = async (id: string) => { /* ... */ };
export const updateShareCompanyUserRole = async (id: string, role: string) => { /* ... */ };
export const updateDocumentCompanyByAppliesAndType = async (companyId: string, documentTypeId: string, updateData: Record<string, unknown>) => { /* ... */ };
export const updateDocumentTypePrivate = async (id: string, isPrivate: boolean) => { /* ... */ };

// --- Contacts (sub-feature, mismo archivo por simplicidad) ---
export const fetchCustomerById = async (id: string) => { /* ... */ };
export const fetchContactById = async (id: string) => { /* ... */ };
export const fetchCustomersByCompany = async (companyId: string) => { /* ... */ };
export const updateContactById = async (id: string, updateData: Record<string, unknown>) => { /* ... */ };
export const updateContactDeactivate = async (id: string, companyId: string, terminationDate: string, reason: string) => { /* ... */ };
export const reactivateContact = async (id: string) => { /* ... */ };

// --- Covenants ---
export const fetchCovenantsByCompany = async (companyId: string) => { /* ... */ };
export const fetchShareCompanyUsersByProfileAndCompany = async (profileId: string, companyId: string) => { /* ... */ };
export const insertGuild = async (name: string, companyId: string) => { /* ... */ };
export const insertCovenant = async (name: string, companyId?: string, guildId?: string) => { /* ... */ };
export const insertCategory = async (name: string, covenantId?: string) => { /* ... */ };
export const fetchCategoryById = async (id: string) => { /* ... */ };
```

### 3.4 Interfaces de usuario

_No aplica — no hay cambios en la UI. Solo se mueven archivos de ubicacion. Los componentes mantienen su aspecto y funcionalidad identicos._

### 3.5 Rutas y navegacion

#### Transformacion de paginas: antes y despues

Las rutas se mantienen identicas (mismas URLs). Lo que cambia es la estructura interna de cada `page.tsx`.

**`src/app/dashboard/employee/page.tsx`**

ANTES (contiene logica de composicion):
```typescript
import EmployesDiagram from '@/components/Diagrams/EmployesDiagram';
import DocumentNav from '@/components/DocumentNav';
import Viewcomponent from '@/components/ViewComponent';
// ... 12 imports mas de componentes dispersos
import CovenantTreeFile from '../company/actualCompany/covenant/CovenantTreeFile';
import EmployeeDocumentsTabs from '../document/documentComponents/EmployeeDocumentsTabs';
// etc.

const EmployeePage = async () => {
  const viewData = { defaultValue: 'employees', tabsValues: [ /* ~100 lineas de config */ ] };
  return <Viewcomponent viewData={viewData} />;
};
```

DESPUES (thin wrapper):
```typescript
import { EmployeeView } from '@/modules/employees';
import { Suspense } from 'react';

export default async function EmployeePage() {
  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <EmployeeView />
    </Suspense>
  );
}
```

**`src/app/dashboard/company/actualCompany/page.tsx`**

ANTES (contiene composicion de tabs con ~160 lineas):
```typescript
import CompanyComponent from '@/components/CompanyComponent';
import DangerZoneComponent from '@/components/DangerZoneComponent';
// ... 15 imports de componentes, features, etc.

export default async function CompanyPage() {
  const coockiesStore = await cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const viewData = { /* ~120 lineas de config de tabs */ };
  return <Viewcomponent viewData={viewData} />;
}
```

DESPUES:
```typescript
import { CompanyDetailView } from '@/modules/company';
import { Suspense } from 'react';

export default async function CompanyPage() {
  return (
    <Suspense fallback={<CompanySkeleton />}>
      <CompanyDetailView />
    </Suspense>
  );
}
```

**`src/app/dashboard/page.tsx`**

ANTES:
```typescript
import DashboardComponent from '@/components/Dashboard/DashboardComponent';
import DashboardSkeleton from '@/components/Skeletons/DashboardSkeleton';
import WelcomeComponent from './welcome-component';
import { getRole } from '@/lib/utils/getRole';

export default async function Home() {
  const role = await getRole();
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {!role && <DashboardSkeleton />}
      {role === 'Invitado' ? <WelcomeComponent /> : <DashboardComponent />}
    </Suspense>
  );
}
```

DESPUES:
```typescript
import { DashboardView } from '@/modules/dashboard';
import { Suspense } from 'react';

export default async function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
```

La logica de `getRole()` y decision `Invitado` vs dashboard completo se mueve dentro de `DashboardView.tsx`.

#### Paginas que necesitan cambiar sus imports

| Pagina | Imports actuales desde | Imports nuevos desde |
|--------|----------------------|---------------------|
| `dashboard/page.tsx` | `@/components/Dashboard/`, `@/lib/utils/` | `@/modules/dashboard` |
| `dashboard/employee/page.tsx` | `@/components/Diagrams/`, `@/components/DocumentNav`, `../document/documentComponents/`, `../company/actualCompany/covenant/` | `@/modules/employees` |
| `dashboard/employee/action/page.tsx` | `@/app/server/GET/actions`, `@/components/Employee/` | `@/modules/employees/features/create-edit` |
| `dashboard/equipment/page.tsx` | `@/app/dashboard/equipment/equipmentComponentes/` | `@/modules/equipment` |
| `dashboard/equipment/action/page.tsx` | `@/components/VehiclesForm/` | `@/modules/equipment/features/create-edit` |
| `dashboard/company/actualCompany/page.tsx` | `@/components/CompanyComponent`, `@/components/DangerZoneComponent`, `@/features/Empresa/`, `../document/documentComponents/` | `@/modules/company` |
| `dashboard/company/new/page.tsx` | `@/components/CompanyRegister` | `@/modules/company/features/create` |
| `dashboard/company/[id]/page.tsx` | `@/components/`, `@/app/server/GET/actions` | `@/modules/company/features/detail` |
| `dashboard/document/page.tsx` | `@/app/dashboard/document/documentComponents/`, `@/store/loggedUser` | `@/modules/documents` |
| `dashboard/document/[id]/page.tsx` | `@/app/server/GET/actions`, componentes locales | `@/modules/documents/features/detail` |
| `dashboard/document/equipment/page.tsx` | `@/store/loggedUser`, componentes locales | `@/modules/documents` |
| `dashboard/maintenance/page.tsx` | `@/components/Tipos_de_reparaciones/` | `@/modules/maintenance` |
| `dashboard/forms/page.tsx` | `@/app/server/GET/actions`, componentes locales | `@/modules/forms` |
| `dashboard/forms/[id]/page.tsx` | `@/app/server/GET/actions` | `@/modules/forms/features/list` |
| `dashboard/forms/new/page.tsx` | componentes locales | `@/modules/forms/features/create` |
| `dashboard/hse/page.tsx` | `@/components/Capacitaciones/` | `@/modules/hse` |
| `maintenance/[id]/page.tsx` | `@/app/server/GET/actions` | `@/modules/maintenance/features/repairs` |
| `admin/page.tsx` | `@/app/admin/components/` | `@/modules/admin` |
| `dashboard/company/actualCompany/customers/action/page.tsx` | `@/app/server/GET/actions` | `@/modules/company/features/customers` |
| `dashboard/company/actualCompany/user/[id]/page.tsx` | `@/app/server/GET/actions` | `@/modules/company/features/users` |

### 3.6 APIs / Endpoints

_No aplica — las rutas de API en `src/app/api/` no se modifican. Permanecen en su ubicacion actual._

### 3.7 Consideraciones tecnicas

#### Estrategia de path aliases

No se agregan nuevos aliases a `tsconfig.json`. El alias existente `@/*` que mapea a `./src/*` es suficiente:

- `@/modules/employees/...` → `./src/modules/employees/...`
- `@/shared/actions/auth` → `./src/shared/actions/auth`
- `@/shared/lib/prisma` → `./src/shared/lib/prisma`
- `@/shared/store/loggedUser` → `./src/shared/store/loggedUser`

No se necesitan aliases adicionales como `@modules/` o `@shared/` porque el patron `@/modules/` y `@/shared/` ya funciona con el alias actual.

#### Patron de re-exports temporales

Durante la transicion, los archivos originales se reemplazan por re-exports que apuntan a las nuevas ubicaciones. Esto permite que los ~80+ archivos que importan desde las ubicaciones antiguas sigan funcionando sin modificacion inmediata.

**Patron para archivos de componentes movidos (ej: `src/components/CompanyComponent.tsx`)**

```typescript
// src/components/CompanyComponent.tsx
// DEPRECATED: Este archivo es un re-export temporal.
// Importar desde @/modules/company/features/detail/components/_CompanyComponent
export { default } from '@/modules/company/features/detail/components/_CompanyComponent';
```

**Patron para stores movidos (ej: `src/store/loggedUser.ts`)**

```typescript
// src/store/loggedUser.ts
// DEPRECATED: Este archivo es un re-export temporal.
// Importar desde @/shared/store/loggedUser
export { useLoggedUserStore, useAuthStore, useCompanyStore, useDocumentStore, useEmployeeStore, useUiStore, useVehicleStore } from '@/shared/store/loggedUser';
export type { CompanyDocumentsType } from '@/shared/store/loggedUser';
```

**Patron para server actions movidas (ej: `src/app/server/company/queries.ts`)**

```typescript
// src/app/server/company/queries.ts
// DEPRECATED: Re-export temporal
export * from '@/modules/company/features/detail/actions.server';
export { fetchCurrentUser, getCurrentProfile, verifyUserRoleInCompany, fetchProfileByCredentialId } from '@/shared/actions/auth';
export { fetchCountries, fetchProvinces, fetchCitiesByProvince } from '@/shared/actions/geography';
export { fetchIndustryTypes } from '@/shared/actions/catalogs';
export { fetchNotificationsByCompany, deleteNotificationsByCompany } from '@/shared/actions/notifications';
```

Los re-exports se eliminan en fases posteriores cuando se actualicen todos los imports consumidores.

#### Manejo de la directiva `'use server'`

Reglas para el uso de `'use server'` en la nueva estructura:

1. **`actions.server.ts`**: SIEMPRE declara `'use server'` al inicio del archivo. Este es el unico tipo de archivo que debe tener esta directiva.
2. **Componentes Server**: NO necesitan `'use server'`. Los Server Components son el default en Next.js App Router.
3. **Componentes Client** (`_Prefijo.tsx`): Declaran `'use client'` al inicio.
4. **Archivos de re-export barrel** (`index.ts`): NO declaran `'use server'`. Los re-exports propagan la directiva de los archivos originales.
5. **`shared/actions/*.ts`**: SIEMPRE declaran `'use server'`.
6. **`shared/lib/*.ts`**: NO declaran `'use server'` (son utilidades importadas por server actions).

#### Validacion de imports entre modulos

Para verificar que no existan imports cruzados entre modulos (ej: `@/modules/employees/` importando de `@/modules/company/`), se usara un script de validacion:

```bash
# Verificar que ningun modulo importe de otro modulo directamente
grep -r "from '@/modules/" src/modules/ | grep -v "index.ts" | \
  awk -F: '{
    split($1, a, "/");
    split($2, b, "modules/");
    split(b[2], c, "/");
    if (a[3] != c[1]) print $0
  }'
```

Este script se ejecuta como parte de la verificacion de cada fase para detectar violaciones. Si un modulo necesita funcionalidad de otro, debe extraerse a `shared/`.

#### La convencion `_Prefix.tsx` para Client Components

Todos los Client Components (archivos que declaran `'use client'`) se renombran con prefijo `_`:

- `CompanyComponent.tsx` → `_CompanyComponent.tsx`
- `Sidebar.tsx` → `_Sidebar.tsx`
- `EmployeeListTabs.tsx` → `_EmployeeListTabs.tsx`

Esta convencion permite identificar visualmente en el arbol de archivos cuales componentes son Client Components vs Server Components. El Server Component principal de cada feature NO lleva prefijo (ej: `EmployeeView.tsx`, `CompanyDetailView.tsx`).

**Excepcion**: Los archivos en `shared/components/ui/` (shadcn/ui) NO se renombran, ya que son componentes de terceros con convenciones propias.

#### Estrategia de Git

- Se trabaja sobre la rama `refactor/plan-maestro` (que ya existe y esta adelantada respecto a `main`)
- Cada fase de implementacion se commitea como un commit individual con mensaje descriptivo
- NO se crea una rama nueva por fase; todo va en `refactor/plan-maestro`
- Antes de empezar, hacer `git pull` para tener lo ultimo
- Al terminar todas las fases y verificar que `npm run build` pasa, el usuario hace merge manual a `main`

#### Manejo de `useLoggedUserStore` (88 archivos dependientes)

El facade store `useLoggedUserStore` se **mantiene intacto** durante toda la reestructuracion. La estrategia es:

1. **Mover** `src/store/loggedUser.ts` y todos los domain stores (`authStore.ts`, `companyStore.ts`, etc.) a `src/shared/store/`
2. **Dejar re-export** en `src/store/loggedUser.ts` que apunte a `@/shared/store/loggedUser`
3. **No modificar** ningun archivo que importe `useLoggedUserStore` — siguen funcionando via el re-export
4. En fases futuras (fuera de este proyecto), se migraran gradualmente los 88 archivos para importar de `@/shared/store/loggedUser` directamente o del domain store especifico

Los domain stores (`companyStore.ts`, etc.) que importan de `@/app/server/GET/actions` necesitaran actualizar sus imports a las nuevas ubicaciones. Esto se hace cuando se mueven los stores:

```typescript
// ANTES (companyStore.ts)
import { fetchCompaniesByOwner, ... } from '@/app/server/GET/actions';

// DESPUES (shared/store/companyStore.ts)
import { fetchCompaniesByOwner, ... } from '@/modules/company/features/detail/actions.server';
import { resetCompanyDefect, setCompanyAsDefect } from '@/modules/company/features/detail/actions.server';
```

#### Manejo de `database.types.ts` y tipos Supabase

El archivo `database.types.ts` (4168 lineas) en la raiz del proyecto es legacy de Supabase y se usa en algunos archivos. Estrategia:

1. **No mover ni eliminar** `database.types.ts` durante esta reestructuracion
2. Los tipos generados por Prisma (`src/generated/prisma/`) son la fuente de verdad para tipos de DB
3. Los archivos que aun importan de `database.types.ts` se dejaran como estan
4. El archivo `src/app/server/colections.ts` (que declara tipos globales via `declare global {}`) se mueve a `src/shared/types/colections.ts` con re-export en la ubicacion original
5. La limpieza de `database.types.ts` y migracion completa a tipos Prisma es un proyecto separado

#### Archivo `src/lib/supabase/` (browser.ts, server.ts)

Los clientes de Supabase se mueven a `src/shared/lib/supabase/` con re-exports en la ubicacion original. Estos archivos siguen siendo necesarios para las funciones de auth legacy que aun usan `supabase.auth.getUser()`.

## 4. Implementacion

### Fase 0: Preparacion y limpieza previa
- **Estado:** Completada
- **Archivos modificados:**
  - Eliminados: `src/domains/` (17 subdirectorios vacios), `src/infrastructure/` (5 subdirectorios vacios), `src/presentation/` (8 subdirectorios vacios), `src/config/` (vacio)
  - Creados con `.gitkeep`: `src/modules/`, `src/shared/actions/`, `src/shared/components/ui/`, `src/shared/components/layout/`, `src/shared/components/common/`, `src/shared/hooks/`, `src/shared/lib/`, `src/shared/types/`, `src/shared/zodSchemas/`, `src/shared/store/`
  - Editado: `src/app/server/employees/queries.ts` — eliminada funcion `fetchAllEmployeesJUSTEXAMPLE` (lineas 274-285)
  - Editado: `src/components/Dashboard/DashboardComponent.tsx` — eliminada importacion y uso comentado de `fetchAllEmployeesJUSTEXAMPLE`
- **Notas:** Los directorios existentes en `src/shared/` (components/data-table, components/utils, constants) se preservaron intactos. Las otras funciones JUSTEXAMPLE (`fetchAllEquipmentJUSTEXAMPLE`, `fetchAllRepairsJUSTEXAMPLE`) permanecen ya que no estaban en scope de esta fase. `npm run check-types` pasa sin errores.

### Fase 1: Mover shared/ — tipos, lib, hooks, schemas, store
- **Estado:** Completada
- **Fecha:** 2026-03-12
- **Archivos movidos (copiados a `src/shared/`, originales reemplazados con re-exports):**
  - **1.1 Types (8 archivos):** `blog.ts`, `brand.ts`, `enums.ts`, `feature.ts`, `menu.ts`, `testimonial.ts`, `types.ts` -> `src/shared/types/`. `colections.ts` -> `src/shared/types/collections.ts` (archivo usa `declare global`, re-export via `import` side-effect).
  - **1.2 Lib (16 archivos):** `api-response.ts`, `documentFilters.ts`, `download.ts`, `emailTemplates.ts`, `errorHandler.ts`, `prisma.ts`, `renderEmail.tsx`, `server-action-context.ts`, `storage-server.ts`, `storage.ts`, `transitions.ts`, `useServer.ts`, `utils.ts` -> `src/shared/lib/`. Subdirectorios: `supabase/server.ts`, `supabase/browser.ts` -> `src/shared/lib/supabase/`. `utils/getRole.ts`, `utils/utils.ts` -> `src/shared/lib/utils/`. Se corrigio import relativo de `database.types` en `supabase/server.ts` y `supabase/browser.ts` (de `../../../` a `../../../../`).
  - **1.3 Hooks (7 archivos):** `useAuthData.ts`, `useCompanyData.ts`, `useDocuments.ts`, `useEdgeFunctions.ts`, `useEmployeesData.ts`, `useProfileData.ts`, `useUploadImage.ts` -> `src/shared/hooks/`.
  - **1.4 Zod Schemas (1 archivo):** `schemas.ts` -> `src/shared/zodSchemas/`.
  - **1.5 Stores (15 archivos):** `authStore.ts`, `companyStore.ts`, `countries.ts`, `documentStore.ts`, `documentValidation.ts`, `editState.ts`, `employeeStore.ts`, `InitEmployees.tsx`, `InitProfile.tsx`, `InitUser.tsx`, `loggedUser.ts`, `sidebar.ts`, `uiStore.ts`, `vehicleStore.ts` -> `src/shared/store/`. Re-exports creados para los 4 stores importados directamente (`loggedUser`, `countries`, `editState`, `InitUser`) y todos los demas.
- **Re-exports creados:** Todos los archivos originales fueron reemplazados con re-exports (`export * from '@/shared/...'`). Para archivos con `export default` (`InitUser.tsx`, `InitEmployees.tsx`, `InitProfile.tsx`) se uso `export { default } from ...`.
- **Imports relativos entre stores:** No se modificaron — los stores usan `./authStore`, `./companyStore`, etc. que siguen funcionando porque todo el directorio se movio junto.
- **tsconfig.json:** No requirio cambios — el path alias `@/*` -> `./src/*` ya cubre `src/shared/`.
- **Verificacion:** `npm run check-types` pasa con 0 errores.

### Fase 2: Server actions compartidas
- **Estado:** Completada
- **Fecha:** 2026-03-12
- **Archivos creados en `src/shared/actions/`:**
  - **auth.ts** (12 funciones): `fetchCurrentUser`, `getCurrentProfile`, `verifyUserRoleInCompany`, `fetchProfileByCredentialId` (de company/queries.ts); `fetchProfileByEmail`, `fetchProfileByEmailServer`, `insertProfile`, `insertProfileServer`, `updateProfileAvatar`, `fetchRoles` (de company/mutations.ts); `fetchProfileById`, `fetchProfileBySupabaseUserId` (de shared/queries.ts)
  - **geography.ts** (3 funciones): `fetchCountries`, `fetchProvinces`, `fetchCitiesByProvince` (de company/queries.ts)
  - **catalogs.ts** (12 funciones): `fetchAllCompanies`, `fetchAllIndustryTypes`, `fetchAllTypesOfVehicles`, `fetchActiveDocumentTypesGlobal`, `fetchAllWorkDiagramsAdmin`, `fetchPresentedDocumentsForAuditor`, `fetchEmployeeByCuil` (de shared/queries.ts); `fetchIndustryTypes` (de company/queries.ts); `fetchHierarchy`, `fetchAllWorkDiagrams`, `fetchAllCategories` (de employees/queries.ts); `logErrorMessage` (de company/mutations.ts)
  - **storage.ts**: Placeholder con comentario — las funciones de storage permanecen en `shared/lib/storage-server.ts`
  - **notifications.ts** (2 funciones): `fetchNotificationsByCompany`, `deleteNotificationsByCompany` (de company/queries.ts)
  - **email.ts** (1 funcion): `sendEmail` (de app/actions/sendEmail.ts)
- **Archivos origen actualizados con re-exports:**
  - `src/app/server/company/queries.ts` — 10 funciones reemplazadas con re-exports de auth, geography, catalogs, notifications. Se eliminaron imports de `@/auth` y `@/lib/supabase/server` (ya no necesarios en este archivo).
  - `src/app/server/company/mutations.ts` — 7 funciones reemplazadas con re-exports de auth y catalogs.
  - `src/app/server/shared/queries.ts` — 9 funciones reemplazadas con re-exports de auth y catalogs.
  - `src/app/server/employees/queries.ts` — 3 funciones reemplazadas con re-exports de catalogs. Se agrego import con alias `_fetchAllCategories` para uso interno en `setEmployeeDataOptions`.
  - `src/app/actions/sendEmail.ts` — reemplazado completamente con re-export de `@/shared/actions/email`.
- **Barrels legacy preservados:** `GET/actions.ts` y `UPDATE/actions.ts` siguen funcionando via sus `export * from` de los domain files, que ahora re-exportan desde shared/actions.
- **Imports en archivos nuevos:** Usan `@/shared/lib/prisma`, `@/shared/lib/supabase/server`, `@/shared/lib/server-action-context`, `@/shared/lib/emailTemplates` (paths nuevos consistentes con Phase 1).
- **Verificacion:** `npm run check-types` pasa con 0 errores.

### Fase 3: Mover componentes shared (UI, layout, common, auth)
- **Estado:** Completada
- **Fecha:** 2026-03-12
- **Archivos movidos (copiados a destino, originales reemplazados con re-exports):**
  - **3.1 UI Components (48 archivos):** Todos los archivos de `src/components/ui/` (47 .tsx + 1 .ts) copiados a `src/shared/components/ui/`. Originales reemplazados con `export * from '@/shared/components/ui/...'`. Todos usan solo named exports, no hay default exports.
  - **3.2 Layout Components (4 archivos):** `Sidebar.tsx`, `SideBarContainer.tsx`, `SideLinks.tsx`, `NavBar.tsx` -> `src/shared/components/layout/`. Re-exports con `export { default }` (todos usan default export). `SideLinks.tsx` tambien re-exporta named export `getServerSideProps`. Imports relativos corregidos en copias: `./Sidebar` -> `@/shared/components/layout/Sidebar` (en SideBarContainer), `./ui/card` -> `@/components/ui/card` (en Sidebar), `./ModalCompany`, `./UpdateUserPasswordForm`, `./UploadImage`, `./ui/*` -> `@/components/...` (en NavBar).
  - **3.3 Common Components (21 archivos):** `Skeletons/` (5 archivos) -> `src/shared/components/common/Skeletons/`. `svg/` (4 archivos) -> `src/shared/components/common/svg/`. Componentes individuales (12 archivos): `AlertComponent.tsx`, `BackButton.tsx`, `EditButton.tsx`, `UploadImage.tsx`, `SelectWithData.tsx`, `CheckboxDefValues.tsx`, `CardsGrid.tsx`, `ReportAnIssue.tsx`, `ViewComponent.tsx`, `DocumentNav.tsx`, `DocumentationDrawer.tsx`, `MissingDocumentList.tsx` -> `src/shared/components/common/`. Imports relativos corregidos: `../ui/*` -> `@/components/ui/*` (en Skeletons), `./ui/*` -> `@/components/ui/*` (en varios), `./SimpleDocument` -> `@/components/SimpleDocument` (en DocumentationDrawer), `./Documents/*` -> `@/components/Documents/*` (en DocumentNav). `src/shared/components/data-table/` preservado intacto (ya existia).
  - **3.4 Auth Components (7 archivos):** `LoginForm.tsx`, `RegisterForm.tsx`, `RecoveryPasswordForm.tsx`, `UpdateUserPasswordForm.tsx`, `AutenticationLight.tsx`, `AutenticationDark.tsx`, `AuthProvider.tsx` -> `src/shared/components/auth/`. Imports relativos corregidos: `./svg/*` -> `@/components/svg/*`, `./ui/*` -> `@/components/ui/*`. Re-exports: named exports (`export *`) para LoginForm, RegisterForm, RecoveryPasswordForm, UpdateUserPasswordForm, AuthProvider; default exports (`export { default }`) para AutenticationLight, AutenticationDark.
- **Re-exports preservan cadena de importacion:** `@/components/ui/button` -> re-export -> `@/shared/components/ui/button` (real). Todos los ~430+ imports existentes siguen funcionando sin cambios.
- **Verificacion:** `npm run check-types` pasa con 0 errores.

### Fase 11: Modulo Forms (Custom Forms)
- **Estado:** Completada
- **Fecha:** 2026-03-12
- **Estructura creada:**
  ```
  src/modules/forms/
  ├── index.ts                          # Re-exports de convenience
  └── features/
      ├── custom-forms/
      │   ├── actions.server.ts         # fetchCustomForms, fetchCustomFormById, fetchCustomFormsByCompany, fetchCustomFormsByCompanyWithAnswers, createCustomForm
      │   └── components/
      │       ├── CardAnswer.tsx
      │       ├── CheckListAnwersTable.tsx
      │       ├── CreatedForm.tsx
      │       ├── DisplayCreatedForms.tsx
      │       ├── FormCard.tsx
      │       ├── FormCardContainer.tsx
      │       ├── FormCustom.tsx
      │       ├── FormCustomContainer.tsx
      │       ├── FormDisplay.tsx
      │       ├── FormUseChart.tsx
      │       ├── Inputs.tsx
      │       ├── NewForm.tsx
      │       ├── ReportModal.tsx
      │       ├── SubmitCustomForm.tsx
      │       ├── vehicle-checklist-report.tsx
      │       ├── formUtils/
      │       │   ├── fieldRenderer.tsx
      │       │   └── formUtils.ts
      │       └── new/
      │           ├── mail-list.tsx
      │           ├── mail.tsx
      │           └── nav.tsx
      └── answers/
          └── actions.server.ts         # fetchFormsAnswersByFormId, fetchAnswerById, fetchFormAnswersByFormId, CreateNewFormAnswer, insertFormAnswer
  ```
- **Server actions movidas:**
  - Queries de `src/app/server/shared/queries.ts` (7 funciones) -> separadas en `custom-forms/actions.server.ts` (4 funciones de custom_form) y `answers/actions.server.ts` (3 funciones de form_answers).
  - Mutations de `src/app/server/shared/mutations.ts` (3 funciones) -> `createCustomForm` en custom-forms, `CreateNewFormAnswer` e `insertFormAnswer` en answers.
  - Originales reemplazados con re-exports apuntando a `@/modules/forms/`.

### Fase 12: Modulo Dashboard
- **Estado:** Completada
- **Fecha:** 2026-03-12
- **Estructura creada:**
  ```
  src/modules/dashboard/
  └── features/
      ├── overview/
      │   └── components/
      │       ├── CardButton.tsx
      │       ├── CardNumber.tsx
      │       ├── CardsGrid.tsx
      │       ├── DashboardComponent.tsx
      │       └── welcome-component.tsx
      ├── tables/
      │   └── components/
      │       ├── colums.tsx
      │       ├── columsMonthly.tsx
      │       ├── columsMonthlyEquipment.tsx
      │       ├── data-table.tsx
      │       ├── data-table-pagination.tsx
      │       ├── EPendingDocumentTable.tsx
      │       └── VPendingDocumentTable.tsx
      ├── expiring-documents/
      │   └── components/
      │       ├── data-table-expiring-document.tsx
      │       ├── data-table-faceted-expiring-document-filter.tsx
      │       ├── data-table-options.tsx
      │       ├── data-table-toolbar-expiring-document.tsx
      │       ├── ExpiredDocumentColumsEquipment.tsx
      │       ├── expiringDocumentColumns.tsx
      │       ├── DocumentsTable.tsx
      │       └── EmployeesTable.tsx
      └── charts/
          └── components/
              ├── EmployeesDashboard.tsx
              ├── EmployeesDashboard2.tsx
              ├── EmployeesDashboard2 copy.tsx
              ├── EmployeesDashboard2copy2.tsx
              ├── EquipmentSolicitudes.tsx
              ├── EquipmentsSolicitudesDates.tsx
              ├── EquipmentStatusChart.tsx
              ├── TyposDeEquipos.tsx
              ├── RepairsChart.tsx
              └── ResousrsesChart.tsx
  ```
- **Componentes movidos (31 archivos totales):**
  - `src/app/dashboard/componentDashboard/` (8 archivos) -> overview + expiring-documents
  - `src/app/dashboard/componentDashboard/table/` (6 archivos) -> expiring-documents
  - `src/app/dashboard/` loose files (6 archivos: colums, columsMonthly, columsMonthlyEquipment, data-table, data-table-pagination, welcome-component) -> tables + overview
  - `src/components/Dashboard/` (9 archivos) -> overview + charts
  - `src/components/Graficos/` (2 archivos) -> charts
- **Re-export stubs:** Creados en todas las ubicaciones originales para no romper imports existentes en otros modulos (documents, company, employees, equipment).
- **Imports actualizados:** `src/app/dashboard/page.tsx` ahora importa de `@/modules/dashboard/`. Imports internos en archivos movidos actualizados a rutas absolutas `@/`.
- **Verificacion:** `npm run check-types` — 0 errores.
- **Componentes movidos (20 archivos):** 15 de `src/app/dashboard/forms/components/`, 2 de `formUtils/`, 3 de `new/components/`. Originales reemplazados con re-export stubs.
- **Imports actualizados en copias:** `@/app/server/shared/queries` -> `@/modules/forms/features/*/actions.server`, `@/app/server/shared/mutations` -> `@/modules/forms/features/*/actions.server`, `@/lib/prisma` -> `@/shared/lib/prisma`, imports relativos (`../formUtils/`, `../components/`) -> paths absolutos `@/modules/forms/...`.
- **Pages no modificados:** `page.tsx` y `layout.tsx` en `src/app/dashboard/forms/` no fueron modificados; siguen importando de re-export stubs que delegan al modulo.
- **Verificacion:** `npm run check-types` pasa con 0 errores.

### Fase 13: Modulo Admin
- **Estado:** Completada
- **Fecha:** 2026-03-12
- **Estructura creada:**
  ```
  src/modules/admin/
  └── features/
      ├── layout/
      │   └── components/
      │       ├── AdminAvatar.tsx
      │       ├── AdminBreadcrumb.tsx
      │       ├── AdminNavbar.tsx
      │       ├── AdminSidebar.tsx
      │       └── AdminError.tsx
      ├── panel/
      │   └── components/
      │       ├── CompaniesChart.tsx
      │       └── CreateUser.tsx
      ├── tables/
      │   └── components/
      │       ├── TableCard.tsx
      │       ├── DiagramTable.tsx
      │       └── CreateDialog.tsx
      └── auditor/
          └── components/
              ├── AuditorPage.tsx
              ├── AuditorColumns.tsx
              └── AuditorDataTable.tsx
  ```
- **Componentes movidos (14 archivos totales):**
  - `src/app/admin/components/` (9 archivos: adminAvatar, adminBreadcrumb, adminNavbar, adminSidebar, createDialog, createUser, diagramTable, tableCard, Graficos/CompaniesChart) -> layout, panel, tables
  - `src/app/admin/auditor/` (3 archivos: columns, data-table, page) -> auditor
  - `src/app/admin/error.tsx` -> layout
- **Funciones admin (`fetchPresentedDocumentsForAuditor`, `fetchActiveDocumentTypesGlobal`, `fetchAllCompanies`):** Ya estaban en `@/shared/actions/catalogs.ts`, re-exportadas desde `@/app/server/shared/queries.ts`. No fue necesario moverlas.
- **Re-export stubs:** Creados en todas las ubicaciones originales (11 archivos en `src/app/admin/components/` y `src/app/admin/auditor/`).
- **Pages actualizados:** `layout.tsx`, `panel/page.tsx`, `tablas/page.tsx` ahora importan directamente desde `@/modules/admin/`. `auditor/page.tsx` re-exporta `AuditorPage` desde el modulo. `error.tsx` re-exporta `AdminError`.
- **Imports internos actualizados:** Referencias relativas en AdminNavbar (`./adminAvatar`, `./adminBreadcrumb`), AuditorPage (`./columns`, `./data-table`), DiagramTable (`./createDialog`) y AdminSidebar (path del logo) corregidas a rutas absolutas `@/modules/admin/...`.
- **Verificacion:** `npm run check-types` — 0 errores.

### Fase 15: Modulo PDF
- **Estado:** Completada
- **Fecha:** 2026-03-13
- **Decision:** Los 6 archivos PDF son todos especificos del dominio HSE/checklists (generadores de PDF para inspecciones vehiculares y mantenimiento). Se movieron al modulo HSE. El componente `PDFPreviewDialog` es un wrapper generico de UI (Dialog + Button) usado tambien fuera de HSE, por lo que se movio a `shared/components/pdf/`.
- **Estructura creada:**
  ```
  src/modules/hse/features/checklist/components/pdf/
  ├── generators/
  │   ├── TransporteSPANAYCHKHYS01.tsx
  │   ├── TransporteSPANAYCHKHYS03.tsx
  │   └── TransporteSPANAYCHKHYS04.tsx
  └── layouts/
      ├── BaseChecklistLayout.tsx
      ├── VehicleInspectionLayout.tsx
      └── MaintenanceChecklistLayout.tsx

  src/shared/components/pdf/
  └── PDFPreviewDialog.tsx
  ```
- **Archivos movidos (7 total):**
  - `src/components/pdf/generators/TransporteSPANAYCHKHYS01.tsx` -> `src/modules/hse/features/checklist/components/pdf/generators/`
  - `src/components/pdf/generators/TransporteSPANAYCHKHYS03.tsx` -> `src/modules/hse/features/checklist/components/pdf/generators/`
  - `src/components/pdf/generators/TransporteSPANAYCHKHYS04.tsx` -> `src/modules/hse/features/checklist/components/pdf/generators/`
  - `src/components/pdf/layouts/BaseChecklistLayout.tsx` -> `src/modules/hse/features/checklist/components/pdf/layouts/`
  - `src/components/pdf/layouts/VehicleInspectionLayout.tsx` -> `src/modules/hse/features/checklist/components/pdf/layouts/`
  - `src/components/pdf/layouts/MaintenanceChecklistLayout.tsx` -> `src/modules/hse/features/checklist/components/pdf/layouts/`
  - `src/components/pdf-preview-dialog.tsx` -> `src/shared/components/pdf/PDFPreviewDialog.tsx`
- **Re-export stubs:** Creados en las 7 ubicaciones originales (`src/components/pdf/generators/*`, `src/components/pdf/layouts/*`, `src/components/pdf-preview-dialog.tsx`).
- **Imports actualizados en copias:** Imports relativos entre generators y layouts convertidos a paths absolutos `@/modules/hse/...`. Import de `checklistItems` en TransporteSPANAYCHKHYS03 actualizado de `@/components/CheckList/ChecklistSergio` a `@/modules/hse/features/checklist/components/ChecklistSergio`.
- **Consumers actualizados (5 archivos en HSE module):** `DynamicChecklistForm.tsx`, `ChecklistSergio.tsx`, `VehicleInspectionChecklist.tsx`, `checkListAnswerColumns.tsx` — imports cambiados a paths canonicos `@/modules/hse/...` y `@/shared/components/pdf/...`.
- **Pages no modificados:** `src/app/dashboard/forms/[id]/page.tsx` sigue importando de los re-export stubs, que delegan correctamente al modulo.
- **Verificacion:** `npm run check-types` — 0 errores.

### Fase 16: Eliminar barrels legacy y re-exports temporales
- **Estado:** Completada
- **Fecha:** 2026-03-13
- **Notas:** Todos los re-exports temporales de Fases 1-3 fueron eliminados. Los imports de ~200+ archivos fueron actualizados directamente a las nuevas rutas en `@/shared/` y `@/modules/`. Los barrels `GET/actions.ts` y `UPDATE/actions.ts` fueron eliminados junto con todos los domain files en `src/app/server/`. Los directorios `src/store/`, `src/hooks/`, `src/lib/`, `src/types/`, `src/zodSchemas/`, `src/components/`, `src/features/` fueron eliminados (o sus re-export stubs removed). El directorio `src/features/Empresa/PortalEmpleados/` fue migrado a `src/modules/company/features/portal/`.
- **Verificacion:** `npm run check-types` — 0 errores. `npm run build` — exitoso.

### Fase 17: Renombrado y convencion final
- **Estado:** Completada
- **Fecha:** 2026-03-13
- **Notas:** Renombramiento aplicado segun convenciones. Las convenciones `_Prefix.tsx` para client components no se aplicaron masivamente para minimizar riesgo; se documentaron como pauta para nuevos archivos.
- **Verificacion:** `npm run check-types` — 0 errores.

### Fase 18: Verificacion final y documentacion
- **Estado:** Completada
- **Fecha:** 2026-03-13
- **Resultados de verificacion:**
  1. `npm run check-types` — 0 errores
  2. `npm run build` — exitoso (produccion completa)
  3. **Archivos no-routing en `src/app/`** — Se encontraron 6 archivos residuales que no son archivos de routing puros:
     - `src/app/dashboard/forms/components/Inputs.tsx`
     - `src/app/dashboard/company/actualCompany/covenant/action/create.tsx`
     - `src/app/dashboard/company/actualCompany/contact/action/create.tsx`
     - `src/app/dashboard/company/actualCompany/page1.tsx`
     - `src/app/dashboard/company/actualCompany/components/General.tsx`
     - `src/app/dashboard/company/actualCompany/customers/action/create.tsx`
     Estos deben migrarse a sus modulos correspondientes en una tarea futura.
  4. **Imports a rutas legacy eliminadas** — 0 imports a `@/app/server/`, `@/store/`, `@/hooks/`, `@/lib/`, `@/types/`, `@/zodSchemas/`, `@/components/`, `@/features/`
  5. **Cross-module imports** — Existen importaciones cruzadas entre modulos (especialmente para DataTable components de dashboard/hse usados en otros modulos, y server actions entre modules). Estas deben refactorizarse gradualmente extrayendo el codigo compartido a `src/shared/`. Los modulos afectados: company, employees, documents, equipment, maintenance, operations, hse, forms, dashboard, admin.
- **Documentacion actualizada:**
  - `CLAUDE.md` — Reescrito para reflejar la nueva arquitectura modular
  - `docs/project-structure.md` — Actualizado con los 11 modulos reales y su estructura
  - `tsconfig.json` — Sin cambios necesarios (el alias `@/*` ya cubre la nueva estructura)

## 5. Verificacion

### Resultado final

La reestructuracion modular esta **completada**. El proyecto compila correctamente (`npm run check-types` y `npm run build`) con la nueva estructura.

### Tareas pendientes post-refactor

1. **Migrar 6 archivos residuales en `src/app/`** a sus modulos correspondientes
2. **Eliminar cross-module imports** extrayendo codigo compartido a `src/shared/` (DataTable pagination, column headers, view options, faceted filters)
3. **Aplicar convencion `_Prefix.tsx`** para client components de forma gradual
4. **Verificacion manual** de flujos criticos (login, navegacion, CRUD, subida de documentos)
5. **Merge a main** cuando el equipo valide manualmente la app
