# Versionado de capacitaciones HSE — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir crear una versión nueva de una capacitación publicada con intentos, y al publicarla cerrar la anterior con su registro definitivo y vencer sus constancias (TKT-827).

**Architecture:** Cada versión es una fila de `trainings`. Las versiones de una misma capacitación se agrupan por `root_training_id` (null en la original) y se encadenan con `previous_version_id`, que es UNIQUE: eso impide tener dos versiones en preparación a la vez. La lógica sin base de datos va en `shared/versioning.ts`, con tests. Las operaciones con base van en `version-actions.server.ts`, con Prisma y `$transaction`. Toda publicación pasa por `updateTrainingStatus`, que deriva a la publicación de versión cuando corresponde.

**Tech Stack:** Next.js 16 server actions, Prisma (cliente en `src/generated/prisma`, se regenera con `npx prisma generate`), SQL de Supabase en `supabase/migrations`, Vitest, @react-pdf/renderer.

**Spec:** `docs/superpowers/specs/2026-11-10-versionado-capacitaciones-design.md`

## Global Constraints

- Migración solo con ADD: columnas nullable o con default. Las capacitaciones existentes quedan como v1 sin versión anterior.
- Todas las consultas filtran por `company_id` (cookie `actualComp`, `getCompanyId()`).
- Sin imports entre módulos. Todo queda en `src/modules/hse/features/training`.
- Textos fijos: "Nueva versión", "v2 en preparación", "Reemplaza a la v{n} (cerrada el dd/mm, N aprobados)", "Cerrada por cambio de versión", "Se emite la versión {n}", "Cerrada por cambio de versión (reemplazada por la versión {n})", "No realizada por cambio de versión", "{título} (versión {n})".
- Invitado y Auditor no versionan (mismo criterio que `OverviewTab`: `role !== 'Invitado' && role !== 'Auditor'`).
- Nunca se borra de Storage un archivo de material que otra fila de `training_materials` referencia.

## Review Focus

- Publicar una v2 cuya v1 se cerró a mano mientras la v2 era borrador: tiene que publicarse igual, marcar la v1 como reemplazada y vencer sus constancias, sin pisar el cierre ya hecho. Test: `buildSupersedeUpdate` con estado `Cerrada`.
- Campos de cierre de HSE cargados a mano en la v1 (incluido `requires_new_actions = false`): no se pisan. Test en `buildSupersededCloseFields`.
- Editar los materiales de la v2 conservando un material copiado de la v1: el archivo no se borra porque sigue referenciado. Test en `materialPathsSafeToDelete`.
- Un empleado con varios intentos aprobados en la v1: se vencen todas sus constancias. Test en `certificatePathsForAttempts`.
- Pedir "Nueva versión" dos veces: la segunda devuelve el borrador existente en lugar de fallar por la constraint UNIQUE. Lo cubre `createTrainingVersion` (Task 3, verificación manual).

---

### Task 1: Migración y schema Prisma

**Files:**
- Create: `supabase/migrations/20261110120000_add_training_versioning.sql`
- Modify: `prisma/schema.prisma` (model `trainings`, línea ~1368)

**Interfaces:**
- Produces: columnas de `trainings`: `version_number int not null default 1`, `root_training_id uuid null` (FK a `trainings.id`), `previous_version_id uuid null unique` (FK a `trainings.id`), `superseded_at timestamptz null`, `published_at timestamptz null`. Índice en `root_training_id`.

- [ ] **Step 1:** Escribir la migración con `ADD COLUMN IF NOT EXISTS`, las FKs, `UNIQUE (previous_version_id)` y el índice. Comentario de cabecera con el circuito del TKT-827, en el estilo de `20260814174908_add_training_lifecycle.sql`.
- [ ] **Step 2:** Agregar los campos al modelo `trainings` con relaciones nombradas (`"training_root"`, `"training_previous_version"`; la segunda es 1 a 1 por el `@unique`).
- [ ] **Step 3:** Run `npx prisma validate && npx prisma generate`. Expected: sin errores.
- [ ] **Step 4:** Run `npm run check-types`. Expected: exit 0.

### Task 2: Lógica pura de versionado

**Files:**
- Create: `src/modules/hse/features/training/shared/versioning.ts`
- Test: `src/modules/hse/features/training/shared/versioning.test.ts`

