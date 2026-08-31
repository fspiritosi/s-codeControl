# Catálogo de conceptos de costo de equipo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que costear un tipo de equipo sea una elección explícita de la empresa, y que los conceptos de costo vivan en un catálogo por empresa donde cada uno puede ser un monto fijo o un porcentaje de otro valor (del equipo, de otro concepto, del total, o por kilómetro).

**Architecture:** Un catálogo `concepto_equipo` por empresa, con `clase_calculo` (enum) y `parametros` (JSON), asociado a los perfiles de tipo vía `concepto_tipo_equipo`. El cálculo replica la técnica del motor de CCT ya existente — orden topológico, detección de ciclos y validación de referencias — en un archivo propio, sin importar ni modificar el motor de CCT. Los conceptos porcentuales se resuelven **por equipo**, con el valor de compra de esa unidad.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Prisma 7 (PostgreSQL) · Zod · decimal.js · vitest · Shadcn/ui

**Spec:** `docs/superpowers/specs/2026-08-31-catalogo-conceptos-equipo-design.md`

## Global Constraints

- **Migraciones**: se crean con `npm run create-migration -- <nombre>` y se escriben en SQL plano, con comentario de encabezado explicando el porqué, nombres de constraint explícitos y `numeric(p,s)`. `npx supabase migration up` **NO funciona** en este entorno (desalineamiento del historial preexistente): aplicá con `docker exec -i supabase_db_s-codeControl psql -U postgres < <archivo>` y registrá la versión a mano en `supabase_migrations.schema_migrations`, como las tres migraciones de la rama anterior.
- **Precisión**: todo intermedio en `Decimal` (`@/modules/costos/shared/utils/decimal`); redondeo a 2 decimales sólo al salir al cliente.
- **Porcentajes en fracción**: `0.17` = 17% en la base y en el motor. La UI los pide y los muestra en porcentaje; la conversión vive sólo en el formulario.
- **Blindaje de actions**: toda action arranca con `getRequiredActionContext()` + `assertModuloHabilitado(companyId)`, y toda mutación verifica pertenencia por `company_id` — incluidos `product_id` e `indice_id`.
- **Sin imports cross-module**: `src/modules/costos` no importa de otros módulos; lo que venga de `products` entra por props desde la ruta.
- **No tocar el motor de CCT** (`motor-conceptos.ts`): se replica su técnica, no su código.
- **El golden no se mueve**: `$7.794.945,28`. Es el criterio de aceptación de toda la línea de trabajo.
- **`npm run lint` está roto en el repo** (Next 16 eliminó `next lint`): verificá con `npx eslint <rutas>`.
- Código, comentarios y textos de UI en español rioplatense.
- **Nunca hacer push.** Commits según la regla del proyecto: si la tarea toca más de 5 archivos o más de 100 líneas, commiteá al verificar; si es menor, dejalo sin commitear y avisá.

---

### Task 1: Motor de conceptos de equipo

**Files:**
- Create: `src/modules/costos/shared/utils/calcular-conceptos-equipo.ts`
- Create: `src/modules/costos/shared/utils/calcular-conceptos-equipo.test.ts`

**Interfaces:**
- Consumes: `Decimal`, `parseDecimal` de `./decimal`.
- Produces:
  - `type ClaseCalculoConceptoEquipo = 'FIJO' | 'PCT_VALOR_EQUIPO' | 'PCT_CONCEPTO' | 'PCT_SUMA_CONCEPTOS' | 'POR_KM'`
  - `type BaseValorEquipo = 'VALOR_COMPRA' | 'VALOR_COMPRA_MAS_ACCESORIOS' | 'VALOR_RESIDUAL'`
  - `type ConceptoEquipoCalc = { codigo: string; clase: 'ACCESORIO' | 'MANTENIMIENTO'; clase_calculo: ClaseCalculoConceptoEquipo; parametros: Record<string, unknown>; is_active?: boolean | null }`
  - `type ContextoEquipo = { valor_compra: Num; valor_residual_pct: Num; km_anuales: number }`
  - `class CicloConceptosEquipoError extends Error`, `class ReferenciaConceptoEquipoInvalidaError extends Error`
  - `ordenTopologicoConceptos(conceptos: ConceptoEquipoCalc[]): ConceptoEquipoCalc[]`
  - `calcularConceptosEquipo(conceptos, ctx): { accesorios: Decimal; mantenimiento_anual: Decimal; por_concepto: Map<string, Decimal> }`

- [ ] **Step 1: Escribir el test que falla**

```ts
// src/modules/costos/shared/utils/calcular-conceptos-equipo.test.ts
import { describe, it, expect } from 'vitest';
import {
  calcularConceptosEquipo,
  ordenTopologicoConceptos,
  CicloConceptosEquipoError,
  ReferenciaConceptoEquipoInvalidaError,
  type ConceptoEquipoCalc,
  type ContextoEquipo,
} from './calcular-conceptos-equipo';

const CTX: ContextoEquipo = {
  valor_compra: '319325000',
  valor_residual_pct: '0.35',
  km_anuales: 120000,
};

const fijo = (codigo: string, precio: string, cantidad = 1, clase: 'ACCESORIO' | 'MANTENIMIENTO' = 'MANTENIMIENTO'): ConceptoEquipoCalc => ({
  codigo,
  clase,
  clase_calculo: 'FIJO',
  parametros: { cantidad, precio_unitario: precio },
});

describe('calcularConceptosEquipo — clases de cálculo', () => {
  it('FIJO multiplica cantidad por precio unitario', () => {
    const r = calcularConceptosEquipo([fijo('neumaticos', '860000', 6)], CTX);
    expect(r.mantenimiento_anual.toNumber()).toBe(5160000);
  });

  it('PCT_VALOR_EQUIPO sobre VALOR_COMPRA: patentes 17% de 319.325.000', () => {
    const r = calcularConceptosEquipo(
      [{ codigo: 'patentes', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_VALOR_EQUIPO',
         parametros: { pct: '0.17', base: 'VALOR_COMPRA' } }],
      CTX
    );
    expect(r.mantenimiento_anual.toNumber()).toBe(54285250);
  });

  it('PCT_VALOR_EQUIPO sobre VALOR_RESIDUAL usa valor_compra × residual', () => {
    const r = calcularConceptosEquipo(
      [{ codigo: 'x', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_VALOR_EQUIPO',
         parametros: { pct: '0.10', base: 'VALOR_RESIDUAL' } }],
      CTX
    );
    // 319.325.000 × 0,35 = 111.763.750 ; 10% = 11.176.375
    expect(r.mantenimiento_anual.toNumber()).toBe(11176375);
  });

  it('PCT_VALOR_EQUIPO sobre VALOR_COMPRA_MAS_ACCESORIOS suma los accesorios resueltos', () => {
    const r = calcularConceptosEquipo(
      [
        fijo('acc', '4498739', 1, 'ACCESORIO'),
        { codigo: 'seguro', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_VALOR_EQUIPO',
          parametros: { pct: '0.01', base: 'VALOR_COMPRA_MAS_ACCESORIOS' } },
      ],
      CTX
    );
    // (319.325.000 + 4.498.739) × 1% = 3.238.237,39
    expect(r.mantenimiento_anual.toDecimalPlaces(2).toNumber()).toBe(3238237.39);
  });

  it('PCT_CONCEPTO se resuelve después de su base, sin importar el orden de entrada', () => {
    const r = calcularConceptosEquipo(
      [
        { codigo: 'imprevistos', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_CONCEPTO',
          parametros: { pct: '0.05', concepto_codigo: 'neumaticos' } },
        fijo('neumaticos', '5160000'),
      ],
      CTX
    );
    // 5.160.000 + 5% de 5.160.000 = 5.160.000 + 258.000
    expect(r.mantenimiento_anual.toNumber()).toBe(5418000);
    expect(r.por_concepto.get('imprevistos')!.toNumber()).toBe(258000);
  });

  it('PCT_SUMA_CONCEPTOS suma las bases indicadas', () => {
    const r = calcularConceptosEquipo(
      [
        fijo('a', '1000000'),
        fijo('b', '2000000'),
        { codigo: 'admin', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_SUMA_CONCEPTOS',
          parametros: { pct: '0.03', conceptos_codigos: ['a', 'b'] } },
      ],
      CTX
    );
    expect(r.por_concepto.get('admin')!.toNumber()).toBe(90000);
  });

  it('POR_KM multiplica por los km anuales', () => {
    const r = calcularConceptosEquipo(
      [{ codigo: 'comb', clase: 'MANTENIMIENTO', clase_calculo: 'POR_KM',
         parametros: { monto_por_km: '850' } }],
      CTX
    );
    expect(r.mantenimiento_anual.toNumber()).toBe(102000000);
  });

  it('POR_KM con km_anuales en 0 da cero', () => {
    const r = calcularConceptosEquipo(
      [{ codigo: 'comb', clase: 'MANTENIMIENTO', clase_calculo: 'POR_KM',
         parametros: { monto_por_km: '850' } }],
      { ...CTX, km_anuales: 0 }
    );
    expect(r.mantenimiento_anual.toNumber()).toBe(0);
  });

  it('separa accesorios de mantenimiento por la clase del concepto', () => {
    const r = calcularConceptosEquipo(
      [fijo('acc', '200000', 1, 'ACCESORIO'), fijo('mant', '120000')],
      CTX
    );
    expect(r.accesorios.toNumber()).toBe(200000);
    expect(r.mantenimiento_anual.toNumber()).toBe(120000);
  });

  it('un concepto inactivo no se calcula ni sirve de base', () => {
    const r = calcularConceptosEquipo(
      [
        { ...fijo('neumaticos', '5160000'), is_active: false },
        { codigo: 'imprevistos', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_CONCEPTO',
          parametros: { pct: '0.05', concepto_codigo: 'neumaticos' } },
      ],
      CTX
    );
    expect(r.mantenimiento_anual.toNumber()).toBe(0);
  });

  it('dos equipos con distinto valor de compra dan importes distintos con el mismo concepto', () => {
    const concepto: ConceptoEquipoCalc[] = [
      { codigo: 'patentes', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_VALOR_EQUIPO',
        parametros: { pct: '0.17', base: 'VALOR_COMPRA' } },
    ];
    const a = calcularConceptosEquipo(concepto, { ...CTX, valor_compra: '247625000' });
    const b = calcularConceptosEquipo(concepto, { ...CTX, valor_compra: '32000000' });
    expect(a.mantenimiento_anual.toNumber()).toBe(42096250);
    expect(b.mantenimiento_anual.toNumber()).toBe(5440000);
  });
});

describe('ordenTopologicoConceptos — errores', () => {
  it('detecta un ciclo entre dos conceptos', () => {
    const conceptos: ConceptoEquipoCalc[] = [
      { codigo: 'a', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_CONCEPTO',
        parametros: { pct: '0.1', concepto_codigo: 'b' } },
      { codigo: 'b', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_CONCEPTO',
        parametros: { pct: '0.1', concepto_codigo: 'a' } },
    ];
    expect(() => ordenTopologicoConceptos(conceptos)).toThrow(CicloConceptosEquipoError);
  });

  it('rechaza una referencia a un concepto inexistente', () => {
    const conceptos: ConceptoEquipoCalc[] = [
      { codigo: 'a', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_CONCEPTO',
        parametros: { pct: '0.1', concepto_codigo: 'no_existe' } },
    ];
    expect(() => ordenTopologicoConceptos(conceptos)).toThrow(ReferenciaConceptoEquipoInvalidaError);
  });

  it('un ACCESORIO con base VALOR_COMPRA_MAS_ACCESORIOS es un ciclo', () => {
    const conceptos: ConceptoEquipoCalc[] = [
      { codigo: 'acc', clase: 'ACCESORIO', clase_calculo: 'PCT_VALOR_EQUIPO',
        parametros: { pct: '0.1', base: 'VALOR_COMPRA_MAS_ACCESORIOS' } },
    ];
    expect(() => ordenTopologicoConceptos(conceptos)).toThrow(CicloConceptosEquipoError);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/modules/costos/shared/utils/calcular-conceptos-equipo.test.ts`
