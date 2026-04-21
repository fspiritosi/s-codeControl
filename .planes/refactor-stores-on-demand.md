# Refactor: Eliminar datos de DB de stores globales → fetch on-demand

**Estado:** Planificación completada
**Fecha:** 2026-03-27

---

## 1. Problema actual

Al cargar cualquier page del dashboard, `setActualCompany()` dispara en cascada:

```
setActualCompany()
├── setActivesEmployees()      → TODOS los empleados con docs
├── fetchVehicles()            → TODOS los vehículos con relaciones
├── documetsFetch()            → TODOS los docs de empleados + equipos + empresa
├── allNotifications()         → notificaciones + OTRA VEZ documetsFetch()
├── documentTypes()            → tipos de documento
└── FetchSharedUsers()         → usuarios compartidos
```

Además hay polling activo:
- Empleados: cada 30s
- Notificaciones: cada 15s (que internamente llama documetsFetch OTRA VEZ)
- Customers: cada 30s
- Contacts: cada 30s

**Resultado:** cada visita descarga toda la DB al cliente, incluso si solo necesitás ver el dashboard.

---

## 2. Principios del refactor

1. **Los stores globales NO guardan datos de la DB** — solo contexto de sesión
2. **Cada page/componente hace sus propias queries** — via server actions o server components
3. **El state global se limita a:** auth, company activa, rol, sidebar, notificaciones
4. **Los catálogos (países, provincias, etc.) se cargan on-demand** cuando un form los necesita

---

## 3. Qué queda en los stores globales

### authStore ✅ MANTENER
| Campo | Razón |
|-------|-------|
| `credentialUser` | Identidad del usuario logueado |
| `profile` | Perfil del usuario |
| `codeControlRole` | Rol global en la app |
| `roleActualCompany` | Rol en la empresa actual |

### companyStore ✅ MANTENER (parcial)
| Campo | Mantener | Razón |
|-------|----------|-------|
| `actualCompany` | ✅ | Core — usado por 95+ componentes |
| `allCompanies` | ✅ | Necesario para CompanySwitcher |
| `sharedCompanies` | ✅ | Necesario para CompanySwitcher |
| `sharedUsers` | ❌ | Mover a page de Company → Users |
| `showNoCompanyAlert` | ✅ | UI state |
| `showMultiplesCompaniesAlert` | ✅ | UI state |

**Acción en `setActualCompany()`:** Eliminar TODAS las cascadas. Solo debe:
1. Setear `actualCompany`
2. Guardar cookie `actualComp`
3. Llamar `router.refresh()` para que los server components se re-rendericen

### uiStore ✅ MANTENER
| Campo | Mantener | Razón |
|-------|----------|-------|
| `active_sidebar` | ✅ | UI state |
| `notifications` | ✅ | Campana de notificaciones en NavBar |

**Pero:** `allNotifications()` no debe llamar `documetsFetch()` internamente. Debe obtener las notificaciones crudas sin necesitar cargar todos los documentos.

### editState ✅ MANTENER
- `readonly` — UI state simple

---

## 4. Qué se ELIMINA de los stores

### documentStore ❌ ELIMINAR COMPLETO
| Campo | Reemplazo |
|-------|-----------|
| `allDocumentsToShow` | Server component en la page de documentos |
| `documentsToShow` | Server component |
| `Alldocuments` | Server component |
| `lastMonthDocuments` | Server component con filtro de fecha |
| `pendingDocuments` | Server component con filtro state='presentado' |
| `companyDocuments` | Ya lo trae la page de company directamente |
| `documetsFetch()` | Eliminar — cada page hace su propia query |

### employeeStore ❌ ELIMINAR COMPLETO
| Campo | Reemplazo |
|-------|-----------|
| `employees` | Ya migrado a DataTable server-side paginada |
| `employeesToShow` | Ya migrado |
| `active_and_inactive_employees` | Ya migrado |
| `DrawerEmployees` | Fetch on-demand en el drawer component |
| Polling 30s | Eliminar — server components se refrescan con revalidate |

### vehicleStore ❌ ELIMINAR COMPLETO
| Campo | Reemplazo |
|-------|-----------|
| `vehicles` | Ya migrado a DataTable server-side paginada |
| `vehiclesToShow` | Ya migrado |
| `DrawerVehicles` | Fetch on-demand en el drawer component |

### countriesStore → REDUCIR
| Campo | Mantener | Razón |
|-------|----------|-------|
| `countries` | ❌ | Fetch on-demand en forms que lo necesiten |
| `provinces` | ❌ | Fetch on-demand |
| `cities` | ❌ | Fetch on-demand |
| `hierarchy` | ❌ | Fetch on-demand |
| `workDiagram` | ❌ | Fetch on-demand |
| `customers` | ❌ | Fetch on-demand |
| `contacts` | ❌ | Fetch on-demand |
| `mandatoryDocuments` | ❌ | Fetch on-demand |
| Polling customers 30s | ❌ | Eliminar |
| Polling contacts 30s | ❌ | Eliminar |

---

## 5. Consumidores que necesitan migración

### Componentes que usan `employees` del store (para dropdowns)
- `SimpleDocument.tsx` → usar server action para buscar empleados
- `MultiResourceDocument.tsx` → idem
- `useEmployeeForm.ts` → `active_and_inactive_employees` ya se puede eliminar
- `DocumentNav.tsx` → fetch on-demand

