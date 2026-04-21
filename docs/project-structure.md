# Estructura del Proyecto

## Arbol de Carpetas Raiz

```
proyecto/
├── src/
│   ├── app/                       # Routing (paginas delgadas)
│   ├── modules/                   # Logica de negocio por dominio
│   └── shared/                    # Codigo compartido
│
├── supabase/                      # Migraciones de base de datos
├── docs/                          # Documentacion interna
├── .planes/                       # Planes de implementacion
│
├── database.types.ts              # Tipos auto-generados de Supabase
├── tsconfig.json                  # Config TypeScript (alias @/* -> ./src/*)
└── CLAUDE.md                      # Guia para asistente AI
```

---

## `src/app/` - Solo Routing

La carpeta `app/` es exclusivamente para routing de Next.js. **No debe contener componentes ni logica de negocio.**

### Archivos permitidos en `app/`
- `page.tsx` - Pagina de la ruta
- `layout.tsx` - Layout de la ruta
- `loading.tsx` - Estado de carga
- `error.tsx` - Manejo de errores
- `not-found.tsx` - 404
- `route.ts` - API routes (en `api/`)
- Subcarpetas de rutas (`[id]/`, `new/`)

### Archivos prohibidos en `app/`
- `components/` - NUNCA
- Logica de negocio - NUNCA
- Utilidades - NUNCA

### Ejemplo correcto

```typescript
// src/app/dashboard/employee/page.tsx
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

### Estructura de rutas

```
src/app/
├── page.tsx                          # Landing page
├── layout.tsx                        # Root layout
│
├── login/page.tsx                    # Login
├── register/page.tsx                 # Registro
├── reset_password/                   # Reset password
│   ├── page.tsx
│   └── update-user/page.tsx
│
├── dashboard/                        # App principal (protegida por middleware)
│   ├── page.tsx                      # Dashboard principal
│   ├── layout.tsx                    # Dashboard layout (sidebar, navbar)
│   ├── company/
│   │   ├── page.tsx                  # Lista de empresas
│   │   ├── new/page.tsx              # Crear empresa
│   │   ├── [id]/page.tsx             # Detalle de empresa
│   │   └── actualCompany/
│   │       ├── page.tsx              # Empresa activa
│   │       ├── contact/action/       # Contactos
│   │       ├── covenant/action/      # Convenios
│   │       ├── customers/action/     # Clientes
│   │       ├── services/[id]/        # Servicios
│   │       └── user/[id]/            # Usuarios
│   ├── employee/
│   │   ├── page.tsx                  # Lista de empleados
│   │   └── action/page.tsx           # Crear/editar empleado
│   ├── equipment/
│   │   ├── page.tsx                  # Lista de equipos
│   │   └── action/page.tsx           # Crear/editar equipo
│   ├── document/
│   │   ├── page.tsx                  # Documentos
│   │   ├── [id]/page.tsx             # Detalle de documento
│   │   └── equipment/page.tsx        # Documentos de equipos
│   ├── maintenance/page.tsx          # Mantenimiento
│   ├── operations/
│   │   ├── page.tsx                  # Operaciones
│   │   └── [id]/page.tsx             # Detalle de operacion
│   ├── forms/
│   │   ├── page.tsx                  # Formularios
│   │   ├── new/page.tsx              # Crear formulario
│   │   └── [id]/
│   │       ├── page.tsx              # Detalle formulario
│   │       ├── new/page.tsx          # Nueva respuesta
│   │       └── view/page.tsx         # Ver respuesta
│   ├── hse/
│   │   ├── page.tsx                  # HSE
│   │   ├── detail/[id]/             # Detalle HSE
│   │   └── document/[id]/detail/    # Documentos HSE
│   └── help/page.tsx                # Ayuda
│
├── admin/                            # Panel admin
│   ├── layout.tsx
│   ├── panel/page.tsx
│   ├── tablas/page.tsx
│   └── auditor/
│       ├── page.tsx
│       ├── [id]/page.tsx
│       └── new-document-type/page.tsx
│
├── hse/training/                     # Paginas publicas HSE
│   ├── page.tsx
│   └── [id]/user/page.tsx
│
├── maintenance/                      # Paginas publicas mantenimiento (QR)
│   ├── page.tsx
│   ├── [id]/page.tsx
│   └── thanks/page.tsx
│
└── api/                              # API Routes (sin cambios)
    ├── company/
    ├── employees/
    ├── equipment/
    ├── daily-report/
    ├── repairs/
    ├── services/
    ├── profile/
    └── ...