**Interfaces:**
- Produces:
  - `SUPERSEDED_EFFECTIVENESS = 'Cerrada por cambio de versión'`
  - `canCreateVersion(input: { status: string | null; attemptsCount: number }): boolean`
  - `buildSupersededCloseFields(current: { effectiveness_method: string | null; requires_new_actions: boolean | null; new_actions_detail: string | null }, nextVersion: number): { effectiveness_method: string | null; requires_new_actions: boolean | null; new_actions_detail: string | null }`
  - `buildSupersedeUpdate(input: { status: string | null; close: CloseFields }, nextVersion: number, now: Date, userId: string | null)`: devuelve el `data` del update de la v1. Si está `Publicado`: `status: 'Cerrada'`, `closed_at`, `closed_by` y los campos de `buildSupersededCloseFields`. En cualquier estado: `superseded_at: now`.
  - `versionedTitle(title: string, versionNumber: number, isVersioned: boolean): string`
  - `supersededClosureNote(nextVersion: number): string`
  - `materialPathsSafeToDelete(candidates: string[], stillReferenced: string[]): string[]`
  - `certificatePathsForAttempts(companyId: string, attempts: { id: string; employee_id: string }[]): string[]`

- [ ] **Step 1: Escribir los tests que fallan**

```ts
describe('canCreateVersion', () => {
  it('solo Publicado con intentos', () => {
    expect(canCreateVersion({ status: 'Publicado', attemptsCount: 1 })).toBe(true);
    expect(canCreateVersion({ status: 'Publicado', attemptsCount: 0 })).toBe(false);
    expect(canCreateVersion({ status: 'Borrador', attemptsCount: 3 })).toBe(false);
    expect(canCreateVersion({ status: 'Cerrada', attemptsCount: 3 })).toBe(false);
  });
});
describe('buildSupersededCloseFields', () => {
  it('completa los vacíos', () => {
    expect(buildSupersededCloseFields({ effectiveness_method: null, requires_new_actions: null, new_actions_detail: null }, 2))
      .toEqual({ effectiveness_method: 'Cerrada por cambio de versión', requires_new_actions: true, new_actions_detail: 'Se emite la versión 2' });
  });
  it('trata el texto en blanco como vacío', () => {
    expect(buildSupersededCloseFields({ effectiveness_method: '  ', requires_new_actions: null, new_actions_detail: null }, 2).effectiveness_method)
      .toBe('Cerrada por cambio de versión');
  });
  it('no pisa lo cargado a mano', () => {
    const manual = { effectiveness_method: 'Encuesta', requires_new_actions: false, new_actions_detail: null };
    expect(buildSupersededCloseFields(manual, 3)).toEqual(manual);
    const conAcciones = { effectiveness_method: 'Encuesta', requires_new_actions: true, new_actions_detail: 'Charla' };
    expect(buildSupersededCloseFields(conAcciones, 3)).toEqual(conAcciones);
  });
  it('requires_new_actions=true sin detalle: completa solo el detalle', () => {
    expect(buildSupersededCloseFields({ effectiveness_method: 'X', requires_new_actions: true, new_actions_detail: null }, 2).new_actions_detail)
      .toBe('Se emite la versión 2');
  });
});
describe('buildSupersedeUpdate', () => {
  const now = new Date('2026-11-10T12:00:00Z');
  const empty = { effectiveness_method: null, requires_new_actions: null, new_actions_detail: null };
  it('Publicado: cierra y marca reemplazada', () => {
    expect(buildSupersedeUpdate({ status: 'Publicado', close: empty }, 2, now, 'u1')).toMatchObject({
      status: 'Cerrada', closed_at: now, closed_by: 'u1', superseded_at: now, effectiveness_method: 'Cerrada por cambio de versión',
    });
  });
  it('Cerrada a mano: solo marca reemplazada', () => {
    expect(buildSupersedeUpdate({ status: 'Cerrada', close: empty }, 2, now, 'u1')).toEqual({ superseded_at: now });
  });
});
describe('versionedTitle / supersededClosureNote', () => {
  it('formatea', () => {
    expect(versionedTitle('Difusión', 2, true)).toBe('Difusión (versión 2)');
    expect(versionedTitle('Difusión', 1, false)).toBe('Difusión');
    expect(versionedTitle('Difusión', 1, true)).toBe('Difusión (versión 1)');
    expect(supersededClosureNote(2)).toBe('Cerrada por cambio de versión (reemplazada por la versión 2)');
  });
});
describe('materialPathsSafeToDelete', () => {
  it('excluye los referenciados y deduplica', () => {
    expect(materialPathsSafeToDelete(['a', 'b', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
  });
});
describe('certificatePathsForAttempts', () => {
  it('arma el document_path de archiveCertificateInEmployeeFile', () => {
    expect(certificatePathsForAttempts('c1', [{ id: 'a1', employee_id: 'e1' }, { id: 'a2', employee_id: 'e1' }]))
      .toEqual(['capacitaciones/c1/e1/a1.pdf', 'capacitaciones/c1/e1/a2.pdf']);
  });
});
```

