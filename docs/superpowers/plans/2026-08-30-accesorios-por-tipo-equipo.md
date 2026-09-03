# Accesorios y mantenimiento por tipo de equipo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que los accesorios y los ítems de mantenimiento de un equipo se definan una vez por tipo de equipo (compartidos por todas las unidades de ese tipo) y puedan vincularse opcionalmente a un producto de almacén para refrescar su precio.

**Architecture:** Una tabla `costo_tipo_equipo` (perfil por `company_id` + `type_id`) agrupa una única tabla de ítems `item_costo_tipo` discriminada por `clase` (ACCESORIO | MANTENIMIENTO). El motor de cálculo pasa a recibir esa lista en vez de un `accesorios` escalar y una lista de mantenimiento. `costo_equipo` conserva sólo lo que es propio de cada unidad: valor de compra, residual y años.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Prisma 7 (PostgreSQL) · Zod · decimal.js · vitest · Shadcn/ui · Tailwind

**Spec:** `docs/superpowers/specs/2026-08-30-accesorios-por-tipo-equipo-design.md`

## Global Constraints

- **Migraciones**: se crean con `npm run create-migration -- <nombre>` (genera el archivo en `supabase/migrations/`) y se escriben en SQL plano, siguiendo el estilo de `supabase/migrations/20260723030931_create_auxiliary_calc_tables.sql`: comentario de encabezado explicando el porqué, nombres de constraint explícitos, `numeric(p,s)` para decimales.
- **Orden seguro**: el árbol debe compilar y testear en verde después de **cada** tarea. Por eso el esquema se agrega primero (aditivo), después se migran los datos, y los `DROP` van al final (Task 9).
- **Precisión**: todo cálculo intermedio en `Decimal` (`@/modules/costos/shared/utils/decimal`). Redondeo a 2 decimales sólo al salir al cliente, con `.toDecimalPlaces(2).toNumber()`.
- **Blindaje de actions**: toda action del módulo costos empieza con `getRequiredActionContext()` + `assertModuloHabilitado(companyId)`, y toda mutación verifica pertenencia por `company_id` antes de escribir.
- **Sin imports cross-module**: `src/modules/costos` no puede importar de `src/modules/products`. Lo que necesite de productos se importa en la **page** (`src/app/...`) y baja por props, como en `src/app/dashboard/purchasing/invoices/new/page.tsx:2`.
- **Regla de commits del proyecto (CLAUDE.md)**: si la tarea toca más de 5 archivos o más de 100 líneas, commiteá al terminar de verificarla. Si es menor, **no commitees**: dejá el cambio y pedile confirmación al usuario. Cada tarea de abajo dice cuál de los dos casos es.
- **Nunca hacer push** salvo indicación explícita del usuario.
- **Tests**: `npx vitest run <ruta>` para un archivo puntual, `npm test` para la suite completa.

---

### Task 1: Motor de cálculo sobre ítems por tipo

Archivo nuevo, sin tocar nada existente: al terminar esta tarea conviven el motor viejo y el nuevo. El viejo se elimina en la Task 9.

**Files:**
- Create: `src/modules/costos/shared/utils/calcular-costo-equipo.ts`
- Create: `src/modules/costos/shared/utils/calcular-costo-equipo.test.ts`

**Interfaces:**
- Consumes: `calcularAmortizacionMensual(valor_compra, valor_residual_pct, anios, accesorios)` de `./calcular-amortizacion` (sin cambios), `Decimal` de `./decimal`.
- Produces:
  - `type ClaseItemCosto = 'ACCESORIO' | 'MANTENIMIENTO'`
  - `type ItemCostoTipoCalc = { clase: ClaseItemCosto; cantidad: Num; precio_unitario: Num; is_active?: boolean | null }`
  - `sumarItemsTipo(items: ItemCostoTipoCalc[]): { accesorios: Decimal; mantenimiento_anual: Decimal }`
  - `calcularCostoMensualEquipo(input: CostoEquipoCalcInput): CostoEquipoCalcResult` con `CostoEquipoCalcInput = { valor_compra; valor_residual_pct; anios_amortizacion: number; items_tipo: ItemCostoTipoCalc[]; afectacion_pct? }` y `CostoEquipoCalcResult = { accesorios_total; amortizacion_mensual; mantenimiento_mensual; costo_mensual }` (los cuatro `Decimal`).

- [ ] **Step 1: Escribir el test que falla**

El fixture es el golden de la planilla real, copiado de `calcular-equipo.test.ts` y convertido al formato nuevo (`cantidad: 1`, `precio_unitario` = el precio anual de antes). El número esperado NO cambia: es el criterio de aceptación de toda la refactorización.

```ts
// src/modules/costos/shared/utils/calcular-costo-equipo.test.ts
import { describe, it, expect } from 'vitest';
import {
  sumarItemsTipo,
  calcularCostoMensualEquipo,
  type ItemCostoTipoCalc,
} from './calcular-costo-equipo';

// ─── Fixture golden: IVECO BUS 170S28 NICCOLO 44+1 (interno 112, PECOM/RDLS-BDT, Jun 2025) ───
// Transcrito de la planilla del cliente (composicion-pecom-*.xls, hoja "Equipos").
// Valor de compra 319.325.000 · residual 35% · 5 años · accesorios 4.498.739.
const mant = (precio_unitario: string): ItemCostoTipoCalc => ({
  clase: 'MANTENIMIENTO',
  cantidad: 1,
  precio_unitario,
});

const PECOM_112 = {
  valor_compra: '319325000',
  valor_residual_pct: '0.35',
  anios_amortizacion: 5,
  items_tipo: [
    { clase: 'ACCESORIO', cantidad: 1, precio_unitario: '4498739' } as ItemCostoTipoCalc,
    mant('5428525'),   // Patentes
    mant('1680000'),   // Seguros
    mant('1780000'),   // VTV / Habilitaciones 2 x año
    mant('1952000'),   // Opticas delanteras 1 juego x año
    mant('132060'),    // Lamparas 6 juegos x año
    mant('1390000'),   // Bateria alternativa 1 x año
    mant('1080980'),   // Pernos Punta de Eje 2 juegos x año
    mant('790000'),    // Barra de direccion 1 juegos x año
    mant('850180'),    // Extremos direccion 2 juegos x año
    mant('1128571.4285714286'), // Caja de direccion hidraulica duracion 210.000 km
    mant('1952000'),   // Campanas de frenos delanteros 1 juego x año
    mant('840000'),    // Cintas de frenos delanteros 1 juego x año
    mant('2060000'),   // Campanas de frenos traseros 1 juego x año
    mant('940000'),    // Cintas de frenos traseras 1 juegos x año
    mant('980466'),    // Sensores delanteros ABS
    mant('520715'),    // Sensores traseros ABS
    mant('960000'),    // Amortiguadores delanteros 2 juegos x año
    mant('920000'),    // Amortiguadores traseros 2 juegos x año
    mant('1660000'),   // Kit de Filtros 2 x año
    mant('420926'),    // Aceite Motor 5w 30 sintetico
    mant('422400'),    // Aceite de caja y diferencial 75w 90
    mant('6800000'),   // Parabrisas 2 juegos x año
    mant('213634.2857142857'),  // Kit embreague cada 210.000 km
    mant('4916122'),   // Aire Acondicionado
    mant('576937.2857142857'),  // Calefaccion cada 210.000 km
    mant('5160000'),   // Neumáticos 6 x año
    mant('920400'),    // Crucetas + centro de cardan
    mant('1380000'),   // Bolilleros de masas de rueda 2 x año
    mant('1371428.5714285714'), // Inyectores cada 210.000 km
    mant('220000'),    // Mantenimiento Filtro de Particulas 2 x año
    mant('580000'),    // Tapiceria en General
    mant('1100000'),   // Alternador 1 cada dos años
  ],
};

describe('sumarItemsTipo', () => {
  it('separa accesorios de mantenimiento y multiplica cantidad por precio', () => {
    const items: ItemCostoTipoCalc[] = [
      { clase: 'ACCESORIO', cantidad: 2, precio_unitario: '150000' },
      { clase: 'MANTENIMIENTO', cantidad: 6, precio_unitario: '860000' },
    ];
    const { accesorios, mantenimiento_anual } = sumarItemsTipo(items);
    expect(accesorios.toNumber()).toBe(300000);
    expect(mantenimiento_anual.toNumber()).toBe(5160000);
  });

  it('excluye los ítems inactivos de ambas clases', () => {
    const items: ItemCostoTipoCalc[] = [
      { clase: 'ACCESORIO', cantidad: 1, precio_unitario: '100000', is_active: false },
      { clase: 'ACCESORIO', cantidad: 1, precio_unitario: '50000', is_active: true },
      { clase: 'MANTENIMIENTO', cantidad: 1, precio_unitario: '999999', is_active: false },
      { clase: 'MANTENIMIENTO', cantidad: 1, precio_unitario: '120000' },
    ];
    const { accesorios, mantenimiento_anual } = sumarItemsTipo(items);
    expect(accesorios.toNumber()).toBe(50000);
    expect(mantenimiento_anual.toNumber()).toBe(120000);
  });

  it('devuelve ceros con lista vacía', () => {
    const { accesorios, mantenimiento_anual } = sumarItemsTipo([]);
    expect(accesorios.toNumber()).toBe(0);
    expect(mantenimiento_anual.toNumber()).toBe(0);
  });
});

describe('calcularCostoMensualEquipo', () => {
  it('golden — IVECO 170S28 interno 112 (PECOM) → $7.794.945,28', () => {
    const r = calcularCostoMensualEquipo({ ...PECOM_112, afectacion_pct: 1 });
    expect(r.costo_mensual.toDecimalPlaces(2).toNumber()).toBe(7794945.28);
  });

  it('golden — desglose: accesorios, amortización y mantenimiento', () => {
    const r = calcularCostoMensualEquipo({ ...PECOM_112, afectacion_pct: 1 });
    expect(r.accesorios_total.toNumber()).toBe(4498739);
    expect(r.amortizacion_mensual.toDecimalPlaces(2).toNumber()).toBe(3534333.15);
    expect(r.mantenimiento_mensual.toDecimalPlaces(2).toNumber()).toBe(4260612.13);
  });

  it('un accesorio impacta la base amortizable y no el mantenimiento', () => {
    const sinAccesorio = calcularCostoMensualEquipo({
      valor_compra: '1000000',
      valor_residual_pct: '0.35',
      anios_amortizacion: 5,
      items_tipo: [],
    });
    const conAccesorio = calcularCostoMensualEquipo({
      valor_compra: '1000000',
      valor_residual_pct: '0.35',
      anios_amortizacion: 5,
      items_tipo: [{ clase: 'ACCESORIO', cantidad: 2, precio_unitario: '100000' }],
    });
    // (1.000.000 − 35%) / 60 = 10.833,33 ; con 200.000 de accesorios: 850.000 / 60 = 14.166,67
    expect(sinAccesorio.amortizacion_mensual.toDecimalPlaces(2).toNumber()).toBe(10833.33);
    expect(conAccesorio.amortizacion_mensual.toDecimalPlaces(2).toNumber()).toBe(14166.67);
    expect(conAccesorio.mantenimiento_mensual.toNumber()).toBe(0);
  });

  it('sin ítems del tipo, amortiza igual con accesorios y mantenimiento en cero', () => {
    const r = calcularCostoMensualEquipo({
      valor_compra: '1000000',
      valor_residual_pct: '0.35',
      anios_amortizacion: 5,
      items_tipo: [],
    });
    expect(r.accesorios_total.toNumber()).toBe(0);
    expect(r.mantenimiento_mensual.toNumber()).toBe(0);
    expect(r.costo_mensual.toDecimalPlaces(2).toNumber()).toBe(10833.33);
  });

  it('la afectación escala linealmente el costo mensual', () => {
    const full = calcularCostoMensualEquipo({ ...PECOM_112, afectacion_pct: 1 }).costo_mensual;
    const half = calcularCostoMensualEquipo({ ...PECOM_112, afectacion_pct: '0.5' }).costo_mensual;
    expect(half.toDecimalPlaces(6).toNumber()).toBe(full.div(2).toDecimalPlaces(6).toNumber());
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/modules/costos/shared/utils/calcular-costo-equipo.test.ts`
Expected: FAIL — `Failed to resolve import "./calcular-costo-equipo"`.

