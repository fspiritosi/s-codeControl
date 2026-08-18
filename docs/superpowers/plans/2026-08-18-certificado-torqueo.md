# Certificado de torqueo — Plan de implementación

> **Para ejecutores:** usar `superpowers:subagent-driven-development` o
> `superpowers:executing-plans`. Los pasos usan checkbox (`- [ ]`).

**Goal:** Permitir cargar los datos de un torqueo y emitir el certificado en PDF,
con listado y reimpresión, dentro del módulo de Mantenimiento.

**Architecture:** Tres tablas nuevas (referencia de torques por marca,
certificado con snapshot del vehículo, y los 15 tildes como filas). Una sola
plantilla de PDF parametrizada por formato de hoja y marca. La lógica pura
—selección de specs por marca, catálogo de ítems, formato de rangos— vive en un
módulo sin dependencias, testeado con vitest.

**Tech Stack:** Next.js 16 (App Router), Prisma, Supabase (migraciones),
@react-pdf/renderer, shadcn/ui, vitest.

**Spec:** `docs/superpowers/specs/2026-08-18-certificado-torqueo-design.md`

## Global Constraints

- Migraciones **ADD-only**. Nunca `db reset` ni borrado de datos.
- Los módulos no se importan entre sí; lo compartido va a `src/shared/`.
- Server actions en `actions.server.ts` dentro de la feature.
- Código nuevo con Prisma, no con el cliente de Supabase.
- Decimal y BigInt de Prisma se convierten a Number/String antes de pasarlos a
  componentes cliente.
- DataTable estándar: `showFilterToggle` + un filtro por columna.
- El PDF toma el logo de `pdf_settings`, como el resto del sistema.

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/<ts>_create_torque_certificates.sql` | Enums, 3 tablas y seed de specs |
| `prisma/schema.prisma` | Modelos `torque_specs`, `torque_certificates`, `torque_certificate_checks` |
| `src/modules/maintenance/features/torque/shared/torque-spec.ts` | Lógica pura: catálogo de ítems, formatos de hoja, formato de rangos |
| `src/modules/maintenance/features/torque/shared/torque-spec.test.ts` | Tests de lo anterior |
| `src/modules/maintenance/features/torque/actions.server.ts` | Listar, crear, obtener, numeración correlativa |
| `src/modules/maintenance/features/torque/components/pdf/TorqueCertificateLayout.tsx` | Plantilla única del PDF |
| `src/modules/maintenance/features/torque/components/TorqueCertificateForm.tsx` | Formulario de carga |
| `src/modules/maintenance/features/torque/components/TorqueCertificatesList.tsx` | Listado |
| `src/modules/maintenance/features/torque/components/columns.tsx` | Columnas del DataTable |
| `src/app/dashboard/maintenance/torque/page.tsx` | Ruta listado |
| `src/app/dashboard/maintenance/torque/new/page.tsx` | Ruta alta |
| `src/app/dashboard/maintenance/torque/[id]/page.tsx` | Ruta detalle |

---

## Task 1: Lógica pura del certificado

**Files:**
- Create: `src/modules/maintenance/features/torque/shared/torque-spec.ts`
- Test: `src/modules/maintenance/features/torque/shared/torque-spec.test.ts`

**Interfaces:**
- Produces: `TORQUE_CHECK_ITEMS`, `PREVIOUS_CHECK_KEYS`, `TIGHTENING_CHECK_KEYS`,
  `SHEET_FORMATS`, `type TorqueCheckKey`, `type SheetFormat`,
  `formatTorqueRange(spec)`, `checkLabel(key)`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, it } from 'vitest';
import {
  TORQUE_CHECK_ITEMS,
  PREVIOUS_CHECK_KEYS,
  TIGHTENING_CHECK_KEYS,
  formatTorqueRange,
  checkLabel,
} from './torque-spec';

describe('catálogo de ítems', () => {
  it('tiene 7 verificaciones previas y 8 de apriete', () => {
    expect(PREVIOUS_CHECK_KEYS).toHaveLength(7);
    expect(TIGHTENING_CHECK_KEYS).toHaveLength(8);
    expect(TORQUE_CHECK_ITEMS).toHaveLength(15);
  });

  it('no repite claves', () => {
    const keys = TORQUE_CHECK_ITEMS.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('devuelve la etiqueta de una clave y la clave misma si no existe', () => {
    expect(checkLabel('epp')).toBe('Elementos de Protección Personal (EPP)');
    expect(checkLabel('inexistente')).toBe('inexistente');
  });
});

describe('formatTorqueRange', () => {
  it('arma el texto con Nm y ft-lbs como en el papel', () => {
    expect(
      formatTorqueRange({ nm_min: 150, nm_max: 170, ftlb_min: 111, ftlb_max: 125 })
    ).toBe('150-170 Nm (111-125 ft-lbs)');
  });

  it('omite los ft-lbs si no están cargados', () => {
    expect(
      formatTorqueRange({ nm_min: 500, nm_max: 600, ftlb_min: null, ftlb_max: null })
    ).toBe('500-600 Nm');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/modules/maintenance/features/torque/shared/torque-spec.test.ts`
