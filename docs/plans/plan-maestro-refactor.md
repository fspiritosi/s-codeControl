# Plan Maestro de Refactorización — CodeControl

**Fecha inicio:** 2026-03-08
**Última actualización:** 2026-03-08
**Rama:** `refactor/plan-maestro`

---

## >>> PUNTO DE CONTINUACIÓN <<<

**Continuar en: FASE 8 — Eliminar Supabase SDK (línea 395)**

### Fases completadas:
| Fase | Estado | Commit |
|------|--------|--------|
| 0 — Estabilización | ✅ COMPLETADA | `fb148446` |
| 1 — Refactor Arquitectónico | ✅ COMPLETADA | `2c1b182f` |
| 2 — Upgrade Next.js 16 | ✅ COMPLETADA | `f5f2e39e` |
| 3 — Migración a Prisma | ✅ COMPLETADA | `f4073376` |
| 4 — NextAuth setup + stores a Prisma | ✅ COMPLETADA | `01c91002` |
| 5 — Storage abstraction + RT → polling | ✅ COMPLETADA | `07eb8749` |
| 6 — Limpieza console.log + ESLint 9 | ✅ COMPLETADA | `a1899eb6` |
| 7 — Auth completa (hybrid passwords) | ✅ COMPLETADA | `0a5c9541` |

### Fases pendientes:
| Fase | Línea | Descripción |
|------|-------|-------------|
| 8 — Eliminar Supabase | 395 | Desinstalar SDK, eliminar archivos, limpiar imports |
| 9 — Dividir server actions por dominio | 445 | Separar GET/actions.ts monolítico en archivos por dominio |
| 10 — Refactorizar componentes gigantes | 505 | Dividir componentes de 1000+ líneas |
| 11 — Migrar moment → date-fns | 555 | Reemplazar moment por date-fns en todo el proyecto |
| 12 — Campaña de eliminación de `any` | 595 | Reducir ~1,100 usos de `any` a < 50 |
| 13 — Reducir componentes client-side | 650 | Convertir a Server Components donde sea posible |
| 14 — Estandarizar API routes con utility | 690 | Aplicar apiSuccess/apiError a los 38 endpoints |
| 15 — Migrar queries browser a server actions | 725 | Eliminar supabaseBrowser() para queries directas en componentes |

---

## Resumen de lo completado

### Métricas antes → después

| Métrica | Antes | Después |
|---------|-------|---------|
| Next.js | 14.0.4 | 16.1.x |
| React | 18 | 19 |
| ORM | Supabase client | Prisma |
| Auth | Supabase Auth only | Supabase + NextAuth (coexistencia) |
| God Store | 1,134 líneas, 61 campos | 6 stores de 68-321 líneas |
| Real-time | 12 suscripciones sin cleanup | Polling 15-30s con cleanup |
| Storage | Acoplado a Supabase | Abstracción `src/lib/storage.ts` |
| Error boundaries | 0 | 3 (app, dashboard, admin) + not-found |
| console.log | 897 | 0 |
| ESLint | v8 + .eslintrc.json | v9 + eslint.config.mjs flat config |
| TypeScript errors | 875 (post-upgrade) | 0 |
| Archivos modificados total | 230 | +13,554 / -9,779 líneas |

### Qué permanece de Supabase (a eliminar en fases 7-8):
- `supabase.auth.*` — Login, registro, getUser (coexiste con NextAuth)
- `supabaseBrowser()` — Usado en ~120 componentes para queries directas (fase 15)
- `src/lib/supabase/server.ts` y `browser.ts` — Clientes aún importados
- `database.types.ts` — Tipos Supabase aún referenciados en `colections.ts`
- Storage internamente usa Supabase detrás de `src/lib/storage.ts`

---

## FASES COMPLETADAS (referencia)

<details>
<summary>Fase 0 — Estabilización (click para expandir)</summary>