- [ ] **Step 3: Escribir la implementación**

```ts
// src/modules/costos/shared/utils/calcular-costo-equipo.ts
import { Decimal } from './decimal';
import { calcularAmortizacionMensual } from './calcular-amortizacion';

type Num = Decimal | string | number;

export type ClaseItemCosto = 'ACCESORIO' | 'MANTENIMIENTO';

/**
 * Ítem de costo definido a nivel tipo de equipo.
 * `cantidad` significa "por unidad de equipo" en ACCESORIO y "por año" en MANTENIMIENTO.
 */
export type ItemCostoTipoCalc = {
  clase: ClaseItemCosto;
  cantidad: Num;
  precio_unitario: Num;
  is_active?: boolean | null;
};

/** Σ (cantidad × precio_unitario) de los ítems activos, separado por clase. */
export function sumarItemsTipo(items: ItemCostoTipoCalc[]): {
  accesorios: Decimal;
  mantenimiento_anual: Decimal;
} {
  let accesorios = new Decimal(0);
  let mantenimiento_anual = new Decimal(0);

  for (const item of items) {
    if (item.is_active === false) continue;
    const subtotal = new Decimal(item.cantidad).mul(new Decimal(item.precio_unitario));
    if (item.clase === 'ACCESORIO') {
      accesorios = accesorios.add(subtotal);
    } else {
      mantenimiento_anual = mantenimiento_anual.add(subtotal);
    }
  }

  return { accesorios, mantenimiento_anual };
}

export type CostoEquipoCalcInput = {
  valor_compra: Num;
  valor_residual_pct: Num;
  anios_amortizacion: number;
  /** Accesorios y mantenimiento heredados del tipo de equipo. */
  items_tipo: ItemCostoTipoCalc[];
  /** Afectación del equipo al servicio (1 = 100%). */
  afectacion_pct?: Num;
};

export type CostoEquipoCalcResult = {
  accesorios_total: Decimal;
  amortizacion_mensual: Decimal;
  mantenimiento_mensual: Decimal;
  /** (amortización + mantenimiento) × afectación */
  costo_mensual: Decimal;
};

/**
 * Costo mensual total de un equipo:
 *
 *   accesorios            = Σ (cantidad × precio_unitario)  [ACCESORIO activos]
 *   base                  = valor_compra − valor_compra × residual + accesorios
 *   amortización_mensual  = base / años / 12
 *   mantenimiento_mensual = Σ (cantidad × precio_unitario)  [MANTENIMIENTO activos] / 12
 *   costo_mensual         = (amortización + mantenimiento) × afectación
 *
 * Reproduce la hoja "Equipos" de la planilla del cliente (Transporte SP).
 */
export function calcularCostoMensualEquipo(input: CostoEquipoCalcInput): CostoEquipoCalcResult {
  const { accesorios, mantenimiento_anual } = sumarItemsTipo(input.items_tipo);

  const amortizacion_mensual = calcularAmortizacionMensual(
    input.valor_compra,
    input.valor_residual_pct,
    input.anios_amortizacion,
    accesorios
  );
  const mantenimiento_mensual = mantenimiento_anual.div(12);
  const afectacion = new Decimal(input.afectacion_pct ?? 1);
  const costo_mensual = amortizacion_mensual.add(mantenimiento_mensual).mul(afectacion);

  return {
    accesorios_total: accesorios,
    amortizacion_mensual,
    mantenimiento_mensual,
    costo_mensual,
  };
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/modules/costos/shared/utils/calcular-costo-equipo.test.ts`
Expected: PASS, 8 tests.

Si el golden da distinto de `7794945.28`, **no toques el número esperado**: el error está en la implementación o en la transcripción del fixture.

- [ ] **Step 5: Correr la suite completa**

Run: `npm test`
Expected: PASS. El motor viejo y su golden siguen existiendo y siguen pasando.

- [ ] **Step 6: Commit**

Menos de 5 archivos, pero más de 100 líneas → commiteá.

```bash
git add src/modules/costos/shared/utils/calcular-costo-equipo.ts src/modules/costos/shared/utils/calcular-costo-equipo.test.ts
git commit -m "feat(costos): motor de costo de equipo sobre items por tipo"
```

---

### Task 2: Esquema — enum, perfil por tipo y tabla de ítems

Migración puramente aditiva: no toca `item_mantenimiento` ni `costo_equipo.accesorios`.

**Files:**
- Create: `supabase/migrations/<timestamp>_costo_tipo_equipo.sql`
- Modify: `prisma/schema.prisma` (enum + 2 modelos + relaciones inversas en `company`, `type`, `products`)

**Interfaces:**
- Produces: modelos Prisma `costo_tipo_equipo` e `item_costo_tipo`, enum `clase_item_costo`, disponibles como `prisma.costo_tipo_equipo` y `prisma.item_costo_tipo`.

- [ ] **Step 1: Crear el archivo de migración**

Run: `npm run create-migration -- costo_tipo_equipo`
Esto crea `supabase/migrations/<timestamp>_costo_tipo_equipo.sql` vacío.

- [ ] **Step 2: Escribir el SQL**

```sql
-- Accesorios y mantenimiento definidos a nivel tipo de equipo, no por dominio.
-- costo_tipo_equipo: perfil de costo compartido por todas las unidades de un tipo
--   dentro de una empresa. La unicidad incluye company_id porque type.company_id es
--   nullable: hay tipos globales que comparten varias empresas y sus listas no deben mezclarse.
-- item_costo_tipo: accesorio o ítem de mantenimiento del tipo. Una sola tabla con
--   discriminador `clase` porque comparten estructura y CRUD; lo único que cambia es
--   cómo entran al cálculo (accesorio → base amortizable; mantenimiento → gasto anual / 12).
--   `cantidad` significa "por unidad de equipo" en ACCESORIO y "por año" en MANTENIMIENTO.
--   product_id es opcional: vincula el ítem a un producto de almacén para poder
--   refrescar precio_unitario desde products.cost_price.

CREATE TYPE "clase_item_costo" AS ENUM ('ACCESORIO', 'MANTENIMIENTO');

CREATE TABLE "costo_tipo_equipo" (
  "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "company_id" uuid        NOT NULL,
  "type_id"    uuid        NOT NULL,
  "is_active"  boolean     NOT NULL DEFAULT true,
  CONSTRAINT "costo_tipo_equipo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "costo_tipo_equipo_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "costo_tipo_equipo_type_id_fkey"
    FOREIGN KEY ("type_id") REFERENCES "type"("id") ON UPDATE CASCADE,
  CONSTRAINT "costo_tipo_equipo_company_type_key" UNIQUE ("company_id", "type_id")
);

CREATE TABLE "item_costo_tipo" (
  "id"                    uuid               NOT NULL DEFAULT gen_random_uuid(),
  "costo_tipo_equipo_id"  uuid               NOT NULL,
  "clase"                 "clase_item_costo" NOT NULL,
  "nombre"                text               NOT NULL,
  "product_id"            uuid,
  "cantidad"              numeric(12,3)      NOT NULL DEFAULT 1,
  "precio_unitario"       numeric(15,2)      NOT NULL,
  "precio_actualizado_at" timestamptz,
  "orden"                 integer            NOT NULL DEFAULT 0,
  "is_active"             boolean            NOT NULL DEFAULT true,
  CONSTRAINT "item_costo_tipo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "item_costo_tipo_costo_tipo_equipo_id_fkey"
    FOREIGN KEY ("costo_tipo_equipo_id") REFERENCES "costo_tipo_equipo"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "item_costo_tipo_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE CASCADE
);

CREATE INDEX "item_costo_tipo_perfil_clase_idx" ON "item_costo_tipo"("costo_tipo_equipo_id", "clase");
```

- [ ] **Step 3: Aplicar la migración localmente**

Run: `npx supabase migration up`
Expected: aplica sin error. Verificá con `npx supabase db diff` que no queden diferencias pendientes.

- [ ] **Step 4: Agregar los modelos al schema de Prisma**

En `prisma/schema.prisma`, justo después del modelo `item_mantenimiento`:

```prisma
enum clase_item_costo {
  ACCESORIO
  MANTENIMIENTO
}

/// Perfil de costo compartido por todos los equipos de un tipo, dentro de una empresa.
model costo_tipo_equipo {
  id         String   @id @default(uuid()) @db.Uuid
  created_at DateTime @default(now()) @db.Timestamptz(6)
  company_id String   @db.Uuid
  type_id    String   @db.Uuid
  is_active  Boolean  @default(true)

  company company           @relation(fields: [company_id], references: [id])
  tipo    type              @relation(fields: [type_id], references: [id])
  items   item_costo_tipo[]

  @@unique([company_id, type_id])
}

/// Accesorio o ítem de mantenimiento de un tipo de equipo.
/// `cantidad` es "por unidad de equipo" en ACCESORIO y "por año" en MANTENIMIENTO.
model item_costo_tipo {
  id                    String           @id @default(uuid()) @db.Uuid
  costo_tipo_equipo_id  String           @db.Uuid
  clase                 clase_item_costo
  nombre                String
  product_id            String?          @db.Uuid
  cantidad              Decimal          @default(1) @db.Decimal(12, 3)
  precio_unitario       Decimal          @db.Decimal(15, 2)
  precio_actualizado_at DateTime?        @db.Timestamptz(6)
  orden                 Int              @default(0)
  is_active             Boolean          @default(true)

  costo_tipo costo_tipo_equipo @relation(fields: [costo_tipo_equipo_id], references: [id], onDelete: Cascade)
  product    products?         @relation(fields: [product_id], references: [id])

  @@index([costo_tipo_equipo_id, clase])
}
```

Agregá además las relaciones inversas (Prisma no compila sin ellas):
- en `model company`: `costos_tipo_equipo costo_tipo_equipo[]`
- en `model type`: `costos_tipo_equipo costo_tipo_equipo[]`
- en `model products`: `items_costo_tipo item_costo_tipo[]`

- [ ] **Step 5: Regenerar el cliente y verificar tipos**

Run: `npx prisma generate && npm run check-types`
Expected: ambos en verde. `prisma.costo_tipo_equipo` ya existe en el cliente generado.

- [ ] **Step 6: Commit**

Más de 100 líneas → commiteá.

```bash
git add prisma/schema.prisma supabase/migrations/
git commit -m "feat(costos): esquema de accesorios y mantenimiento por tipo de equipo"
```

---

### Task 3: Tipos client-safe del feature

**Files:**
- Create: `src/modules/costos/shared/types/tipo-equipo.types.ts`
- Modify: `src/modules/costos/shared/types/index.ts` (agregar el re-export)

**Interfaces:**
- Consumes: `ClaseItemCosto` de `@/modules/costos/shared/utils/calcular-costo-equipo` (Task 1).
- Produces: `ItemCostoTipoClient`, `ItemCostoTipoInput`, `TipoEquipoResumen`, `CostoTipoEquipoDetalle`.

- [ ] **Step 1: Escribir el archivo de tipos**

```ts
// src/modules/costos/shared/types/tipo-equipo.types.ts
import type { ClaseItemCosto } from '@/modules/costos/shared/utils/calcular-costo-equipo';

export type { ClaseItemCosto };

/** Input para crear/actualizar un ítem de costo de un tipo de equipo. */
export type ItemCostoTipoInput = {
  clase: ClaseItemCosto;
  nombre: string;
  product_id?: string | null;
  cantidad: number;
  precio_unitario: number;
  orden?: number;
  is_active?: boolean;
};

/** Ítem tal como lo consume la UI (Decimal → number, con datos del producto resueltos). */
export type ItemCostoTipoClient = {
  id: string;
  clase: ClaseItemCosto;
  nombre: string;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  cantidad: number;
  precio_unitario: number;
  /** cantidad × precio_unitario, calculado en el servidor. */
  subtotal: number;
  precio_actualizado_at: Date | null;
  orden: number;
  is_active: boolean;
};

/** Fila de la tabla de tipos de equipo. */
export type TipoEquipoResumen = {
  type_id: string;
  nombre: string;
  perfil_id: string | null;
  equipos_count: number;
  accesorios_count: number;
  mantenimiento_count: number;
  total_accesorios: number;
  mantenimiento_anual: number;
};

/** Detalle de un tipo: perfil + sus dos listas de ítems. */
export type CostoTipoEquipoDetalle = {
  type_id: string;
  nombre: string;
  perfil_id: string | null;
  equipos_count: number;
  accesorios: ItemCostoTipoClient[];
  mantenimiento: ItemCostoTipoClient[];
  total_accesorios: number;
  mantenimiento_anual: number;
};
```

- [ ] **Step 2: Re-exportar desde el barrel**

En `src/modules/costos/shared/types/index.ts`, agregá junto a los demás re-exports:

```ts
export * from './tipo-equipo.types';
```

- [ ] **Step 3: Verificar tipos**

Run: `npm run check-types`
Expected: PASS.

- [ ] **Step 4: No commitear todavía**

2 archivos, menos de 100 líneas: por la regla del proyecto, este cambio se commitea junto con la Task 4. Dejalo en el working tree.

---

### Task 4: Server actions del feature tipos-equipo

**Files:**
- Create: `src/modules/costos/features/tipos-equipo/actions.server.ts`
- Create: `src/modules/costos/features/tipos-equipo/index.ts`
- Create: `src/modules/costos/shared/utils/refresco-precios.ts`
- Create: `src/modules/costos/shared/utils/refresco-precios.test.ts`

**Interfaces:**
- Consumes: `sumarItemsTipo` (Task 1); los tipos de la Task 3; `getRequiredActionContext` de `@/shared/lib/server-action-context`; `assertModuloHabilitado` de `@/modules/costos/shared/utils/access`; `toClientNumber` de `@/modules/costos/shared/utils/decimal`.
- Produces: `listTiposEquipoConCosto()`, `getCostoTipoEquipo(typeId)`, `ensureCostoTipoEquipo(typeId)`, `addItemCostoTipo(perfilId, input)`, `updateItemCostoTipo(id, input)`, `deleteItemCostoTipo(id)`, `bulkAddItemsCostoTipo(perfilId, items)`, `refrescarPreciosDesdeAlmacen(perfilId)`, y la función pura `resolverRefrescoPrecios(items, precios)`.

- [ ] **Step 1: Escribir el test de la función pura de refresco**

La lógica de "qué ítem cambia y en cuánto" se extrae para poder testearla sin base de datos.

```ts
// src/modules/costos/shared/utils/refresco-precios.test.ts
import { describe, it, expect } from 'vitest';
import { resolverRefrescoPrecios } from './refresco-precios';

describe('resolverRefrescoPrecios', () => {
  it('actualiza sólo los ítems vinculados cuyo precio cambió', () => {
    const r = resolverRefrescoPrecios(
      [
        { id: 'a', product_id: 'p1', cantidad: '2', precio_unitario: '100' },
        { id: 'b', product_id: 'p2', cantidad: '1', precio_unitario: '500' },
        { id: 'c', product_id: null, cantidad: '1', precio_unitario: '999' },
      ],
      new Map([
        ['p1', '150'], // cambió
        ['p2', '500'], // igual
      ])
    );
    expect(r.actualizados.map((i) => i.id)).toEqual(['a']);
    expect(r.actualizados[0].precio_unitario.toNumber()).toBe(150);
    // delta anual = (150 − 100) × cantidad 2 = 100
    expect(r.delta_total.toNumber()).toBe(100);
  });

  it('ignora los ítems cuyo producto ya no existe', () => {
    const r = resolverRefrescoPrecios(
      [{ id: 'a', product_id: 'borrado', cantidad: '1', precio_unitario: '100' }],
      new Map()
    );
    expect(r.actualizados).toEqual([]);
    expect(r.delta_total.toNumber()).toBe(0);
  });

  it('sin ítems vinculados no hay nada que actualizar', () => {
    const r = resolverRefrescoPrecios(
      [{ id: 'a', product_id: null, cantidad: '1', precio_unitario: '100' }],
      new Map([['p1', '150']])
    );
    expect(r.actualizados).toEqual([]);
    expect(r.delta_total.toNumber()).toBe(0);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/modules/costos/shared/utils/refresco-precios.test.ts`
Expected: FAIL — `Failed to resolve import "./refresco-precios"`.

- [ ] **Step 3: Implementar la función pura**

```ts
// src/modules/costos/shared/utils/refresco-precios.ts
import { Decimal } from './decimal';

type Num = Decimal | string | number;

export type ItemRefrescable = {
  id: string;
  product_id: string | null;
  cantidad: Num;
  precio_unitario: Num;
};

export type RefrescoResultado = {
  actualizados: { id: string; precio_unitario: Decimal }[];
  /** Suma de (precio_nuevo − precio_viejo) × cantidad sobre los ítems que cambian. */
  delta_total: Decimal;
};

/**
 * Decide qué ítems hay que reprecificar contra el catálogo de productos.
 * `precios` mapea product_id → cost_price actual. Un producto ausente del mapa
 * (borrado o inactivo) deja el ítem intacto.
 */
export function resolverRefrescoPrecios(
  items: ItemRefrescable[],
  precios: Map<string, Num>
): RefrescoResultado {
  const actualizados: { id: string; precio_unitario: Decimal }[] = [];
  let delta_total = new Decimal(0);

  for (const item of items) {
    if (!item.product_id) continue;
    const precioNuevoRaw = precios.get(item.product_id);
    if (precioNuevoRaw == null) continue;

    const precioNuevo = new Decimal(precioNuevoRaw);
    const precioViejo = new Decimal(item.precio_unitario);
    if (precioNuevo.eq(precioViejo)) continue;

    actualizados.push({ id: item.id, precio_unitario: precioNuevo });
    delta_total = delta_total.add(precioNuevo.sub(precioViejo).mul(new Decimal(item.cantidad)));
  }

  return { actualizados, delta_total };
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/modules/costos/shared/utils/refresco-precios.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Escribir las server actions**

```ts
// src/modules/costos/features/tipos-equipo/actions.server.ts
'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { Decimal, toClientNumber } from '@/modules/costos/shared/utils/decimal';
import { sumarItemsTipo } from '@/modules/costos/shared/utils/calcular-costo-equipo';
import { resolverRefrescoPrecios } from '@/modules/costos/shared/utils/refresco-precios';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type {
  CostoTipoEquipoDetalle,
  ItemCostoTipoClient,
  ItemCostoTipoInput,
  TipoEquipoResumen,
} from '@/modules/costos/shared/types/tipo-equipo.types';