### Componentes que usan `vehicles` del store (para dropdowns)
- `SimpleDocument.tsx` → server action
- `MultiResourceDocument.tsx` → server action

### Componentes que usan `documentsToShow` del store
- `EPendingDocumentTable.tsx` → server component con query propia
- `VPendingDocumentTable.tsx` → server component con query propia
- `TabsDocuments.tsx` → ya migrado a DataTable server-side

### Componentes que usan catálogos del countriesStore
- `useEmployeeForm.ts` → fetch catálogos al montar el form
- `useVehicleForm.ts` → idem
- `AddCompanyDocumentForm.tsx` → fetch doc types on-demand

---

## 6. Fases de implementación

### Fase 1: Desacoplar `setActualCompany()` de las cascadas
**Impacto:** Alto — elimina la carga inicial pesada
**Riesgo:** Bajo — solo cambia cuándo se cargan los datos

- [ ] Modificar `companyStore.setActualCompany()`:
  - Solo setear company + cookie + `router.refresh()`
  - Eliminar llamadas a employeeStore, vehicleStore, documentStore, uiStore
- [ ] Modificar `InitUser.tsx`:
  - Eliminar llamada a `documetsFetch()`
- [ ] Verificar que el dashboard sigue funcionando (usa server components)
- [ ] Verificar CompanySwitcher (cambiar empresa debe refrescar la page)

### Fase 2: Eliminar documentStore
**Impacto:** Medio — las pages de documentos ya usan DataTable server-side
**Riesgo:** Medio — verificar que no quedan consumidores

- [ ] Buscar todos los consumidores de `documentsToShow`, `allDocumentsToShow`, `Alldocuments`, `pendingDocuments`
- [ ] Migrar `EPendingDocumentTable` y `VPendingDocumentTable` a server components
- [ ] Eliminar `documetsFetch()` y sus server actions obsoletas
- [ ] Eliminar `documentStore.ts`
- [ ] Actualizar facade `loggedUser.ts`

### Fase 3: Eliminar employeeStore
**Impacto:** Medio — la tabla ya usa DataTable server-side
**Riesgo:** Medio — dropdowns de upload necesitan lista de empleados

- [ ] Migrar dropdowns de `SimpleDocument`/`MultiResourceDocument` a fetch on-demand
- [ ] Eliminar polling de empleados
- [ ] Eliminar `employeeStore.ts`
- [ ] Actualizar facade `loggedUser.ts`

### Fase 4: Eliminar vehicleStore
**Impacto:** Bajo — misma lógica que empleados
**Riesgo:** Bajo

- [ ] Migrar dropdowns de upload a fetch on-demand
- [ ] Eliminar `vehicleStore.ts`
- [ ] Actualizar facade `loggedUser.ts`

### Fase 5: Reducir countriesStore
**Impacto:** Medio — los forms necesitan catálogos
**Riesgo:** Bajo — los catálogos se pueden cargar on-demand sin problemas

- [ ] Eliminar auto-fetch on window load
- [ ] Eliminar polling de customers/contacts
- [ ] Cada form que necesite catálogos los pide como props desde el server component padre
- [ ] Mantener `fetchCities(provinceId)` como utility (no como store)

### Fase 6: Simplificar allNotifications()
**Impacto:** Alto — elimina la doble carga de documentos
**Riesgo:** Bajo

- [ ] `allNotifications()` debe traer notificaciones con los datos mínimos del documento inline (join en la query)
- [ ] Eliminar la dependencia de documentStore dentro de uiStore
- [ ] Ajustar polling de notificaciones para que no cargue documentos

### Fase 7: Limpiar facade loggedUser.ts
**Impacto:** Bajo — solo limpieza
**Riesgo:** Medio — muchos archivos importan el facade

- [ ] Eliminar campos y acciones que ya no existen
- [ ] Buscar y migrar consumidores que usen campos eliminados
- [ ] Considerar deprecar el facade gradualmente

---

## 7. Orden de ejecución recomendado

```
Fase 1 (desacoplar cascadas) → Fase 6 (notificaciones) → Fase 2 (documentStore) → Fase 3 (employeeStore) → Fase 4 (vehicleStore) → Fase 5 (countriesStore) → Fase 7 (limpiar facade)
```

Fase 1 es la más impactante y la menos riesgosa. Resuelve el 80% del problema de performance.

---

## 8. Resultado esperado

### Antes:
```
Dashboard load → 15+ queries paralelas (empleados, vehículos, docs, notificaciones, catálogos...)
Cualquier page → mismas 15+ queries via setActualCompany cascade
Polling: 4 intervals activos (empleados 30s, notificaciones 15s, customers 30s, contacts 30s)
```

### Después:
```
Dashboard load → 6 counts (cacheados 60s) + notificaciones
Employee page → DataTable paginada (10 registros + count)
Document page → DataTable paginada (10 registros + count)
Equipment page → DataTable paginada (10 registros + count)
Polling: solo notificaciones (15s, query liviana)
```

### Stores globales resultantes:
```
authStore:    credentialUser, profile, codeControlRole, roleActualCompany
companyStore: actualCompany, allCompanies, sharedCompanies, alerts
uiStore:      active_sidebar, notifications
editState:    readonly
```
