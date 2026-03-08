# Plan Maestro de Refactorización — CodeControl

**Fecha:** 2026-03-08
**Alcance:** Estabilización, refactor arquitectónico, upgrade Next.js 16, migración Supabase → Prisma
**Estado:** Planificación

---

## Resumen Ejecutivo

El proyecto tiene 563 archivos TypeScript/TSX, 187 archivos con queries directas a Supabase, un store monolítico de 1,134 líneas, y componentes de hasta 1,878 líneas mezclando lógica de negocio con UI. Este plan aborda las mejoras en 6 fases secuenciales con dependencias claras entre ellas.

### Métricas actuales del proyecto

| Métrica | Valor |
|---------|-------|
| Archivos TS/TSX | 563 |
| Archivos con queries Supabase (.from) | 187 |
| API Routes | 38 endpoints |
| Server Actions | 17 archivos |
| Componentes client-side | 274 (60%) |
| Usos de `any` | ~1,100 |
| `console.log` en producción | 897 |
| Suscripciones real-time | 12 |
| Archivos de storage | 27 |
| Migraciones SQL | 40 |
| Buckets de storage | 4 (documents-hse, repair_images, document_files, training-materials) |

---

## FASE 0 — Preparación y Estabilización

**Objetivo:** Corregir bugs críticos y crear la base para los cambios futuros.
**Riesgo:** Bajo
**Archivos estimados:** ~15

### 0.1 — Corregir memory leaks en suscripciones real-time

**Problema:** 12 suscripciones Supabase en stores sin `.unsubscribe()`. Se acumulan en cada navegación.

**Archivos a modificar:**
- `src/stores/loggedUser.ts` — 4 suscripciones (share_company_users, notifications, employees, company)
- `src/stores/countries.ts` — 2 suscripciones
- `src/components/VehiclesForm.tsx` — 1 suscripción
- `src/app/admin/auditor/page.tsx` — 1 suscripción
- `src/app/dashboard/company/page.tsx` — 2 suscripciones
- `src/app/dashboard/company/actualCompany/services/[id]/page.tsx` — 1 suscripción

**Acción:** Mover suscripciones a `useEffect` con cleanup en componentes, o agregar mecanismo de unsubscribe en stores.

### 0.2 — Agregar Error Boundaries

**Problema:** 0 archivos `error.tsx` en todo el proyecto.

**Archivos a crear:**
- `src/app/error.tsx` — Error boundary global
- `src/app/dashboard/error.tsx` — Error boundary del dashboard
- `src/app/admin/error.tsx` — Error boundary del admin

### 0.3 — Eliminar código muerto

**Archivos a eliminar/limpiar:**
- `src/stores/InitDocuments.tsx` — 173 líneas completamente comentadas
- `src/stores/InitCompanies.tsx` — 16 líneas, componente vacío
- `src/stores/vehicles.ts` — 90 líneas mayormente comentadas
- Bloques comentados en `src/middleware.ts` (líneas 95-103)
- Bloques comentados en API routes de daily-report

### 0.4 — Estandarizar respuestas de error en API Routes

**Problema:** Formatos inconsistentes — algunos retornan `{ error: ['msg'] }`, otros `{ error: 'msg' }`, otros no retornan nada.

**Acción:** Crear utility `src/lib/api-response.ts`:
```typescript
// Formato estándar
type ApiResponse<T> = { success: true; data: T } | { success: false; error: string; code?: string }
```

**Archivos a modificar:** 38 API routes en `src/app/api/`

---

## FASE 1 — Refactor Arquitectónico

**Objetivo:** Dividir monolitos, eliminar duplicación, estandarizar patrones.
**Riesgo:** Medio
**Archivos estimados:** ~60
**Pre-requisito:** Fase 0 completada

### 1.1 — Dividir God Store

**Problema:** `src/stores/loggedUser.ts` tiene 1,134 líneas y 61 campos.

**Stores nuevos a crear:**