const TIPOS_PATH = '/dashboard/costos/tipos-equipo';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const schemaItem = z.object({
  clase: z.enum(['ACCESORIO', 'MANTENIMIENTO']),
  nombre: z.string().min(1).max(200),
  product_id: z.string().uuid().nullable().optional(),
  cantidad: z.number().positive(),
  precio_unitario: z.number().nonnegative(),
  orden: z.number().int().nonnegative().default(0),
  is_active: z.boolean().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ItemRow = {
  id: string;
  clase: 'ACCESORIO' | 'MANTENIMIENTO';
  nombre: string;
  product_id: string | null;
  cantidad: { toString(): string };
  precio_unitario: { toString(): string };
  precio_actualizado_at: Date | null;
  orden: number;
  is_active: boolean;
  product?: { code: string; name: string } | null;
};

function toItemClient(i: ItemRow): ItemCostoTipoClient {
  const cantidad = toClientNumber(i.cantidad.toString());
  const precio_unitario = toClientNumber(i.precio_unitario.toString());
  // El subtotal se calcula en Decimal, no con aritmética de floats.
  const subtotal = new Decimal(i.cantidad.toString())
    .mul(new Decimal(i.precio_unitario.toString()))
    .toDecimalPlaces(2)
    .toNumber();
  return {
    id: i.id,
    clase: i.clase,
    nombre: i.nombre,
    product_id: i.product_id,
    product_code: i.product?.code ?? null,
    product_name: i.product?.name ?? null,
    cantidad,
    precio_unitario,
    subtotal,
    precio_actualizado_at: i.precio_actualizado_at,
    orden: i.orden,
    is_active: i.is_active,
  };
}

async function assertPerfilPertenece(perfilId: string, companyId: string) {
  const perfil = await prisma.costo_tipo_equipo.findFirst({
    where: { id: perfilId, company_id: companyId },
    select: { id: true },
  });
  if (!perfil) throw new Error('Perfil de costo no encontrado o sin acceso');
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listTiposEquipoConCosto(): Promise<TipoEquipoResumen[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  // type.company_id es nullable: hay tipos globales que usan varias empresas. El
  // listado incluye los tipos propios MÁS los globales que los vehículos de esta
  // empresa efectivamente usan; si no, esos equipos no tendrían dónde cargar sus ítems.
  const conteos = await prisma.vehicles.groupBy({
    by: ['type'],
    where: { company_id: companyId },
    _count: { _all: true },
  });

  const [tipos, perfiles] = await Promise.all([
    prisma.type.findMany({
      where: {
        is_active: true,
        OR: [{ company_id: companyId }, { id: { in: conteos.map((c) => c.type) } }],
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.costo_tipo_equipo.findMany({
      where: { company_id: companyId },
      include: { items: { where: { is_active: true } } },
    }),
  ]);

  const perfilPorTipo = new Map(perfiles.map((p) => [p.type_id, p]));
  const equiposPorTipo = new Map(conteos.map((c) => [c.type, c._count._all]));

  return tipos.map((t) => {
    const perfil = perfilPorTipo.get(t.id);
    const items = perfil?.items ?? [];
    const { accesorios, mantenimiento_anual } = sumarItemsTipo(
      items.map((i) => ({
        clase: i.clase,
        cantidad: i.cantidad.toString(),
        precio_unitario: i.precio_unitario.toString(),
        is_active: i.is_active,
      }))
    );

    return {
      type_id: t.id,
      nombre: t.name,
      perfil_id: perfil?.id ?? null,
      equipos_count: equiposPorTipo.get(t.id) ?? 0,
      accesorios_count: items.filter((i) => i.clase === 'ACCESORIO').length,
      mantenimiento_count: items.filter((i) => i.clase === 'MANTENIMIENTO').length,
      total_accesorios: accesorios.toDecimalPlaces(2).toNumber(),
      mantenimiento_anual: mantenimiento_anual.toDecimalPlaces(2).toNumber(),
    };
  });
}

export async function getCostoTipoEquipo(typeId: string): Promise<CostoTipoEquipoDetalle | null> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  // Propio de la empresa o global (company_id null). Nunca uno de otra empresa.
  const tipo = await prisma.type.findFirst({
    where: { id: typeId, OR: [{ company_id: companyId }, { company_id: null }] },
    select: { id: true, name: true },
  });
  if (!tipo) return null;

  const [perfil, equipos_count] = await Promise.all([
    prisma.costo_tipo_equipo.findUnique({
      where: { company_id_type_id: { company_id: companyId, type_id: typeId } },
      include: {
        items: {
          orderBy: [{ clase: 'asc' }, { orden: 'asc' }],
          include: { product: { select: { code: true, name: true } } },
        },
      },
    }),
    prisma.vehicles.count({ where: { company_id: companyId, type: typeId } }),
  ]);

  // La suma va sobre los valores crudos de Prisma (strings), no sobre los numbers ya
  // redondeados de toItemClient: si no, el total arrastra el error de redondeo por ítem.
  const { accesorios, mantenimiento_anual } = sumarItemsTipo(
    (perfil?.items ?? []).map((i) => ({
      clase: i.clase,
      cantidad: i.cantidad.toString(),
      precio_unitario: i.precio_unitario.toString(),
      is_active: i.is_active,
    }))
  );
  const items = (perfil?.items ?? []).map(toItemClient);

  return {
    type_id: tipo.id,
    nombre: tipo.name,
    perfil_id: perfil?.id ?? null,
    equipos_count,
    accesorios: items.filter((i) => i.clase === 'ACCESORIO'),
    mantenimiento: items.filter((i) => i.clase === 'MANTENIMIENTO'),
    total_accesorios: accesorios.toDecimalPlaces(2).toNumber(),
    mantenimiento_anual: mantenimiento_anual.toDecimalPlaces(2).toNumber(),
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Crea el perfil del tipo si todavía no existe. Devuelve su id. */
export async function ensureCostoTipoEquipo(typeId: string): Promise<string> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const tipo = await prisma.type.findFirst({
    where: { id: typeId, OR: [{ company_id: companyId }, { company_id: null }] },
    select: { id: true },
  });
  if (!tipo) throw new Error('Tipo de equipo no encontrado o sin acceso');

  const perfil = await prisma.costo_tipo_equipo.upsert({
    where: { company_id_type_id: { company_id: companyId, type_id: typeId } },
    create: { company_id: companyId, type_id: typeId },
    update: {},
  });
  return perfil.id;
}

export async function addItemCostoTipo(perfilId: string, input: ItemCostoTipoInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertPerfilPertenece(perfilId, companyId);
  const parsed = schemaItem.parse(input);

  const item = await prisma.item_costo_tipo.create({
    data: {
      costo_tipo_equipo_id: perfilId,
      ...parsed,
      product_id: parsed.product_id ?? null,
      precio_actualizado_at: parsed.product_id ? new Date() : null,
    },
  });
  revalidatePath(TIPOS_PATH);
  return item.id;
}

export async function updateItemCostoTipo(id: string, input: Partial<ItemCostoTipoInput>) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existing = await prisma.item_costo_tipo.findUnique({
    where: { id },
    select: { costo_tipo_equipo_id: true },
  });
  if (!existing) throw new Error('Ítem no encontrado');
  await assertPerfilPertenece(existing.costo_tipo_equipo_id, companyId);

  const parsed = schemaItem.partial().parse(input);
  await prisma.item_costo_tipo.update({ where: { id }, data: parsed });
  revalidatePath(TIPOS_PATH);
}

export async function deleteItemCostoTipo(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existing = await prisma.item_costo_tipo.findUnique({
    where: { id },
    select: { costo_tipo_equipo_id: true },
  });
  if (!existing) throw new Error('Ítem no encontrado');
  await assertPerfilPertenece(existing.costo_tipo_equipo_id, companyId);

  await prisma.item_costo_tipo.delete({ where: { id } });
  revalidatePath(TIPOS_PATH);
}

/** Carga masiva de ítems (dialog de importación). Retorna la cantidad insertada. */
export async function bulkAddItemsCostoTipo(
  perfilId: string,
  items: ItemCostoTipoInput[]
): Promise<number> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertPerfilPertenece(perfilId, companyId);

  const parsed = z.array(schemaItem).min(1).parse(items);
  const result = await prisma.item_costo_tipo.createMany({
    data: parsed.map((i, idx) => ({
      costo_tipo_equipo_id: perfilId,
      clase: i.clase,
      nombre: i.nombre,
      product_id: i.product_id ?? null,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      orden: i.orden ?? idx,
      is_active: i.is_active ?? true,
    })),
  });
  revalidatePath(TIPOS_PATH);
  return result.count;
}

/**
 * Refresca el precio de los ítems vinculados a almacén desde products.cost_price.
 * No toca nombre ni cantidad. Devuelve cuántos cambiaron y el delta anual total.
 */
export async function refrescarPreciosDesdeAlmacen(
  perfilId: string
): Promise<{ actualizados: number; delta_total: number }> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertPerfilPertenece(perfilId, companyId);

  const items = await prisma.item_costo_tipo.findMany({
    where: { costo_tipo_equipo_id: perfilId, product_id: { not: null } },
    select: { id: true, product_id: true, cantidad: true, precio_unitario: true },
  });
  if (items.length === 0) return { actualizados: 0, delta_total: 0 };

  const productos = await prisma.products.findMany({
    where: { id: { in: items.map((i) => i.product_id!) }, company_id: companyId },
    select: { id: true, cost_price: true },
  });
  const precios = new Map(productos.map((p) => [p.id, p.cost_price.toString()]));

  const { actualizados, delta_total } = resolverRefrescoPrecios(
    items.map((i) => ({
      id: i.id,
      product_id: i.product_id,
      cantidad: i.cantidad.toString(),
      precio_unitario: i.precio_unitario.toString(),
    })),
    precios
  );

  if (actualizados.length > 0) {
    const ahora = new Date();
    await prisma.$transaction(
      actualizados.map((a) =>
        prisma.item_costo_tipo.update({
          where: { id: a.id },
          data: { precio_unitario: a.precio_unitario.toFixed(2), precio_actualizado_at: ahora },
        })
      )
    );
    revalidatePath(TIPOS_PATH);
  }

  return {
    actualizados: actualizados.length,
    delta_total: delta_total.toDecimalPlaces(2).toNumber(),
  };
}
```

- [ ] **Step 6: Escribir el barrel del feature**

```ts
// src/modules/costos/features/tipos-equipo/index.ts
export * from './actions.server';
```

- [ ] **Step 7: Verificar tipos y tests**

Run: `npm run check-types && npm test`
Expected: ambos PASS.

Si `prisma.costo_tipo_equipo.findUnique({ where: { company_id_type_id: ... } })` no compila, el nombre del índice compuesto que generó Prisma es otro: mirá el tipo `costo_tipo_equipoWhereUniqueInput` en `src/generated/prisma/models/` y usá el que esté ahí.

- [ ] **Step 8: Commit**

Junto con los tipos de la Task 3. Más de 5 archivos → commiteá.

```bash
git add src/modules/costos/shared/types/ src/modules/costos/features/tipos-equipo/ src/modules/costos/shared/utils/refresco-precios.ts src/modules/costos/shared/utils/refresco-precios.test.ts
git commit -m "feat(costos): actions de accesorios y mantenimiento por tipo de equipo"
```

---

### Task 5: Componente de tabla de ítems

**Files:**
- Create: `src/modules/costos/features/tipos-equipo/components/TablaItemsCostoTipo.tsx`

**Interfaces:**
- Consumes: `addItemCostoTipo`, `updateItemCostoTipo`, `deleteItemCostoTipo`, `ensureCostoTipoEquipo` (Task 4); `ItemCostoTipoClient` (Task 3); `SearchableSelect` de `@/shared/components/ui/searchable-select`; `formatCurrencyARS` de `@/shared/lib/utils/formatters`.
- Produces: `<TablaItemsCostoTipo clase typeId perfilId items productos />`.

- [ ] **Step 1: Escribir el componente**

Toma como base `src/modules/costos/features/equipos/components/TablaItemsMantenimiento.tsx` (mismo patrón de Dialog + Table + `router.refresh()`), con tres diferencias: los labels dependen de `clase`, el form tiene selector de producto y cantidad, y el perfil se crea on-demand con `ensureCostoTipoEquipo` cuando todavía no existe.

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import {
  addItemCostoTipo, updateItemCostoTipo, deleteItemCostoTipo, ensureCostoTipoEquipo,
} from '../actions.server';
import type { ClaseItemCosto, ItemCostoTipoClient } from '@/modules/costos/shared/types/tipo-equipo.types';
import { formatCurrencyARS, formatDateUTC } from '@/shared/lib/utils/formatters';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export type ProductoOption = { id: string; code: string; name: string; cost_price: number };

interface Props {
  clase: ClaseItemCosto;
  typeId: string;
  perfilId: string | null;
  items: ItemCostoTipoClient[];
  productos: ProductoOption[];
}

const COPY = {
  ACCESORIO: {
    titulo: 'Accesorios',
    cantidad: 'Cantidad',
    total: 'Total accesorios (a la base amortizable)',
    placeholder: 'Butacas reclinables',
    vacio: 'No hay accesorios cargados para este tipo.',
  },
  MANTENIMIENTO: {
    titulo: 'Mantenimiento',
    cantidad: 'Cantidad anual',
    total: 'Mantenimiento anual',
    placeholder: 'Neumáticos 315/80 R22.5',
    vacio: 'No hay ítems de mantenimiento cargados para este tipo.',
  },
} as const;

const EMPTY = { nombre: '', product_id: '', cantidad: '1', precio_unitario: '' };

export function TablaItemsCostoTipo({ clase, typeId, perfilId, items, productos }: Props) {
  const router = useRouter();
  const copy = COPY[clase];
  const [openNuevo, setOpenNuevo] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const total = items.reduce((acc, i) => acc + i.subtotal, 0);
  const opciones = productos.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }));

  function reset() { setForm(EMPTY); }

  function elegirProducto(productId: string) {
    const p = productos.find((x) => x.id === productId);
    setForm((f) => ({
      ...f,
      product_id: productId,
      nombre: f.nombre || (p?.name ?? ''),
      precio_unitario: p ? String(p.cost_price) : f.precio_unitario,
    }));
  }

  async function handleNuevo(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const id = perfilId ?? (await ensureCostoTipoEquipo(typeId));
      await addItemCostoTipo(id, {
        clase,
        nombre: form.nombre,
        product_id: form.product_id || null,
        cantidad: Number(form.cantidad),
        precio_unitario: Number(form.precio_unitario),
        orden: items.length,
      });
      setOpenNuevo(false);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  function abrirEdicion(item: ItemCostoTipoClient) {
    setForm({
      nombre: item.nombre,
      product_id: item.product_id ?? '',
      cantidad: String(item.cantidad),
      precio_unitario: String(item.precio_unitario),
    });
    setEditando(item.id);
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setLoading(true);
    try {
      await updateItemCostoTipo(editando, {
        nombre: form.nombre,
        product_id: form.product_id || null,
        cantidad: Number(form.cantidad),
        precio_unitario: Number(form.precio_unitario),
      });
      setEditando(null);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar este ítem?')) return;
    try {
      await deleteItemCostoTipo(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const FormBody = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Producto de almacén (opcional)</Label>
        <SearchableSelect
          options={opciones}
          value={form.product_id}
          onValueChange={elegirProducto}
          placeholder="Sin vincular"
          searchPlaceholder="Buscar producto..."
        />
        <p className="text-xs text-muted-foreground">
          Vincularlo permite refrescar el precio desde el almacén.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="item_nombre">Descripción</Label>
        <Input
          id="item_nombre"
          placeholder={copy.placeholder}
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="item_cantidad">{copy.cantidad}</Label>
          <Input
            id="item_cantidad" type="number" step="0.001" min="0.001"
            value={form.cantidad}
            onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="item_precio">Precio unitario</Label>
          <Input
            id="item_precio" type="number" step="0.01" min="0"
            value={form.precio_unitario}
            onChange={(e) => setForm((f) => ({ ...f, precio_unitario: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost"
          onClick={() => { setOpenNuevo(false); setEditando(null); reset(); }}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{copy.titulo} ({items.length})</CardTitle>
        <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nuevo ítem</DialogTitle></DialogHeader>
            {FormBody(handleNuevo, 'Agregar')}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Dialog open={!!editando} onOpenChange={(v) => { if (!v) { setEditando(null); reset(); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Editar ítem</DialogTitle></DialogHeader>
            {FormBody(handleEditar, 'Guardar cambios')}
          </DialogContent>
        </Dialog>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{copy.vacio}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right w-28">{copy.cantidad}</TableHead>
                <TableHead className="text-right w-36">Precio unitario</TableHead>
                <TableHead className="text-right w-36">Subtotal</TableHead>
                <TableHead className="w-32">Últ. refresco</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>
                    {item.product_code
                      ? <Badge variant="secondary">{item.product_code}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono">{item.cantidad}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrencyARS(item.precio_unitario)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrencyARS(item.subtotal)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.precio_actualizado_at ? formatDateUTC(item.precio_actualizado_at) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirEdicion(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => handleEliminar(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-medium" colSpan={4}>{copy.total}</TableCell>
                <TableCell className="text-right font-mono font-medium">{formatCurrencyARS(total)}</TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verificar tipos y lint**

Run: `npm run check-types && npm run lint`
Expected: ambos PASS.

- [ ] **Step 3: No commitear todavía**

Un solo archivo: se commitea junto con la Task 6.

---

### Task 6: Páginas de tipos de equipo

**Files:**
- Create: `src/app/dashboard/costos/tipos-equipo/page.tsx`
- Create: `src/app/dashboard/costos/tipos-equipo/[typeId]/page.tsx`
- Create: `src/modules/costos/features/tipos-equipo/components/TablaTiposEquipo.tsx`
- Create: `src/modules/costos/features/tipos-equipo/components/BotonRefrescarPrecios.tsx`
- Modify: `src/modules/costos/components/CostosDashboard.tsx` (card nueva)

**Interfaces:**
- Consumes: `listTiposEquipoConCosto`, `getCostoTipoEquipo`, `refrescarPreciosDesdeAlmacen` (Task 4); `TablaItemsCostoTipo` (Task 5); `getProductsByCompany` de `@/modules/products/features/list/actions.server` — **importado en la page, no en el módulo**.

- [ ] **Step 1: Escribir la tabla de tipos**

```tsx
// src/modules/costos/features/tipos-equipo/components/TablaTiposEquipo.tsx
import Link from 'next/link';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import type { TipoEquipoResumen } from '@/modules/costos/shared/types/tipo-equipo.types';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';

export function TablaTiposEquipo({ tipos }: { tipos: TipoEquipoResumen[] }) {
  if (tipos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay tipos de equipo cargados en la empresa.
      </p>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo de equipo</TableHead>
              <TableHead className="text-right w-24">Equipos</TableHead>
              <TableHead className="text-right w-28">Accesorios</TableHead>
              <TableHead className="text-right w-32">Ítems mant.</TableHead>
              <TableHead className="text-right w-44">Total accesorios</TableHead>
              <TableHead className="text-right w-44">Mantenimiento anual</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipos.map((t) => (
              <TableRow key={t.type_id}>
                <TableCell className="font-medium">{t.nombre}</TableCell>
                <TableCell className="text-right font-mono">{t.equipos_count}</TableCell>
                <TableCell className="text-right font-mono">{t.accesorios_count}</TableCell>
                <TableCell className="text-right font-mono">{t.mantenimiento_count}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrencyARS(t.total_accesorios)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrencyARS(t.mantenimiento_anual)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/costos/tipos-equipo/${t.type_id}`}>Editar</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Escribir el botón de refresco de precios**

```tsx
// src/modules/costos/features/tipos-equipo/components/BotonRefrescarPrecios.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { refrescarPreciosDesdeAlmacen } from '../actions.server';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  perfilId: string | null;
  /** Cantidad de ítems con producto vinculado: si es 0, no hay nada que refrescar. */
  vinculados: number;
}

export function BotonRefrescarPrecios({ perfilId, vinculados }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!perfilId) return;
    setLoading(true);
    try {
      const { actualizados, delta_total } = await refrescarPreciosDesdeAlmacen(perfilId);
      if (actualizados === 0) {
        toast.info('Los precios ya estaban actualizados');
      } else {
        const signo = delta_total > 0 ? '+' : '';
        toast.success(
          `${actualizados} ${actualizados === 1 ? 'precio actualizado' : 'precios actualizados'} · ${signo}${formatCurrencyARS(delta_total)} anual`
        );
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al refrescar precios');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5"
      disabled={loading || !perfilId || vinculados === 0}
      onClick={handleClick}
      title={vinculados === 0 ? 'No hay ítems vinculados a almacén' : undefined}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Actualizando...' : 'Actualizar precios desde almacén'}
    </Button>
  );
}
```

- [ ] **Step 3: Escribir la page del listado**

```tsx
// src/app/dashboard/costos/tipos-equipo/page.tsx
import { Suspense } from 'react';
import { listTiposEquipoConCosto } from '@/modules/costos/features/tipos-equipo/actions.server';
import { TablaTiposEquipo } from '@/modules/costos/features/tipos-equipo/components/TablaTiposEquipo';

async function TiposContent() {
  const tipos = await listTiposEquipoConCosto();
  return <TablaTiposEquipo tipos={tipos} />;
}

export default function TiposEquipoPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tipos de equipo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Accesorios y mantenimiento compartidos por todas las unidades de cada tipo.
        </p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando tipos...</div>}>
        <TiposContent />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 4: Escribir la page del detalle**

`getProductsByCompany` se importa acá, en la ruta, y baja por props: así el módulo costos no importa del módulo products.

```tsx
// src/app/dashboard/costos/tipos-equipo/[typeId]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCostoTipoEquipo } from '@/modules/costos/features/tipos-equipo/actions.server';
import { TablaItemsCostoTipo } from '@/modules/costos/features/tipos-equipo/components/TablaItemsCostoTipo';
import { BotonRefrescarPrecios } from '@/modules/costos/features/tipos-equipo/components/BotonRefrescarPrecios';
import { getProductsByCompany } from '@/modules/products/features/list/actions.server';
import BackButton from '@/shared/components/common/BackButton';

interface Props {
  params: Promise<{ typeId: string }>;
}

async function DetalleContent({ typeId }: { typeId: string }) {
  const [detalle, productosRaw] = await Promise.all([
    getCostoTipoEquipo(typeId),
    getProductsByCompany(),
  ]);
  if (!detalle) return notFound();

  const productos = productosRaw.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    cost_price: Number(p.cost_price),
  }));

  const todos = [...detalle.accesorios, ...detalle.mantenimiento];
  const vinculados = todos.filter((i) => i.product_id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{detalle.nombre}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {detalle.equipos_count} {detalle.equipos_count === 1 ? 'equipo' : 'equipos'} de este tipo ·
            estos valores aplican a todos ellos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BotonRefrescarPrecios perfilId={detalle.perfil_id} vinculados={vinculados} />
          <BackButton />
        </div>
      </div>

      <TablaItemsCostoTipo
        clase="ACCESORIO"
        typeId={detalle.type_id}
        perfilId={detalle.perfil_id}
        items={detalle.accesorios}
        productos={productos}
      />

      <TablaItemsCostoTipo
        clase="MANTENIMIENTO"
        typeId={detalle.type_id}
        perfilId={detalle.perfil_id}
        items={detalle.mantenimiento}
        productos={productos}
      />
    </div>
  );
}

export default async function TipoEquipoDetallePage({ params }: Props) {
  const { typeId } = await params;
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando tipo...</div>}>
        <DetalleContent typeId={typeId} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 5: Agregar la card al dashboard de costos**

En `src/modules/costos/components/CostosDashboard.tsx`:

1. Agregá `Layers` al import de `lucide-react`.
2. En `getCostosCounts`, sumá al `Promise.all` y al objeto devuelto:

```ts
    prisma.costo_tipo_equipo.count({ where: { company_id: companyId } }),
```

(desestructurala como `tiposConCosto` y agregala al return; agregá también `tiposConCosto: 0` al objeto por defecto de `CostosDashboard`).

3. En `cards`, entre "CCTs configurados" y "Equipos con costo":

```ts
    { title: 'Tipos de equipo',    value: counts.tiposConCosto,   icon: Layers,      href: '/dashboard/costos/tipos-equipo' },
```

- [ ] **Step 6: Verificar**

Run: `npm run check-types && npm run lint && npm test`
Expected: los tres PASS.

- [ ] **Step 7: Probar a mano**

Run: `npm run dev`, entrá a `/dashboard/costos/tipos-equipo` con una empresa que tenga el módulo costos contratado.
Verificá: se listan los tipos; entrás a uno; agregás un accesorio sin producto; agregás un ítem de mantenimiento vinculado a un producto (el precio se precarga solo); el botón de refresco queda habilitado recién cuando hay un ítem vinculado.

- [ ] **Step 8: Commit**

Más de 5 archivos → commiteá (incluye la Task 5).

```bash
git add src/app/dashboard/costos/tipos-equipo/ src/modules/costos/features/tipos-equipo/components/ src/modules/costos/components/CostosDashboard.tsx
git commit -m "feat(costos): pantalla de accesorios y mantenimiento por tipo de equipo"
```

---

### Task 7: Migración de los datos existentes

Puebla las tablas nuevas desde las viejas. Todavía no borra nada: el sistema queda con los datos duplicados hasta la Task 9.

**Files:**
- Create: `supabase/migrations/<timestamp>_migrar_items_mantenimiento_a_tipo.sql`

- [ ] **Step 1: Crear el archivo de migración**

Run: `npm run create-migration -- migrar_items_mantenimiento_a_tipo`

- [ ] **Step 2: Escribir el SQL**

El equipo donante de cada par `(company_id, type)` es el que más ítems activos tenga; desempata el `costo_equipo` más antiguo. Se copia con `cantidad = 1` y `precio_unitario = precio_anual`, de modo que el valor anual queda idéntico y **ningún costo se mueve**.

```sql
-- Migra los ítems de mantenimiento y el accesorio escalar desde costo_equipo
-- (por dominio) hacia costo_tipo_equipo / item_costo_tipo (por tipo de equipo).
--
-- Donante de cada (company_id, type): el equipo con más ítems activos; desempata
-- el costo_equipo más antiguo. Los ítems de los equipos no donantes se descartan
-- deliberadamente (decisión del spec 2026-08-30).
--
-- cantidad = 1 y precio_unitario = precio_anual ⇒ el valor anual no cambia.

-- 1) Un perfil por cada par (empresa, tipo) que tenga al menos un equipo con costo.
--    El company_id sale de costo_equipo, no de vehicles (donde es nullable).
INSERT INTO "costo_tipo_equipo" ("company_id", "type_id")
SELECT DISTINCT ce."company_id", v."type"
FROM "costo_equipo" ce
JOIN "vehicles" v ON v."id" = ce."vehicle_id"
ON CONFLICT ("company_id", "type_id") DO NOTHING;

-- 2) Elegir el equipo donante de cada par.
CREATE TEMP TABLE "donantes" AS
SELECT DISTINCT ON (ce."company_id", v."type")
       ce."company_id",
       v."type"        AS type_id,
       ce."id"         AS costo_equipo_id,
       ce."accesorios" AS accesorios
FROM "costo_equipo" ce
JOIN "vehicles" v ON v."id" = ce."vehicle_id"
LEFT JOIN "item_mantenimiento" im
       ON im."costo_equipo_id" = ce."id" AND im."is_active" = true
GROUP BY ce."company_id", v."type", ce."id", ce."accesorios", ce."created_at"
ORDER BY ce."company_id", v."type", COUNT(im."id") DESC, ce."created_at" ASC;

-- 3) Copiar los ítems de mantenimiento del donante.
INSERT INTO "item_costo_tipo"
  ("costo_tipo_equipo_id", "clase", "nombre", "cantidad", "precio_unitario", "orden", "is_active")
SELECT ctе."id", 'MANTENIMIENTO', im."nombre", 1, im."precio_anual", im."orden", im."is_active"
FROM "donantes" d
JOIN "costo_tipo_equipo" ctе
  ON ctе."company_id" = d."company_id" AND ctе."type_id" = d."type_id"
JOIN "item_mantenimiento" im ON im."costo_equipo_id" = d."costo_equipo_id";

-- 4) El accesorio escalar del donante, si tenía.
INSERT INTO "item_costo_tipo"
  ("costo_tipo_equipo_id", "clase", "nombre", "cantidad", "precio_unitario", "orden")
SELECT ctе."id", 'ACCESORIO', 'Accesorios (migrado)', 1, d."accesorios", 0
FROM "donantes" d
JOIN "costo_tipo_equipo" ctе
  ON ctе."company_id" = d."company_id" AND ctе."type_id" = d."type_id"
WHERE d."accesorios" > 0;

-- 5) Informar cuántos ítems se descartan, para revisión posterior.
DO $$
DECLARE descartados integer;
BEGIN
  SELECT COUNT(*) INTO descartados
  FROM "item_mantenimiento" im
  WHERE im."costo_equipo_id" NOT IN (SELECT "costo_equipo_id" FROM "donantes");
  RAISE NOTICE 'Ítems de mantenimiento descartados (equipos no donantes): %', descartados;