Expected: FAIL — `Failed to resolve import "./calcular-conceptos-equipo"`.

- [ ] **Step 3: Escribir la implementación**

```ts
// src/modules/costos/shared/utils/calcular-conceptos-equipo.ts
import { Decimal, parseDecimal } from './decimal';

type Num = Decimal | string | number;

export type ClaseCalculoConceptoEquipo =
  | 'FIJO'
  | 'PCT_VALOR_EQUIPO'
  | 'PCT_CONCEPTO'
  | 'PCT_SUMA_CONCEPTOS'
  | 'POR_KM';

export type BaseValorEquipo = 'VALOR_COMPRA' | 'VALOR_COMPRA_MAS_ACCESORIOS' | 'VALOR_RESIDUAL';

export type ConceptoEquipoCalc = {
  codigo: string;
  clase: 'ACCESORIO' | 'MANTENIMIENTO';
  clase_calculo: ClaseCalculoConceptoEquipo;
  parametros: Record<string, unknown>;
  is_active?: boolean | null;
};

/** Datos de la unidad sobre los que se resuelven los conceptos porcentuales. */
export type ContextoEquipo = {
  valor_compra: Num;
  valor_residual_pct: Num;
  km_anuales: number;
};

export class CicloConceptosEquipoError extends Error {
  constructor(ciclo: string[]) {
    super(`Ciclo detectado en conceptos de equipo: ${ciclo.join(' → ')}`);
    this.name = 'CicloConceptosEquipoError';
  }
}

export class ReferenciaConceptoEquipoInvalidaError extends Error {
  constructor(origen: string, referenciado: string) {
    super(`El concepto '${origen}' referencia a '${referenciado}', que no existe`);
    this.name = 'ReferenciaConceptoEquipoInvalidaError';
  }
}

/**
 * Dependencias de un concepto. Un concepto con base VALOR_COMPRA_MAS_ACCESORIOS depende
 * implícitamente de TODOS los accesorios: así su base está completa cuando se resuelve, y un
 * accesorio que use esa base queda detectado como ciclo (se definiría en términos de sí mismo).
 */
function getDependencias(c: ConceptoEquipoCalc, codigosAccesorios: string[]): string[] {
  const p = c.parametros;
  switch (c.clase_calculo) {
    case 'PCT_CONCEPTO':
      return [String(p.concepto_codigo)];
    case 'PCT_SUMA_CONCEPTOS':
      return (p.conceptos_codigos as string[]) ?? [];
    case 'PCT_VALOR_EQUIPO':
      return p.base === 'VALOR_COMPRA_MAS_ACCESORIOS' ? codigosAccesorios : [];
    default:
      return [];
  }
}

/** Ordena los conceptos de modo que cada uno se resuelva después de sus dependencias. */
export function ordenTopologicoConceptos(conceptos: ConceptoEquipoCalc[]): ConceptoEquipoCalc[] {
  const activos = conceptos.filter((c) => c.is_active !== false);
  const byCode = new Map(activos.map((c) => [c.codigo, c]));
  const codigosAccesorios = activos.filter((c) => c.clase === 'ACCESORIO').map((c) => c.codigo);

  for (const c of activos) {
    for (const dep of getDependencias(c, codigosAccesorios)) {
      if (!byCode.has(dep)) throw new ReferenciaConceptoEquipoInvalidaError(c.codigo, dep);
    }
  }

  const visitado = new Set<string>();
  const enStack = new Set<string>();
  const resultado: ConceptoEquipoCalc[] = [];

  function visitar(codigo: string, path: string[]) {
    if (enStack.has(codigo)) throw new CicloConceptosEquipoError([...path, codigo]);
    if (visitado.has(codigo)) return;
    enStack.add(codigo);
    const c = byCode.get(codigo)!;
    for (const dep of getDependencias(c, codigosAccesorios)) visitar(dep, [...path, codigo]);
    enStack.delete(codigo);
    visitado.add(codigo);
    resultado.push(c);
  }

  for (const c of activos) visitar(c.codigo, []);
  return resultado;
}

function calcularUno(
  c: ConceptoEquipoCalc,
  ctx: ContextoEquipo,
  valores: Map<string, Decimal>,
  accesoriosResueltos: Decimal
): Decimal {
  const p = c.parametros;

  switch (c.clase_calculo) {
    case 'FIJO':
      return parseDecimal(p.cantidad as Num).mul(parseDecimal(p.precio_unitario as Num));

    case 'PCT_VALOR_EQUIPO': {
      const compra = parseDecimal(ctx.valor_compra);
      const base =
        p.base === 'VALOR_RESIDUAL'
          ? compra.mul(parseDecimal(ctx.valor_residual_pct))
          : p.base === 'VALOR_COMPRA_MAS_ACCESORIOS'
            ? compra.add(accesoriosResueltos)
            : compra;
      return base.mul(parseDecimal(p.pct as Num));
    }

    case 'PCT_CONCEPTO': {
      const base = valores.get(String(p.concepto_codigo)) ?? new Decimal(0);
      return base.mul(parseDecimal(p.pct as Num));
    }

    case 'PCT_SUMA_CONCEPTOS': {
      const codigos = (p.conceptos_codigos as string[]) ?? [];
      let suma = new Decimal(0);
      for (const cod of codigos) suma = suma.add(valores.get(cod) ?? 0);
      return suma.mul(parseDecimal(p.pct as Num));
    }

    case 'POR_KM':
      return parseDecimal(p.monto_por_km as Num).mul(ctx.km_anuales);
  }
}

/**
 * Resuelve todos los conceptos de un equipo y los agrega por clase.
 * Los porcentuales se calculan con los valores de ESA unidad, así que dos equipos del mismo
 * tipo con distinto valor de compra obtienen importes distintos del mismo concepto.
 */
export function calcularConceptosEquipo(
  conceptos: ConceptoEquipoCalc[],
  ctx: ContextoEquipo
): { accesorios: Decimal; mantenimiento_anual: Decimal; por_concepto: Map<string, Decimal> } {
  const ordenados = ordenTopologicoConceptos(conceptos);
  const por_concepto = new Map<string, Decimal>();
  let accesorios = new Decimal(0);
  let mantenimiento_anual = new Decimal(0);

  for (const c of ordenados) {
    const valor = calcularUno(c, ctx, por_concepto, accesorios);
    por_concepto.set(c.codigo, valor);
    if (c.clase === 'ACCESORIO') accesorios = accesorios.add(valor);
    else mantenimiento_anual = mantenimiento_anual.add(valor);
  }

  return { accesorios, mantenimiento_anual, por_concepto };
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/modules/costos/shared/utils/calcular-conceptos-equipo.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Correr la suite completa**

Run: `npm test`
Expected: PASS. Nada existente se rompe: el archivo es nuevo y nadie lo importa todavía.

- [ ] **Step 6: Commit**

Más de 100 líneas → commiteá.

```bash
git add src/modules/costos/shared/utils/calcular-conceptos-equipo.ts src/modules/costos/shared/utils/calcular-conceptos-equipo.test.ts
git commit -m "feat(costos): motor de conceptos de costo de equipo"
```

---

### Task 2: Integrar el motor de conceptos al costo del equipo

**Files:**
- Modify: `src/modules/costos/shared/utils/calcular-costo-equipo.ts`
- Modify: `src/modules/costos/shared/utils/calcular-costo-equipo.test.ts`

**Interfaces:**
- Consumes: `calcularConceptosEquipo`, `ConceptoEquipoCalc`, `ContextoEquipo` (Task 1).
- Produces: `calcularCostoMensualEquipo` cambia `items_tipo: ItemCostoTipoCalc[]` por `conceptos: ConceptoEquipoCalc[]` y suma `km_anuales` al input; el resultado gana `por_concepto: Map<string, Decimal>`. Se eliminan `ItemCostoTipoCalc` y `sumarItemsTipo`.

- [ ] **Step 1: Adaptar el golden y agregar el caso porcentual**

En `calcular-costo-equipo.test.ts`, el fixture `PECOM_112` pasa de `items_tipo` a `conceptos`. Cada `mant('5428525')` se convierte en un concepto `FIJO` con código propio. Reemplazá el helper y el fixture por:

```ts
import {
  calcularCostoMensualEquipo,
  type CostoEquipoCalcInput,
} from './calcular-costo-equipo';
import type { ConceptoEquipoCalc } from './calcular-conceptos-equipo';