- Memory leaks arreglados en 12 suscripciones real-time
- Error boundaries creados: `error.tsx` (app, dashboard, admin) + `not-found.tsx`
- Código muerto eliminado: InitDocuments, InitCompanies, vehicles store
- Utility `src/lib/api-response.ts` creado (pendiente aplicar en Fase 14)

</details>

<details>
<summary>Fase 1 — Refactor Arquitectónico (click para expandir)</summary>

- God store dividido: authStore, companyStore, employeeStore, documentStore, vehicleStore, uiStore
- loggedUser.ts mantenido como facade para backward compatibility
- Boilerplate extraído a `src/lib/server-action-context.ts`
- Componentes genéricos de documentos: ShowDocument.tsx, UploadDocument.tsx

</details>

<details>
<summary>Fase 2 — Next.js 16 (click para expandir)</summary>

- Next 14→16, React 18→19, Zustand 4→5, framer-motion 10→12
- react-day-picker 8→9, cmdk 0.2→1.1, sonner 1→2, vaul 0.9→1.1
- Supabase SSR 0.0.10→0.8.0 con nuevo cookie adapter
- 77+ archivos actualizados para async cookies/headers/params
- ESLint 8→9, eliminados paquetes obsoletos

</details>

<details>
<summary>Fase 3 — Prisma (click para expandir)</summary>

- Schema Prisma: 1,285 líneas, 60+ modelos, 18 enums
- 62 GET actions + 5 UPDATE actions migradas a Prisma
- 39 API routes migradas a Prisma
- Supabase retenido solo para auth, storage y real-time

</details>

<details>
<summary>Fase 4 — NextAuth + Stores (click para expandir)</summary>

- NextAuth v5 configurado con Google + Credentials providers
- Modelos Auth agregados a Prisma schema (Account, AuthUser, Session, VerificationToken)
- Middleware actualizado: NextAuth check → fallback Supabase
- 6 domain stores migrados de supabase.from() a server actions
- 18 nuevas server actions creadas para stores

</details>

<details>
<summary>Fase 5 — Storage + Real-time (click para expandir)</summary>

- Abstracción `src/lib/storage.ts` (client) y `storage-server.ts` (server)
- 25 archivos migrados a usar abstracción de storage
- 12 suscripciones real-time reemplazadas por polling (15-30s)
- Stores exponen startPolling/stopPolling para control de lifecycle

</details>

<details>
<summary>Fase 6 — Limpieza (click para expandir)</summary>

- 368 console.log eliminados de 95 archivos
- console.log en contexto de error convertidos a console.error
- ESLint migrado a flat config (eslint.config.mjs)
- Regla no-console: warn (permite console.error y console.warn)

</details>

---

## FASE 7 — Migración Completa de Auth

**Objetivo:** Implementar verificación real de passwords en NextAuth y migrar gradualmente desde Supabase Auth.
**Riesgo:** Alto
**Pre-requisito:** Fases 4-6 completadas

### 7.1 — Migración híbrida de passwords (Opción C)

**Contexto:** Las contraseñas están en `auth.users` de Supabase GoTrue (tabla interna, bcrypt). La tabla `profile` no tiene campo password. Los usuarios NO tendrán que cambiar sus contraseñas.

**Estrategia:** En cada login exitoso, capturar el password, hashearlo y guardarlo en `profile.password_hash`. Logins futuros verifican primero contra el hash propio; si no existe, delegan a Supabase Auth y guardan el hash para la próxima vez.

**Acciones:**

1. Agregar campo `password_hash` al modelo `profile` en `prisma/schema.prisma`:
   ```prisma
   model profile {
     // ... campos existentes
     password_hash String?   @db.Text
   }
   ```

2. Instalar bcryptjs:
   ```bash
   npm install bcryptjs @types/bcryptjs
   ```

