# Migración: ViewComponent → UrlTabs (navegación por URL)

**Estado:** Planificación completada
**Fecha:** 2026-03-26
**Scope inicial:** Módulo Company (`/dashboard/company/actualCompany`)

---

## 1. Análisis

### 1.1 Problema actual

`ViewComponent` maneja tabs 100% client-side con Radix UI Tabs. Consecuencias:
- **No hay deep linking** — no se puede compartir una URL que lleve a un tab específico
- **Refresh pierde el tab** — al recargar siempre vuelve al tab default
- **searchParams no llegan** — los filtros de DataTable no se propagan porque los tabs no están en la URL
- **Todo se monta** — los 8 tabs del company page se montan en el DOM, aunque solo se vea uno
- **Browser history no funciona** — el botón atrás no navega entre tabs

### 1.2 Solución: UrlTabs de base_erp

Base_erp usa un componente `UrlTabs` que envuelve Radix Tabs pero sincroniza el tab activo con un query parameter de la URL (`?tab=value`). Beneficios:
- URLs bookmarkables: `/dashboard/company/actualCompany?tab=users`
- Refresh mantiene el tab activo
- Browser history funciona (back/forward navegan tabs)
- searchParams se preservan al cambiar tabs
- Se puede resetear paginación al cambiar de tab
- Validación de tabs en server antes de renderizar

### 1.3 Componente UrlTabs (de base_erp)

**Archivo:** `base_erp/src/shared/components/ui/url-tabs.tsx`

Props principales:
- `paramName` — nombre del query param (default: `"tab"`)
- `baseUrl` — URL base para construir links
- `preserveParams` — params que se mantienen al cambiar tab
- `resetParams` — params que se limpian al cambiar tab (default: `["page"]`)
- `replace` — usar `router.replace` en vez de `router.push`

Exports: `UrlTabs`, `UrlTabsList`, `UrlTabsTrigger`, `UrlTabsContent`

### 1.4 Company page actual (s-codeControl)

**Archivo:** `src/app/dashboard/company/actualCompany/page.tsx`

8 tabs definidos en `viewData`:

| Tab value | Nombre | Componente | Restricción |
|-----------|--------|------------|-------------|
| `general` | General | CompanyComponent + DangerZoneComponent | - |
| `"documentacion"` | Documentación | DocumentTabComponent | - |
| `users` | Usuarios | UsersTabComponent | Invitado |
| `customers` | Clientes | Customers | Invitado |
| `contacts` | Contactos | Contacts | Invitado |
| `covenant` | Convenios | CovenantTreeFile | Invitado |
| `service` | Servicios | ServiceComponent | Invitado |
| `portal_employee` | Portal de Empleados | PortalEmployeeWrapper | Invitado |

**Nota:** El value `"documentacion"` tiene comillas extra — bug preexistente.

### 1.5 Otros consumidores de ViewComponent

| Page | Tabs | Prioridad migración |
|------|------|---------------------|
| `/dashboard/company/actualCompany` | 8 tabs | **Este plan** |
| `/dashboard/employee` | 5 tabs | Siguiente |
| `/dashboard/equipment` | 4 tabs | Siguiente |
| `/dashboard/document` | 4 tabs | Siguiente |
| `/dashboard/hse/...` | Variable | Después |
| `/dashboard/maintenance` | Variable | Después |
| `/dashboard/operations` | Variable | Después |
| `/dashboard/forms` | Variable | Después |

---

## 2. Planificación

### 2.1 Fases de implementación

#### Fase 1: Traer UrlTabs al proyecto
- **Objetivo:** Copiar y adaptar el componente UrlTabs de base_erp
- **Tareas:**
  - [ ] Copiar `base_erp/src/shared/components/ui/url-tabs.tsx` a `s-codeControl/src/shared/components/ui/url-tabs.tsx`
  - [ ] Adaptar imports (verificar que usa componentes de shadcn que ya tenemos: Tabs de Radix)
  - [ ] Verificar que compila sin errores
  - [ ] Exportar desde barrel si es necesario
- **Archivos:** `src/shared/components/ui/url-tabs.tsx`
- **Criterio:** El componente se importa y renderiza sin errores

#### Fase 2: Crear CompanyPageContent (reemplazo de ViewComponent para company)
- **Objetivo:** Reescribir la page de company usando UrlTabs
- **Tareas:**
  - [ ] Crear `src/modules/company/features/detail/components/CompanyPageContent.tsx`
    - Componente server que recibe `tab` (string validado) y `searchParams`
    - Renderiza UrlTabs con los 8 tabs
    - Cada UrlTabsContent renderiza el componente correspondiente
    - Filtrado por rol: tabs con restricción `Invitado` no se renderizan si el rol es Invitado
    - Cada tab tiene su título, descripción y botón de acción (si aplica) dentro del UrlTabsContent
  - [ ] Mover la lógica de auth/role del ViewComponent a la page o a un componente dedicado
  - [ ] Pasar `searchParams` a los componentes que lo necesiten (ej: DocumentTabComponent si tuviera DataTable)