- [ ] **Step 2:** Run `npx vitest run src/modules/hse/features/training/shared/versioning.test.ts`. Expected: FAIL (módulo inexistente).
- [ ] **Step 3:** Implementar `versioning.ts`. Usar `certificatePathsForAttempts` también en `archiveCertificateInEmployeeFile`, para que el formato de ruta tenga una sola definición.
- [ ] **Step 4:** Run el mismo comando. Expected: PASS.
- [ ] **Step 5:** Commit `feat(hse): TKT-827 modelo y lógica de versionado de capacitaciones` (junto con Task 1).

### Task 3: Server actions de versionado

**Files:**
- Create: `src/modules/hse/features/training/version-actions.server.ts` (`'use server'`, Prisma)
- Modify: `src/modules/hse/features/training/actions.server.ts`: `updateTrainingStatus` (~1390), `updateTraining` (~1311), `updateTrainingMaterials` (~700), `deleteTraining` (~1441)

**Interfaces:**
- Consumes: Task 2 completa, `validateForPublish`, `fetchTrainingRecordFields`, `fetchCurrentUser`.
- Produces:
  - `createTrainingVersion(trainingId: string): Promise<{ success: true; id: string; existing: boolean } | { success: false; error: string }>`
  - `publishTrainingVersion(trainingId: string): Promise<{ success: true } | { success: false; error: string }>`
  - `fetchTrainingVersions(trainingId: string): Promise<TrainingVersionRow[]>`, con `TrainingVersionRow = { id: string; version_number: number; status: string | null; created_at: string | null; published_at: string | null; closed_at: string | null; superseded: boolean; approved: number; total: number }`

- [ ] **Step 1: `createTrainingVersion`.** Rechazar con `canCreateVersion` falso: "Solo se puede versionar una capacitación publicada que ya tiene intentos". Si ya existe un training con `previous_version_id = trainingId`, devolver `{ success: true, id, existing: true }`. Si no, en un `$transaction`: crear el training con `status: 'Borrador'`, `version_number: v1 + 1`, `root_training_id: v1.root_training_id ?? v1.id`, `previous_version_id: v1.id`, y copiar título, descripción, `passing_score`, `test_limit_time`, los campos de `TrainingRecordData` **excepto los de cierre de HSE** (`effectiveness_method`, `requires_new_actions`, `new_actions_detail` quedan null en la v2) y los `training_materials` (mismo `file_url`). Copiar también las `training_questions` activas con sus `training_question_options` activas (preservando `order_index`, `is_correct`, `points` y `question_type`) y las `training_tag_assignments`. Revalidar `/dashboard/hse`.
- [ ] **Step 2: `publishTrainingVersion`.** Validar la v2 con `validateForPublish`; si falla, devolver `No se puede publicar la capacitación: ${errors.join('. ')}`, el formato que espera `OverviewTab`. Si la v2 no tiene `previous_version_id`, devolver error. Leer la v1 y los ids de sus intentos aprobados (`passed: true`). Exigir `fetchCurrentUser()?.id`; si falta, devolver error. En un `$transaction`:
  - v1: `buildSupersedeUpdate`.
  - `documents_employees.updateMany({ where: { document_path: { in: certificatePathsForAttempts(...) } }, data: { state: 'vencido', validity: now.toISOString(), user_id } })`. El trigger `log_document_employee_changes` exige `user_id`.
  - v2: `status: 'Publicado', published_at: now`.

  Revalidar `/dashboard/hse`, el detalle de las dos versiones, `/dashboard/document` y `/dashboard/employee`.
- [ ] **Step 3: `fetchTrainingVersions`.** Grupo = `root_training_id ?? id`. Traer las filas con `id = grupo OR root_training_id = grupo` y `company_id`, ordenadas por `version_number desc`. `approved` = empleados distintos con intento `passed: true`. `total` = empleados activos de la empresa, el mismo criterio que `getEmployeesCount`. `superseded` = `superseded_at != null`.
- [ ] **Step 4: Derivar la publicación.**
  - En `updateTrainingStatus`: si `status === 'Publicado'` y la capacitación tiene `previous_version_id`, devolver `publishTrainingVersion(trainingId)`. Si no, mantener el flujo actual y además setear `published_at: new Date().toISOString()` en el update.
  - En `updateTraining`: si `data.status === 'Publicado'` y el estado actual no es `Publicado`, guardar todo con `status` sin cambiar y al final llamar a `updateTrainingStatus(trainingId, 'Publicado')`, devolviendo su resultado.