3. Actualizar `src/auth.ts` — lógica del Credentials provider:
   ```typescript
   async authorize(credentials) {
     const { email, password } = credentials
     const profile = await prisma.profile.findFirst({ where: { email } })
     if (!profile) return null

     // Paso 1: Intentar verificar con hash propio
     if (profile.password_hash) {
       const valid = await bcrypt.compare(password, profile.password_hash)
       if (valid) return { id: profile.id, email: profile.email, name: profile.fullname }
       return null // password incorrecto
     }

     // Paso 2: No tiene hash propio → verificar con Supabase Auth
     const supabase = await supabaseServer()
     const { error } = await supabase.auth.signInWithPassword({ email, password })
     if (error) return null

     // Paso 3: Supabase validó OK → guardar hash para futuro
     const hash = await bcrypt.hash(password, 12)
     await prisma.profile.update({
       where: { id: profile.id },
       data: { password_hash: hash }
     })

     return { id: profile.id, email: profile.email, name: profile.fullname }
   }
   ```

4. Actualizar `src/app/register/actions.ts` — guardar hash al registrar:
   ```typescript
   const hash = await bcrypt.hash(password, 12)
   await prisma.profile.create({
     data: { ..., password_hash: hash }
   })
   ```

5. Actualizar `src/app/reset_password/` — al resetear password, actualizar `password_hash`

### 7.2 — Enriquecer JWT con datos de rol y empresa

**Problema:** El middleware actual hace 4-5 queries a DB en cada request para obtener rol y empresa.

**Acción:** Incluir `role`, `companyId`, y `profileId` en el JWT token de NextAuth:

```typescript
// src/auth.ts callbacks
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      const profile = await prisma.profile.findFirst({ where: { email: user.email } })
      const company = await prisma.company.findFirst({ where: { owner_id: profile?.id } })
      token.role = profile?.role
      token.profileId = profile?.id
      token.companyId = company?.id
    }
    return token
  },
  async session({ session, token }) {
    session.user.role = token.role
    session.user.profileId = token.profileId
    session.user.companyId = token.companyId
    return session
  }
}
```

### 7.3 — Migrar middleware a NextAuth puro

**Archivo:** `src/middleware.ts`

**Acción:** Eliminar las queries a Supabase del middleware. Usar solo el JWT de NextAuth para autorización:
- Verificar sesión con `auth()`
- Leer role, companyId del token (sin queries)
- Mantener lógica de redirección por roles (Admin, Auditor, Invitado, etc.)
- Eliminar import de `supabaseServer` del middleware

### 7.4 — Migrar componentes de login/registro a NextAuth puro

**Archivos a modificar:**

| Archivo | Acción |
|---------|--------|
| `src/app/login/actions.ts` | Eliminar flujo Supabase, usar solo NextAuth signIn |
| `src/app/register/actions.ts` | Crear usuario con Prisma + hash, luego NextAuth signIn |
| `src/hooks/useAuthData.ts` | Reemplazar por `useSession()` de NextAuth |
| `src/components/LoginForm.tsx` | Actualizar formulario para usar actions NextAuth |
| `src/components/RegisterForm.tsx` | Actualizar formulario |
| `src/components/LogOutButton.tsx` | Usar solo `signOut()` de NextAuth |
| `src/app/login/auth/callback/route.ts` | Eliminar (NextAuth maneja callbacks) |
| `src/app/login/auth/confirm/route.ts` | Eliminar o adaptar |
| `src/app/reset_password/*` | Implementar reset con token propio + actualizar password_hash |

### 7.5 — Testing de auth

**Checklist:**
- [ ] Login con email + password (usuarios existentes, sin cambio de password)
- [ ] Login con Google OAuth
- [ ] Registro de nuevo usuario
- [ ] Logout
- [ ] Reset de password
- [ ] Middleware protege rutas correctamente
- [ ] Roles funcionan (Admin, Auditor, Invitado, CodeControlClient)
- [ ] Cambio de empresa funciona
- [ ] Sesión persiste entre recargas

---

## FASE 8 — Eliminar Supabase SDK

**Objetivo:** Remover completamente el SDK de Supabase del proyecto.
**Riesgo:** Medio
**Pre-requisito:** Fase 7 completada y testeada