```

---

## `src/modules/` - Logica de Negocio

Cada modulo es un dominio de negocio independiente.

### Modulos existentes

| Modulo | Descripcion | Features |
|--------|-------------|----------|
| `company` | Gestion de empresa activa | detail, create, list, contacts, covenants, customers, users, portal |
| `employees` | Gestion de empleados | list, create, detail, diagrams, validation |
| `documents` | Gestion documental | list, upload, manage, types |
| `equipment` | Vehiculos y equipos | list, create, qr |
| `maintenance` | Reparaciones y servicios | repairs, services |
| `operations` | Partes diarios | daily-reports |
| `hse` | Seguridad e higiene | training, checklist, documents |
| `forms` | Formularios custom | custom-forms, answers |
| `dashboard` | Panel principal | overview, tables, charts, expiring-documents |
| `admin` | Panel de administracion | layout, panel, tables, auditor |
| `landing` | Landing page y auth | home, auth |

### Estructura de un Modulo

```
modules/{modulo}/
├── features/
│   ├── {feature}/
│   │   ├── actions.server.ts      # Server Actions de esta feature
│   │   ├── components/            # Componentes de esta feature
│   │   │   ├── ComponentName.tsx  # Server o Client component
│   │   │   └── ...
│   │   └── index.ts               # Barrel export
│   └── ...
│
├── shared/                        # Compartido dentro del modulo
│   ├── types.ts
│   ├── validators.ts
│   └── utils.ts
│
└── index.ts                       # Barrel export del modulo
```

### Regla de comunicacion entre modulos

```typescript
// PROHIBIDO - Importar de otro modulo
import { utils } from '@/modules/company/shared/utils';

// CORRECTO - Usar shared/
import { formatCurrency } from '@/shared/lib/utils';
```

**Nota:** Actualmente existen algunas importaciones cruzadas entre modulos (documentado en la verificacion de Phase 18). Estas deben refactorizarse gradualmente extrayendo el codigo compartido a `src/shared/`.

---

## `src/shared/` - Codigo Compartido

```
src/shared/
├── actions/                         # Server actions compartidas
│   ├── auth.ts                      # Autenticacion, sesion, perfil
│   ├── catalogs.ts                  # Catalogos globales (roles, industry types, etc.)
│   ├── geography.ts                 # Paises, provincias, ciudades
│   ├── notifications.ts             # CRUD de notificaciones
│   ├── email.ts                     # Envio de emails
│   └── storage.ts                   # Upload/download de archivos
│
├── components/
│   ├── ui/                          # shadcn/ui (48 componentes)
│   ├── layout/                      # Sidebar, NavBar, SideBarContainer, SideLinks
│   ├── common/                      # ViewComponent, Skeletons, SVGs, AlertComponent, etc.
│   ├── auth/                        # LoginForm, RegisterForm, AuthProvider
│   ├── data-table/                  # DataTable reutilizable (base, filters, toolbars)
│   │   ├── base/                    # data-table, column-header, pagination, view-options
│   │   ├── filters/                 # faceted-filter, date-picker
│   │   └── toolbars/                # toolbar-base
│   └── pdf/                         # PDFPreviewDialog
│
├── hooks/                           # Custom hooks
│   ├── useCompanyData.ts
│   ├── useEmployeesData.ts
│   ├── useDocuments.ts
│   ├── useProfileData.ts
│   ├── useUploadImage.ts
│   ├── useAuthData.ts
│   └── useEdgeFunctions.ts
│
├── lib/                             # Utilidades y clientes
│   ├── prisma.ts                    # Cliente Prisma singleton
│   ├── supabase/
│   │   ├── server.ts                # supabaseServer(), adminSupabaseServer()
│   │   └── browser.ts               # createBrowserClient
│   ├── server-action-context.ts     # getActionContext, getRequiredActionContext
│   ├── storage-server.ts            # Storage server utils
│   ├── storage.ts                   # Storage client utils
│   ├── utils.ts                     # cn() y utilidades generales
│   ├── utils/
│   │   ├── getRole.ts
│   │   └── utils.ts
│   ├── documentFilters.ts
│   ├── errorHandler.ts
│   ├── emailTemplates.ts
│   ├── renderEmail.tsx
│   ├── download.ts
│   ├── transitions.ts
│   ├── useServer.ts
│   └── api-response.ts
│
├── store/                           # Zustand stores
│   ├── loggedUser.ts                # Facade store (compone domain stores)
│   ├── authStore.ts
│   ├── companyStore.ts
│   ├── employeeStore.ts
│   ├── documentStore.ts
│   ├── vehicleStore.ts
│   ├── uiStore.ts
│   ├── countries.ts
│   ├── documentValidation.ts
│   ├── editState.ts
│   ├── sidebar.ts
│   ├── InitUser.tsx
│   ├── InitProfile.tsx
│   └── InitEmployees.tsx
│
├── types/
│   ├── types.ts                     # Tipos de dominio
│   ├── collections.ts               # declare global {} para tablas Supabase
│   ├── blog.ts, brand.ts, enums.ts  # Tipos especificos
│   ├── feature.ts, menu.ts
│   └── testimonial.ts
│
└── zodSchemas/
    └── schemas.ts                   # Schemas Zod para formularios
```

---

## `database.types.ts`

Tipos auto-generados por Supabase. Se regenera con `npm run gentypes`. **Nunca editar manualmente.**