| Store | Responsabilidad | Campos estimados |
|-------|----------------|-----------------|
| `src/stores/authStore.ts` | credentialUser, profile, codeControlRole, roleActualCompany | ~8 |
| `src/stores/companyStore.ts` | allCompanies, actualCompany, sharedCompanies, sharedUsers, alerts | ~10 |
| `src/stores/employeeStore.ts` | employees, employeesToShow, active_and_inactive, DrawerEmployees | ~8 |
| `src/stores/documentStore.ts` | documents (fuente única), filtros derivados con selectors | ~6 |
| `src/stores/vehicleStore.ts` | vehicles, vehiclesToShow, DrawerVehicles | ~6 |
| `src/stores/uiStore.ts` | active_sidebar, notifications, modals | ~5 |

**Eliminar estado duplicado:**
- Mantener `employees` como fuente única → derivar `employeesToShow` y `active_and_inactive` con selectors de Zustand
- Mantener `documents` como fuente única → derivar `lastMonthDocuments`, `pendingDocuments`, etc. con selectors
- Misma lógica para `vehicles`/`vehiclesToShow`

**Archivos a actualizar:** 29 componentes que importan `useLoggedUserStore`

### 1.2 — Extraer boilerplate de Server Actions

**Problema:** 49 funciones repiten cookie + supabase client + company_id (500+ líneas duplicadas).

**Acción:** Crear utility `src/lib/server-action-context.ts`:
```typescript
async function getActionContext() {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const companyId = cookiesStore.get('actualComp')?.value;
  if (!companyId) throw new ActionError('No company selected');
  return { supabase, companyId };
}
```

**Archivos a refactorizar:**
- `src/app/server/GET/actions.ts` — 62 funciones
- `src/app/server/UPDATE/actions.ts` — 5 funciones
- `src/components/Capacitaciones/actions/actions.ts` — 19 funciones
- `src/features/Hse/actions/documents.ts` — 19 funciones

### 1.3 — Dividir archivos monolíticos de Server Actions por dominio

**Estructura propuesta:**
```
src/app/server/
├── lib/
│   └── context.ts              # getActionContext() utility
├── employees/
│   ├── queries.ts              # GET: fetchAllEmployees, fetchActiveEmployees, etc.
│   └── mutations.ts            # CREATE/UPDATE/DELETE
├── documents/
│   ├── queries.ts
│   └── mutations.ts
├── vehicles/
│   ├── queries.ts
│   └── mutations.ts
├── company/
│   ├── queries.ts
│   └── mutations.ts
├── repairs/
│   ├── queries.ts
│   └── mutations.ts
├── daily-reports/
│   ├── queries.ts
│   └── mutations.ts
└── shared/
    ├── queries.ts              # Queries compartidas cross-domain
    └── mutations.ts
```

**Archivos fuente (a dividir):**
- `src/app/server/GET/actions.ts` (1,419 líneas → ~8 archivos de ~100-150 líneas)
- `src/app/server/UPDATE/actions.ts` (80 líneas → distribuir por dominio)

### 1.4 — Componente genérico de documentos

**Problema:** ~1,500 líneas duplicadas entre variantes Employee/Equipment.

**Archivos duplicados a consolidar:**

| Actual | Líneas |
|--------|--------|
| ShowEmployeeDocument.tsx | 468 |
| ShowEquipmentDocument.tsx | 452 |
| UploadDocumentEmployee.tsx | 424 |
| UploadDocumentEquipment.tsx | 435 |
| UploadDocumentMultiEmployee.tsx | 342 |
| UploadDocumentMultiEquipment.tsx | 325 |

**Resultado:** 3 componentes genéricos parametrizados:
- `ShowDocument.tsx<T>` — con prop `entityType: 'employee' | 'equipment'`
- `UploadDocument.tsx<T>` — genérico por tipo de entidad
- `UploadDocumentMulti.tsx<T>` — genérico para multi-documentos

### 1.5 — Refactorizar componentes gigantes

**Componentes a dividir:**