### 8.1 — Verificar que no quedan usos de Supabase Auth

```bash
grep -rn "supabase.auth\." src/ --include="*.ts" --include="*.tsx"
```

Todos los resultados deben ser eliminados o migrados antes de continuar.

### 8.2 — Migrar storage a proveedor final

**Decisión pendiente:** Elegir proveedor de storage definitivo.

**Acción:** Actualizar las implementaciones internas de `src/lib/storage.ts` y `storage-server.ts` para usar el proveedor elegido (S3, R2, Vercel Blob, etc.) en lugar de Supabase Storage.

### 8.3 — Desinstalar paquetes Supabase

```bash
npm uninstall @supabase/ssr @supabase/supabase-js @supabase/gotrue-js supabase
```

### 8.4 — Eliminar archivos Supabase

- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `src/lib/utils/middleware.ts` (updateSession de Supabase)
- `supabase/supabase.ts`
- `supabase/config.toml`
- `supabase/seed.sql`
- `database.types.ts`
- `scripts/generate-types.ts`

**Mantener como backup (en rama legacy):**
- `supabase/migrations/` — 40 archivos de migraciones SQL

### 8.5 — Limpiar package.json

Eliminar scripts de Supabase:
- `genlocaltypes`, `gentypes`, `local`, `pull-changes`, `pull-data`, `create-migration`, `migration-status`, `push-migrations`

### 8.6 — Limpiar variables de entorno

Eliminar de `.env` / `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_SUPABASE_API_KEY`

Agregar:
- `DATABASE_URL`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## FASE 9 — Dividir Server Actions por Dominio

**Objetivo:** Separar `src/app/server/GET/actions.ts` (1,300+ líneas, 80+ funciones) en archivos por dominio.
**Riesgo:** Bajo
**Pre-requisito:** Fase 8 completada

### 9.1 — Crear estructura por dominio

```
src/app/server/
├── lib/
│   └── context.ts                  # getActionContext() (ya existe)
├── employees/
│   ├── queries.ts                  # fetchAllEmployees, fetchActiveEmployees, etc.
│   └── mutations.ts
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
├── hse/
│   ├── queries.ts
│   └── mutations.ts
└── shared/
    └── queries.ts                  # Queries cross-domain (countries, lookup data)
```

### 9.2 — Mover funciones y actualizar imports

- Distribuir las 80+ funciones de `GET/actions.ts` por dominio
- Distribuir funciones de `UPDATE/actions.ts` por dominio
- Actualizar todos los imports en stores, componentes y páginas
- Eliminar archivos originales `GET/actions.ts` y `UPDATE/actions.ts`
- Cada archivo resultante debe tener < 200 líneas

---

## FASE 10 — Refactorizar Componentes Gigantes

**Objetivo:** Dividir componentes de 1,000+ líneas en piezas manejables.
**Riesgo:** Medio
**Pre-requisito:** Fase 9 (para tener imports limpios)

### 10.1 — EmployeeComponent.tsx (1,878 líneas)

**Dividir en:**
- `EmployeeForm.tsx` — Formulario de datos personales
- `EmployeeDocuments.tsx` — Sección de documentos
- `EmployeeActions.tsx` — Botones de acción y lógica
- `useEmployeeForm.ts` — Hook custom con lógica de negocio

### 10.2 — DailyReport.tsx (1,596 líneas)

**Dividir en:**
- `DailyReportForm.tsx` — Formulario de creación
- `DailyReportTable.tsx` — Tabla de registros
- `DailyReportFilters.tsx` — Filtros y búsqueda
- `useDailyReport.ts` — Hook custom

### 10.3 — NewDocumentType.tsx (1,429 líneas)

**Dividir en:**
- `DocumentTypeConfig.tsx` — Configuración de campos
- `DocumentTypeForm.tsx` — Formulario principal
- `DocumentTypePreview.tsx` — Vista previa
- `useDocumentType.ts` — Hook custom

