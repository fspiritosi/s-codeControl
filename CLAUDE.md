# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CodeControl** — Multi-tenant SaaS for managing employees, equipment, documents, daily reports, HSE/training, repair requests, and organizational diagrams. Built with Next.js 14 (App Router) + Supabase + TypeScript.

## Common Commands

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run check-types  # TypeScript type checking (tsc --noEmit)
npm run format       # Prettier format all files
npm run gentypes     # Regenerate Supabase types from remote DB → database.types.ts
npm run genlocaltypes # Regenerate types from local Supabase
npm run create-migration # Create DB migration: npm run create-migration -- migrationName
npm run push-migrations  # Push migrations to production
```

## Architecture

### Route Structure (`src/app/`)

- `/` — Landing page (public)
- `/login`, `/register`, `/reset_password` — Auth pages (public)
- `/dashboard/**` — Protected routes (employees, equipment, documents, company, HSE, maintenance, operations, forms, daily reports)
- `/admin/**` — Admin panel, tables management, auditor view
- `/api/**` — REST API route handlers (company, employees, equipment, daily-report, repairs, services, profile)
- `/server/GET/actions.ts`, `/server/UPDATE/actions.ts` — Server actions organized by HTTP method
- `/actions/sendEmail.ts` — Email server action via nodemailer

### Authentication & Middleware

Middleware (`src/middleware.ts`) protects `/dashboard/*` and `/admin/*`:
1. Validates Supabase session
2. Fetches user profile + company associations
3. Enforces role-based access: Admin, CodeControlClient, Usuario, Invitado (guest), Auditor
4. Guest users restricted to document/employees/equipment views only
5. Auditors routed exclusively to `/auditor`

Cookie `actualComp` stores the current company ID, used extensively in server actions.

### Supabase Client

- **Server**: `src/lib/supabase/server.ts` — `supabaseServer()` (anon key, RLS) and `adminSupabaseServer()` (service role key, bypasses RLS)
- **Browser**: `src/lib/supabase/browser.ts` — Client-side operations via `createBrowserClient`

### State Management

- **Zustand** — Primary store in `src/stores/loggedUser.ts` holds user profile, companies, employees, vehicles, documents, notifications, roles
- **Jotai** — Used for lighter/atomic state
- **Initialization**: `InitUser.tsx` and related `Init*` components hydrate Zustand from server-passed props on mount

### Type System

- `database.types.ts` — Auto-generated Supabase types (do NOT edit manually, use `npm run gentypes`)
- `src/app/server/colections.ts` — Global type declarations via `declare global {}` mapping Supabase table rows
- `src/types/types.ts` — Domain-specific type definitions
- `src/zodSchemas/schemas.ts` — Zod validation schemas for forms

### Server Actions Convention

Functions in `src/app/server/GET/actions.ts` and `UPDATE/actions.ts`:
- Named in camelCase: `metodoFiltroEntidad` (e.g., `getAllEmployees`, `fetchCurrentCompany`)
- Use `supabaseServer()` for DB access
- Read `actualComp` from cookies for company-scoped queries

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

### Component Organization (`src/components/`)

- `ui/` — Shadcn/ui base components
- Feature folders: `Documents/`, `DailyReport/`, `CheckList/`, `Diagrams/`, `Capacitaciones/`, `Graficos/`, `pdf/`, `Services/`
- `shared/components/` — Reusable data table components with sorting, filtering, pagination, export

### Project Structure Layers

- `src/features/` — Feature-specific code (auth, company, employees, equipment, hse)
- `src/domains/` — Domain logic
- `src/infrastructure/` — DB clients, storage, external services
- `src/hooks/` — Custom hooks (`useAuthData`, `useCompanyData`, `useDocuments`, `useEmployeesData`, `useUploadImage`)
- `src/shared/` — Cross-cutting utilities and components

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