| Componente | Líneas | Estrategia |
|------------|--------|------------|
| EmployeeComponent.tsx | 1,878 | Extraer: EmployeeForm, EmployeeDocuments, EmployeeActions |
| DailyReport.tsx | 1,596 | Extraer: DailyReportForm, DailyReportTable, DailyReportFilters |
| NewDocumentType.tsx | 1,429 | Extraer: DocumentTypeConfig, DocumentTypeForm, DocumentTypePreview |
| VehiclesForm.tsx | 1,287 | Extraer: VehicleBasicInfo, VehicleDocuments, VehicleQR |

**Criterio:** Cada componente resultante ≤ 300 líneas. Separar lógica de negocio (hooks custom) de presentación (componentes).

---

## FASE 2 — Upgrade a Next.js 16

**Objetivo:** Actualizar Next.js y todas las dependencias.
**Riesgo:** Alto
**Pre-requisito:** Fase 1 completada (para no tener que refactorizar monolitos sobre APIs nuevas)

### 2.1 — Actualizar dependencias core

**Upgrades principales:**

| Paquete | Actual | Target |
|---------|--------|--------|
| next | 14.0.4 | 16.x |
| react | ^18 | ^19 |
| react-dom | ^18 | ^19 |
| @types/react | ^18.2.53 | ^19.x |
| @types/react-dom | ^18 | ^19.x |
| eslint-config-next | 14.0.4 | 16.x |
| typescript | ^5 | ^5.7+ |

### 2.2 — Adaptar breaking changes de React 19

**Cambios necesarios:**
- `forwardRef` ya no es necesario — React 19 pasa ref como prop
  - Impacta: componentes Shadcn/ui en `src/components/ui/`
- `useFormStatus` / `useActionState` reemplazan patrones actuales de `useFormState`
- `ref` callbacks reciben cleanup function
- Verificar compatibilidad de todas las librerías Radix UI con React 19

### 2.3 — Adaptar breaking changes de Next.js 15 → 16

**Cambios críticos (acumulados desde Next 14):**

1. **`cookies()` y `headers()` ahora son async** (desde Next 15)
   - Impacto: 49+ funciones en server actions + middleware
   - Acción: agregar `await` a todas las llamadas a `cookies()`

2. **`params` y `searchParams` ahora son async** (desde Next 15)
   - Impacta: todas las pages y API routes con params dinámicos
   - Archivos: `src/app/api/*/[id]/route.ts`, pages con params

3. **Nuevo `next.config.ts`** (migrar desde .js)
   - Migrar `next.config.js` → `next.config.ts`

4. **`fetch` caching por defecto: `no-store`** (desde Next 15)
   - Revisar si hay dependencia del cache implícito

5. **Turbopack como default** (Next 16)
   - Verificar compatibilidad con PostCSS + Tailwind config

### 2.4 — Actualizar dependencias secundarias

**Librerías a verificar compatibilidad con React 19:**