- **Archivos:** `src/modules/company/features/detail/components/CompanyPageContent.tsx`
- **Criterio:** Todos los 8 tabs renderizan correctamente

#### Fase 3: Actualizar la page de company
- **Objetivo:** Conectar la nueva implementación
- **Tareas:**
  - [ ] Reescribir `src/app/dashboard/company/actualCompany/page.tsx`:
    - Recibir `searchParams` (con `tab` como param)
    - Validar tab contra lista de valores permitidos
    - Pasar `tab` y `searchParams` a `CompanyPageContent`
    - Envolver en `Suspense` con skeleton
  - [ ] Verificar que las URLs funcionan:
    - `/dashboard/company/actualCompany` → tab default (general)
    - `/dashboard/company/actualCompany?tab=users` → tab usuarios
    - `/dashboard/company/actualCompany?tab=customers` → tab clientes
    - etc.
  - [ ] Verificar que browser back/forward funciona entre tabs
  - [ ] Verificar que refresh mantiene el tab activo
  - [ ] Fix bug del value `"documentacion"` → `documentacion`
- **Archivos:** `src/app/dashboard/company/actualCompany/page.tsx`
- **Criterio:** Navegación por URL funcional, deep linking, history

#### Fase 4: Verificación y limpieza
- **Objetivo:** Asegurar que todo funciona y no se rompió nada
- **Tareas:**
  - [ ] Verificar cada tab en browser (light + dark mode)
  - [ ] Verificar role-based filtering (Invitado no ve tabs restringidos)
  - [ ] Verificar que los botones de acción funcionan (Editar empresa, Registrar usuario, etc.)
  - [ ] `npm run check-types`
  - [ ] Verificar que ViewComponent sigue funcionando para las demás pages (NO lo eliminamos)
  - [ ] Commit
- **Archivos:** Verificación, no cambios
- **Criterio:** 0 errores, navegación URL completa, tabs con restricción de roles

### 2.2 Orden de ejecución

```
Fase 1 (UrlTabs) → Fase 2 (CompanyPageContent) → Fase 3 (page) → Fase 4 (verificación)
```

Fases 1 y 2 son parcialmente independientes (Fase 2 necesita saber la API de UrlTabs).

### 2.3 Estimación de complejidad
- Fase 1: **baja** — copiar y adaptar componente
- Fase 2: **media** — reestructurar 8 tabs con lógica de roles
- Fase 3: **baja** — actualizar page wrapper
- Fase 4: **baja** — verificación

### 2.4 Patrón resultante (template para migrar otras pages)

```tsx
// page.tsx
export default async function SomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; [key: string]: string | undefined }>;
}) {
  const resolved = await searchParams;
  const validTabs = ['tab1', 'tab2', 'tab3'];
  const currentTab = validTabs.includes(resolved.tab ?? '') ? resolved.tab! : 'tab1';

  return (
    <Suspense fallback={<PageSkeleton />}>
      <SomePageContent tab={currentTab} searchParams={resolved} />
    </Suspense>
  );
}

// SomePageContent.tsx (server component)
export async function SomePageContent({ tab, searchParams }: Props) {
  const role = await getRole();

  return (
    <div className="flex flex-col gap-6 py-4 px-6">
      <UrlTabs value={tab} paramName="tab" baseUrl="/dashboard/some-page">
        <UrlTabsList>
          <UrlTabsTrigger value="tab1">Tab 1</UrlTabsTrigger>
          {role !== 'Invitado' && <UrlTabsTrigger value="tab2">Tab 2</UrlTabsTrigger>}
          <UrlTabsTrigger value="tab3">Tab 3</UrlTabsTrigger>
        </UrlTabsList>

        <UrlTabsContent value="tab1">
          <Card>
            <CardHeader>
              <CardTitle>Título</CardTitle>
              <CardDescription>Descripción</CardDescription>
            </CardHeader>
            <CardContent>
              <ComponentForTab1 searchParams={searchParams} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        {role !== 'Invitado' && (
          <UrlTabsContent value="tab2">
            <ComponentForTab2 />
          </UrlTabsContent>
        )}
      </UrlTabs>
    </div>
  );
}
```

### 2.5 Notas importantes

- **NO eliminar ViewComponent** — sigue usándose en las demás pages hasta que se migren
- **UrlTabs es client component** — pero los children pueden ser server components
- **searchParams fluyen naturalmente** — porque están en la URL, no en estado client
- **`resetParams: ["page"]`** — al cambiar de tab se resetea la paginación (importante para DataTables)
- **`preserveParams`** — útil si hay filtros globales que deben persistir entre tabs
- **El rol se obtiene en el server** — la page o el content component verifican el rol y condicionan el render de los tabs