let seq = 0;
const mant = (precio_unitario: string): ConceptoEquipoCalc => ({
  codigo: `m${seq++}`,
  clase: 'MANTENIMIENTO',
  clase_calculo: 'FIJO',
  parametros: { cantidad: 1, precio_unitario },
});
```

El fixture conserva **exactamente** los mismos 32 valores de mantenimiento y el accesorio de `4498739`, ahora como:

```ts
const PECOM_112 = {
  valor_compra: '319325000',
  valor_residual_pct: '0.35',
  anios_amortizacion: 5,
  km_anuales: 0,
  conceptos: [
    { codigo: 'acc', clase: 'ACCESORIO', clase_calculo: 'FIJO',
      parametros: { cantidad: 1, precio_unitario: '4498739' } } as ConceptoEquipoCalc,
    mant('5428525'), mant('1680000'), mant('1780000'), mant('1952000'), mant('132060'),
    mant('1390000'), mant('1080980'), mant('790000'), mant('850180'),
    mant('1128571.4285714286'), mant('1952000'), mant('840000'), mant('2060000'),
    mant('940000'), mant('980466'), mant('520715'), mant('960000'), mant('920000'),
    mant('1660000'), mant('420926'), mant('422400'), mant('6800000'),
    mant('213634.2857142857'), mant('4916122'), mant('576937.2857142857'),
    mant('5160000'), mant('920400'), mant('1380000'), mant('1371428.5714285714'),
    mant('220000'), mant('580000'), mant('1100000'),
  ],
};
```

Los tests que usaban `items_tipo` pasan a usar `conceptos` y a incluir `km_anuales: 0`. Agregá además este caso, que es la razón de ser de la tarea:

```ts
it('un concepto porcentual da distinto importe según el valor de compra de la unidad', () => {
  const conceptos: ConceptoEquipoCalc[] = [
    { codigo: 'patentes', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_VALOR_EQUIPO',
      parametros: { pct: '0.17', base: 'VALOR_COMPRA' } },
  ];
  const caro = calcularCostoMensualEquipo({
    valor_compra: '247625000', valor_residual_pct: '0.35', anios_amortizacion: 5,
    km_anuales: 0, conceptos,
  });
  const barato = calcularCostoMensualEquipo({
    valor_compra: '32000000', valor_residual_pct: '0.35', anios_amortizacion: 5,
    km_anuales: 0, conceptos,
  });
  // 17% de cada valor de compra, prorrateado a mes
  expect(caro.mantenimiento_mensual.toDecimalPlaces(2).toNumber()).toBe(3508020.83);
  expect(barato.mantenimiento_mensual.toDecimalPlaces(2).toNumber()).toBe(453333.33);
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/modules/costos/shared/utils/calcular-costo-equipo.test.ts`
Expected: FAIL — `conceptos` no existe en `CostoEquipoCalcInput`.

- [ ] **Step 3: Adaptar el motor**

En `calcular-costo-equipo.ts`: borrá `ItemCostoTipoCalc` y `sumarItemsTipo`, importá el motor de conceptos y dejá:

```ts
import { Decimal } from './decimal';
import { calcularAmortizacionMensual } from './calcular-amortizacion';
import { calcularConceptosEquipo, type ConceptoEquipoCalc } from './calcular-conceptos-equipo';

type Num = Decimal | string | number;

export type ClaseItemCosto = 'ACCESORIO' | 'MANTENIMIENTO';

export type CostoEquipoCalcInput = {
  valor_compra: Num;
  valor_residual_pct: Num;
  anios_amortizacion: number;
  km_anuales: number;
  /** Conceptos heredados del tipo, resueltos con los valores de ESTA unidad. */
  conceptos: ConceptoEquipoCalc[];
  afectacion_pct?: Num;
};

export type CostoEquipoCalcResult = {
  accesorios_total: Decimal;
  amortizacion_mensual: Decimal;
  mantenimiento_mensual: Decimal;
  costo_mensual: Decimal;
  /** Importe resuelto de cada concepto para esta unidad, por código. */
  por_concepto: Map<string, Decimal>;
};

export function calcularCostoMensualEquipo(input: CostoEquipoCalcInput): CostoEquipoCalcResult {
  const { accesorios, mantenimiento_anual, por_concepto } = calcularConceptosEquipo(
    input.conceptos,
    {
      valor_compra: input.valor_compra,
      valor_residual_pct: input.valor_residual_pct,
      km_anuales: input.km_anuales,
    }
  );

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
    por_concepto,
  };
}
```

El `describe('calcularAmortizacionMensual')` del final del archivo de test no se toca.

- [ ] **Step 4: Correr los tests**

Run: `npx vitest run src/modules/costos/shared/utils/calcular-costo-equipo.test.ts`
Expected: PASS, con el golden todavía en `7794945.28`. Si ese número se movió, la conversión del fixture está mal: revisá que estén los 32 valores y el accesorio.

- [ ] **Step 5: Verificar el resto**

Run: `npm run check-types`
Expected: FALLA en `calcular-equipos-servicio.ts` y en `features/equipos/actions.server.ts`, que todavía pasan `items_tipo`. Es esperado y lo cierra la Task 6. Anotá los errores y seguí.

- [ ] **Step 6: No commitear todavía**

El árbol no compila hasta la Task 6. Commit conjunto más adelante.

---

### Task 3: Esquema del catálogo

**Files:**
- Create: `supabase/migrations/<timestamp>_catalogo_conceptos_equipo.sql`
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: modelos Prisma `concepto_equipo` y `concepto_tipo_equipo`, enums `clase_calculo_concepto_equipo` y `base_valor_equipo`.

- [ ] **Step 1: Crear el archivo de migración**

Run: `npm run create-migration -- catalogo_conceptos_equipo`

- [ ] **Step 2: Escribir el SQL (sólo el alta de estructura)**

La conversión de datos y el DROP van en la Task 7: esta migración es aditiva.

```sql
-- Catálogo de conceptos de costo por empresa. Reemplaza a item_costo_tipo (importes planos por
-- tipo) por conceptos reutilizables que pueden ser un monto fijo o un porcentaje de otro valor.
-- Los porcentuales se resuelven POR EQUIPO, con el valor de compra de cada unidad, así que el
-- catálogo guarda la regla y no el importe.
-- Los porcentajes se guardan como fracción (0.17 = 17%), igual que costo_equipo.valor_residual_pct.

CREATE TYPE "clase_calculo_concepto_equipo" AS ENUM (
  'FIJO', 'PCT_VALOR_EQUIPO', 'PCT_CONCEPTO', 'PCT_SUMA_CONCEPTOS', 'POR_KM'
);

CREATE TYPE "base_valor_equipo" AS ENUM (
  'VALOR_COMPRA', 'VALOR_COMPRA_MAS_ACCESORIOS', 'VALOR_RESIDUAL'
);

CREATE TABLE "concepto_equipo" (
  "id"                    uuid                            NOT NULL DEFAULT gen_random_uuid(),
  "created_at"            timestamptz                     NOT NULL DEFAULT now(),
  "company_id"            uuid                            NOT NULL,
  "codigo"                text                            NOT NULL,
  "nombre"                text                            NOT NULL,
  "clase"                 "clase_item_costo"              NOT NULL,
  "clase_calculo"         "clase_calculo_concepto_equipo" NOT NULL,
  "parametros"            jsonb                           NOT NULL,
  "product_id"            uuid,
  "indice_id"             uuid,
  "precio_actualizado_at" timestamptz,
  "orden"                 integer                         NOT NULL DEFAULT 0,
  "is_active"             boolean                         NOT NULL DEFAULT true,
  CONSTRAINT "concepto_equipo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "concepto_equipo_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "concepto_equipo_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE CASCADE,
  CONSTRAINT "concepto_equipo_indice_id_fkey"
    FOREIGN KEY ("indice_id") REFERENCES "indices"("id") ON UPDATE CASCADE,
  CONSTRAINT "concepto_equipo_company_codigo_key" UNIQUE ("company_id", "codigo")
);
CREATE INDEX "concepto_equipo_company_idx" ON "concepto_equipo"("company_id");

CREATE TABLE "concepto_tipo_equipo" (
  "id"                   uuid    NOT NULL DEFAULT gen_random_uuid(),
  "costo_tipo_equipo_id" uuid    NOT NULL,
  "concepto_equipo_id"   uuid    NOT NULL,
  "orden"                integer NOT NULL DEFAULT 0,
  "is_active"            boolean NOT NULL DEFAULT true,
  CONSTRAINT "concepto_tipo_equipo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "concepto_tipo_equipo_perfil_fkey"
    FOREIGN KEY ("costo_tipo_equipo_id") REFERENCES "costo_tipo_equipo"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "concepto_tipo_equipo_concepto_fkey"
    FOREIGN KEY ("concepto_equipo_id") REFERENCES "concepto_equipo"("id") ON UPDATE CASCADE,
  CONSTRAINT "concepto_tipo_equipo_perfil_concepto_key" UNIQUE ("costo_tipo_equipo_id", "concepto_equipo_id")
);
CREATE INDEX "concepto_tipo_equipo_perfil_idx" ON "concepto_tipo_equipo"("costo_tipo_equipo_id");
```

- [ ] **Step 3: Aplicar contra la base local**

Run: `docker exec -i supabase_db_s-codeControl psql -U postgres < supabase/migrations/<archivo>.sql`
Después registrá la versión en `supabase_migrations.schema_migrations`, igual que las anteriores.
Verificá que las dos tablas existan con `docker exec supabase_db_s-codeControl psql -U postgres -c "\d concepto_equipo"`.

- [ ] **Step 4: Agregar los modelos a Prisma**

```prisma
enum clase_calculo_concepto_equipo {
  FIJO
  PCT_VALOR_EQUIPO
  PCT_CONCEPTO
  PCT_SUMA_CONCEPTOS
  POR_KM
}

enum base_valor_equipo {
  VALOR_COMPRA
  VALOR_COMPRA_MAS_ACCESORIOS
  VALOR_RESIDUAL
}

/// Catálogo de conceptos de costo de la empresa. Un concepto porcentual guarda la regla;
/// el importe se resuelve por equipo, con los valores de cada unidad.
model concepto_equipo {
  id                    String                        @id @default(uuid()) @db.Uuid
  created_at            DateTime                      @default(now()) @db.Timestamptz(6)
  company_id            String                        @db.Uuid
  codigo                String
  nombre                String
  clase                 clase_item_costo
  clase_calculo         clase_calculo_concepto_equipo
  parametros            Json
  product_id            String?                       @db.Uuid
  indice_id             String?                       @db.Uuid
  precio_actualizado_at DateTime?                     @db.Timestamptz(6)
  orden                 Int                           @default(0)
  is_active             Boolean                       @default(true)

  company company   @relation(fields: [company_id], references: [id])
  product products? @relation(fields: [product_id], references: [id])
  indice  indices?  @relation(fields: [indice_id], references: [id])
  tipos   concepto_tipo_equipo[]

  @@unique([company_id, codigo])
  @@index([company_id])
}

/// Qué conceptos usa el perfil de costo de un tipo de equipo.
model concepto_tipo_equipo {
  id                   String  @id @default(uuid()) @db.Uuid
  costo_tipo_equipo_id String  @db.Uuid
  concepto_equipo_id   String  @db.Uuid
  orden                Int     @default(0)
  is_active            Boolean @default(true)

  costo_tipo costo_tipo_equipo @relation(fields: [costo_tipo_equipo_id], references: [id], onDelete: Cascade)
  concepto   concepto_equipo   @relation(fields: [concepto_equipo_id], references: [id])

  @@unique([costo_tipo_equipo_id, concepto_equipo_id])
  @@index([costo_tipo_equipo_id])
}
```

Agregá las relaciones inversas: `conceptos_equipo concepto_equipo[]` en `company`, `products` e `indices`; y `conceptos concepto_tipo_equipo[]` en `costo_tipo_equipo`.

- [ ] **Step 5: Regenerar y verificar**

Run: `npx prisma generate`
Expected: OK. `npm run check-types` sigue fallando por la Task 2, que es lo esperado.

- [ ] **Step 6: No commitear todavía**

Va junto con el resto, al cerrar la Task 6.

---

### Task 4: Tipos y validación de conceptos

**Files:**
- Create: `src/modules/costos/shared/types/concepto.types.ts`
- Create: `src/modules/costos/shared/validators/concepto-equipo.ts`
- Create: `src/modules/costos/shared/validators/concepto-equipo.test.ts`
- Modify: `src/modules/costos/shared/types/index.ts`

**Interfaces:**
- Consumes: `ClaseCalculoConceptoEquipo`, `BaseValorEquipo` (Task 1).
- Produces: `ConceptoEquipoClient`, `ConceptoEquipoInput`, `ConceptoTipoResumen`; `schemaParametros` (discriminated union de Zod), `validarParametros(clase_calculo, parametros)`, `derivarCodigo(nombre, existentes)`, `describirCalculo(concepto)`.

- [ ] **Step 1: Escribir el test de los validadores**

```ts
// src/modules/costos/shared/validators/concepto-equipo.test.ts
import { describe, it, expect } from 'vitest';
import { validarParametros, derivarCodigo, describirCalculo } from './concepto-equipo';

describe('validarParametros', () => {
  it('acepta FIJO con cantidad y precio', () => {
    expect(() => validarParametros('FIJO', { cantidad: 6, precio_unitario: 860000 })).not.toThrow();
  });

  it('rechaza FIJO sin precio_unitario', () => {
    expect(() => validarParametros('FIJO', { cantidad: 6 })).toThrow();
  });

  it('acepta PCT_VALOR_EQUIPO con pct en fracción y base válida', () => {
    expect(() => validarParametros('PCT_VALOR_EQUIPO', { pct: 0.17, base: 'VALOR_COMPRA' })).not.toThrow();
  });

  it('rechaza una base inexistente', () => {
    expect(() => validarParametros('PCT_VALOR_EQUIPO', { pct: 0.17, base: 'VALOR_INVENTADO' })).toThrow();
  });

  it('rechaza un pct mayor a 1 (se guarda en fracción, no en porcentaje)', () => {
    expect(() => validarParametros('PCT_VALOR_EQUIPO', { pct: 17, base: 'VALOR_COMPRA' })).toThrow();
  });

  it('acepta PCT_SUMA_CONCEPTOS con al menos un código', () => {
    expect(() => validarParametros('PCT_SUMA_CONCEPTOS', { pct: 0.03, conceptos_codigos: ['a'] })).not.toThrow();
  });

  it('rechaza PCT_SUMA_CONCEPTOS con lista vacía', () => {
    expect(() => validarParametros('PCT_SUMA_CONCEPTOS', { pct: 0.03, conceptos_codigos: [] })).toThrow();
  });

  it('acepta POR_KM con monto_por_km', () => {
    expect(() => validarParametros('POR_KM', { monto_por_km: 850 })).not.toThrow();
  });
});

describe('derivarCodigo', () => {
  it('normaliza acentos, mayúsculas y símbolos', () => {
    expect(derivarCodigo('Opticas delanteras 1 juego x año', [])).toBe('opticas_delanteras_1_juego_x_ano');
  });

  it('trunca a 40 caracteres', () => {
    const codigo = derivarCodigo('a'.repeat(60), []);
    expect(codigo.length).toBe(40);
  });

  it('agrega sufijo numérico ante colisión', () => {
    expect(derivarCodigo('Patentes', ['patentes'])).toBe('patentes_2');
    expect(derivarCodigo('Patentes', ['patentes', 'patentes_2'])).toBe('patentes_3');
  });

  it('es determinista: mismo nombre y mismos existentes dan el mismo código', () => {
    expect(derivarCodigo('Seguros', ['x'])).toBe(derivarCodigo('Seguros', ['x']));
  });
});

describe('describirCalculo', () => {
  it('describe un fijo con su importe', () => {
    expect(describirCalculo('FIJO', { cantidad: 6, precio_unitario: 860000 })).toBe('6 × $860.000');
  });

  it('describe un porcentaje del valor de compra', () => {
    expect(describirCalculo('PCT_VALOR_EQUIPO', { pct: 0.17, base: 'VALOR_COMPRA' })).toBe(
      '17% del valor de compra'
    );
  });

  it('describe un porcentaje de otro concepto', () => {
    expect(describirCalculo('PCT_CONCEPTO', { pct: 0.05, concepto_codigo: 'neumaticos' })).toBe(
      '5% de neumaticos'
    );
  });

  it('describe un monto por kilómetro', () => {
    expect(describirCalculo('POR_KM', { monto_por_km: 850 })).toBe('$850 por km');
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/modules/costos/shared/validators/concepto-equipo.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar los validadores**

```ts
// src/modules/costos/shared/validators/concepto-equipo.ts
import { z } from 'zod';
import type { ClaseCalculoConceptoEquipo } from '@/modules/costos/shared/utils/calcular-conceptos-equipo';

const pct = z.coerce.number().min(0).max(1, 'El porcentaje se guarda en fracción (0,17 = 17%)');

export const schemaParametrosFijo = z.object({
  cantidad: z.coerce.number().positive(),
  precio_unitario: z.coerce.number().nonnegative(),
});

export const schemaParametrosPctValorEquipo = z.object({
  pct,
  base: z.enum(['VALOR_COMPRA', 'VALOR_COMPRA_MAS_ACCESORIOS', 'VALOR_RESIDUAL']),
});

export const schemaParametrosPctConcepto = z.object({
  pct,
  concepto_codigo: z.string().min(1),
});

export const schemaParametrosPctSumaConceptos = z.object({
  pct,
  conceptos_codigos: z.array(z.string().min(1)).min(1, 'Elegí al menos un concepto'),
});

export const schemaParametrosPorKm = z.object({
  monto_por_km: z.coerce.number().nonnegative(),
});

const PORCLASE = {
  FIJO: schemaParametrosFijo,
  PCT_VALOR_EQUIPO: schemaParametrosPctValorEquipo,
  PCT_CONCEPTO: schemaParametrosPctConcepto,
  PCT_SUMA_CONCEPTOS: schemaParametrosPctSumaConceptos,
  POR_KM: schemaParametrosPorKm,
} as const;

/** Valida los parámetros según la clase de cálculo. Lanza ZodError si no corresponden. */
export function validarParametros(
  clase_calculo: ClaseCalculoConceptoEquipo,
  parametros: unknown
): Record<string, unknown> {
  return PORCLASE[clase_calculo].parse(parametros) as Record<string, unknown>;
}

/**
 * Deriva un código estable desde el nombre: minúsculas, sin acentos, no alfanuméricos a `_`,
 * truncado a 40. Ante colisión agrega un sufijo numérico. Determinista.
 */
export function derivarCodigo(nombre: string, existentes: string[]): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

  const usados = new Set(existentes);
  if (!usados.has(base)) return base;

  let n = 2;
  while (usados.has(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

const BASES_LEGIBLES: Record<string, string> = {
  VALOR_COMPRA: 'valor de compra',
  VALOR_COMPRA_MAS_ACCESORIOS: 'valor de compra más accesorios',
  VALOR_RESIDUAL: 'valor residual',
};

function money(v: number): string {
  return `$${new Intl.NumberFormat('es-AR').format(v)}`;
}

function pctLegible(v: number): string {
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(v * 100)}%`;
}

/** Texto corto que explica cómo se calcula un concepto, para mostrar en la tabla. */
export function describirCalculo(
  clase_calculo: ClaseCalculoConceptoEquipo,
  p: Record<string, unknown>
): string {
  switch (clase_calculo) {
    case 'FIJO':
      return `${p.cantidad} × ${money(Number(p.precio_unitario))}`;
    case 'PCT_VALOR_EQUIPO':
      return `${pctLegible(Number(p.pct))} del ${BASES_LEGIBLES[String(p.base)]}`;
    case 'PCT_CONCEPTO':
      return `${pctLegible(Number(p.pct))} de ${p.concepto_codigo}`;
    case 'PCT_SUMA_CONCEPTOS':
      return `${pctLegible(Number(p.pct))} de ${(p.conceptos_codigos as string[]).join(' + ')}`;
    case 'POR_KM':
      return `${money(Number(p.monto_por_km))} por km`;
  }
}
```

- [ ] **Step 4: Escribir los tipos client-safe**

```ts
// src/modules/costos/shared/types/concepto.types.ts
import type {
  ClaseCalculoConceptoEquipo,
  BaseValorEquipo,
} from '@/modules/costos/shared/utils/calcular-conceptos-equipo';
import type { ClaseItemCosto } from '@/modules/costos/shared/utils/calcular-costo-equipo';

export type { ClaseCalculoConceptoEquipo, BaseValorEquipo };

export type ConceptoEquipoInput = {
  nombre: string;
  clase: ClaseItemCosto;
  clase_calculo: ClaseCalculoConceptoEquipo;
  parametros: Record<string, unknown>;
  product_id?: string | null;
  indice_id?: string | null;
  orden?: number;
  is_active?: boolean;
};

export type ConceptoEquipoClient = {
  id: string;
  codigo: string;
  nombre: string;
  clase: ClaseItemCosto;
  clase_calculo: ClaseCalculoConceptoEquipo;
  parametros: Record<string, unknown>;
  /** Texto legible de cómo se calcula, resuelto en el servidor. */
  descripcion_calculo: string;
  product_id: string | null;
  product_code: string | null;
  indice_id: string | null;
  indice_nombre: string | null;
  precio_actualizado_at: Date | null;
  orden: number;
  is_active: boolean;
  /** En cuántos tipos de equipo se usa este concepto. */
  usado_en_tipos: number;
};

/** Fila de la tabla de tipos costeados. */
export type TipoCosteadoResumen = {
  type_id: string;
  perfil_id: string;
  nombre: string;
  equipos_count: number;
  accesorios_count: number;
  mantenimiento_count: number;
  /** Total de los conceptos FIJO; los porcentuales se resuelven por equipo. */
  total_fijo_accesorios: number;
  total_fijo_mantenimiento: number;
  /** Cuántos conceptos asociados dependen del equipo (porcentuales o por km). */
  conceptos_variables: number;
};

/** Detalle del perfil de un tipo: sus conceptos asociados. */
export type CostoTipoEquipoDetalle = {
  type_id: string;
  nombre: string;
  perfil_id: string;
  equipos_count: number;
  accesorios: ConceptoEquipoClient[];
  mantenimiento: ConceptoEquipoClient[];
  total_fijo_accesorios: number;
  total_fijo_mantenimiento: number;
  conceptos_variables: number;
};
```

En `src/modules/costos/shared/types/index.ts` agregá `export * from './concepto.types';` y quitá el re-export de `tipo-equipo.types` si dejó de existir (lo reemplaza este archivo en la Task 6).

- [ ] **Step 5: Correr los tests**

Run: `npx vitest run src/modules/costos/shared/validators/concepto-equipo.test.ts`
Expected: PASS, 16 tests.

- [ ] **Step 6: No commitear todavía**

---

### Task 5: Server actions del catálogo

**Files:**
- Create: `src/modules/costos/features/conceptos/actions.server.ts`
- Create: `src/modules/costos/features/conceptos/index.ts`

**Interfaces:**
- Consumes: los validadores y tipos de la Task 4; `ordenTopologicoConceptos` (Task 1) para el chequeo de ciclos; `assertModuloHabilitado`, `getRequiredActionContext`.
- Produces: `listConceptos()`, `createConcepto(input)`, `updateConcepto(id, input)`, `deleteConcepto(id)`, `refrescarPreciosConceptos()`, `aplicarIndiceConceptos(indiceId, anio, mes)`.

- [ ] **Step 1: Escribir las actions**

```ts
// src/modules/costos/features/conceptos/actions.server.ts
'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { Decimal } from '@/modules/costos/shared/utils/decimal';
import {
  ordenTopologicoConceptos,
  type ConceptoEquipoCalc,
} from '@/modules/costos/shared/utils/calcular-conceptos-equipo';
import {
  validarParametros,
  derivarCodigo,
  describirCalculo,
} from '@/modules/costos/shared/validators/concepto-equipo';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type {
  ConceptoEquipoClient,
  ConceptoEquipoInput,
} from '@/modules/costos/shared/types/concepto.types';

const CONCEPTOS_PATH = '/dashboard/costos/conceptos';
const TIPOS_PATH = '/dashboard/costos/tipos-equipo';
const EQUIPOS_PATH = '/dashboard/costos/equipos';

const schemaConcepto = z.object({
  nombre: z.string().min(1).max(200),
  clase: z.enum(['ACCESORIO', 'MANTENIMIENTO']),
  clase_calculo: z.enum(['FIJO', 'PCT_VALOR_EQUIPO', 'PCT_CONCEPTO', 'PCT_SUMA_CONCEPTOS', 'POR_KM']),
  parametros: z.record(z.unknown()),
  product_id: z.string().uuid().nullable().optional(),
  indice_id: z.string().uuid().nullable().optional(),
  orden: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

type ConceptoRow = {
  id: string;
  codigo: string;
  nombre: string;
  clase: 'ACCESORIO' | 'MANTENIMIENTO';
  clase_calculo: 'FIJO' | 'PCT_VALOR_EQUIPO' | 'PCT_CONCEPTO' | 'PCT_SUMA_CONCEPTOS' | 'POR_KM';
  parametros: unknown;
  product_id: string | null;
  indice_id: string | null;
  precio_actualizado_at: Date | null;
  orden: number;
  is_active: boolean;
  product?: { code: string; company_id: string } | null;
  indice?: { nombre: string } | null;
  _count?: { tipos: number };
};

function toConceptoClient(c: ConceptoRow, companyId: string): ConceptoEquipoClient {
  const parametros = (c.parametros ?? {}) as Record<string, unknown>;
  const productoPropio = c.product && c.product.company_id === companyId ? c.product : null;
  return {
    id: c.id,
    codigo: c.codigo,
    nombre: c.nombre,
    clase: c.clase,
    clase_calculo: c.clase_calculo,
    parametros,
    descripcion_calculo: describirCalculo(c.clase_calculo, parametros),
    product_id: c.product_id,
    product_code: productoPropio?.code ?? null,
    indice_id: c.indice_id,
    indice_nombre: c.indice?.nombre ?? null,
    precio_actualizado_at: c.precio_actualizado_at,
    orden: c.orden,
    is_active: c.is_active,
    usado_en_tipos: c._count?.tipos ?? 0,
  };
}

async function assertProductoPertenece(productId: string, companyId: string) {
  const p = await prisma.products.findFirst({
    where: { id: productId, company_id: companyId },
    select: { id: true },
  });
  if (!p) throw new Error('Producto no encontrado o sin acceso');
}

async function assertIndicePertenece(indiceId: string, companyId: string) {
  const i = await prisma.indices.findFirst({
    where: { id: indiceId, company_id: companyId },
    select: { id: true },
  });
  if (!i) throw new Error('Índice no encontrado o sin acceso');
}

/**
 * Verifica que el catálogo resultante siga siendo resoluble: sin referencias colgadas y sin
 * ciclos. Se corre ANTES de escribir, sobre el catálogo completo con el cambio aplicado.
 */
async function assertCatalogoResoluble(
  companyId: string,
  cambio: { id?: string; codigo: string; clase: 'ACCESORIO' | 'MANTENIMIENTO'; clase_calculo: ConceptoRow['clase_calculo']; parametros: Record<string, unknown> }
) {
  const existentes = await prisma.concepto_equipo.findMany({
    where: { company_id: companyId, is_active: true },
    select: { id: true, codigo: true, clase: true, clase_calculo: true, parametros: true },
  });

  const conceptos: ConceptoEquipoCalc[] = existentes
    .filter((c) => c.id !== cambio.id)
    .map((c) => ({
      codigo: c.codigo,
      clase: c.clase,
      clase_calculo: c.clase_calculo,
      parametros: (c.parametros ?? {}) as Record<string, unknown>,
    }));

  conceptos.push({
    codigo: cambio.codigo,
    clase: cambio.clase,
    clase_calculo: cambio.clase_calculo,
    parametros: cambio.parametros,
  });

  // Lanza CicloConceptosEquipoError o ReferenciaConceptoEquipoInvalidaError si algo no cierra.
  ordenTopologicoConceptos(conceptos);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listConceptos(): Promise<ConceptoEquipoClient[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const conceptos = await prisma.concepto_equipo.findMany({
    where: { company_id: companyId },
    include: {
      product: { select: { code: true, company_id: true } },
      indice: { select: { nombre: true } },
      _count: { select: { tipos: true } },
    },
    orderBy: [{ clase: 'asc' }, { orden: 'asc' }, { nombre: 'asc' }],
  });

  return conceptos.map((c) => toConceptoClient(c as ConceptoRow, companyId));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createConcepto(input: ConceptoEquipoInput): Promise<string> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const parsed = schemaConcepto.parse(input);
  const parametros = validarParametros(parsed.clase_calculo, parsed.parametros);

  if (parsed.product_id) await assertProductoPertenece(parsed.product_id, companyId);
  if (parsed.indice_id) await assertIndicePertenece(parsed.indice_id, companyId);

  const existentes = await prisma.concepto_equipo.findMany({
    where: { company_id: companyId },
    select: { codigo: true },
  });
  const codigo = derivarCodigo(parsed.nombre, existentes.map((e) => e.codigo));

  await assertCatalogoResoluble(companyId, {
    codigo,
    clase: parsed.clase,
    clase_calculo: parsed.clase_calculo,
    parametros,
  });

  const creado = await prisma.concepto_equipo.create({
    data: {
      company_id: companyId,
      codigo,
      nombre: parsed.nombre,
      clase: parsed.clase,
      clase_calculo: parsed.clase_calculo,
      parametros,
      product_id: parsed.product_id ?? null,
      indice_id: parsed.indice_id ?? null,
      precio_actualizado_at: parsed.product_id ? new Date() : null,
      orden: parsed.orden ?? 0,
      is_active: parsed.is_active ?? true,
    },
  });

  revalidatePath(CONCEPTOS_PATH);
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
  return creado.id;
}

export async function updateConcepto(id: string, input: Partial<ConceptoEquipoInput>) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existente = await prisma.concepto_equipo.findFirst({
    where: { id, company_id: companyId },
  });
  if (!existente) throw new Error('Concepto no encontrado o sin acceso');

  const parsed = schemaConcepto.partial().parse(input);
  const clase_calculo = parsed.clase_calculo ?? existente.clase_calculo;
  const parametros = parsed.parametros
    ? validarParametros(clase_calculo, parsed.parametros)
    : ((existente.parametros ?? {}) as Record<string, unknown>);

  if (parsed.product_id) await assertProductoPertenece(parsed.product_id, companyId);
  if (parsed.indice_id) await assertIndicePertenece(parsed.indice_id, companyId);

  await assertCatalogoResoluble(companyId, {
    id,
    codigo: existente.codigo,
    clase: parsed.clase ?? existente.clase,
    clase_calculo,
    parametros,
  });

  await prisma.concepto_equipo.update({
    where: { id },
    data: {
      nombre: parsed.nombre ?? existente.nombre,
      clase: parsed.clase ?? existente.clase,
      clase_calculo,
      parametros,
      product_id: parsed.product_id === undefined ? existente.product_id : parsed.product_id,
      indice_id: parsed.indice_id === undefined ? existente.indice_id : parsed.indice_id,
      orden: parsed.orden ?? existente.orden,
      is_active: parsed.is_active ?? existente.is_active,
    },
  });

  revalidatePath(CONCEPTOS_PATH);
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
}

/** Borra un concepto. Falla si está asociado a algún tipo: primero hay que desasociarlo. */
export async function deleteConcepto(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existente = await prisma.concepto_equipo.findFirst({
    where: { id, company_id: companyId },
    include: { _count: { select: { tipos: true } } },
  });
  if (!existente) throw new Error('Concepto no encontrado o sin acceso');
  if (existente._count.tipos > 0) {
    throw new Error(
      `No se puede eliminar: el concepto está asociado a ${existente._count.tipos} tipo(s) de equipo`
    );
  }

  await prisma.concepto_equipo.delete({ where: { id } });
  revalidatePath(CONCEPTOS_PATH);
}

/** Refresca el precio de los conceptos FIJO vinculados a un producto del almacén. */
export async function refrescarPreciosConceptos(): Promise<{ actualizados: number }> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const conceptos = await prisma.concepto_equipo.findMany({
    where: { company_id: companyId, clase_calculo: 'FIJO', product_id: { not: null } },
    select: { id: true, product_id: true, parametros: true },
  });
  if (conceptos.length === 0) return { actualizados: 0 };

  const productos = await prisma.products.findMany({
    where: { id: { in: conceptos.map((c) => c.product_id!) }, company_id: companyId },
    select: { id: true, cost_price: true },
  });
  const precios = new Map(productos.map((p) => [p.id, p.cost_price.toString()]));

  const cambios = conceptos.flatMap((c) => {
    const nuevo = precios.get(c.product_id!);
    if (nuevo == null) return [];
    const p = (c.parametros ?? {}) as Record<string, unknown>;
    if (new Decimal(String(p.precio_unitario ?? 0)).eq(new Decimal(nuevo))) return [];
    return [{ id: c.id, parametros: { ...p, precio_unitario: nuevo } }];
  });

  if (cambios.length > 0) {
    const ahora = new Date();
    await prisma.$transaction(
      cambios.map((c) =>
        prisma.concepto_equipo.update({
          where: { id: c.id },
          data: { parametros: c.parametros, precio_actualizado_at: ahora },
        })
      )
    );
    revalidatePath(CONCEPTOS_PATH);
    revalidatePath(TIPOS_PATH);
    revalidatePath(EQUIPOS_PATH);
  }

  return { actualizados: cambios.length };
}

/**
 * Aplica la variación de un índice a los conceptos FIJO que lo tengan asociado.
 * `variacion` está en porcentaje (4.2 = +4,2%), como en index_values.
 */
export async function aplicarIndiceConceptos(
  indiceId: string,
  anio: number,
  mes: number
): Promise<{ actualizados: number }> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertIndicePertenece(indiceId, companyId);

  const valor = await prisma.index_values.findUnique({
    where: { indice_id_anio_mes: { indice_id: indiceId, anio, mes } },
    select: { variacion: true },
  });
  if (!valor) throw new Error('No hay valor cargado para ese índice en el período indicado');

  const factor = new Decimal(1).add(new Decimal(valor.variacion.toString()).div(100));

  const conceptos = await prisma.concepto_equipo.findMany({
    where: { company_id: companyId, clase_calculo: 'FIJO', indice_id: indiceId },
    select: { id: true, parametros: true },
  });
  if (conceptos.length === 0) return { actualizados: 0 };

  const ahora = new Date();
  await prisma.$transaction(
    conceptos.map((c) => {
      const p = (c.parametros ?? {}) as Record<string, unknown>;
      const nuevo = new Decimal(String(p.precio_unitario ?? 0)).mul(factor).toDecimalPlaces(2);
      return prisma.concepto_equipo.update({
        where: { id: c.id },
        data: {
          parametros: { ...p, precio_unitario: nuevo.toFixed(2) },
          precio_actualizado_at: ahora,
        },
      });
    })
  );

  revalidatePath(CONCEPTOS_PATH);
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
  return { actualizados: conceptos.length };
}
```

- [ ] **Step 2: Barrel del feature**

```ts
// src/modules/costos/features/conceptos/index.ts
export * from './actions.server';
```

- [ ] **Step 3: Verificar tipos**

Run: `npm run check-types`
Expected: sigue fallando sólo por la Task 2 (los consumidores viejos del motor). Ningún error nuevo en los archivos de esta tarea.

- [ ] **Step 4: No commitear todavía**

---

### Task 6: Adaptar tipos-equipo y las lecturas al catálogo

**Files:**
- Modify: `src/modules/costos/features/tipos-equipo/actions.server.ts`
- Modify: `src/modules/costos/shared/utils/calcular-equipos-servicio.ts`
- Modify: `src/modules/costos/shared/utils/calcular-equipos-servicio.test.ts`
- Modify: `src/modules/costos/features/equipos/actions.server.ts`
- Modify: `src/modules/costos/shared/types/equipo.types.ts`
- Delete: `src/modules/costos/shared/types/tipo-equipo.types.ts`

**Interfaces:**
- Consumes: `calcularCostoMensualEquipo` con `conceptos` y `km_anuales` (Task 2); tipos de la Task 4.
- Produces: `listTiposCosteados()`, `listTiposDisponibles()`, `crearCostoTipoEquipo(typeId, conceptoIds)`, `asociarConcepto(perfilId, conceptoId)`, `desasociarConcepto(asociacionId)`, `eliminarCostoTipoEquipo(perfilId)`, `getCostoTipoEquipo(typeId)`; el helper `conceptosPorTipoDeEmpresa(companyId): Promise<Map<string, ConceptoEquipoCalc[]>>`.

- [ ] **Step 1: Adaptar el test de agregación por servicio**

En `calcular-equipos-servicio.test.ts`, los fixtures pasan de `items_tipo` a `conceptos` y suman `km_anuales`. Agregá este caso, que es lo nuevo:

```ts
it('un concepto porcentual da distinto costo a dos equipos del mismo tipo', () => {
  const conceptos = [
    { codigo: 'patentes', clase: 'MANTENIMIENTO' as const, clase_calculo: 'PCT_VALOR_EQUIPO' as const,
      parametros: { pct: '0.17', base: 'VALOR_COMPRA' } },
  ];
  const { por_vehiculo } = agregarEquipos([
    { asignacion_id: 'a1', vehicle_id: 'v1', interno: '101', descripcion: 'Caro',
      afectacion_pct: 1, valor_compra: '247625000', valor_residual_pct: '0.35',
      anios_amortizacion: 5, km_anuales: 0, conceptos },
    { asignacion_id: 'a2', vehicle_id: 'v2', interno: '102', descripcion: 'Barato',
      afectacion_pct: 1, valor_compra: '32000000', valor_residual_pct: '0.35',
      anios_amortizacion: 5, km_anuales: 0, conceptos },
  ]);
  expect(por_vehiculo[0].mantenimiento_mensual.toDecimalPlaces(2).toNumber()).toBe(3508020.83);
  expect(por_vehiculo[1].mantenimiento_mensual.toDecimalPlaces(2).toNumber()).toBe(453333.33);
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/modules/costos/shared/utils/calcular-equipos-servicio.test.ts`
Expected: FAIL — `conceptos` no existe en `EquipoServicioCalc`.

- [ ] **Step 3: Adaptar `calcular-equipos-servicio.ts`**

`EquipoServicioCalc` reemplaza `items_tipo: ItemCostoTipoCalc[]` por `conceptos: ConceptoEquipoCalc[]` y suma `km_anuales: number`. `EquipoServicioResultado` no cambia. En `calcularEquiposServicio`, el `Map` pasa a traer conceptos vía la asociación:

```ts
const perfiles = await prisma.costo_tipo_equipo.findMany({
  where: { company_id: servicio.company_id },
  include: {
    conceptos: {
      where: { is_active: true },
      include: { concepto: true },
    },
  },
});

const conceptosPorTipo = new Map(
  perfiles.map((p) => [
    p.type_id,
    p.conceptos
      .filter((a) => a.concepto.is_active)
      .map((a) => ({
        codigo: a.concepto.codigo,
        clase: a.concepto.clase,
        clase_calculo: a.concepto.clase_calculo,
        parametros: (a.concepto.parametros ?? {}) as Record<string, unknown>,
      })),
  ])
);
```

y en el `map` de cada asignación: `conceptos: conceptosPorTipo.get(a.vehicle.type) ?? []`, `km_anuales: c.km_anuales`. Se mantiene el criterio de exclusión actual: sólo se excluye el equipo sin `costo_equipo` activo.

- [ ] **Step 4: Reescribir las actions de tipos-equipo**

En `features/tipos-equipo/actions.server.ts`: eliminá las actions de ítems (`addItemCostoTipo`, `updateItemCostoTipo`, `deleteItemCostoTipo`, `bulkAddItemsCostoTipo`, `refrescarPreciosDesdeAlmacen`, `ensureCostoTipoEquipo`, `listTiposEquipoConCosto`) y el helper `toItemClient`. En su lugar:

```ts
/** Conceptos activos por tipo, en una sola query, para evitar el N+1. */
export async function conceptosPorTipoDeEmpresa(
  companyId: string
): Promise<Map<string, ConceptoEquipoCalc[]>> {
  const perfiles = await prisma.costo_tipo_equipo.findMany({
    where: { company_id: companyId },
    include: { conceptos: { where: { is_active: true }, include: { concepto: true } } },
  });
  return new Map(
    perfiles.map((p) => [
      p.type_id,
      p.conceptos
        .filter((a) => a.concepto.is_active)
        .map((a) => ({
          codigo: a.concepto.codigo,
          clase: a.concepto.clase,
          clase_calculo: a.concepto.clase_calculo,
          parametros: (a.concepto.parametros ?? {}) as Record<string, unknown>,
        })),
    ])
  );
}

/** Sólo los tipos que la empresa decidió costear. */
export async function listTiposCosteados(): Promise<TipoCosteadoResumen[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const [perfiles, conteos] = await Promise.all([
    prisma.costo_tipo_equipo.findMany({
      where: { company_id: companyId },
      include: {
        tipo: { select: { id: true, name: true } },
        conceptos: { where: { is_active: true }, include: { concepto: true } },
      },
    }),
    prisma.vehicles.groupBy({
      by: ['type'],
      where: { company_id: companyId },
      _count: { _all: true },
    }),
  ]);
  const equiposPorTipo = new Map(conteos.map((c) => [c.type, c._count._all]));

  return perfiles
    .map((p) => {
      const activos = p.conceptos.map((a) => a.concepto).filter((c) => c.is_active);
      const fijos = activos.filter((c) => c.clase_calculo === 'FIJO');
      const sumaFija = (clase: 'ACCESORIO' | 'MANTENIMIENTO') =>
        fijos
          .filter((c) => c.clase === clase)
          .reduce((acc, c) => {
            const par = (c.parametros ?? {}) as Record<string, unknown>;
            return acc.add(
              new Decimal(String(par.cantidad ?? 0)).mul(new Decimal(String(par.precio_unitario ?? 0)))
            );
          }, new Decimal(0));

      return {
        type_id: p.type_id,
        perfil_id: p.id,
        nombre: p.tipo.name,
        equipos_count: equiposPorTipo.get(p.type_id) ?? 0,
        accesorios_count: activos.filter((c) => c.clase === 'ACCESORIO').length,
        mantenimiento_count: activos.filter((c) => c.clase === 'MANTENIMIENTO').length,
        total_fijo_accesorios: sumaFija('ACCESORIO').toDecimalPlaces(2).toNumber(),
        total_fijo_mantenimiento: sumaFija('MANTENIMIENTO').toDecimalPlaces(2).toNumber(),
        conceptos_variables: activos.filter((c) => c.clase_calculo !== 'FIJO').length,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/** Tipos de la empresa que todavía no tienen costo creado, para el selector de alta. */
export async function listTiposDisponibles(): Promise<{ id: string; nombre: string; equipos: number }[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const [conteos, perfiles] = await Promise.all([
    prisma.vehicles.groupBy({
      by: ['type'],
      where: { company_id: companyId },
      _count: { _all: true },
    }),
    prisma.costo_tipo_equipo.findMany({
      where: { company_id: companyId },
      select: { type_id: true },
    }),
  ]);
  const yaCosteados = new Set(perfiles.map((p) => p.type_id));

  const tipos = await prisma.type.findMany({
    where: {
      is_active: true,
      id: { notIn: [...yaCosteados] },
      OR: [{ company_id: companyId }, { id: { in: conteos.map((c) => c.type) } }],
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const equiposPorTipo = new Map(conteos.map((c) => [c.type, c._count._all]));
  return tipos.map((t) => ({
    id: t.id,
    nombre: t.name,
    equipos: equiposPorTipo.get(t.id) ?? 0,
  }));
}

/** Crea el perfil del tipo y le asocia los conceptos elegidos. */
export async function crearCostoTipoEquipo(typeId: string, conceptoIds: string[]): Promise<string> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const tipo = await prisma.type.findFirst({
    where: { id: typeId, OR: [{ company_id: companyId }, { company_id: null }] },
    select: { id: true },
  });
  if (!tipo) throw new Error('Tipo de equipo no encontrado o sin acceso');

  const ids = z.array(z.string().uuid()).parse(conceptoIds);
  if (ids.length > 0) {
    const propios = await prisma.concepto_equipo.count({
      where: { id: { in: ids }, company_id: companyId },
    });
    if (propios !== new Set(ids).size) throw new Error('Algún concepto no existe o no es de la empresa');
  }

  const perfil = await prisma.costo_tipo_equipo.upsert({
    where: { company_id_type_id: { company_id: companyId, type_id: typeId } },
    create: { company_id: companyId, type_id: typeId },
    update: {},
  });

  if (ids.length > 0) {
    await prisma.concepto_tipo_equipo.createMany({
      data: ids.map((conceptoId, idx) => ({
        costo_tipo_equipo_id: perfil.id,
        concepto_equipo_id: conceptoId,
        orden: idx,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
  return perfil.id;
}

export async function asociarConcepto(perfilId: string, conceptoId: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertPerfilPertenece(perfilId, companyId);

  const concepto = await prisma.concepto_equipo.findFirst({
    where: { id: conceptoId, company_id: companyId },
    select: { id: true },
  });
  if (!concepto) throw new Error('Concepto no encontrado o sin acceso');

  const cuantos = await prisma.concepto_tipo_equipo.count({
    where: { costo_tipo_equipo_id: perfilId },
  });

  await prisma.concepto_tipo_equipo.create({
    data: { costo_tipo_equipo_id: perfilId, concepto_equipo_id: conceptoId, orden: cuantos },
  });
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
}

export async function desasociarConcepto(asociacionId: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const asociacion = await prisma.concepto_tipo_equipo.findUnique({
    where: { id: asociacionId },
    select: { costo_tipo_equipo_id: true },
  });
  if (!asociacion) throw new Error('Asociación no encontrada');
  await assertPerfilPertenece(asociacion.costo_tipo_equipo_id, companyId);

  await prisma.concepto_tipo_equipo.delete({ where: { id: asociacionId } });
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
}

/** Deshace la decisión de costear un tipo. Borra el perfil y sus asociaciones. */
export async function eliminarCostoTipoEquipo(perfilId: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertPerfilPertenece(perfilId, companyId);

  await prisma.costo_tipo_equipo.delete({ where: { id: perfilId } });
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
}
```

`getCostoTipoEquipo(typeId)` se conserva y devuelve `CostoTipoEquipoDetalle`. Para no duplicar el mapeo a cliente, **importá `describirCalculo` desde `@/modules/costos/shared/validators/concepto-equipo`** (es una función pura, no una action) y armá el `ConceptoEquipoClient` acá mismo — no importes `toConceptoClient` desde `features/conceptos/actions.server.ts`, porque ese archivo tiene `'use server'` y todo lo que exporta debe ser una función async tratada como server action.

Devuelve `null` si el tipo no tiene perfil. La forma del retorno:

```ts
return {
  type_id: tipo.id,
  nombre: tipo.name,
  perfil_id: perfil.id,
  equipos_count,
  accesorios: conceptosClient.filter((c) => c.clase === 'ACCESORIO'),
  mantenimiento: conceptosClient.filter((c) => c.clase === 'MANTENIMIENTO'),
  total_fijo_accesorios: sumaFija('ACCESORIO').toDecimalPlaces(2).toNumber(),
  total_fijo_mantenimiento: sumaFija('MANTENIMIENTO').toDecimalPlaces(2).toNumber(),
  conceptos_variables: conceptosClient.filter((c) => c.clase_calculo !== 'FIJO').length,
};
```

donde `sumaFija(clase)` es la misma función que en `listTiposCosteados`: suma `cantidad × precio_unitario` en `Decimal` sólo de los conceptos `FIJO` de esa clase. Cada `ConceptoEquipoClient` incluye además el `id` de su fila en `concepto_tipo_equipo` para poder desasociarlo, en un campo `asociacion_id: string` que hay que sumar al tipo en `concepto.types.ts`.

- [ ] **Step 5: Adaptar las lecturas de equipos**

En `features/equipos/actions.server.ts`, reemplazá `itemsPorTipoDeEmpresa` e `itemsDelTipo` por el uso de `conceptosPorTipoDeEmpresa`, y pasá al motor `conceptos` y `km_anuales: ce.km_anuales`. En `getEquipoParaEdicion` agregá al retorno el desglose por concepto resuelto para esa unidad:

```ts
conceptos_resueltos: conceptos.map((c) => ({
  codigo: c.codigo,
  nombre: nombrePorCodigo.get(c.codigo) ?? c.codigo,
  clase: c.clase,
  descripcion_calculo: describirCalculo(c.clase_calculo, c.parametros),
  importe: (por_concepto.get(c.codigo) ?? new Decimal(0)).toDecimalPlaces(2).toNumber(),
})),
```

En `equipo.types.ts`, agregá el tipo `ConceptoResueltoClient = { codigo: string; nombre: string; clase: ClaseItemCosto; descripcion_calculo: string; importe: number }` y sumalo al retorno de `getEquipoParaEdicion`.

- [ ] **Step 6: Borrar el tipo viejo**

```bash
git rm src/modules/costos/shared/types/tipo-equipo.types.ts
```
y quitá su re-export de `types/index.ts`.

- [ ] **Step 7: Verificar**

Run: `npm run check-types`
Expected: fallará sólo en los componentes de UI que todavía usan lo viejo (`TablaItemsCostoTipo`, `ImportarItemsDialog`, `TablaTiposEquipo`, las pages). Lo cierra la Task 8.

Run: `npx vitest run src/modules/costos/shared/utils/`
Expected: PASS, con el golden intacto.

- [ ] **Step 8: No commitear todavía**

---

### Task 7: Migración de datos al catálogo

**Files:**
- Create: `supabase/migrations/<timestamp>_migrar_items_a_conceptos.sql`

- [ ] **Step 1: Crear el archivo**

Run: `npm run create-migration -- migrar_items_a_conceptos`

- [ ] **Step 2: Escribir el SQL**

```sql
-- Convierte los ítems planos de item_costo_tipo en conceptos del catálogo por empresa.
-- Cada (company_id, nombre, clase) distinto se vuelve UN concepto FIJO, y los perfiles que lo
-- usaban quedan asociados a él: los nombres repetidos entre tipos se unifican.
-- Los importes no cambian: cantidad y precio_unitario se conservan tal cual en parametros.

-- Respaldo previo: la conversión es irreversible y conviene poder auditarla.
CREATE TABLE IF NOT EXISTS "item_costo_tipo_backup_20260831" AS
  SELECT i.*, c."company_id", c."type_id"
  FROM "item_costo_tipo" i
  JOIN "costo_tipo_equipo" c ON c."id" = i."costo_tipo_equipo_id";

-- 1) Un concepto por cada (empresa, nombre, clase) distinto.
--    El código se deriva del nombre: minúsculas, sin acentos, no alfanuméricos a '_', 40 chars.
--    Ante colisión dentro de la empresa se agrega un sufijo numérico por row_number.
WITH distintos AS (
  SELECT c."company_id",
         i."nombre",
         i."clase",
         MIN(i."orden")                                        AS orden,
         (ARRAY_AGG(i."cantidad"        ORDER BY i."orden", i."id"))[1] AS cantidad,
         (ARRAY_AGG(i."precio_unitario" ORDER BY i."orden", i."id"))[1] AS precio_unitario,
         (ARRAY_AGG(i."product_id"      ORDER BY i."orden", i."id"))[1] AS product_id,
         (ARRAY_AGG(i."precio_actualizado_at" ORDER BY i."orden", i."id"))[1] AS precio_actualizado_at
  FROM "item_costo_tipo" i
  JOIN "costo_tipo_equipo" c ON c."id" = i."costo_tipo_equipo_id"
  GROUP BY c."company_id", i."nombre", i."clase"
), con_codigo AS (
  SELECT d.*,
         LEFT(
           REGEXP_REPLACE(
             REGEXP_REPLACE(LOWER(TRANSLATE(d."nombre",
               'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), '[^a-z0-9]+', '_', 'g'),
             '^_+|_+$', '', 'g'),
           40) AS codigo_base,
         ROW_NUMBER() OVER (
           PARTITION BY d."company_id",
             LEFT(REGEXP_REPLACE(REGEXP_REPLACE(LOWER(TRANSLATE(d."nombre",
               'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), '[^a-z0-9]+', '_', 'g'),
               '^_+|_+$', '', 'g'), 40)
           ORDER BY d."clase", d."nombre") AS n
  FROM distintos d
)
INSERT INTO "concepto_equipo"
  ("company_id", "codigo", "nombre", "clase", "clase_calculo", "parametros",
   "product_id", "precio_actualizado_at", "orden")
SELECT "company_id",
       CASE WHEN n = 1 THEN codigo_base ELSE codigo_base || '_' || n END,
       "nombre",
       "clase",
       'FIJO',
       jsonb_build_object('cantidad', "cantidad", 'precio_unitario', "precio_unitario"),
       "product_id",
       "precio_actualizado_at",
       "orden"
FROM con_codigo;

-- 2) Asociar cada perfil a los conceptos que tenía, conservando el orden.
INSERT INTO "concepto_tipo_equipo" ("costo_tipo_equipo_id", "concepto_equipo_id", "orden")
SELECT i."costo_tipo_equipo_id", ce."id", i."orden"
FROM "item_costo_tipo" i
JOIN "costo_tipo_equipo" c  ON c."id"  = i."costo_tipo_equipo_id"
JOIN "concepto_equipo"   ce ON ce."company_id" = c."company_id"
                           AND ce."nombre"     = i."nombre"
                           AND ce."clase"      = i."clase"
ON CONFLICT ("costo_tipo_equipo_id", "concepto_equipo_id") DO NOTHING;

-- 3) Informar el resultado, para revisión.
DO $$
DECLARE conceptos integer; asociaciones integer;
BEGIN
  SELECT COUNT(*) INTO conceptos    FROM "concepto_equipo";
  SELECT COUNT(*) INTO asociaciones FROM "concepto_tipo_equipo";
  RAISE NOTICE 'Conceptos creados: % · asociaciones: %', conceptos, asociaciones;
END $$;

DROP TABLE "item_costo_tipo";
```

- [ ] **Step 3: Aplicar y verificar contra la base**

Aplicá con `docker exec -i supabase_db_s-codeControl psql -U postgres < <archivo>` y registrá la versión a mano.

Verificá que los importes no se movieron:

```sql
SELECT t.name AS tipo,
       COUNT(*) FILTER (WHERE ce.clase = 'ACCESORIO')     AS accesorios,
       COUNT(*) FILTER (WHERE ce.clase = 'MANTENIMIENTO') AS mantenimiento,
       SUM((ce.parametros->>'cantidad')::numeric * (ce.parametros->>'precio_unitario')::numeric)
         FILTER (WHERE ce.clase = 'MANTENIMIENTO')        AS mant_anual
FROM costo_tipo_equipo c
JOIN type t ON t.id = c.type_id
LEFT JOIN concepto_tipo_equipo a ON a.costo_tipo_equipo_id = c.id
LEFT JOIN concepto_equipo ce ON ce.id = a.concepto_equipo_id
GROUP BY t.name ORDER BY t.name;
```

Expected, exactamente: **Supervisión** → 0 accesorios, 4 mantenimiento, 14.048.525,00; **Transporte de carga** → 1 accesorio, 33 mantenimiento, 46.789.601,33. Si alguna suma no coincide al centavo, la migración está mal y hay que corregirla, no justificarla.

- [ ] **Step 4: Actualizar Prisma**

Borrá el modelo `item_costo_tipo` de `prisma/schema.prisma` y la relación `items` de `costo_tipo_equipo`. Run: `npx prisma generate`.

- [ ] **Step 5: No commitear todavía**

---

### Task 8: UI del catálogo y de los tipos costeados

**Files:**
- Create: `src/app/dashboard/costos/conceptos/page.tsx`
- Create: `src/modules/costos/features/conceptos/components/TablaConceptos.tsx`
- Create: `src/modules/costos/features/conceptos/components/FormConcepto.tsx`
- Create: `src/modules/costos/features/tipos-equipo/components/DialogCrearCostoTipo.tsx`
- Modify: `src/modules/costos/features/tipos-equipo/components/TablaTiposEquipo.tsx`
- Modify: `src/app/dashboard/costos/tipos-equipo/page.tsx`
- Modify: `src/app/dashboard/costos/tipos-equipo/[typeId]/page.tsx`
- Modify: `src/modules/costos/features/equipos/components/ItemsHeredadosDelTipo.tsx`
- Modify: `src/modules/costos/components/CostosDashboard.tsx`
- Delete: `src/modules/costos/features/tipos-equipo/components/TablaItemsCostoTipo.tsx`
- Delete: `src/modules/costos/features/tipos-equipo/components/ImportarItemsDialog.tsx`
- Delete: `src/modules/costos/features/tipos-equipo/components/BotonRefrescarPrecios.tsx`

**Interfaces:**
- Consumes: las actions de las Tasks 5 y 6; `SearchableSelect` de `@/shared/components/ui/searchable-select`; `getProductsByCompany` importado en la page y filtrado por empresa activa.

**Patrones a seguir, ya presentes en el repo** (leelos antes de escribir): `src/modules/costos/features/tipos-equipo/components/TablaItemsCostoTipo.tsx` para el patrón tabla + `Dialog` de alta/edición + `router.refresh()` + `toast`; `src/modules/costos/features/cct/components/FormConcepto.tsx` para un formulario cuyos campos cambian según la clase de cálculo elegida — es el mismo problema ya resuelto para los conceptos de CCT.

- [ ] **Step 1: Pantalla del catálogo**

`src/app/dashboard/costos/conceptos/page.tsx` es un server component que llama a `listConceptos()`, trae los productos con `getProductsByCompany()` filtrados por la empresa activa (mismo patrón que `[typeId]/page.tsx` hoy) y los índices con `prisma.indices.findMany({ where: { company_id } })` a través de una action del feature, y se los pasa por props a `TablaConceptos`.

`TablaConceptos` es un client component con la tabla (nombre, clase, cómo se calcula usando `descripcion_calculo`, producto vinculado, índice, en cuántos tipos se usa, acciones) y los diálogos de alta y edición, siguiendo el patrón de `TablaItemsCostoTipo` actual: `Dialog` + `Table` + `router.refresh()` + `toast`.

`FormConcepto` es el formulario que cambia según la clase de cálculo elegida:

| Clase | Campos |
|---|---|
| `FIJO` | cantidad, precio unitario, producto de almacén (opcional), índice (opcional) |
| `PCT_VALOR_EQUIPO` | porcentaje (en %, se guarda /100), base (select con las tres bases) |
| `PCT_CONCEPTO` | porcentaje, concepto base (select con los conceptos existentes) |
| `PCT_SUMA_CONCEPTOS` | porcentaje, conceptos base (multi-select) |
| `POR_KM` | monto por kilómetro |

Comunes a todas: nombre y clase (ACCESORIO / MANTENIMIENTO). El formulario arma `parametros` según la clase y llama a `createConcepto` o `updateConcepto`. Los errores de ciclo y de referencia llegan como `Error` de la action y se muestran con `toast.error(err.message)`: el mensaje ya viene legible desde el motor.

- [ ] **Step 2: Diálogo de creación de costo de tipo**

`DialogCrearCostoTipo` recibe `tiposDisponibles` y `conceptos` por props. Tiene un `SearchableSelect` con los tipos sin costo (mostrando cuántos equipos tiene cada uno) y una lista de conceptos con checkbox agrupados por clase. Al confirmar llama a `crearCostoTipoEquipo(typeId, conceptoIds)` y hace `router.refresh()`. Si `tiposDisponibles` está vacío, el botón queda deshabilitado con el título "Ya creaste el costo de todos los tipos".

- [ ] **Step 3: Listado de tipos costeados**

`TablaTiposEquipo` pasa a recibir `TipoCosteadoResumen[]` y muestra: tipo, equipos, accesorios, ítems de mantenimiento, total fijo de accesorios, total fijo de mantenimiento y una columna "Variables" con la cantidad de conceptos que dependen del equipo. Encabezado de la sección de totales: **"Totales de los conceptos fijos"**, con una nota al pie: *"Los conceptos porcentuales y por kilómetro se resuelven en cada equipo."* Si no hay ningún tipo costeado, muestra un estado vacío que invita a usar el botón.

La page del listado suma el botón "Crear costo de equipo" en el encabezado, alimentado por `listTiposDisponibles()` y `listConceptos()`.

- [ ] **Step 4: Detalle del tipo**

`[typeId]/page.tsx` llama a `getCostoTipoEquipo(typeId)`; si devuelve `null` (el tipo no está costeado) hace `notFound()`. Renderiza dos bloques, accesorios y mantenimiento, cada uno con una tabla simple de conceptos asociados (nombre, cómo se calcula, botón de desasociar) y un botón "Asociar concepto" que abre el catálogo filtrado por esa clase. Los componentes `TablaItemsCostoTipo`, `ImportarItemsDialog` y `BotonRefrescarPrecios` se borran: el refresco de precios ahora vive en el catálogo, que es donde están los conceptos.

- [ ] **Step 5: Detalle del equipo con el desglose resuelto**

`ItemsHeredadosDelTipo` pasa a recibir `conceptos_resueltos: ConceptoResueltoClient[]` y a mostrar una tabla con el importe que le corresponde a **esa** unidad: nombre, cómo se calcula y el importe. Es donde "17% del valor de compra" se vuelve un número. Mantiene el link a la pantalla del tipo y el encabezado con el nombre del tipo.

- [ ] **Step 6: Card del dashboard**

En `CostosDashboard.tsx`, agregá una card "Conceptos de costo" con `prisma.concepto_equipo.count({ where: { company_id: companyId } })`, icono `ListChecks`, href `/dashboard/costos/conceptos`, ubicada antes de "Tipos de equipo". La card de "Tipos de equipo" ya cuenta `costo_tipo_equipo`, que ahora son sólo los costeados: no hay que tocarla.

- [ ] **Step 7: Verificación completa**

```bash
npm run check-types && npm test && npx eslint src/modules/costos src/app/dashboard/costos
```

Expected: los tres en verde, con el golden en `7794945.28`.

Run: `grep -rn "item_costo_tipo\|ItemCostoTipoCalc\|ItemCostoTipoClient\|sumarItemsTipo" src --include="*.ts" --include="*.tsx" | grep -v generated`
Expected: sin resultados.

- [ ] **Step 8: Smoke manual**

Run: `npm run dev`. Verificá:
1. `/dashboard/costos/conceptos` lista los conceptos migrados, todos como fijos.
2. Creá un concepto porcentual: "Patentes = 17% del valor de compra", clase MANTENIMIENTO.
3. `/dashboard/costos/tipos-equipo` muestra **sólo** los dos tipos costeados, sin duplicados.
4. Asociá el concepto nuevo al tipo "Transporte de carga".
5. En `/dashboard/costos/equipos`, el costo mensual del interno 202 sube exactamente en `17% × su valor de compra / 12`.
6. Entrá al detalle del 202: el desglose muestra "Patentes · 17% del valor de compra · $<importe>" con el importe de esa unidad.
7. Probá crear un ciclo (concepto A = 5% de B, y editar B para que sea 5% de A): la segunda edición debe fallar con el mensaje de ciclo.

Si no podés hacer login, decilo en el reporte y listá lo que quedó sin verificar. No afirmes haber probado lo que no probaste.

- [ ] **Step 9: Commit**

Más de 5 archivos → commiteá todo el trabajo de las Tasks 2 a 8.

```bash
git add -A
git commit -m "feat(costos): catálogo de conceptos con clases de cálculo y elección de tipos costeados"
```

**Cuidado:** verificá con `git status` antes del `add -A` que no estés arrastrando archivos ajenos a la tarea.

---

## Notas para quien ejecute

- **El golden manda: `7794945.28`.** Si cambia, el error está en el código.
- **No hagas push.**
- El orden de las tareas mantiene el árbol compilando hasta la Task 2, que lo rompe a propósito; de ahí en más el cierre llega recién en la Task 8. Es deliberado y está anotado en cada tarea.
- Los datos locales para verificar la Task 7: **Supervisión** 4 ítems / $14.048.525,00 y **Transporte de carga** 33 ítems + 1 accesorio de $4.498.739 / $46.789.601,33. Los costos mensuales de referencia son $1.459.599,31 (interno 101) y $6.656.716,59 (interno 202), y **no deben moverse** mientras no se agregue ningún concepto porcentual.