### 10.4 — VehiclesForm.tsx (1,287 líneas)

**Dividir en:**
- `VehicleBasicInfo.tsx` — Datos básicos del vehículo
- `VehicleDocuments.tsx` — Sección de documentos
- `VehicleQR.tsx` — Generación de QR
- `useVehicleForm.ts` — Hook custom

**Criterio:** Cada componente resultante ≤ 300 líneas. Separar lógica (hooks) de presentación (componentes).

---

## FASE 11 — Migrar moment → date-fns

**Objetivo:** Eliminar `moment` (66KB gzipped) — el proyecto ya tiene `date-fns`.
**Riesgo:** Bajo
**Pre-requisito:** Ninguno específico (puede hacerse en paralelo)

### 11.1 — Buscar y mapear usos de moment

```bash
grep -rn "from 'moment'" src/ --include="*.ts" --include="*.tsx"
```

### 11.2 — Tabla de equivalencias

| moment | date-fns |
|--------|----------|
| `moment(date).format('DD/MM/YYYY')` | `format(new Date(date), 'dd/MM/yyyy')` |
| `moment(date).format('YYYY-MM-DD')` | `format(new Date(date), 'yyyy-MM-dd')` |
| `moment(date).fromNow()` | `formatDistanceToNow(new Date(date), { locale: es })` |
| `moment(date).diff(other, 'days')` | `differenceInDays(new Date(date), new Date(other))` |
| `moment(date).isBefore(other)` | `isBefore(new Date(date), new Date(other))` |
| `moment(date).add(n, 'days')` | `addDays(new Date(date), n)` |
| `moment(date).subtract(n, 'months')` | `subMonths(new Date(date), n)` |
| `moment().startOf('month')` | `startOfMonth(new Date())` |

### 11.3 — Reemplazar en todos los archivos

### 11.4 — Desinstalar moment
```bash
npm uninstall moment
```

---

## FASE 12 — Campaña de Eliminación de `any`

**Objetivo:** Reducir ~1,100 usos de `any` a < 50.
**Riesgo:** Bajo
**Pre-requisito:** Fases 7-9 (para tener tipos Prisma estables y auth migrado)

### 12.1 — Prioridad de corrección

| Prioridad | Área | Estrategia |
|-----------|------|------------|
| 1 | Server actions y API routes | Usar tipos Prisma generados (`Prisma.employeesGetPayload<>`) |
| 2 | Stores | Inferir tipos de las server actions |
| 3 | Hooks | Tipar parámetros y retornos |
| 4 | Componentes | Tipar props, callbacks y event handlers |
| 5 | Zod schemas | Reemplazar `z.any()` por schemas específicos |

### 12.2 — Tipos Prisma como fuente de verdad

Reemplazar tipos globales en `src/app/server/colections.ts`:
```typescript
// ANTES
declare global {
  type Employee = DB['public']['Tables']['employees']['Row'];
}

// DESPUÉS
import type { employees, vehicles, company, profile } from '@prisma/client'
declare global {
  type Employee = employees
  type Vehicle = vehicles
  type Company = company
  type Profile = profile
}
```

### 12.3 — Configurar ESLint para prevenir nuevos `any`

Agregar regla a `eslint.config.mjs`:
```javascript
"@typescript-eslint/no-explicit-any": "warn"
```

---

## FASE 13 — Reducir Componentes Client-Side

**Objetivo:** Reducir de 60% a < 40% de componentes con `'use client'`.
**Riesgo:** Bajo
**Pre-requisito:** Fase 10 (componentes ya refactorizados)

### 13.1 — Identificar candidatos a Server Component

Criterios para convertir a Server Component:
- Solo renderiza datos (sin `useState`, `useEffect`, `useRef`)
- Hace data fetching y pasa props a children
- No usa event handlers (onClick, onChange, etc.)
- No usa hooks de terceros (useForm, useTable, etc.)

### 13.2 — Convertir gradualmente

