# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CodeControl** — Multi-tenant SaaS for managing employees, equipment, documents, daily reports, HSE/training, repair requests, and organizational diagrams. Built with Next.js 14 (App Router) + Supabase + TypeScript.

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
npm run gentypes     # Regenerate Supabase types from remote DB -> database.types.ts
npm run genlocaltypes # Regenerate types from local Supabase
npm run create-migration # Create DB migration: npm run create-migration -- migrationName
npm run push-migrations  # Push migrations to production
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
- Uses `supabaseServer()` for DB access
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

### Authentication & Middleware

Middleware (`src/middleware.ts`) protects `/dashboard/*` and `/admin/*`:
1. Validates Supabase session
2. Fetches user profile + company associations
3. Enforces role-based access: Admin, CodeControlClient, Usuario, Invitado (guest), Auditor
4. Guest users restricted to document/employees/equipment views only
5. Auditors routed exclusively to `/auditor`

Cookie `actualComp` stores the current company ID, used extensively in server actions.

### Supabase Client

- **Server**: `src/shared/lib/supabase/server.ts` — `supabaseServer()` (anon key, RLS) and `adminSupabaseServer()` (service role key, bypasses RLS)
- **Browser**: `src/shared/lib/supabase/browser.ts` — Client-side operations via `createBrowserClient`

### State Management

- **Zustand** — Primary facade store in `src/shared/store/loggedUser.ts` composes domain stores (authStore, companyStore, employeeStore, documentStore, vehicleStore, uiStore)
- **Jotai** — Used for lighter/atomic state
- **Initialization**: `InitUser.tsx` and related `Init*` components in `src/shared/store/` hydrate Zustand from server-passed props on mount

### Type System

- `database.types.ts` — Auto-generated Supabase types (do NOT edit manually, use `npm run gentypes`)
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
4. **`database.types.ts` is auto-generated** — Never edit manually

## Environment Variables

Required in `.env.local` (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only, bypasses RLS)
- `NEXT_PUBLIC_PROJECT_URL` — Project base URL
- `RESEND_SUPABASE_API_KEY` — Email service key
- SMTP config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

## Database Workflow

1. Pull latest migrations: `git pull origin dev`
2. Apply locally: `npx supabase migration up`
3. Make DB changes locally
4. Create migration: `npm run create-migration -- migrationName`
5. Push to production: `npm run push-migrations`
6. Commit the migration file and create PR to dev

## Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json)