END $$;

DROP TABLE "donantes";
```

**Cuidado:** al escribir el SQL, verificá que todos los alias sean ASCII (`cte`, no `ctе` con una `е` cirílica). Copiar y pegar de un documento puede introducir homoglifos que Postgres acepta como identificadores distintos y hacen fallar el JOIN de forma confusa.

- [ ] **Step 3: Aplicar y verificar los datos**

Run: `npx supabase migration up`

Después, en `npx prisma studio` o por SQL, verificá sobre una empresa con datos reales:

```sql
SELECT t."name",
       COUNT(*) FILTER (WHERE i."clase" = 'ACCESORIO')     AS accesorios,
       COUNT(*) FILTER (WHERE i."clase" = 'MANTENIMIENTO') AS mantenimiento,
       SUM(i."cantidad" * i."precio_unitario")
         FILTER (WHERE i."clase" = 'MANTENIMIENTO')        AS mant_anual
FROM "costo_tipo_equipo" c
JOIN "type" t ON t."id" = c."type_id"
LEFT JOIN "item_costo_tipo" i ON i."costo_tipo_equipo_id" = c."id"
GROUP BY t."name";
```

Expected: el `mant_anual` de cada tipo coincide con la suma de `precio_anual` de los ítems del equipo donante de ese tipo.

- [ ] **Step 4: Commit**

Un archivo pero más de 100 líneas → commiteá.

```bash
git add supabase/migrations/
git commit -m "feat(costos): migra items de mantenimiento y accesorios al tipo de equipo"
```

---

### Task 8: Lecturas del costo de equipo sobre el motor nuevo

**Files:**
- Modify: `src/modules/costos/features/equipos/actions.server.ts` (las 3 queries + `schemaCostoEquipo`; se eliminan las 4 actions de `item_mantenimiento`)
- Modify: `src/modules/costos/shared/utils/calcular-equipos-servicio.ts`
- Modify: `src/modules/costos/shared/utils/calcular-equipos-servicio.test.ts`
- Modify: `src/modules/costos/shared/types/equipo.types.ts`
- Modify: `src/modules/costos/features/equipos/index.ts`

**Interfaces:**
- Consumes: `calcularCostoMensualEquipo` e `ItemCostoTipoCalc` de `@/modules/costos/shared/utils/calcular-costo-equipo` (Task 1).
- Produces: `CostoEquipoDetalle` y `VehiculoConCosto` ganan `accesorios_total: number`; `CostoEquipoDetalle` reemplaza `items: ItemMantenimientoClient[]` por `items_tipo_count: number` y `tipo: { id: string; nombre: string }`.

- [ ] **Step 1: Adaptar el test de agregación de equipos por servicio**

En `calcular-equipos-servicio.test.ts`, reemplazá en cada fixture `accesorios` + `items: [{ precio_anual }]` por `items_tipo`, y agregá el caso de dos equipos compartiendo el tipo:

```ts
it('dos equipos del mismo tipo comparten la lista de ítems', () => {
  const itemsTipo: ItemCostoTipoCalc[] = [
    { clase: 'ACCESORIO', cantidad: 1, precio_unitario: '200000' },
    { clase: 'MANTENIMIENTO', cantidad: 1, precio_unitario: '120000' },
  ];
  const { por_vehiculo, total_equipos } = agregarEquipos([
    {
      asignacion_id: 'a1', vehicle_id: 'v1', interno: '101', descripcion: 'Uno',
      afectacion_pct: 1, valor_compra: '1000000', valor_residual_pct: '0.35',
      anios_amortizacion: 5, items_tipo: itemsTipo,
    },
    {
      asignacion_id: 'a2', vehicle_id: 'v2', interno: '102', descripcion: 'Dos',
      afectacion_pct: 1, valor_compra: '1000000', valor_residual_pct: '0.35',
      anios_amortizacion: 5, items_tipo: itemsTipo,
    },
  ]);
  // (1.000.000 − 35% + 200.000) / 60 = 14.166,666… ; mantenimiento 120.000 / 12 = 10.000
  expect(por_vehiculo[0].costo_mensual.toDecimalPlaces(2).toNumber()).toBe(24166.67);
  expect(por_vehiculo[0].costo_mensual.eq(por_vehiculo[1].costo_mensual)).toBe(true);
  expect(total_equipos.toDecimalPlaces(2).toNumber()).toBe(48333.33);
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/modules/costos/shared/utils/calcular-equipos-servicio.test.ts`
Expected: FAIL — `items_tipo` no existe en `EquipoServicioCalc`.

- [ ] **Step 3: Adaptar `calcular-equipos-servicio.ts`**

1. Cambiá el import: `calcularCostoMensualEquipo` e `ItemCostoTipoCalc` vienen ahora de `./calcular-costo-equipo`.
2. En `EquipoServicioCalc`, reemplazá `accesorios?: Num` e `items: ItemMantCalc[]` por `items_tipo: ItemCostoTipoCalc[]`.
3. En `agregarEquipos`, pasale `items_tipo: e.items_tipo` al motor y sumá `accesorios_total` al resultado por vehículo.
4. En `calcularEquiposServicio`, resolvé los perfiles por tipo con un solo query, evitando el N+1:

```ts
export async function calcularEquiposServicio(servicioId: string): Promise<ResumenEquipos> {
  const servicio = await prisma.servicio_contrato.findUniqueOrThrow({
    where: { id: servicioId },
    select: { company_id: true },
  });

  const [asignaciones, perfiles] = await Promise.all([
    prisma.asignacion_equipo_servicio.findMany({
      where: { servicio_id: servicioId, is_active: true },
      include: {
        vehicle: {
          select: {
            intern_number: true,
            domain: true,
            type: true,
            brand_rel: { select: { name: true } },
            model_rel: { select: { name: true } },
            costo_equipo: true,
          },
        },
      },
      orderBy: { vehicle: { intern_number: 'asc' } },
    }),
    prisma.costo_tipo_equipo.findMany({
      where: { company_id: servicio.company_id },
      include: { items: { where: { is_active: true } } },
    }),
  ]);

  const itemsPorTipo = new Map(
    perfiles.map((p) => [
      p.type_id,
      p.items.map((i) => ({
        clase: i.clase,
        cantidad: i.cantidad.toString(),
        precio_unitario: i.precio_unitario.toString(),
        is_active: i.is_active,
      })),
    ])
  );

  // Se excluye el equipo sin costo_equipo activo. Que su tipo no tenga perfil NO lo
  // excluye: amortiza igual, con accesorios y mantenimiento en cero.
  const conCosto = asignaciones.filter((a) => a.vehicle.costo_equipo && a.vehicle.costo_equipo.is_active);

  const { por_vehiculo, total_equipos } = agregarEquipos(
    conCosto.map((a) => {
      const c = a.vehicle.costo_equipo!;
      const descripcion =
        `${a.vehicle.brand_rel?.name ?? ''} ${a.vehicle.model_rel?.name ?? ''}`.trim() ||
        a.vehicle.domain ||
        '—';
      return {
        asignacion_id: a.id,
        vehicle_id: a.vehicle_id,
        interno: a.vehicle.intern_number ?? '—',
        descripcion,
        afectacion_pct: a.afectacion_pct.toString(),
        valor_compra: c.valor_compra.toString(),
        valor_residual_pct: c.valor_residual_pct.toString(),
        anios_amortizacion: c.anios_amortizacion,
        items_tipo: itemsPorTipo.get(a.vehicle.type) ?? [],
      };
    })
  );
  // …el mapeo a por_vehiculoClient y el return quedan como estaban.
}
```

- [ ] **Step 4: Correr los tests**

Run: `npx vitest run src/modules/costos/shared/utils/calcular-equipos-servicio.test.ts`
Expected: PASS.

- [ ] **Step 5: Adaptar las queries de equipos**

En `src/modules/costos/features/equipos/actions.server.ts`:

1. Import del motor: `@/modules/costos/shared/utils/calcular-costo-equipo`.
2. Sacá `accesorios` de `schemaCostoEquipo` y del objeto `data` de `upsertCostoEquipo`.
3. Borrá `addItemMantenimiento`, `updateItemMantenimiento`, `deleteItemMantenimiento`, `bulkAddItemsMantenimiento` y el helper `assertCostoEquipoPertenece` (ya no se usa).
4. Agregá este helper al bloque de helpers del archivo:

```ts
type ItemTipoCalcRow = {
  clase: 'ACCESORIO' | 'MANTENIMIENTO';
  cantidad: string;
  precio_unitario: string;
  is_active: boolean;
};

/** Ítems por tipo de toda la empresa, en un solo query, para evitar el N+1. */
async function itemsPorTipoDeEmpresa(companyId: string): Promise<Map<string, ItemTipoCalcRow[]>> {
  const perfiles = await prisma.costo_tipo_equipo.findMany({
    where: { company_id: companyId },
    include: { items: { where: { is_active: true } } },
  });
  return new Map(
    perfiles.map((p) => [
      p.type_id,
      p.items.map((i) => ({
        clase: i.clase,
        cantidad: i.cantidad.toString(),
        precio_unitario: i.precio_unitario.toString(),
        is_active: i.is_active,
      })),
    ])
  );
}
```

5. `listVehiculosConCosto` queda así (sacá el `include` de `costo_equipo.items_mantenimiento` y sumá `type` al select del vehículo):

```ts
export async function listVehiculosConCosto(): Promise<VehiculoConCosto[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const [vehiculos, itemsPorTipo] = await Promise.all([
    prisma.vehicles.findMany({
      where: { company_id: companyId },
      include: {
        brand_rel: { select: { name: true } },
        model_rel: { select: { name: true } },
        costo_equipo: true,
      },
      orderBy: { intern_number: 'asc' },
    }),
    itemsPorTipoDeEmpresa(companyId),
  ]);

  return vehiculos.map((v) => {
    const { marca, modelo } = nombreVehiculo(v);
    const ce = v.costo_equipo;
    let costo_mensual: number | null = null;
    let accesorios_total: number | null = null;

    if (ce) {
      const r = calcularCostoMensualEquipo({
        valor_compra: ce.valor_compra.toString(),
        valor_residual_pct: ce.valor_residual_pct.toString(),
        anios_amortizacion: ce.anios_amortizacion,
        items_tipo: itemsPorTipo.get(v.type) ?? [],
        afectacion_pct: 1,
      });
      costo_mensual = r.costo_mensual.toDecimalPlaces(2).toNumber();
      accesorios_total = r.accesorios_total.toDecimalPlaces(2).toNumber();
    }

    return {
      id: v.id,
      interno: v.intern_number,
      dominio: v.domain,
      marca,
      modelo,
      anio: v.year,
      tiene_costo: !!ce,
      valor_compra: ce ? toClientNumber(ce.valor_compra) : null,
      costo_mensual,
      accesorios_total,
      items_count: (itemsPorTipo.get(v.type) ?? []).length,
    };
  });
}
```

6. En `getCostoEquipo` y `getEquipoParaEdicion`, sacá el `include` de `items_mantenimiento`, sumá `type_rel: { select: { id: true, name: true } }` al `include` del vehículo, y reemplazá el bloque de cálculo por:

```ts
  const perfil = await prisma.costo_tipo_equipo.findUnique({
    where: { company_id_type_id: { company_id: companyId, type_id: v.type } },
    include: { items: { where: { is_active: true } } },
  });
  const items_tipo = (perfil?.items ?? []).map((i) => ({
    clase: i.clase,
    cantidad: i.cantidad.toString(),
    precio_unitario: i.precio_unitario.toString(),
    is_active: i.is_active,
  }));

  const { accesorios_total, amortizacion_mensual, mantenimiento_mensual, costo_mensual } =
    calcularCostoMensualEquipo({
      valor_compra: ce.valor_compra.toString(),
      valor_residual_pct: ce.valor_residual_pct.toString(),
      anios_amortizacion: ce.anios_amortizacion,
      items_tipo,
      afectacion_pct: 1,
    });
```

y en el objeto retornado, reemplazá `items: […]` por:

```ts
    tipo: { id: v.type, nombre: v.type_rel.name },
    items_tipo_count: items_tipo.length,
    accesorios_total: accesorios_total.toDecimalPlaces(2).toNumber(),
```

En `getEquipoParaEdicion`, `accesorios_total` va dentro del objeto `resumen`, junto a `amortizacion_mensual`, `mantenimiento_mensual` y `costo_mensual`; `tipo` e `items_tipo_count` van al nivel superior del retorno.

- [ ] **Step 6: Actualizar los tipos de equipo**

En `src/modules/costos/shared/types/equipo.types.ts`:
- `CostoEquipoClient`: sacá `accesorios` del `Omit` y del tipo (la columna sigue existiendo hasta la Task 9, pero ya no se expone).
- `VehiculoConCosto`: agregá `accesorios_total: number | null`.
- `CostoEquipoDetalle`: sacá `items: ItemMantenimientoClient[]`; agregá `accesorios_total: number`, `items_tipo_count: number` y `tipo: { id: string; nombre: string }`.
- Borrá `ItemMantenimientoClient` e `ItemMantInput`.

- [ ] **Step 7: Verificar**

Run: `npm run check-types`
Expected: fallará en los componentes de la UI de equipos que todavía usan lo viejo — eso lo arregla la Task 9. Anotá los errores; deben ser sólo de `FormCostoEquipo.tsx`, `TablaItemsMantenimiento.tsx`, `ImportarItemsDialog.tsx` y la page del detalle del equipo.

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: No commitear todavía**

El árbol no compila hasta terminar la Task 9. Commit conjunto al final.

---

### Task 9: UI del equipo en sólo lectura y limpieza final

**Files:**
- Modify: `src/app/dashboard/costos/equipos/[vehicleId]/page.tsx`
- Modify: `src/modules/costos/features/equipos/components/FormCostoEquipo.tsx`
- Modify: `src/modules/costos/features/equipos/components/ResumenCostoEquipo.tsx`
- Create: `src/modules/costos/features/equipos/components/ItemsHeredadosDelTipo.tsx`
- Delete: `src/modules/costos/features/equipos/components/TablaItemsMantenimiento.tsx`
- Delete: `src/modules/costos/features/equipos/components/ImportarItemsDialog.tsx` (se mueve al feature de tipos)
- Create: `src/modules/costos/features/tipos-equipo/components/ImportarItemsDialog.tsx`
- Modify: `src/modules/costos/features/tipos-equipo/components/TablaItemsCostoTipo.tsx` (montar el dialog en el CardHeader)
- Delete: `src/modules/costos/shared/utils/calcular-mantenimiento.ts`
- Delete: `src/modules/costos/shared/utils/calcular-equipo.test.ts`
- Create: `supabase/migrations/<timestamp>_drop_item_mantenimiento.sql`
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Mover el dialog de importación al feature de tipos**

Run: `git mv src/modules/costos/features/equipos/components/ImportarItemsDialog.tsx src/modules/costos/features/tipos-equipo/components/ImportarItemsDialog.tsx`

En el archivo movido:
- Cambiá las props a `{ perfilId: string; clase: ClaseItemCosto }`.
- Cambiá el import a `bulkAddItemsCostoTipo` de `../actions.server`.
- El parser (`parseNumero`, `parseEntrada`) se conserva **tal cual**: el precio parseado pasa a ser `precio_unitario` con `cantidad: 1`, que es exactamente la semántica anterior.
- Al llamar la action, mapeá cada ítem a `{ clase, nombre, cantidad: 1, precio_unitario, orden }`.

Montalo en `TablaItemsCostoTipo` (Task 5), en el `CardHeader`, junto al botón "Agregar", pasándole `perfilId` y `clase`; renderizalo sólo si `perfilId` no es `null`.

- [ ] **Step 2: Escribir el bloque de sólo lectura del detalle del equipo**

```tsx
// src/modules/costos/features/equipos/components/ItemsHeredadosDelTipo.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { ExternalLink } from 'lucide-react';

interface Props {
  tipo: { id: string; nombre: string };
  accesorios_total: number;
  mantenimiento_mensual: number;
  items_tipo_count: number;
}

/** Los accesorios y el mantenimiento se editan a nivel tipo, no por unidad. */
export function ItemsHeredadosDelTipo({
  tipo, accesorios_total, mantenimiento_mensual, items_tipo_count,
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">
            Accesorios y mantenimiento del tipo «{tipo.nombre}»
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {items_tipo_count === 0
              ? 'Este tipo todavía no tiene ítems cargados.'
              : `${items_tipo_count} ${items_tipo_count === 1 ? 'ítem' : 'ítems'} compartidos por todas las unidades de este tipo.`}
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href={`/dashboard/costos/tipos-equipo/${tipo.id}`}>
            <ExternalLink className="h-3.5 w-3.5" /> Editar en tipos de equipo
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Accesorios (a la base amortizable)</p>
          <p className="text-lg font-mono">{formatCurrencyARS(accesorios_total)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Mantenimiento mensual</p>
          <p className="text-lg font-mono">{formatCurrencyARS(mantenimiento_mensual)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Actualizar el form y el resumen del equipo**

En `FormCostoEquipo.tsx`, tres borrados puntuales:
- del estado inicial: la línea `accesorios: costo ? String(costo.accesorios) : '0',`
- de la llamada a `upsertCostoEquipo`: la línea `accesorios: Number(form.accesorios || '0'),`
- el `<div className="space-y-1.5">` completo del input `accesorios` (label "Accesorios")

En `ResumenCostoEquipo.tsx`, agregá `accesorios_total: number` a `Props`, cambiá el contenedor a `sm:grid-cols-4` y agregá esta card como primera del grid:

```tsx
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Accesorios</CardDescription>
          <CardTitle className="text-xl">{formatCurrencyARS(accesorios_total)}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">Heredados del tipo</p>
        </CardContent>
      </Card>
```

- [ ] **Step 4: Actualizar la page del detalle del equipo**

En `src/app/dashboard/costos/equipos/[vehicleId]/page.tsx`: sacá el import y el uso de `TablaItemsMantenimiento`, pasale `accesorios_total` a `ResumenCostoEquipo`, y renderizá `<ItemsHeredadosDelTipo />` con los datos del detalle. Borrá el bloque condicional `{costo ? … : <p>Guardá primero…</p>}`.

- [ ] **Step 5: Borrar el código muerto**

```bash
git rm src/modules/costos/features/equipos/components/TablaItemsMantenimiento.tsx
git rm src/modules/costos/shared/utils/calcular-mantenimiento.ts
git rm src/modules/costos/shared/utils/calcular-equipo.test.ts
```

El golden de `calcular-equipo.test.ts` ya vive, adaptado, en `calcular-costo-equipo.test.ts` (Task 1). Verificá que `calcular-amortizacion.ts` **no** se borre: se sigue usando.

Run: `grep -rn "calcular-mantenimiento\|item_mantenimiento\|ItemMantCalc" src --include="*.ts" --include="*.tsx" | grep -v generated`
Expected: sin resultados. Si aparece alguno, arreglalo antes de seguir.

- [ ] **Step 6: Migración de limpieza**

Run: `npm run create-migration -- drop_item_mantenimiento`

```sql
-- Los accesorios y el mantenimiento ahora viven en item_costo_tipo, a nivel tipo de
-- equipo (migrados en <timestamp>_migrar_items_mantenimiento_a_tipo.sql).
DROP TABLE IF EXISTS "item_mantenimiento";
ALTER TABLE "costo_equipo" DROP COLUMN IF EXISTS "accesorios";
```

Run: `npx supabase migration up`

- [ ] **Step 7: Actualizar el schema de Prisma**

Borrá el modelo `item_mantenimiento`, la relación `items_mantenimiento` de `costo_equipo` y el campo `accesorios` de `costo_equipo`.

Run: `npx prisma generate`

- [ ] **Step 8: Verificación completa**

```bash
npm run check-types && npm run lint && npm test
```

Expected: los tres PASS, con el golden de `calcular-costo-equipo.test.ts` todavía en `7794945.28`.

- [ ] **Step 9: Smoke manual**

Run: `npm run dev`. Verificá:
1. `/dashboard/costos/equipos` lista y muestra costos mensuales coherentes con antes de la migración.
2. El detalle de un equipo ya no permite editar ítems y muestra el bloque del tipo con el link.
3. Editar un ítem en `/dashboard/costos/tipos-equipo/<id>` cambia el costo mensual de **todas** las unidades de ese tipo.
4. La composición de un servicio (`/dashboard/costos/composicion`) sigue arrojando el mismo subtotal de equipos que antes del cambio.

- [ ] **Step 10: Commit**

Más de 5 archivos → commiteá.

```bash
git add -A
git commit -m "refactor(costos): accesorios y mantenimiento pasan a nivel tipo de equipo"
```

---

## Notas para quien ejecute

- **El número que manda es `7794945.28`.** Si en cualquier momento el golden cambia, el error está en el código, no en el test.
- **No hagas push.** La regla del proyecto es explícita: push sólo cuando el usuario lo pida.
- Si al aplicar la Task 7 sobre datos reales aparece un tipo con cero ítems migrados donde esperabas ítems, revisá que el `type` del vehículo no sea un tipo global (`company_id IS NULL`): el perfil se crea igual, pero el donante se elige por empresa.