Empezar por:
- Páginas (`page.tsx`) que actualmente tienen `'use client'`
- Layouts que no necesitan interactividad
- Componentes wrapper que solo pasan datos

### 13.3 — Patrón: Server Component + Client Island

```typescript
// ServerWrapper.tsx (Server Component — sin 'use client')
export default async function ServerWrapper() {
  const data = await fetchData()
  return <ClientInteractive data={data} />
}

// ClientInteractive.tsx ('use client')
export function ClientInteractive({ data }) {
  // Hooks y interactividad aquí
}
```

---

## FASE 14 — Estandarizar API Routes con Utility

**Objetivo:** Aplicar `apiSuccess`/`apiError` de `src/lib/api-response.ts` a los 38 endpoints.
**Riesgo:** Bajo
**Pre-requisito:** Fase 9 (estructura limpia)

### 14.1 — Migrar respuestas de API routes

Para cada route.ts en `src/app/api/`:

```typescript
// ANTES
return Response.json({ employees })
// catch: console.error(error) // sin respuesta

// DESPUÉS
return apiSuccess(employees)
// catch: return apiError('Error fetching employees', 500)
```

### 14.2 — Estandarizar códigos HTTP

- 200: GET exitoso
- 201: POST/CREATE exitoso
- 400: Validación fallida
- 401: No autenticado
- 403: No autorizado
- 404: Recurso no encontrado
- 500: Error interno

---

## FASE 15 — Migrar Queries Browser a Server Actions

**Objetivo:** Eliminar `supabaseBrowser()` para queries directas en componentes cliente.
**Riesgo:** Medio
**Pre-requisito:** Fases 8-9 completadas

### 15.1 — Identificar componentes con queries browser

```bash
grep -rn "supabaseBrowser" src/components/ --include="*.tsx" -l
grep -rn "supabaseBrowser" src/hooks/ --include="*.ts" -l
```

### 15.2 — Para cada componente

1. Identificar la query Supabase
2. Buscar si existe una server action equivalente
3. Si no existe, crear la server action en el archivo de dominio correspondiente (Fase 9)
4. Reemplazar la query directa por la llamada a server action
5. Si el componente ya no necesita `supabaseBrowser`, eliminar el import

### 15.3 — Hooks a migrar

| Hook | Acción |
|------|--------|
| `useEmployeesData.ts` | Reemplazar queries por server actions |
| `useCompanyData.ts` | Reemplazar queries por server actions |
| `useDocuments.ts` | Verificar si aún usa supabaseBrowser |
| `useEdgeFunctions.ts` | Evaluar si migrar a API route o eliminar |

---

## Dependencias entre Fases Pendientes

```
FASE 7 (Auth completa)
  └──► FASE 8 (Eliminar Supabase SDK)
         └──► FASE 9 (Dividir server actions)
         │      └──► FASE 14 (Estandarizar API routes)
         │      └──► FASE 15 (Migrar queries browser)
         └──► FASE 12 (Eliminar `any`)

FASE 10 (Refactorizar componentes) ◄── Puede iniciar después de Fase 9
  └──► FASE 13 (Reducir client-side)

FASE 11 (moment → date-fns) ◄── Independiente, puede hacerse en cualquier momento
```

## Notas Importantes

1. **Backup:** La rama `main` preserva el estado original. Considerar crear `legacy/supabase` antes de mergear.
2. **Base de datos:** Supabase PostgreSQL sigue siendo el hosting de la DB. Prisma se conecta directo al mismo PostgreSQL. Solo cambia el SDK de acceso.
3. **Migraciones futuras:** Usar `prisma migrate dev` en lugar de `supabase db diff`.
4. **Passwords:** La migración de auth (Fase 7) es transparente para usuarios — no necesitan cambiar contraseñas. El hash se captura en el primer login post-migración.
5. **Testing:** Cada fase debe incluir testing de regresión antes de mergearse.
6. **Variables de entorno necesarias post-migración:** `DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
