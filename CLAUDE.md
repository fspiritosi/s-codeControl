# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CodeControl** — Multi-tenant SaaS for managing employees, equipment, documents, daily reports, HSE/training, repair requests, and organizational diagrams. Built with Next.js 16 (App Router, Turbopack) + React 19 + Prisma (PostgreSQL) + NextAuth + TypeScript. Ya no usa Supabase: la base es un Postgres en Dokploy, los archivos viven en RustFS (S3) y la auth es propia (profile + bcrypt, NextAuth con JWT).

## Git Rules

- Nunca hagas un push de sin que me lo indique.
- Cuando una tarea impacta en mas de 5 archivos o en mas de 100 lineas de codigo, podes hacer el commit ni bien terminas de probar que todo funciona. Cuando sea menor a estos valores, se hacen cuando te lo indique el usuario.

## Common Commands

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run check-types  # TypeScript type checking (tsc --noEmit)
npm run format       # Prettier format all files
npm run prisma:generate # Regenerate Prisma client (src/generated/prisma)
```

## Architecture

### Project Structure Overview

The codebase follows a **modular architecture** with three main layers:

```
src/
├── app/              # Routing only (thin page wrappers)
├── modules/          # Business logic organized by domain
└── shared/           # Cross-cutting code shared between modules
```

### Route Structure (`src/app/`)

The `app/` directory is **exclusively for Next.js routing**. Pages are thin wrappers that import and render components from `src/modules/`. No business logic, components, or utilities should live here.

**Allowed files in `app/`:** `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts` (API routes).

**Routes:**
- `/` — Landing page (public)
- `/login`, `/register`, `/reset_password` — Auth pages (public)
- `/dashboard/**` — Protected routes (employees, equipment, documents, company, HSE, maintenance, operations, forms, daily reports)
- `/admin/**` — Admin panel, tables management, auditor view
- `/api/**` — REST API route handlers (company, employees, equipment, daily-report, repairs, services, profile)
- `/hse/training/**` — Public HSE training pages
- `/maintenance/**` — Public maintenance/QR pages

**Example page pattern:**
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

### Modules (`src/modules/`)

Each module is an independent business domain. Modules contain features, each with their own server actions, components, and types.

| Module | Description |
|--------|-------------|
| `company` | Company management (detail, create, contacts, covenants, customers, users, portal) |
| `employees` | Employee management (list, create, detail, diagrams, validation) |
| `documents` | Document management (list, upload, manage, types) |
| `equipment` | Vehicle/equipment management (list, create, QR) |
| `maintenance` | Repairs and services |
| `operations` | Daily reports |
| `hse` | HSE training, checklists, documents |
| `forms` | Custom forms and answers |
| `dashboard` | Dashboard overview, charts, tables, expiring documents |
| `admin` | Admin panel, auditor, tables management |
| `landing` | Landing page, auth (login/register) |

**Module structure:**
```
modules/{module}/
├── features/
│   ├── {feature}/
│   │   ├── actions.server.ts    # Server actions (queries + mutations)
│   │   ├── components/          # UI components for this feature
│   │   └── index.ts             # Barrel export
│   └── ...
├── shared/                      # Shared within the module (types, validators, utils)
└── index.ts                     # Barrel export
```

### Server Actions Convention

Server actions live in `src/modules/{domain}/features/{feature}/actions.server.ts`:
- Each file declares `'use server'` at the top
- Contains both queries and mutations for that feature
- Uses Prisma (`@/shared/lib/prisma`) for DB access and `fetchCurrentUser()` for the session
- Reads `actualComp` from cookies for company-scoped queries
- Named in camelCase: `metodoFiltroEntidad` (e.g., `getAllEmployees`, `fetchCurrentCompany`)

Shared server actions (used by multiple modules) live in `src/shared/actions/`:
- `auth.ts` — Authentication, session, user profile
- `catalogs.ts` — Global catalogs (roles, industry types, document types, work diagrams)
- `geography.ts` — Countries, provinces, cities
- `notifications.ts` — Notification CRUD
- `email.ts` — Email sending via nodemailer
- `storage.ts` — File upload/download operations

### Shared Code (`src/shared/`)

Cross-cutting utilities and components shared between modules:

```
src/shared/
├── actions/          # Shared server actions (auth, catalogs, geography, email, etc.)
├── components/
│   ├── ui/           # Shadcn/ui base components (48 files)
│   ├── layout/       # Sidebar, NavBar, SideBarContainer, SideLinks
│   ├── common/       # ViewComponent, Skeletons, SVGs, AlertComponent, etc.
│   ├── auth/         # LoginForm, RegisterForm, AuthProvider, etc.
│   ├── data-table/   # Reusable data table with sorting, filtering, pagination, export
│   └── pdf/          # PDFPreviewDialog
├── hooks/            # useCompanyData, useEmployeesData, useDocuments, useProfileData, useUploadImage, etc.
├── lib/              # prisma, supabase clients, utils, storage, error handling, email templates
├── store/            # Zustand stores (loggedUser facade + domain stores)
├── types/            # Global type definitions, collections
└── zodSchemas/       # Zod validation schemas
```

### Authentication

NextAuth (`src/auth.ts`) con JWT: Credentials (bcrypt contra `profile.password_hash`) y Google (crea el `profile` en el primer ingreso). `fetchCurrentUser()` (`src/shared/actions/auth.ts`) devuelve `{ id, email }` del profile en sesión. Recuperación de contraseña e invitaciones: `src/shared/actions/auth-recovery.ts` (tabla `auth_tokens`). `src/proxy.ts` solo propaga `x-pathname`; los guards de permisos viven en los layouts.

Cookie `actualComp` stores the current company ID, used extensively in server actions.

### Storage

`@/shared/lib/storage` (cliente, vía `/api/storage`) y `@/shared/lib/storage-server` (servidor) sobre RustFS/S3. Los buckets son los de siempre con `_` cambiado por `-` (`document_files` → `document-files`). Las URLs públicas se arman con `STORAGE_PUBLIC_URL`.

### State Management

- **Zustand** — Primary facade store in `src/shared/store/loggedUser.ts` composes domain stores (authStore, companyStore, employeeStore, documentStore, vehicleStore, uiStore)
- **Jotai** — Used for lighter/atomic state
- **Initialization**: `InitUser.tsx` and related `Init*` components in `src/shared/store/` hydrate Zustand from server-passed props on mount

### Type System

- `src/shared/types/legacy-db.types.ts` — Tipos heredados del esquema de Supabase (solo lectura; el origen de verdad es `prisma/schema.prisma`)
- `src/shared/types/collections.ts` — Global type declarations via `declare global {}` mapping Supabase table rows
- `src/shared/types/types.ts` — Domain-specific type definitions
- `src/shared/zodSchemas/schemas.ts` — Zod validation schemas for forms

### Key Libraries

| Purpose | Library |
|---------|---------|
| UI Components | Shadcn/ui (Radix UI) |
| Styling | Tailwind CSS + tailwindcss-animate |
| Forms | React Hook Form + Zod |
| Data Tables | TanStack Table |
| PDF Generation | @react-pdf/renderer, jspdf |
| Excel Export | XLSX |
| Charts | Recharts |
| Icons | Lucide React, Radix Icons |
| Dates | date-fns, moment |

### Important Rules

1. **`src/app/` is routing only** — No components, business logic, or utilities in app/
2. **No cross-module imports** — Modules must NOT import from other modules. If shared functionality is needed, extract it to `src/shared/`
3. **Server actions in modules** — Each feature has its own `actions.server.ts`
4. **Esquema de la base**: `prisma/schema.prisma` es la fuente; los cambios van por migraciones de Prisma

## Environment Variables

Ver `.env.example` (base, auth, storage S3, SMTP, `CRON_SECRET`). Despliegue y variables de GitHub: `docs/deploy/runbook.md`. Corte desde Supabase: `prisma/cutover/README.md`. Crons: `docs/cron.md`.

## Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json)