Expected: FAIL — no existe el módulo.

- [ ] **Step 3: Implementar**

```ts
/**
 * Catálogo y formato del certificado de torqueo (tsk-575).
 *
 * Puro y sin dependencias: lo consumen el formulario, el PDF y las server
 * actions, y se testea aislado.
 */

export const PREVIOUS_CHECK_KEYS = [
  'area_trabajo_seguro',
  'epp',
  'base_firme',
  'herramienta_condiciones',
  'tornilleria_estado',
  'secuencia_disponible',
  'estado_checkpoint',
] as const;

export const TIGHTENING_CHECK_KEYS = [
  'torque_del_derecho',
  'torque_del_izquierdo',
  'torque_tras_derecho',
  'torque_tras_izquierdo',
  'ind_rueda_del_derecho',
  'ind_rueda_del_izquierdo',
  'ind_rueda_tras_derecho',
  'ind_rueda_tras_izquierdo',
] as const;

export type TorqueCheckKey =
  | (typeof PREVIOUS_CHECK_KEYS)[number]
  | (typeof TIGHTENING_CHECK_KEYS)[number];

export const TORQUE_CHECK_ITEMS: { key: TorqueCheckKey; label: string; group: 'previous' | 'tightening' }[] = [
  { key: 'area_trabajo_seguro', label: 'Área de trabajo seguro', group: 'previous' },
  { key: 'epp', label: 'Elementos de Protección Personal (EPP)', group: 'previous' },
  { key: 'base_firme', label: 'Base firme y vehículo inmovilizado', group: 'previous' },
  { key: 'herramienta_condiciones', label: 'Herramienta de torque en condiciones', group: 'previous' },
  { key: 'tornilleria_estado', label: 'Tornillería en buen estado', group: 'previous' },
  { key: 'secuencia_disponible', label: 'Secuencia de apriete disponible', group: 'previous' },
  { key: 'estado_checkpoint', label: 'Estado de Checkpoint', group: 'previous' },
  { key: 'torque_del_derecho', label: 'Torque del. derecho', group: 'tightening' },
  { key: 'torque_del_izquierdo', label: 'Torque del. izquierdo', group: 'tightening' },
  { key: 'torque_tras_derecho', label: 'Torque tras. derecho', group: 'tightening' },
  { key: 'torque_tras_izquierdo', label: 'Torque tras. izquierdo', group: 'tightening' },
  { key: 'ind_rueda_del_derecho', label: 'Ind. rueda del. derecho', group: 'tightening' },
  { key: 'ind_rueda_del_izquierdo', label: 'Ind. rueda del. izquierdo', group: 'tightening' },
  { key: 'ind_rueda_tras_derecho', label: 'Ind. rueda tras. derecho', group: 'tightening' },
  { key: 'ind_rueda_tras_izquierdo', label: 'Ind. rueda tras. izquierdo', group: 'tightening' },
];

/** Formato de hoja: cambia solo el juego de fotos del PDF. */
export const SHEET_FORMATS = [
  { value: 'LIGHT', label: 'Vehículos chicos' },
  { value: 'BUS', label: 'Colectivos' },
] as const;

export type SheetFormat = (typeof SHEET_FORMATS)[number]['value'];

export function checkLabel(key: string): string {
  return TORQUE_CHECK_ITEMS.find((i) => i.key === key)?.label ?? key;
}

/** "150-170 Nm (111-125 ft-lbs)", como figura en el papel. */
export function formatTorqueRange(spec: {
  nm_min: number;
  nm_max: number;
  ftlb_min: number | null;
  ftlb_max: number | null;
}): string {
  const nm = `${spec.nm_min}-${spec.nm_max} Nm`;
  if (spec.ftlb_min == null || spec.ftlb_max == null) return nm;
  return `${nm} (${spec.ftlb_min}-${spec.ftlb_max} ft-lbs)`;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/modules/maintenance/features/torque/shared/torque-spec.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/maintenance/features/torque/shared/
git commit -m "feat(torque): catálogo de ítems y formato de rangos del certificado"
```