- [ ] **Step 5: Borrado seguro de archivos.**
  - En `updateTrainingMaterials`: candidatos = rutas de los materiales actuales menos las URLs que siguen en `materials`. Filtrar con `materialPathsSafeToDelete` contra los `file_url` que referencia otra capacitación (`training_materials` con `training_id != trainingId` y `file_url in candidatos`).
  - En `deleteTraining`: el mismo filtro antes de `storageServer.remove`. Además, como las FKs de `training_questions`, `training_question_options` y `training_tag_assignments` no tienen `ON DELETE CASCADE` en las migraciones, borrar esas filas antes que la capacitación. Una v2 en borrador las tiene copiadas y, si no, su eliminación fallaría.
- [ ] **Step 6:** Run `npm run check-types && npx eslint src/modules/hse/features/training`. Expected: exit 0.
- [ ] **Step 7:** Commit `feat(hse): TKT-827 crear y publicar versiones de capacitaciones`.

### Task 4: PDF del registro y la constancia

**Files:**
- Modify: `src/modules/hse/features/training/record-actions.server.ts` (`buildTrainingRecord`, `buildTrainingCertificate`)
- Modify: `src/modules/hse/features/training/components/pdf/TrainingRecordLayout.tsx` (tipo `TrainingRecordHeader` y render)

**Interfaces:**
- Consumes: `versionedTitle`, `supersededClosureNote` (Task 2).
- Produces: `TrainingRecordHeader.closure_note: string | null`.

- [ ] **Step 1:** En los dos builders: `isVersioned = version_number > 1 || superseded_at != null`, y `title`/`training_title = versionedTitle(...)`. En `buildTrainingRecord`, `closure_note = superseded_at ? supersededClosureNote(version_number + 1) : null`.
- [ ] **Step 2:** En `TrainingRecordLayout`, mostrar `closure_note`, si existe, como una línea destacada debajo del encabezado.
- [ ] **Step 3:** Run `npm run check-types`. Expected: exit 0.
- [ ] **Step 4:** Commit `feat(hse): TKT-827 número de versión en registro y constancia`.

### Task 5: UI — detalle, listado y empleados

**Files:**
- Modify: `src/modules/hse/features/training/actions.server.ts`: `fetchTrainings` (~295) y `fetchTrainingById` (~439) devuelven `version_number`, `previous_version_id`, `superseded_at`, `draftVersionId` y `previousVersion: { version_number; closed_at; approved } | null`. `fetchTrainings` excluye las filas con `superseded_at`.
- Modify: `components/trainin-detail-wrapper.tsx`: el botón deshabilitado "Clonar capacitación" pasa a "Nueva versión" (o "Ver v{n} en preparación" si existe `draftVersionId`), visible para admins cuando `canCreateVersion`. Al crear, `router.push('/dashboard/hse/detail/' + id)`. Badge `v{n}` junto al título. Pestaña nueva "Versiones" (grid de 6 columnas).
- Create: `components/VersionsTab.tsx`: tabla con versión, estado ("Cerrada por cambio de versión" si `superseded`), creada, publicada, aprobados/total y enlace al detalle de cada versión. El registro se descarga desde el resumen de cada versión.
- Modify: `components/TrainingGrid.tsx` y `components/TrainingList.tsx`: badge `v{n}` si `version_number > 1`, línea "Reemplaza a la v{n} (cerrada el dd/mm, N aprobados)" si hay `previousVersion`, y enlace "v{n} en preparación" si hay `draftVersionId`.
- Modify: `components/EmployeesTab.tsx`: si `superseded_at`, los pendientes se muestran como "No realizada por cambio de versión" y no se ofrece recordatorio.
- Modify: `components/OverviewTab.tsx`: si `superseded_at`, el badge de estado dice "Cerrada por cambio de versión"; ocultar "Enviar recordatorio".

- [ ] **Step 1:** Ampliar `fetchTrainings` y `fetchTrainingById`. `draftVersionId` = id de la fila con `previous_version_id = id`, si existe y no tiene `superseded_at`.
- [ ] **Step 2:** Implementar los cambios de componentes listados arriba.
- [ ] **Step 3:** Run `npm run check-types && npm run lint && npm test`. Expected: exit 0.
- [ ] **Step 4:** Commit `feat(hse): TKT-827 versiones en el detalle, el listado y empleados`.

### Task 6: Verificación integral

- [ ] **Step 1:** Run `npm run build`. Expected: build OK.
- [ ] **Step 2:** Si hay una base local disponible (Supabase local en `127.0.0.1:54322`), aplicar la migración y recorrer el flujo: publicar → registrar un intento aprobado y archivar su constancia → "Nueva versión" → agregar material → publicar la v2. Verificar: v1 Cerrada con `superseded_at` y campos de cierre completados, constancia `vencido`, v2 Publicada sin intentos, listado con una sola tarjeta. Si no hay base disponible, dejar constancia en el reporte de que esta verificación no se hizo.