| Librería | Actual | Notas |
|----------|--------|-------|
| @radix-ui/* | v1.x | Necesita upgrade a v2.x para React 19 |
| framer-motion | ^10.18.0 | Necesita upgrade a v11+ (renombrada a `motion`) |
| react-hook-form | ^7.49.3 | Verificar compat React 19 |
| zustand | 4.5.0 | Upgrade a 5.x |
| @tanstack/react-table | ^8.11.7 | Verificar compat |
| recharts | ^2.13.3 | Verificar compat |
| react-day-picker | ^8.10.0 | Upgrade a v9 |
| cmdk | ^0.2.1 | Upgrade a v1.x |
| sonner | ^1.4.41 | Verificar compat |
| vaul | ^0.9.0 | Verificar compat |
| swiper | ^11.0.5 | Verificar compat |
| embla-carousel-react | ^8.2.0 | Verificar compat |
| react-modal | ^3.16.1 | Considerar reemplazar por Radix Dialog |
| shadcn | ^3.5.1 | Verificar nueva CLI |

**Eliminar paquetes duplicados/obsoletos:**
- `@supabase/auth-helpers-nextjs` — deprecado en favor de `@supabase/ssr` (ya lo usan)
- `next-cookies` — reemplazable por `cookies()` de Next.js
- `next-theme` — duplicado con `next-themes`
- `moment` — reemplazar con `date-fns` (ya incluido)
- `punycode` — incluido en Node.js core

### 2.5 — Testing post-upgrade

**Checklist de verificación:**
- [ ] Build sin errores (`npm run build`)
- [ ] Type check sin errores (`npm run check-types`)
- [ ] Lint sin errores (`npm run lint`)
- [ ] Login/registro funcionando
- [ ] Navegación dashboard completa
- [ ] Carga de documentos
- [ ] Reportes diarios
- [ ] Suscripciones real-time
- [ ] Generación de PDF/Excel
- [ ] Responsive en mobile

---

## FASE 3 — Migración Supabase → Prisma (Capa de Base de Datos)

**Objetivo:** Reemplazar todas las queries Supabase (`supabase.from().select()`) por Prisma Client.
**Riesgo:** Alto
**Pre-requisito:** Fase 2 completada
**Archivos impactados:** 187 archivos con queries directas

### 3.1 — Setup de Prisma

**Acciones:**
1. Instalar dependencias:
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```
2. Introspeccionar la base de datos existente (Supabase PostgreSQL):
   ```bash
   npx prisma db pull
   ```
   Esto genera `prisma/schema.prisma` a partir de las 30+ tablas existentes.

3. Generar Prisma Client:
   ```bash
   npx prisma generate
   ```

4. Crear cliente singleton:
   ```typescript
   // src/lib/prisma.ts
   import { PrismaClient } from '@prisma/client'
   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
   export const prisma = globalForPrisma.prisma || new PrismaClient()
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   ```

**Archivos a crear:**
- `prisma/schema.prisma` — generado desde DB existente
- `src/lib/prisma.ts` — singleton client

**Variables de entorno a agregar:**
- `DATABASE_URL` — connection string de PostgreSQL (puede ser la misma URL de Supabase PostgreSQL)

### 3.2 — Migrar Server Actions (prioridad alta)

**Orden de migración por dominio (de menor a mayor complejidad):**

| # | Dominio | Archivos | Queries | Complejidad |
|---|---------|----------|---------|-------------|
| 1 | Company | queries.ts, mutations.ts | ~8 | Baja |
| 2 | Vehicles | queries.ts, mutations.ts | ~10 | Baja |
| 3 | Employees | queries.ts, mutations.ts | ~15 | Media |
| 4 | Documents | queries.ts, mutations.ts | ~20 | Media |
| 5 | Repairs | queries.ts, mutations.ts | ~8 | Media |
| 6 | Daily Reports | queries.ts, mutations.ts | ~12 | Alta |
| 7 | HSE/Capacitaciones | queries.ts, mutations.ts | ~38 | Alta |

**Ejemplo de transformación:**
```typescript
// ANTES (Supabase)
const { data, error } = await supabase
  .from('employees')
  .select('*, city(name), province(name)')
  .eq('company_id', companyId)
  .eq('is_active', true);

// DESPUÉS (Prisma)
const data = await prisma.employees.findMany({
  where: { company_id: companyId, is_active: true },
  include: { city: { select: { name: true } }, province: { select: { name: true } } }
});
```

### 3.3 — Migrar API Routes

**38 endpoints a migrar en `src/app/api/`:**

| Grupo | Endpoints | Prioridad |
|-------|-----------|-----------|
| /api/company/* | 4 | Media |
| /api/employees/* | 4 | Alta |
| /api/equipment/* | 3 | Alta |
| /api/daily-report/* | 7 | Alta |
| /api/services/* | 5 | Media |
| /api/repairs/* | 3 | Media |
| /api/document/* | 1 | Media |
| /api/profile | 1 | Baja |
| /api/send | 1 | Baja (no usa DB) |
| Otros | 9 | Baja |

**Decisión arquitectónica:** Evaluar si migrar API routes a server actions donde sea posible, reduciendo los 38 endpoints. Las API routes deben mantenerse solo para:
- Webhooks externos
- Endpoints consumidos por terceros
- Operaciones que requieren streaming

### 3.4 — Migrar queries en componentes browser

**Problema:** 120+ componentes cliente usan `supabaseBrowser()` para queries directas.

**Estrategia:** Reemplazar queries client-side por server actions:
```typescript
// ANTES: query directa desde el browser
const supabase = supabaseBrowser();
const { data } = await supabase.from('covenant').select('*').eq('company_id', id);

// DESPUÉS: server action
const data = await getCovenantsByCompany(id);
```

**Archivos clave a migrar:**
- `src/components/CovenantComponent.tsx`
- `src/components/Tipos_de_reparaciones/RepairEntry.tsx`
- `src/components/AddCovenantModal.tsx`
- `src/hooks/useEmployeesData.ts`
- `src/hooks/useCompanyData.ts`
- ~115 componentes adicionales

### 3.5 — Migrar RPC calls a Prisma raw queries o lógica de aplicación

**4 funciones RPC a reemplazar:**

| Función RPC | Ubicación | Estrategia |
|-------------|-----------|------------|
| `get_company_users_by_cuil` | PortalEmpleados/actions.ts | Prisma query con where |
| `find_employee_by_full_name_v2` | GET/actions.ts | Prisma fulltext search o raw query |
| `filter_employees_by_conditions` | documentFilters.ts | Prisma where con condiciones dinámicas |
| `filter_vehicles_by_conditions` | documentFilters.ts | Prisma where con condiciones dinámicas |

### 3.6 — Migrar stores (Zustand)

**Archivos críticos:**
- `src/stores/loggedUser.ts` (o los stores divididos en Fase 1) — 56+ queries Supabase
- `src/stores/countries.ts` — queries de lookup data

**Estrategia:** Los stores NO deben hacer queries directamente. Mover toda la lógica de fetching a server actions y que los stores solo almacenen estado.

### 3.7 — Actualizar middleware

**Archivo:** `src/middleware.ts` — CRÍTICO

**Problema:** Middleware ejecuta 4-5 queries Supabase en cada request.

**Nota importante:** Prisma Client NO funciona en Edge Runtime (middleware de Next.js). Opciones:

1. **Opción A — JWT + datos en token:** Almacenar role y company_id en el JWT/session token. Middleware solo verifica el token sin queries a DB.
2. **Opción B — Prisma con driver adapter:** Usar `@prisma/adapter-neon` o similar para edge-compatible queries.
3. **Opción C — Mover lógica a layout:** Sacar las queries del middleware y moverlas a `layout.tsx` del dashboard (server component).

**Recomendación:** Opción A (JWT) para máximo rendimiento + Opción C para lógica de roles compleja.

### 3.8 — Reemplazar tipos globales

**Archivo:** `src/app/server/colections.ts` (254 líneas)

**Acción:** Reemplazar tipos manuales por los generados por Prisma:
```typescript
// ANTES
declare global {
  type Employee = DB['public']['Tables']['employees']['Row'];
}

// DESPUÉS
import { employees as Employee } from '@prisma/client';
// O usar los tipos generados directamente
```

**Archivo:** `database.types.ts` — Se elimina completamente (reemplazado por Prisma generate).

**Scripts a actualizar en package.json:**
- Eliminar `gentypes` y `genlocaltypes`
- Agregar `"prisma:generate": "prisma generate"`
- Agregar `"prisma:push": "prisma db push"`
- Agregar `"prisma:migrate": "prisma migrate dev"`

---

## FASE 4 — Migración de Auth (Supabase Auth → NextAuth.js / Auth.js)

**Objetivo:** Reemplazar Supabase Auth por una solución independiente.
**Riesgo:** Alto
**Pre-requisito:** Fase 3 en progreso o completada

### 4.1 — Setup de Auth.js (NextAuth v5)

**Instalar:**
```bash
npm install next-auth@beta @auth/prisma-adapter
```

**Archivos a crear:**
- `src/auth.ts` — Configuración principal de Auth.js
- `src/app/api/auth/[...nextauth]/route.ts` — API route handler
- `prisma/schema.prisma` — Agregar modelos Account, Session, User, VerificationToken

**Providers a configurar:**
- Credentials (email + password) — reemplaza `signInWithPassword()`
- Google OAuth — reemplaza `signInWithOAuth({ provider: 'google' })`
- Email (Magic Link/OTP) — reemplaza flujo OTP actual

### 4.2 — Migrar flujos de autenticación

**Archivos a modificar:**

| Archivo actual | Acción |
|----------------|--------|
| `src/app/login/actions.ts` | Reemplazar signIn/signOut/signUp por Auth.js |
| `src/app/register/actions.ts` | Adaptar registro a Auth.js |
| `src/hooks/useAuthData.ts` | Reemplazar por `useSession()` de Auth.js |
| `src/components/LoginForm.tsx` | Actualizar formulario |
| `src/components/RegisterForm.tsx` | Actualizar formulario |
| `src/components/RegisterWithRole.tsx` | Actualizar registro con rol |
| `src/components/LogOutButton.tsx` | Usar `signOut()` de Auth.js |
| `src/app/login/auth/callback/route.ts` | Reemplazar por callback de Auth.js |
| `src/app/login/auth/confirm/route.ts` | Adaptar o eliminar |
| `src/app/reset_password/*` | Implementar con Auth.js |

### 4.3 — Migrar middleware de auth

**Archivo:** `src/middleware.ts`

**Antes:** 5 queries a Supabase para validar sesión + rol.
**Después:** Verificación de JWT token de Auth.js (sin queries a DB):

```typescript
import { auth } from '@/auth';

export default auth((req) => {
  const { role, companyId } = req.auth; // Del token JWT
  // Lógica de roles sin queries
});
```

### 4.4 — Migrar tabla de profiles

**Situación actual:** La tabla `profile` en Supabase almacena datos extendidos del usuario.

**Acción:** Mantener tabla `profile` en PostgreSQL, vincularla al modelo `User` de Auth.js via Prisma.

---

## FASE 5 — Migración de Storage y Real-time

**Objetivo:** Reemplazar Supabase Storage y suscripciones real-time.
**Riesgo:** Medio
**Pre-requisito:** Fases 3-4 completadas

### 5.1 — Migrar Storage

**4 buckets a migrar:**

| Bucket | Uso | Archivos impactados |
|--------|-----|---------------------|
| document_files | Documentos de empleados/equipos | ~15 archivos |
| documents-hse | Documentos HSE | ~5 archivos |
| repair_images | Imágenes de solicitudes de reparación | ~3 archivos |
| training-materials | Material de capacitaciones | ~4 archivos |

**Opciones de reemplazo:**

| Opción | Pros | Contras |
|--------|------|---------|
| AWS S3 + presigned URLs | Estándar industria, escalable | Costo, setup IAM |
| Cloudflare R2 | Sin egress fees, compatible S3 | Menos features |
| Vercel Blob | Integrado con Vercel | Vendor lock-in |
| UploadThing | Simple para Next.js | Menos control |
| MinIO (self-hosted) | Open source, compatible S3 | Requiere infra |

**Archivos a modificar (27 total):**
- Crear `src/lib/storage.ts` — abstracción del servicio de storage
- Reemplazar `supabase.storage.from('bucket')` por nueva abstracción
- Operaciones a migrar: `.upload()`, `.download()`, `.remove()`, `.getPublicUrl()`

### 5.2 — Migrar o eliminar Real-time

**12 suscripciones actuales — evaluar necesidad real:**

| Suscripción | Tabla | Necesidad real |
|-------------|-------|---------------|
| share_company_users (INSERT/UPDATE/DELETE) | Alta — permisos | Evaluar: ¿polling cada 30s? |
| notifications (INSERT/UPDATE/DELETE) | Alta — UX | Mantener real-time |
| employees (UPDATE) | Media | Polling suficiente |
| company (INSERT/UPDATE/DELETE) | Baja | Polling suficiente |
| countries lookups | Baja — datos estáticos | Eliminar, cachear |
| VehiclesForm | Baja | Eliminar |
| Auditor page | Media | Polling |
| Company pages | Media | Polling |

**Opciones de reemplazo para real-time:**

| Opción | Complejidad | Costo |
|--------|-------------|-------|
| Polling con SWR/React Query | Baja | Gratis |
| Server-Sent Events (SSE) | Media | Gratis |
| Pusher | Baja | Pago |
| Ably | Baja | Pago |
| Socket.io + server custom | Alta | Infra |
| PostgreSQL LISTEN/NOTIFY | Media | Gratis |

**Recomendación:** Para la mayoría de los casos, **polling con React Query** (revalidación cada 15-30s) es suficiente. Mantener real-time solo para notificaciones, usando SSE o un servicio como Pusher.

---

## FASE 6 — Limpieza y Calidad de Código

**Objetivo:** Mejorar calidad general post-migración.
**Riesgo:** Bajo
**Pre-requisito:** Fases anteriores completadas

### 6.1 — Eliminar dependencias de Supabase

**Paquetes a desinstalar:**
```bash
npm uninstall @supabase/auth-helpers-nextjs @supabase/gotrue-js @supabase/ssr @supabase/supabase-js supabase
```

**Archivos a eliminar:**
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `supabase/supabase.ts`
- `supabase/config.toml`
- `supabase/seed.sql`
- `database.types.ts`
- Directorio `supabase/migrations/` (mantener backup)

### 6.2 — Campaña de eliminación de `any`

**~1,100 instancias → objetivo: < 50**

**Prioridad de corrección:**
1. Server actions y API routes — tipado con tipos Prisma
2. Stores — tipos inferidos de Prisma
3. Hooks — parámetros y retornos tipados
4. Componentes — props y event handlers

### 6.3 — Limpiar console.log

**897 instancias → objetivo: 0 en producción**

**Acción:** Configurar ESLint rule `no-console: 'warn'` y reemplazar por logger estructurado donde sea necesario.

### 6.4 — Migrar de moment a date-fns

**Eliminar `moment` (66KB gzipped) — ya tienen `date-fns` instalado.**

Buscar todos los imports de `moment` y reemplazar por equivalentes de `date-fns`.

### 6.5 — Reducir componentes client-side

**Actual:** 274 (60%) client → **Objetivo:** <40% client

**Estrategia:** Convertir a Server Components todos los componentes que:
- Solo renderizan datos (sin interactividad)
- Hacen data fetching y pasan props
- No usan hooks de estado/efectos

---

## Dependencias entre Fases

```
FASE 0 (Estabilización)
  └──► FASE 1 (Refactor Arquitectónico)
         └──► FASE 2 (Next.js 16)
                └──► FASE 3 (Prisma) ◄── Puede iniciar en paralelo con Fase 4
                └──► FASE 4 (Auth)   ◄── Puede iniciar en paralelo con Fase 3
                       └──► FASE 5 (Storage + Real-time)
                              └──► FASE 6 (Limpieza)
```

## Estimación de Impacto por Fase

| Fase | Archivos impactados | Complejidad | Riesgo de regresión |
|------|---------------------|-------------|---------------------|
| 0 — Estabilización | ~20 | Baja | Bajo |
| 1 — Refactor | ~60 | Media | Medio |
| 2 — Next.js 16 | ~100+ | Alta | Alto |
| 3 — Prisma | ~187 | Alta | Alto |
| 4 — Auth | ~15 | Alta | Alto |
| 5 — Storage/RT | ~30 | Media | Medio |
| 6 — Limpieza | ~200 | Baja | Bajo |

## Notas Importantes

1. **Backup:** Crear rama `legacy/supabase` antes de iniciar Fase 3 para preservar el estado actual.
2. **Base de datos:** Supabase PostgreSQL puede seguir siendo el proveedor de DB — Prisma se conecta directamente a PostgreSQL. La migración es del SDK/ORM, no necesariamente del hosting.
3. **Migraciones:** Las 40 migraciones SQL existentes se convierten al esquema Prisma via `prisma db pull`. Las futuras migraciones se gestionan con `prisma migrate dev`.
4. **Feature flags:** Considerar implementar flags para migrar endpoints gradualmente (Supabase query → Prisma query) sin big-bang.
5. **Testing:** Cada fase debe incluir testing de regresión antes de mergearse a main.