---

## Task 2: Migración y modelos

**Files:**
- Create: `supabase/migrations/<timestamp>_create_torque_certificates.sql`
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: tablas `torque_specs`, `torque_certificates`,
  `torque_certificate_checks`; enums `torque_sheet_format` (LIGHT/BUS) y
  `torque_bolt_condition` (DRY/LUBRICATED).

- [ ] **Step 1: Crear el archivo de migración**

Run: `npm run create-migration -- create_torque_certificates`

- [ ] **Step 2: Escribir la migración**

Los dos enums: `torque_sheet_format` (`LIGHT`, `BUS`) y `torque_bolt_condition`
(`DRY`, `LUBRICATED`).

`torque_specs`: `company_id`, `brand_id` → `brand_vehicles` (**BigInt**, no uuid), `configuration`
(text), `nm_min`, `nm_max`, `ftlb_min`, `ftlb_max` (los ft-lbs nullable),
`is_active` (default true).

`torque_certificates`:
- `company_id`, `number` (int), `full_number` (text), `@@unique([company_id, number])`
- `vehicle_id` → `vehicles`, `sheet_format` (torque_sheet_format)
- `date` (date), `driver_name`, `mechanic_name`, `place`
- `tool_type`, y las cuatro calibraciones, una por rueda:
  `calibration_di`, `calibration_dd`, `calibration_td`, `calibration_ti`
  (DI delantera izquierda, DD delantera derecha, TD trasera derecha,
  TI trasera izquierda — así figuran en el papel)
- `required_torque`, `meets_requirement` (bool), `tolerance_range_nm`,
  `bolt_condition` (torque_bolt_condition)
- Snapshot: `vehicle_domain`, `vehicle_intern_number`, `vehicle_brand_name`
- `created_by`, `created_at`

`torque_certificate_checks`: `certificate_id` (ON DELETE CASCADE), `item_key`
(text, una de las 15 claves de Task 1), `value` (bool), `observations` (text
nullable), `@@index([certificate_id])`.

Al final, el seed de `torque_specs` para cada empresa que tenga las marcas
cargadas:

```sql
-- Valores de las dos hojas en papel. Mercedes-Benz para vehículos chicos,
-- Iveco para colectivos; se cargan como dato porque la tabla que se imprime
-- depende de la marca real del vehículo, no del formato de hoja (tsk-575).
-- Las marcas NO son globales: brand_vehicles tiene company_id. Por eso cada
-- empresa se une con SUS propias marcas y no con un CROSS JOIN, que le
-- asignaría a un cliente las marcas de otro.
INSERT INTO torque_specs (company_id, brand_id, configuration, nm_min, nm_max, ftlb_min, ftlb_max)
SELECT b.company_id, b.id, v.configuration, v.nm_min, v.nm_max, v.ftlb_min, v.ftlb_max
FROM (VALUES
  ('Mercedes-Benz', '9+1',  150, 170, 111, 125),
  ('Mercedes-Benz', '15+1', 170, 190, 125, 140),
  ('Mercedes-Benz', '19+1', 190, 210, 140, 155),
  ('Iveco', '1+8',   500,  600, 369,  443),
  ('Iveco', '24+1',  600,  700, 443,  516),
  ('Iveco', '31+1',  800,  900, 590,  664),
  ('Iveco', '41+1', 1000, 1200, 738,  885),
  ('Iveco', '43+1', 1100, 1300, 811,  959),
  ('Iveco', '44+1', 1200, 1400, 885, 1030)
) AS v(brand_name, configuration, nm_min, nm_max, ftlb_min, ftlb_max)
JOIN brand_vehicles b ON b.name = v.brand_name AND b.company_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

- [ ] **Step 3: Aplicar en local y verificar**

```bash
docker cp supabase/migrations/<archivo>.sql supabase_db_s-codeControl:/tmp/m.sql
docker exec supabase_db_s-codeControl psql -U postgres -d postgres -1 -v ON_ERROR_STOP=1 -f /tmp/m.sql
docker exec supabase_db_s-codeControl psql -U postgres -d postgres -t -A -c \
  "select b.name, s.configuration, s.nm_min, s.nm_max from torque_specs s join brand_vehicles b on b.id=s.brand_id order by b.name, s.nm_min;"
```

Expected: 3 filas de Mercedes-Benz y 6 de Iveco **por empresa**.

- [ ] **Step 4: Agregar los modelos a Prisma y regenerar**

```bash
npx prisma validate && npx prisma generate
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script | grep -i torque
```

Expected: sin drift (sin líneas de torque).

- [ ] **Step 5: Regenerar tipos y verificar compilación**

```bash
npm run genlocaltypes
npx tsc --noEmit -p tsconfig.json
```

Expected: cero errores.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations prisma/schema.prisma database.types.ts
git commit -m "feat(torque): tablas de certificado de torqueo y seed de specs"
```

---

## Task 3: Server actions

**Files:**
- Create: `src/modules/maintenance/features/torque/actions.server.ts`

**Interfaces:**
- Consumes: `TorqueCheckKey`, `SheetFormat` de Task 1; modelos de Task 2.
- Produces:
  - `getVehiclesForTorque(): Promise<{ id, domain, serie, intern_number, brand_id, brand_name }[]>`
  - `getTorqueSpecsByBrand(brandId: string): Promise<{ configuration, nm_min, nm_max, ftlb_min, ftlb_max }[]>`
  - `getTorqueCertificates(): Promise<TorqueCertificateRow[]>`
  - `getTorqueCertificateById(id: string)`
  - `createTorqueCertificate(input: TorqueCertificateInput): Promise<{ success: boolean; id?: string; error?: string }>`

- [ ] **Step 1: Implementar las lecturas**

`getVehiclesForTorque` trae los equipos activos de la empresa con su marca
(`brand_rel.name`), convirtiendo `BigInt` a string. `getTorqueSpecsByBrand`
devuelve las specs activas ordenadas por `nm_min`, con Decimal → Number.

- [ ] **Step 2: Implementar `createTorqueCertificate`**

Toma el correlativo con `findFirst({ orderBy: { number: 'desc' } })` dentro de la
empresa, arma `full_number` como `TQ-` + 5 dígitos, y crea el certificado con sus
15 checks en una sola transacción (`prisma.$transaction`). **Guarda el snapshot**
de patente, interno y marca leídos del vehículo en ese momento — no se resuelven
por relación al leer.

- [ ] **Step 3: Verificar contra la base**

Script con `tsx` que crea un certificado de un vehículo Mercedes, lee sus specs,
verifica que sean las de Mercedes y no las de Iveco, que se hayan creado 15
checks, y que el correlativo no colisione al crear dos seguidos. Borra lo creado
al terminar.

Expected: todo OK y base limpia al final.

- [ ] **Step 4: Commit**

```bash
git add src/modules/maintenance/features/torque/actions.server.ts
git commit -m "feat(torque): server actions de certificados"
```

---

## Task 4: Plantilla del PDF

**Files:**
- Create: `src/modules/maintenance/features/torque/components/pdf/TorqueCertificateLayout.tsx`

**Interfaces:**
- Consumes: `formatTorqueRange`, `checkLabel`, `TORQUE_CHECK_ITEMS` de Task 1.
- Produces: `TorqueCertificateLayout({ data, specs, logoUrl })`, y los tipos
  `TorqueCertificatePdfData` y `TorquePdfSpecRow`.

- [ ] **Step 1: Implementar el layout**

Una sola plantilla con las cinco secciones del papel. Los diagramas de apriete y
las fotos se reciben como props opcionales (`diagramUrl`, `vehiclePhotosUrl`): si
no están, se omiten sin romper. La sección 5 imprime `specs.map(formatTorqueRange)`.
La firma va como línea en blanco.

- [ ] **Step 2: Renderizar el PDF y verificar**

Script con `tsx` que renderiza con datos de prueba: uno con specs de Mercedes y
otro con las de Iveco, y uno sin imágenes.

Expected: los tres generan buffer > 0 bytes; el de Mercedes contiene "150-170 Nm"
y no contiene "500-600 Nm".

- [ ] **Step 3: Commit**

```bash
git add src/modules/maintenance/features/torque/components/pdf/
git commit -m "feat(torque): plantilla PDF del certificado"
```

---

## Task 5: Formulario de carga

**Files:**
- Create: `src/modules/maintenance/features/torque/components/TorqueCertificateForm.tsx`
- Create: `src/app/dashboard/maintenance/torque/new/page.tsx`

**Interfaces:**
- Consumes: todo lo anterior.

- [ ] **Step 1: Implementar el formulario**

`SearchableSelect` de equipo; al elegirlo se completan patente, interno y marca y
se cargan las specs de esa marca, que se muestran **en pantalla, solo lectura**.
Select de formato de hoja. Datos generales, los 7 checks previos con
observaciones, especificaciones, y los 8 checks de apriete. Al guardar, genera el
PDF y lo descarga.

Con menos de 5 campos se usa `useState` + Zod; acá son más, así que va con el
patrón de formularios largos del proyecto.

- [ ] **Step 2: Verificar tipos y compilación**

```bash
npx tsc --noEmit -p tsconfig.json
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dashboard/maintenance/torque/new
```

Expected: cero errores; la ruta compila.

- [ ] **Step 3: Commit**

---

## Task 6: Listado, detalle y navegación

**Files:**
- Create: `src/modules/maintenance/features/torque/components/TorqueCertificatesList.tsx`
- Create: `src/modules/maintenance/features/torque/components/columns.tsx`
- Create: `src/app/dashboard/maintenance/torque/page.tsx`
- Create: `src/app/dashboard/maintenance/torque/[id]/page.tsx`
- Modify: `src/shared/components/layout/SideBarContainer.tsx`

**Interfaces:**
- Consumes: `getTorqueCertificates`, `getTorqueCertificateById`.

- [ ] **Step 1: Listado con DataTable estándar**

Columnas: número, fecha, vehículo (patente del snapshot), interno, mecánico,
formato. `showFilterToggle` y un filtro por columna.

- [ ] **Step 2: Detalle con reimpresión**

Muestra los datos cargados y un botón que regenera el PDF desde el registro
guardado, sin recargar nada.

- [ ] **Step 3: Entrada en el sidebar**

Agregar "Certificados de torqueo" bajo Mantenimiento en
`SideBarContainer.tsx` — es el sidebar real; `SideLinks.tsx` es legacy.

- [ ] **Step 4: Verificar**

```bash
npx tsc --noEmit -p tsconfig.json
```
Y abrir las tres rutas en el navegador con sesión: alta, listado y reimpresión.

- [ ] **Step 5: Commit**

---

## Pendiente que no bloquea el desarrollo

Las imágenes (diagramas de apriete y fotos de vehículos) son escaneos de baja
resolución. Las tareas 4 y 5 las tratan como props opcionales, así que todo se
construye y se prueba sin ellas. Antes de entregar hay que resolver: pedirle el
Word original a Sergio, redibujar los diagramas como vectores, o publicar el
certificado solo con los diagramas.
