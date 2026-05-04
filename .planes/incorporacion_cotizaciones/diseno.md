# Diseño Técnico — Módulo de Gestión de Costos
**Codecontrol SAS · Mayo 2026 · v1.0 (post-spec v1.2)**

> Este documento es el complemento técnico del spec aprobado en [`../incorporacion_cotizaciones.md`](../incorporacion_cotizaciones.md). El spec define **qué** se construye; este doc define **cómo**: signatures, contratos de motores, schema Prisma final, plan de migrations, estrategia de testing.
>
> Cada sección refiere al entregable correspondiente del spec (E-0 a E-6) y a las tareas Linear ([`tareas-linear.md`](./tareas-linear.md)).

## Tabla de contenidos

1. [Convenciones generales](#1-convenciones-generales)
2. [Schema Prisma final consolidado](#2-schema-prisma-final-consolidado)
3. [Fase 0 — Preparación e infraestructura](#3-fase-0--preparación-e-infraestructura)
4. [Fase 1 (E-1) — Configurador de CCT + motor de conceptos](#4-fase-1-e-1--configurador-de-cct--motor-de-conceptos)
5. [Fase 2 (E-2) — Costo de equipos y combustible](#5-fase-2-e-2--costo-de-equipos-y-combustible)
6. [Fase 3 (E-3) — Servicio/contrato + MOD + OCP](#6-fase-3-e-3--serviciocontrato--mod--ocp)
7. [Fase 4 (E-4) — Composición de costos + PDF](#7-fase-4-e-4--composición-de-costos--pdf)
8. [Fase 5 (E-5) — Fórmula polinómica](#8-fase-5-e-5--fórmula-polinómica)
9. [Fase 6 (E-6) — Liquidación de sueldos + deploy](#9-fase-6-e-6--liquidación-de-sueldos--deploy)
10. [Contratos compartidos](#10-contratos-compartidos)
11. [Plan de migrations](#11-plan-de-migrations)
12. [Estrategia de testing](#12-estrategia-de-testing)

---

## 1. Convenciones generales

### 1.1 Estructura del módulo

```
src/modules/costos/
├── features/
│   ├── cct/                    # E-1
│   ├── equipos/                # E-2
│   ├── combustible/            # E-2
│   ├── servicios/              # E-3 (CRUD servicio_contrato)
│   ├── mod/                    # E-3
│   ├── ocp/                    # E-3
│   ├── composicion/            # E-4
│   ├── formula-polinomica/     # E-5
│   └── liquidacion/            # E-6
├── shared/
│   ├── types/
│   ├── utils/                  # Motores de cálculo (decimal.js)
│   ├── constants/
│   └── pdf/                    # Templates @react-pdf/renderer
└── index.ts
```

Cada `features/{X}/` contiene:
- `actions.server.ts` — Server Actions (`'use server'`, queries + mutations agrupadas)
- `components/` — UI components
- `index.ts` — barrel export

### 1.2 Imports estandarizados

```typescript
// Prisma client
import { prisma } from '@/shared/lib/prisma';
import type { config_cct, concepto_cct, /* ... */ } from '@/generated/prisma/client';
import { Prisma } from '@/generated/prisma/client';                          // namespace para tipos como Prisma.Decimal
import { Decimal } from '@/generated/prisma/client/runtime/library';         // o desde 'decimal.js'

// Auth + scope
import { getActionContext, getRequiredActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { supabaseServer } from '@/shared/lib/supabase/server';

// UI
import { DataTable } from '@/shared/components/common/DataTable';
import { Button, Input, Select /* ... */ } from '@/shared/components/ui/...';

// Formatters
import { formatCurrencyARS, formatPercentage } from '@/shared/lib/utils/formatters';
```

### 1.3 Patrón estándar de Server Action

```typescript
'use server';
import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';

export async function listConfigCCT() {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId, 'costos');
  return prisma.config_cct.findMany({
    where: { company_id: companyId, is_active: true },
    orderBy: [{ cct_codigo: 'asc' }, { vigencia_desde: 'desc' }],
  });
}
```

### 1.4 Manejo de Decimal

- **Server-side intermedio:** `decimal.js` (importado del runtime de Prisma).
- **Frontera server→client:** convertir a `string` (preferido) o `number` justo antes de retornar. Las RSC no serializan `Decimal` directamente.
- **Helpers:**
  ```typescript
  // src/modules/costos/shared/utils/decimal.ts
  export function toClientNumber(d: Decimal | null | undefined): number | null {
    if (d == null) return null;
    return d.toDecimalPlaces(2).toNumber();
  }
  export function toClientString(d: Decimal | null | undefined): string | null {
    if (d == null) return null;
    return d.toFixed(2);
  }
  ```

### 1.5 Validación con Zod

Los formularios usan React Hook Form + Zod. Schemas en `features/{X}/schemas.ts` o inline si son simples. Para forms de <5 campos preferir `useState + parse manual`.

### 1.6 Convención de archivos

- Componentes: `PascalCase.tsx`
- Server actions: `actions.server.ts`
- Tipos: `*.types.ts`
- Utilidades de cálculo: `kebab-case.ts`
- Hooks: `useNombreCamelCase.ts`

---

## 2. Schema Prisma final consolidado

> Todos los modelos nuevos. Aplicar via 7 migrations separadas (ver §11). Convenciones: UUID `@db.Uuid`, FKs `String @db.Uuid`, períodos `String @db.VarChar(7)`, timestamps `DateTime @default(now()) @db.Timestamptz(6)`.

### 2.1 Enums

```prisma
enum tipo_concepto_cct {
  remunerativo
  no_remunerativo
  descuento
  aporte_patronal
  provision
  prevision
  ausentismo
}

enum ambito_concepto_cct {
  mod_servicio
  liquidacion
}

enum clase_calculo_concepto {
  FIJO_GLOBAL
  FIJO_POR_CATEGORIA
  PCT_CONCEPTO
  PCT_SUMA_CONCEPTOS
  POR_ANTIGUEDAD_VALOR
  POR_ANTIGUEDAD_PCT
  POR_UNIDAD
}

enum tipo_indice_polinomico {
  cct
  ipim_34
  gasoil_g3
  ipim_ng
  custom
}

enum estado_liquidacion {
  borrador
  confirmada
  pagada
}
```

### 2.2 Configurador CCT (E-1)

```prisma
model config_cct {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at      DateTime @default(now()) @db.Timestamptz(6)
  company_id      String   @db.Uuid
  cct_codigo      String   @db.VarChar(40)
  cct_nombre      String   @db.VarChar(120)
  vigencia_desde  String   @db.VarChar(7)
  vigencia_hasta  String?  @db.VarChar(7)
  is_active       Boolean  @default(true)
  descripcion     String?

  company       company             @relation(fields: [company_id], references: [id])
  categorias    categoria_cct[]
  conceptos     concepto_cct[]
  servicios     servicio_contrato[]
  liquidaciones liquidacion_sueldo[]

  @@index([company_id, cct_codigo, is_active])
}

model categoria_cct {
  id            String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  config_cct_id String  @db.Uuid
  codigo        String  @db.VarChar(20)
  nombre        String  @db.VarChar(80)
  orden         Int     @default(0)

  config_cct      config_cct                  @relation(fields: [config_cct_id], references: [id], onDelete: Cascade)
  valores         valor_concepto_categoria[]
  asignaciones    asignacion_mod[]
  liquidaciones   liquidacion_sueldo[]

  @@unique([config_cct_id, codigo])
}

model concepto_cct {
  id            String                    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  config_cct_id String                    @db.Uuid
  codigo        String                    @db.VarChar(40)
  nombre        String                    @db.VarChar(120)
  tipo          tipo_concepto_cct
  aplica_en     ambito_concepto_cct[]
  clase_calculo clase_calculo_concepto
  parametros    Json
  orden         Int                       @default(0)
  is_active     Boolean                   @default(true)

  config_cct config_cct                 @relation(fields: [config_cct_id], references: [id], onDelete: Cascade)
  valores    valor_concepto_categoria[]

  @@unique([config_cct_id, codigo])
}

model valor_concepto_categoria {
  id               String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  concepto_cct_id  String  @db.Uuid
  categoria_cct_id String  @db.Uuid
  valor            Decimal @db.Decimal(15,2)

  concepto  concepto_cct  @relation(fields: [concepto_cct_id], references: [id], onDelete: Cascade)
  categoria categoria_cct @relation(fields: [categoria_cct_id], references: [id], onDelete: Cascade)

  @@unique([concepto_cct_id, categoria_cct_id])
}

model tope_imponible {
  id              String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  codigo          String  @db.VarChar(40)
  vigencia_desde  String  @db.VarChar(7)
  valor           Decimal @db.Decimal(15,2)
  fuente          String? @db.VarChar(120)

  @@unique([codigo, vigencia_desde])
}
```

### 2.3 Equipos + Combustible (E-2)

```prisma
model costo_equipo {
  id                  String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at          DateTime @default(now()) @db.Timestamptz(6)
  vehicle_id          String  @unique @db.Uuid
  company_id          String  @db.Uuid
  valor_compra        Decimal @db.Decimal(15,2)
  valor_residual_pct  Decimal @db.Decimal(5,4)        // 0.35 = 35%
  anios_amortizacion  Int     @default(5)
  km_anuales          Int     @default(0)
  accesorios          Decimal @default(0) @db.Decimal(15,2)
  is_active           Boolean @default(true)

  vehicle  vehicles @relation(fields: [vehicle_id], references: [id])
  company  company  @relation(fields: [company_id], references: [id])
  items    item_mantenimiento[]
}

model item_mantenimiento {
  id                String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  costo_equipo_id   String  @db.Uuid
  nombre            String  @db.VarChar(160)
  precio_anual      Decimal @db.Decimal(15,2)
  orden             Int     @default(0)
  is_active         Boolean @default(true)

  costo_equipo costo_equipo @relation(fields: [costo_equipo_id], references: [id], onDelete: Cascade)
}

model registro_combustible {
  id                  String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  servicio_id         String  @db.Uuid
  vehicle_id          String  @db.Uuid
  periodo             String  @db.VarChar(7)
  litros_mensuales    Decimal @db.Decimal(10,2)
  precio_gasoil_lt    Decimal @db.Decimal(15,2)
  litros_urea         Decimal @default(0) @db.Decimal(10,2)
  precio_urea_lt      Decimal @default(0) @db.Decimal(15,2)

  servicio servicio_contrato @relation(fields: [servicio_id], references: [id], onDelete: Cascade)
  vehicle  vehicles          @relation(fields: [vehicle_id], references: [id])

  @@unique([servicio_id, vehicle_id, periodo])
}
```

> **Nota sobre `item_mantenimiento`:** se elimina `frecuencia_km` y `cantidad` del spec original. La planilla del cliente carga directamente el costo anual prorrateado. Cuando el cliente pone "Neumáticos 1 juego cada 30.000 km, 6 neumáticos × $X" hace la cuenta y guarda el `precio_anual`. Si se requiere desglose se documenta en el `nombre`. Justificación: las planillas reales hacen exactamente eso.

### 2.4 Servicio/Contrato + MOD + OCP (E-3)

```prisma
model servicio_contrato {
  id                  String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at          DateTime @default(now()) @db.Timestamptz(6)
  company_id          String  @db.Uuid
  customer_id         String  @db.Uuid
  config_cct_id       String  @db.Uuid
  nombre              String  @db.VarChar(160)
  descripcion         String?
  fecha_inicio        String  @db.VarChar(10)        // YYYY-MM-DD
  fecha_fin           String? @db.VarChar(10)
  is_active           Boolean @default(true)

  // Márgenes comerciales (porcentajes 0-1)
  margen_iibb         Decimal @default(0) @db.Decimal(5,4)
  margen_debcred      Decimal @default(0) @db.Decimal(5,4)
  margen_estructura   Decimal @default(0) @db.Decimal(5,4)
  margen_ganancia     Decimal @default(0) @db.Decimal(5,4)
  licencia_ordenanza  Decimal @default(0) @db.Decimal(5,4)

  // Configuración de servicio (kms contratados, días hábiles, horas día — para calcular outputs)
  config_servicio     Json?

  company    company    @relation(fields: [company_id], references: [id])
  customer   customers  @relation(fields: [customer_id], references: [id])
  config_cct config_cct @relation(fields: [config_cct_id], references: [id])

  asignaciones_mod      asignacion_mod[]
  asignaciones_equipo   asignacion_equipo_servicio[]
  items_ocp             item_ocp[]
  registros_combustible registro_combustible[]
  composiciones_costo   composicion_costo[]
  outputs_configurados  tipo_output_servicio[]
  formula_polinomica    formula_polinomica?
  periodos_polinomico   periodo_formula_polinomica[]
}

model asignacion_mod {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  servicio_id       String    @db.Uuid
  employee_id       String    @db.Uuid
  categoria_cct_id  String    @db.Uuid
  afectacion_pct    Decimal   @db.Decimal(5,4)        // 1.0000 = 100%
  antiguedad_anios  Int       @default(0)
  is_active         Boolean   @default(true)

  // Inputs estimados para cálculo MOD del servicio (no son los reales del recibo, son la estimación)
  // { hs_nocturnas: 12, hs_extras_50: 9, hs_extras_100: 0, dias_feriado: 0, dias_desarraigo: 1, ... }
  overrides_calculo Json?

  servicio  servicio_contrato @relation(fields: [servicio_id], references: [id], onDelete: Cascade)
  employee  employees         @relation(fields: [employee_id], references: [id])
  categoria categoria_cct     @relation(fields: [categoria_cct_id], references: [id])
}

model asignacion_equipo_servicio {
  id              String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  servicio_id     String  @db.Uuid
  vehicle_id      String  @db.Uuid
  afectacion_pct  Decimal @default(1) @db.Decimal(5,4)
  km_mensuales    Int     @default(0)
  is_active       Boolean @default(true)

  servicio servicio_contrato @relation(fields: [servicio_id], references: [id], onDelete: Cascade)
  vehicle  vehicles          @relation(fields: [vehicle_id], references: [id])

  @@unique([servicio_id, vehicle_id])
}

model item_ocp {
  id                  String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  servicio_id         String  @db.Uuid
  grupo               String  @db.VarChar(40)         // 'vestimenta' | 'epp' | 'medicos' | 'carnet' | 'otros'
  concepto            String  @db.VarChar(160)
  costo_anual         Decimal @db.Decimal(15,2)
  cantidad_personas   Decimal @default(1) @db.Decimal(5,2)
  is_active           Boolean @default(true)

  servicio servicio_contrato @relation(fields: [servicio_id], references: [id], onDelete: Cascade)
}
```

### 2.5 Composición + Outputs (E-4)

```prisma
model composicion_costo {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at          DateTime @default(now()) @db.Timestamptz(6)
  servicio_id         String   @db.Uuid
  periodo             String   @db.VarChar(7)
  config_cct_id       String   @db.Uuid

  subtotal_mod         Decimal @db.Decimal(15,2)
  subtotal_equipos     Decimal @db.Decimal(15,2)
  subtotal_combustible Decimal @db.Decimal(15,2)
  subtotal_ocp         Decimal @db.Decimal(15,2)
  total_costo_directo  Decimal @db.Decimal(15,2)
  total_con_margenes   Decimal @db.Decimal(15,2)
  precio_mensual       Decimal @db.Decimal(15,2)

  detalle_json Json
  pdf_path     String? @db.VarChar(500)

  servicio   servicio_contrato    @relation(fields: [servicio_id], references: [id])
  config_cct config_cct           @relation(fields: [config_cct_id], references: [id])
  outputs    output_composicion[]

  @@unique([servicio_id, periodo])
}

model tipo_output_servicio {
  id          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  servicio_id String  @db.Uuid
  codigo      String  @db.VarChar(40)         // 'KM_EXCEDENTE', 'DIA_FERIADO', etc.
  nombre      String  @db.VarChar(120)
  formula     Json
  orden       Int     @default(0)
  is_active   Boolean @default(true)

  servicio servicio_contrato     @relation(fields: [servicio_id], references: [id], onDelete: Cascade)
  outputs  output_composicion[]

  @@unique([servicio_id, codigo])
}

model output_composicion {
  id              String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  composicion_id  String  @db.Uuid
  tipo_output_id  String  @db.Uuid
  valor           Decimal @db.Decimal(15,4)
  detalle_calculo Json?

  composicion composicion_costo    @relation(fields: [composicion_id], references: [id], onDelete: Cascade)
  tipo_output tipo_output_servicio @relation(fields: [tipo_output_id], references: [id])

  @@unique([composicion_id, tipo_output_id])
}
```

### 2.6 Fórmula polinómica (E-5)

```prisma
model formula_polinomica {
  id              String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  servicio_id     String  @unique @db.Uuid
  descripcion     String?
  fecha_base      String  @db.VarChar(7)
  precio_base     Decimal @db.Decimal(15,2)

  servicio    servicio_contrato            @relation(fields: [servicio_id], references: [id], onDelete: Cascade)
  componentes componente_formula[]
  periodos    periodo_formula_polinomica[]
}

model componente_formula {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  formula_id        String   @db.Uuid
  codigo            String   @db.VarChar(20)         // 'I001', 'I002', ...
  nombre            String   @db.VarChar(120)
  tipo_indice       tipo_indice_polinomico
  ponderacion       Decimal  @db.Decimal(5,4)
  valor_indice_base Decimal  @db.Decimal(15,4)
  fuente_indice     String?  @db.VarChar(160)

  formula  formula_polinomica         @relation(fields: [formula_id], references: [id], onDelete: Cascade)
  valores  valor_componente_periodo[]

  @@unique([formula_id, codigo])
}

model periodo_formula_polinomica {
  id                          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  formula_id                  String   @db.Uuid
  servicio_id                 String   @db.Uuid
  periodo                     String   @db.VarChar(7)

  ajuste_porcentual_acumulado Decimal  @db.Decimal(10,6)
  ajuste_monto                Decimal  @db.Decimal(15,2)
  valor_ajustado              Decimal  @db.Decimal(15,2)
  importe_certificado         Decimal? @db.Decimal(15,2)
  retroactivo_acumulado       Decimal? @db.Decimal(15,2)

  formula  formula_polinomica         @relation(fields: [formula_id], references: [id], onDelete: Cascade)
  servicio servicio_contrato          @relation(fields: [servicio_id], references: [id])
  valores  valor_componente_periodo[]

  @@unique([formula_id, periodo])
}

model valor_componente_periodo {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  periodo_id        String   @db.Uuid
  componente_id     String   @db.Uuid
  valor_indice      Decimal  @db.Decimal(15,4)
  variacion_pct     Decimal  @db.Decimal(10,6)
  contribucion_pct  Decimal  @db.Decimal(10,6)

  periodo    periodo_formula_polinomica @relation(fields: [periodo_id], references: [id], onDelete: Cascade)
  componente componente_formula         @relation(fields: [componente_id], references: [id])

  @@unique([periodo_id, componente_id])
}
```

### 2.7 Liquidación (E-6)

```prisma
model liquidacion_sueldo {
  id                  String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at          DateTime           @default(now()) @db.Timestamptz(6)
  company_id          String             @db.Uuid
  employee_id         String             @db.Uuid
  config_cct_id       String             @db.Uuid
  categoria_cct_id    String             @db.Uuid
  periodo             String             @db.VarChar(7)
  estado              estado_liquidacion @default(borrador)

  dias_trabajados     Int                @default(30)
  inasistencias_dias  Int                @default(0)
  hs_nocturnas        Decimal            @default(0) @db.Decimal(8,2)
  hs_extras_50        Decimal            @default(0) @db.Decimal(8,2)
  hs_extras_100       Decimal            @default(0) @db.Decimal(8,2)
  dias_feriado        Int                @default(0)
  dias_desarraigo     Int                @default(0)
  inputs_extra        Json?

  total_remunerativo  Decimal            @db.Decimal(15,2)
  total_no_remun      Decimal            @db.Decimal(15,2)
  total_descuentos    Decimal            @db.Decimal(15,2)
  total_sac           Decimal            @default(0) @db.Decimal(15,2)
  neto_a_pagar        Decimal            @db.Decimal(15,2)

  conceptos_json      Json
  pdf_path            String?            @db.VarChar(500)

  company    company       @relation(fields: [company_id], references: [id])
  employee   employees     @relation(fields: [employee_id], references: [id])
  config_cct config_cct    @relation(fields: [config_cct_id], references: [id])
  categoria  categoria_cct @relation(fields: [categoria_cct_id], references: [id])

  @@unique([employee_id, periodo])
}
```

### 2.8 Relaciones inversas en modelos existentes

```prisma
// model company (agregar):
config_cct                config_cct[]
costo_equipos             costo_equipo[]
servicios_contrato        servicio_contrato[]
liquidaciones_sueldos     liquidacion_sueldo[]

// model vehicles (agregar):
costo_equipo              costo_equipo?
asignaciones_servicio     asignacion_equipo_servicio[]
registros_combustible     registro_combustible[]

// model employees (agregar):
asignaciones_mod          asignacion_mod[]
liquidaciones_sueldos     liquidacion_sueldo[]

// model customers (agregar):
servicios_contrato        servicio_contrato[]
```

---

## 3. Fase 0 — Preparación e infraestructura

### 3.1 Habilitación del módulo en el catálogo

`hired_modules` en este codebase referencia `modules` (tabla de catálogo, no enum). **No se toca el enum `modulos`.** Pasos:

1. Crear migration `e0_costos_setup` que **inserta un row en `modules`**:
   ```sql
   INSERT INTO modules (id, created_at, name, description, price)
   VALUES (gen_random_uuid(), now(), 'costos', 'Gestión de Costos de Servicios', 0)
   ON CONFLICT DO NOTHING;
   ```
2. En staging, insertar `hired_modules` para Transporte SP referenciando ese `module_id`.

### 3.2 Layout protegido + verificación de módulo

`src/app/dashboard/costos/layout.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';

export default async function CostosLayout({ children }: { children: React.ReactNode }) {
  const { companyId } = await getRequiredActionContext();
  const habilitado = await prisma.hired_modules.findFirst({
    where: { company_id: companyId, module: { name: 'costos' } },
  });
  if (!habilitado) redirect('/dashboard?error=modulo_no_habilitado');
  return <>{children}</>;
}
```

### 3.3 Helper de acceso del módulo

`src/modules/costos/shared/utils/access.ts`:

```typescript
'use server';
import { prisma } from '@/shared/lib/prisma';

export async function assertModuloHabilitado(companyId: string, moduleName: 'costos') {
  const habilitado = await prisma.hired_modules.findFirst({
    where: { company_id: companyId, module: { name: moduleName } },
  });
  if (!habilitado) throw new Error(`Módulo ${moduleName} no habilitado para esta empresa`);
}
```

### 3.4 Sidebar

Agregar en `src/shared/components/layout/SideLinks.tsx` un item al array `Allinks` después de "Mantenimiento":

```typescript
{
  name: 'Gestión de Costos',
  href: '/dashboard/costos',
  icon: <Calculator size={sizeIcons} />,
  module: 'costos',  // se filtra contra hired_modules en el render
},
```

Si el patrón actual de `SideLinks.tsx` no soporta filtrado por módulo, ese soporte se agrega como subtarea de Fase 0 (verificar contra el código antes de ejecutar).

### 3.5 Bucket de Supabase Storage

Bucket `costos-pdfs` con dos carpetas:
- `composiciones/{companyId}/{servicioId}/{periodo}.pdf`
- `liquidaciones/{companyId}/{employeeId}/{periodo}.pdf`

RLS: solo lectura para usuarios con `share_company_users.company_id = {companyId}` y módulo `costos` habilitado. Política a definir en migration de Supabase.

### 3.6 Formatters compartidos

`src/shared/lib/utils/formatters.ts` (crear si no existe):

```typescript
const arsCurrency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrencyARS(value: number | string | null | undefined): string {
  if (value == null) return '—';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '—';
  return arsCurrency.format(n);
}

export function formatPercentage(value: number | string | null | undefined, decimals = 2): string {
  if (value == null) return '—';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '—';
  return `${(n * 100).toFixed(decimals).replace('.', ',')}%`;
}
```

### 3.7 Dependencias a verificar/instalar

```bash
npm ls decimal.js                         # debería estar (Prisma lo trae)
npm ls @react-pdf/renderer                # spec lo asume; verificar
npm ls xlsx                               # ya está (per CLAUDE.md)
```

Si `@react-pdf/renderer` no está, agregar como dependencia normal.

---

## 4. Fase 1 (E-1) — Configurador de CCT + motor de conceptos

### 4.1 Server Actions (`src/modules/costos/features/cct/actions.server.ts`)

```typescript
// CCT
export async function listCCTs(): Promise<config_cct[]>
export async function getCCT(id: string): Promise<CCTConDetalle | null>
export async function createCCT(input: CreateCCTInput): Promise<config_cct>
export async function clonarParitaria(cctId: string, nuevaVigenciaDesde: string): Promise<config_cct>
export async function closeParitaria(cctId: string, vigenciaHasta: string): Promise<void>
export async function deleteCCT(id: string): Promise<void>  // solo si no tiene composiciones/liquidaciones

// Categorías
export async function addCategoria(cctId: string, input: CategoriaInput): Promise<categoria_cct>
export async function updateCategoria(id: string, input: Partial<CategoriaInput>): Promise<categoria_cct>
export async function deleteCategoria(id: string): Promise<void>

// Conceptos
export async function addConcepto(cctId: string, input: ConceptoInput): Promise<concepto_cct>
export async function updateConcepto(id: string, input: Partial<ConceptoInput>): Promise<concepto_cct>
export async function deleteConcepto(id: string): Promise<void>
export async function reorderConceptos(cctId: string, ordenes: { id: string; orden: number }[]): Promise<void>

// Valores por categoría (para conceptos FIJO_POR_CATEGORIA)
export async function setValorPorCategoria(input: { conceptoId: string; categoriaId: string; valor: string }): Promise<void>
export async function bulkSetValores(conceptoId: string, valores: { categoriaId: string; valor: string }[]): Promise<void>

// Topes (admin del sistema)
export async function listTopes(): Promise<tope_imponible[]>
export async function addTope(input: TopeInput): Promise<tope_imponible>
export async function updateTope(id: string, input: Partial<TopeInput>): Promise<tope_imponible>
export async function deleteTope(id: string): Promise<void>
```

### 4.2 Tipos compartidos (`src/modules/costos/shared/types/cct.types.ts`)

```typescript
import type { tipo_concepto_cct, ambito_concepto_cct, clase_calculo_concepto } from '@/generated/prisma/client';

export interface CreateCCTInput {
  cct_codigo: string;
  cct_nombre: string;
  vigencia_desde: string;       // YYYY-MM
  descripcion?: string;
}

export interface CategoriaInput {
  codigo: string;
  nombre: string;
  orden?: number;
}

export interface ConceptoInput {
  codigo: string;
  nombre: string;
  tipo: tipo_concepto_cct;
  aplica_en: ambito_concepto_cct[];
  clase_calculo: clase_calculo_concepto;
  parametros: ParametrosConcepto;
  orden?: number;
}

// Discriminated union — un tipo por clase de cálculo
export type ParametrosConcepto =
  | { clase: 'FIJO_GLOBAL'; valor: string }
  | { clase: 'FIJO_POR_CATEGORIA' }
  | { clase: 'PCT_CONCEPTO'; concepto_codigo: string; porcentaje: string }
  | {
      clase: 'PCT_SUMA_CONCEPTOS';
      conceptos_codigos: string[];
      porcentaje: string;
      tope_codigo?: string;
    }
  | { clase: 'POR_ANTIGUEDAD_VALOR'; valor_por_anio: string }
  | {
      clase: 'POR_ANTIGUEDAD_PCT';
      porcentaje_por_anio: string;
      concepto_base_codigo: string;
    }
  | {
      clase: 'POR_UNIDAD';
      unidad: 'horas' | 'dias';
      recargo?: string;            // 0.30 = 30%
      derivacion?: { base: string; divisor_horas_mes: number };  // ej {base:'BASICO', divisor:200}
    };

export interface TopeInput {
  codigo: string;
  vigencia_desde: string;
  valor: string;
  fuente?: string;
}
```

### 4.3 Motor de conceptos (`src/modules/costos/shared/utils/motor-conceptos.ts`)

**Contrato:**

```typescript
import { Decimal } from '@/generated/prisma/client/runtime/library';

export interface ContextoCalculo {
  ambito: 'mod_servicio' | 'liquidacion';
  categoria_codigo: string;
  antiguedad_anios: number;
  dias_trabajados: number;
  hs_nocturnas: Decimal;
  hs_extras_50: Decimal;
  hs_extras_100: Decimal;
  dias_feriado: number;
  dias_desarraigo: number;
  periodo: string;                    // YYYY-MM (para resolver topes)
  inputs_extra?: Record<string, unknown>;
}

export interface ConceptoResuelto {
  concepto_codigo: string;
  concepto_nombre: string;
  tipo: tipo_concepto_cct;
  cantidad?: Decimal;                 // unidades aplicadas (días, horas, años, etc.)
  valor_unitario?: Decimal;
  base?: Decimal;                     // base imponible cuando aplica
  importe: Decimal;                   // resultado final
  trace?: string;                     // descripción del cálculo (para auditoría/debug)
}

export interface CCTResuelto {
  config_cct_id: string;
  conceptos: ConceptoResuelto[];
  totales: {
    remunerativo: Decimal;
    no_remunerativo: Decimal;
    descuento: Decimal;
    aporte_patronal: Decimal;
    provision: Decimal;
    prevision: Decimal;
    ausentismo: Decimal;
  };
}

/** Resuelve todos los conceptos del CCT cuyo `aplica_en` contiene el ámbito del contexto. */
export async function resolverCCT(
  cctId: string,
  contexto: ContextoCalculo
): Promise<CCTResuelto>;

/** Internal: una vez cargados conceptos+valores+topes, calcula sin más queries. */
export function resolverConceptos(
  conceptos: ConceptoCargado[],
  valoresCategoria: Map<string, Map<string, Decimal>>,
  topes: TopeCargado[],
  contexto: ContextoCalculo
): CCTResuelto;
```

**Algoritmo:**

1. **Cargar** `conceptos` activos del CCT, `valor_concepto_categoria`, `tope_imponible` con `vigencia_desde <= contexto.periodo`.
2. **Filtrar** por `aplica_en.includes(ambito)`.
3. **Construir grafo de dependencias** a partir de los `parametros`:
   - `PCT_CONCEPTO` depende de `concepto_codigo`.
   - `PCT_SUMA_CONCEPTOS` depende de cada elemento de `conceptos_codigos`.
   - `POR_ANTIGUEDAD_PCT` depende de `concepto_base_codigo`.
   - Los demás no tienen dependencias entre conceptos.
4. **Orden topológico** (Kahn's algorithm). Si hay ciclo → throw `ConceptoCiclicoError`.
5. **Iterar** en ese orden, llamando `calcularConcepto(c, ctx, resueltos)`. Acumular en `resueltos: Map<string, ConceptoResuelto>`.
6. **Sumarizar** por `tipo` para los totales.

**Dispatcher por clase:**

```typescript
function calcularConcepto(c: ConceptoCargado, ctx: ContextoCalculo, resueltos: Map<string, ConceptoResuelto>, valoresCategoria: ..., topes: ...): ConceptoResuelto {
  switch (c.parametros.clase) {
    case 'FIJO_GLOBAL':           return calcFijoGlobal(c, ...);
    case 'FIJO_POR_CATEGORIA':    return calcFijoPorCategoria(c, ctx.categoria_codigo, valoresCategoria);
    case 'PCT_CONCEPTO':          return calcPctConcepto(c, resueltos);
    case 'PCT_SUMA_CONCEPTOS':    return calcPctSumaConceptos(c, resueltos, topes, ctx.periodo);
    case 'POR_ANTIGUEDAD_VALOR':  return calcAntiguedadValor(c, ctx.antiguedad_anios);
    case 'POR_ANTIGUEDAD_PCT':    return calcAntiguedadPct(c, ctx.antiguedad_anios, resueltos);
    case 'POR_UNIDAD':            return calcPorUnidad(c, ctx, resueltos);
  }
}
```

Cada `calc*` devuelve `ConceptoResuelto` con `trace` legible para debugging:

```typescript
// Ejemplo: PCT_CONCEPTO
trace: `${c.codigo} = ${dependencia.codigo}(${dependencia.importe}) × ${porcentaje} = ${importe}`
```

**Validaciones al guardar concepto:**

- `concepto_codigo` referenciado existe en el mismo CCT y está activo.
- No introduce ciclo (correr ordenamiento topológico en validación).
- Si `tope_codigo`, existe al menos una entrada en `tope_imponible` con ese código.
- Para `PCT_CONCEPTO` con `concepto_codigo`, la dependencia tiene `aplica_en` que incluye los mismos ámbitos que el concepto que la referencia (ej: si el descuento de jubilación se aplica en `liquidacion`, los conceptos referenciados deben aplicar en `liquidacion`).

### 4.4 UI — Configurador

**Pantalla principal `/dashboard/costos/configuracion-cct`:**

```
┌─ SELECTOR ────────────────────────────────────────────┐
│ CCT: [▼ 545/08 UOCRA Petroleros] [+ Nuevo CCT]      │
│ Paritaria: [▼ Abr 2026 (vigente)] [+ Nueva paritaria]│
└──────────────────────────────────────────────────────┘
[ Categorías ] [ Conceptos ] [ Valores por categoría ]
```

**Tab "Categorías"**: tabla simple con codigo, nombre, orden. Acciones: edit, delete, drag para reordenar.

**Tab "Conceptos"**: DataTable con columnas codigo, nombre, tipo, ámbito, clase de cálculo, orden. Filtros por tipo y ámbito. Botón "Nuevo concepto" abre Sheet con el form dinámico:

```
┌─ Form Nuevo Concepto ───────────────────────────┐
│ Código:        [____________]                  │
│ Nombre:        [____________]                  │
│ Tipo:          [▼ remunerativo]                │
│ Aplica en:     [✓ MOD] [✓ Liquidación]         │
│ Clase de cálculo: [▼ PCT_CONCEPTO]              │
│                                                 │
│ ┌─ Parámetros (cambia según clase) ───────────┐│
│ │ Concepto referenciado: [▼ DIAS_TRAB]         ││
│ │ Porcentaje:            [0.85]                ││
│ └──────────────────────────────────────────────┘│
│ Orden: [10]                                     │
│                            [Cancelar] [Guardar] │
└─────────────────────────────────────────────────┘
```

El bloque "Parámetros" se renderiza con un componente `ParametrosFormByClase` que despacha por clase:

- `FIJO_GLOBAL`: 1 input numérico (valor).
- `FIJO_POR_CATEGORIA`: nota "Configurar valores en la pestaña Valores por categoría".
- `PCT_CONCEPTO`: select de concepto + input %.
- `PCT_SUMA_CONCEPTOS`: multi-select de conceptos + input % + select opcional de tope.
- `POR_ANTIGUEDAD_VALOR`: 1 input (valor por año).
- `POR_ANTIGUEDAD_PCT`: select de concepto base + input % por año.
- `POR_UNIDAD`: select unidad (horas/días) + input recargo + (si horas) campos de derivación.

**Tab "Valores por categoría"**: solo se muestran los conceptos con clase `FIJO_POR_CATEGORIA`. Grilla `concepto × categoría` con celda editable in-place.

**Pantalla `/dashboard/costos/topes-imponibles`** (admin del sistema): DataTable simple con codigo, vigencia_desde, valor, fuente. Acceso restringido a `profile.role === 'Admin'` (no el admin de la empresa cliente).

### 4.5 Componentes

| Archivo | Tipo | Responsabilidad |
|---|---|---|
| `PanelCCT.tsx` | Server Component | Layout principal con selectores + tabs |
| `SelectorCCT.tsx` | Client | Dropdown de CCTs activos |
| `SelectorParitaria.tsx` | Client | Dropdown de paritarias del CCT seleccionado |
| `FormNuevoCCT.tsx` | Client (Sheet) | Crear nuevo CCT |
| `FormNuevaParitaria.tsx` | Client (Sheet) | Crear nueva paritaria (clona la anterior) |
| `TabCategorias.tsx` | Server | DataTable de categorías |
| `FormCategoria.tsx` | Client (Dialog) | Edit/create categoría |
| `TabConceptos.tsx` | Server | DataTable de conceptos con filtros |
| `FormConcepto.tsx` | Client (Sheet) | Edit/create concepto con form dinámico |
| `ParametrosFormByClase.tsx` | Client | Switch que renderiza el form correcto según clase |
| `TabValoresPorCategoria.tsx` | Server | Grilla concepto × categoría |
| `PanelTopesImponibles.tsx` | Server | DataTable de topes (admin) |

### 4.6 Seed inicial CCT 545/08

`scripts/seed-cct-545-08.ts` — script Node ejecutable que inserta categorías + conceptos del CCT 545/08 vigente, con valores extraídos de las planillas reales. Ejecuta una sola vez en staging.

```typescript
// 7 categorías: G B, H B, I B, J B, M B, VII B, OFESP
// ~25 conceptos con sus parámetros
// Valores por categoría para BASICO
```

### 4.7 Tests del motor

`src/modules/costos/shared/utils/__tests__/motor-conceptos.test.ts`:

- Test por cada clase de cálculo (7 tests mínimo).
- Test de orden topológico con 4-5 conceptos interdependientes.
- Test de detección de ciclo (debe throw).
- Test de tope imponible (jubilación 11% sobre base, con tope).
- Test de doble base imponible (descuento sindicato sobre bruto + descuento sindicato SNR sobre no-remun).
- **Tests golden**: reproducir los 3 recibos reales (Bide / Guiñazu / Moragues) — bruto + neto al centavo.

---

## 5. Fase 2 (E-2) — Costo de equipos y combustible

### 5.1 Server Actions

`src/modules/costos/features/equipos/actions.server.ts`:

```typescript
export async function listVehiculosConCosto(): Promise<VehiculoConCosto[]>
export async function getCostoEquipo(vehicleId: string): Promise<CostoEquipoDetalle | null>
export async function upsertCostoEquipo(input: CostoEquipoInput): Promise<costo_equipo>
export async function addItemMantenimiento(costoEquipoId: string, input: ItemMantInput): Promise<item_mantenimiento>
export async function updateItemMantenimiento(id: string, input: Partial<ItemMantInput>): Promise<item_mantenimiento>
export async function deleteItemMantenimiento(id: string): Promise<void>
export async function bulkAddItemsMantenimiento(costoEquipoId: string, items: ItemMantInput[]): Promise<number>  // para import
```

`src/modules/costos/features/combustible/actions.server.ts`:

```typescript
export async function listRegistrosCombustible(servicioId: string): Promise<registro_combustible[]>
export async function upsertRegistroCombustible(input: RegistroCombustibleInput): Promise<registro_combustible>
export async function deleteRegistroCombustible(id: string): Promise<void>
```

### 5.2 Motores de cálculo

`src/modules/costos/shared/utils/calcular-amortizacion.ts`:

```typescript
export function calcularAmortizacionMensual(
  valor_compra: Decimal,
  valor_residual_pct: Decimal,
  anios_amortizacion: number,
  accesorios: Decimal = new Decimal(0)
): Decimal {
  const valor_residual = valor_compra.mul(valor_residual_pct);
  const base_amortizable = valor_compra.sub(valor_residual).add(accesorios);
  return base_amortizable.div(anios_amortizacion).div(12);
}
```

`src/modules/costos/shared/utils/calcular-mantenimiento.ts`:

```typescript
export function calcularMantenimientoMensual(items: item_mantenimiento[]): Decimal {
  return items
    .filter((i) => i.is_active)
    .reduce((acc, i) => acc.add(new Decimal(i.precio_anual.toString())), new Decimal(0))
    .div(12);
}

export function calcularCostoMensualEquipo(
  costo_equipo: costo_equipo & { items: item_mantenimiento[] },
  km_mensuales: number,
  afectacion_pct: Decimal
): Decimal {
  const amort = calcularAmortizacionMensual(...);
  const mant  = calcularMantenimientoMensual(costo_equipo.items);
  return amort.add(mant).mul(afectacion_pct);
}
```

### 5.3 UI — Pantallas

**`/dashboard/costos/equipos`**: DataTable de vehículos del cliente con columnas adicionales: valor compra, valor residual, costo mensual calculado. Click en una fila abre detalle con CRUD de `item_mantenimiento`.

**`/dashboard/costos/equipos/[vehicleId]`**: form de `costo_equipo` arriba + DataTable de items abajo. Botón "Importar items desde JSON/CSV" para carga rápida.

**`/dashboard/costos/combustible`**: lista de servicios con sus registros de combustible mensuales. Permite cargar/editar por período. La asignación de qué vehículos consumen combustible se infiere de `asignacion_equipo_servicio` (creado en Fase 3).

### 5.4 Componentes

| Archivo | Responsabilidad |
|---|---|
| `TablaEquiposCosto.tsx` | DataTable principal de vehículos con costos |
| `FormCostoEquipo.tsx` | Form upsert de costo_equipo |
| `TablaItemsMantenimiento.tsx` | DataTable de items por equipo |
| `FormItemMantenimiento.tsx` | Sheet para CRUD item |
| `ImportarItemsDialog.tsx` | Dialog para pegar JSON/CSV de items |
| `ResumenCostoEquipo.tsx` | Card con amortización + mantenimiento + total |
| `TablaRegistrosCombustible.tsx` | DataTable de registros por período |
| `FormRegistroCombustible.tsx` | Form mensual con litros y precios |

### 5.5 Tests

- Test golden contra IVECO 170S28 (PECOM): valor compra $319,325,000 → costo mensual $7,794,945.
- Test golden contra IVECO 10-190 (AESA): valor compra $247,625,000 → costo mensual $6,656,716.
- Test del cálculo de combustible: 950 lts × 1596 + 47.5 lts × 3227.5 = $1,669,506.

---

## 6. Fase 3 (E-3) — Servicio/contrato + MOD + OCP

### 6.1 Server Actions

`src/modules/costos/features/servicios/actions.server.ts`:

```typescript
export async function listServicios(): Promise<ServicioListItem[]>
export async function getServicio(id: string): Promise<ServicioDetalle | null>
export async function createServicio(input: CreateServicioInput): Promise<servicio_contrato>
export async function updateServicio(id: string, input: Partial<UpdateServicioInput>): Promise<servicio_contrato>
export async function deleteServicio(id: string): Promise<void>
export async function asignarEquiposServicio(servicioId: string, asignaciones: AsignacionEquipoInput[]): Promise<void>
```

`src/modules/costos/features/mod/actions.server.ts`:

```typescript
export async function listAsignacionesMOD(servicioId: string): Promise<AsignacionMODConDetalle[]>
export async function addAsignacionMOD(servicioId: string, input: AsignacionMODInput): Promise<asignacion_mod>
export async function updateAsignacionMOD(id: string, input: Partial<AsignacionMODInput>): Promise<asignacion_mod>
export async function deleteAsignacionMOD(id: string): Promise<void>
export async function calcularResumenMOD(servicioId: string, periodo: string): Promise<ResumenMOD>
```

`src/modules/costos/features/ocp/actions.server.ts`:

```typescript
export async function listItemsOCP(servicioId: string): Promise<item_ocp[]>
export async function addItemOCP(servicioId: string, input: ItemOCPInput): Promise<item_ocp>
export async function updateItemOCP(id: string, input: Partial<ItemOCPInput>): Promise<item_ocp>
export async function deleteItemOCP(id: string): Promise<void>
export async function calcularResumenOCP(servicioId: string): Promise<ResumenOCP>
```

### 6.2 Motor MOD del servicio

`src/modules/costos/shared/utils/calcular-mod.ts`:

```typescript
import { resolverCCT } from './motor-conceptos';

export interface ResumenMODChofer {
  asignacion_id: string;
  employee_id: string;
  employee_nombre: string;
  categoria_codigo: string;
  antiguedad_anios: number;
  afectacion_pct: Decimal;
  conceptos: ConceptoResuelto[];      // conceptos del CCT con aplica_en=mod_servicio
  bruto_chofer: Decimal;              // antes de aplicar afectacion
  total_chofer: Decimal;              // bruto × afectación
}

export interface ResumenMOD {
  servicio_id: string;
  periodo: string;
  config_cct_id: string;
  por_chofer: ResumenMODChofer[];
  total_mod: Decimal;
}

export async function calcularMOD(servicioId: string, periodo: string): Promise<ResumenMOD>;
```

**Pseudocódigo:**

```typescript
async function calcularMOD(servicioId, periodo) {
  const servicio = await prisma.servicio_contrato.findUnique({
    where: { id: servicioId },
    include: { config_cct: true, asignaciones_mod: { include: { employee: true, categoria: true } } },
  });
  const por_chofer: ResumenMODChofer[] = [];
  for (const a of servicio.asignaciones_mod.filter(a => a.is_active)) {
    const ctx: ContextoCalculo = {
      ambito: 'mod_servicio',
      categoria_codigo: a.categoria.codigo,
      antiguedad_anios: a.antiguedad_anios,
      dias_trabajados: 30,                // estimado mensual
      hs_nocturnas: new Decimal(a.overrides_calculo?.hs_nocturnas ?? 0),
      hs_extras_50: new Decimal(a.overrides_calculo?.hs_extras_50 ?? 0),
      hs_extras_100: new Decimal(a.overrides_calculo?.hs_extras_100 ?? 0),
      dias_feriado: a.overrides_calculo?.dias_feriado ?? 0,
      dias_desarraigo: a.overrides_calculo?.dias_desarraigo ?? 0,
      periodo,
      inputs_extra: a.overrides_calculo,
    };
    const resuelto = await resolverCCT(servicio.config_cct_id, ctx);
    const bruto_chofer = sumarConceptos(resuelto.conceptos);    // suma de TODOS los conceptos del MOD (rem + no-rem + aportes + provisiones + etc.)
    const total_chofer = bruto_chofer.mul(a.afectacion_pct);
    por_chofer.push({ ..., bruto_chofer, total_chofer });
  }
  const total_mod = por_chofer.reduce((s, c) => s.add(c.total_chofer), new Decimal(0));
  return { servicio_id, periodo, config_cct_id: servicio.config_cct_id, por_chofer, total_mod };
}
```

### 6.3 Motor OCP

`src/modules/costos/shared/utils/calcular-ocp.ts`:

```typescript
export interface ResumenOCPGrupo {
  grupo: string;
  items: item_ocp[];
  total_anual: Decimal;
  provision_mensual: Decimal;
  total_con_personas: Decimal;
}
export interface ResumenOCP {
  servicio_id: string;
  por_grupo: ResumenOCPGrupo[];
  total_ocp: Decimal;
}

export async function calcularOCP(servicioId: string): Promise<ResumenOCP>;
```

Por grupo: suma `costo_anual` × `cantidad_personas` ÷ 12.

### 6.4 UI

**`/dashboard/costos/servicios`**: DataTable de servicios. Columnas: nombre, customer, CCT, fecha inicio, estado.

**`/dashboard/costos/servicios/[id]`**: detalle con tabs:
- **General**: form de `servicio_contrato` (datos básicos + márgenes + config_servicio JSON).
- **MOD**: tabla de asignaciones de choferes + resumen MOD.
- **OCP**: tabla de items OCP agrupados.
- **Equipos**: tabla de asignaciones de vehículos.
- **Composición** (a llenar en E-4).

**`/dashboard/costos/mano-de-obra`** y `otros-costos-personal`: listados transversales (todos los servicios) con filtro por servicio. Útiles para ver toda la nómina o todos los OCP juntos.

### 6.5 Componentes

| Archivo | Responsabilidad |
|---|---|
| `TablaServicios.tsx` | DataTable de servicios |
| `FormServicio.tsx` | Sheet/Form de creación |
| `DetalleServicio.tsx` | Tabs container |
| `TabServicioGeneral.tsx` | Form general |
| `TabServicioMOD.tsx` | Asignaciones + resumen MOD |
| `TabServicioOCP.tsx` | Items OCP + resumen |
| `TabServicioEquipos.tsx` | Asignaciones de equipos |
| `AsignacionChoferes.tsx` | DataTable de asignacion_mod |
| `FormAsignacionMOD.tsx` | Sheet con employee, categoría, antigüedad, overrides |
| `ResumenMOD.tsx` | Card con desglose por chofer y total |
| `TablaItemsOCP.tsx` | DataTable de items_ocp con grupo |
| `FormItemOCP.tsx` | Sheet de CRUD item |
| `ResumenOCP.tsx` | Card con totales por grupo |

### 6.6 Tests

- Test golden contra los 3 recibos: bruto remunerativo del MOD-servicio coincide con bruto del recibo.
- Test que la `afectacion_pct` reduce el total proporcionalmente.
- Test que `overrides_calculo` se propaga al contexto del motor.
- Test del cálculo OCP: total = sum(costo_anual × cantidad_personas) / 12.

---

## 7. Fase 4 (E-4) — Composición de costos + PDF

### 7.1 Server Actions

`src/modules/costos/features/composicion/actions.server.ts`:

```typescript
export async function listComposiciones(servicioId?: string): Promise<ComposicionListItem[]>
export async function getComposicion(id: string): Promise<ComposicionDetalle | null>
export async function calcularComposicion(servicioId: string, periodo: string): Promise<ComposicionDetalle>
export async function persistirComposicion(detalle: ComposicionDetalle): Promise<composicion_costo>
export async function regenerarPDF(composicionId: string): Promise<{ pdfPath: string; signedUrl: string }>
export async function getSignedUrlPDF(composicionId: string): Promise<string>

// Tipos de output
export async function listOutputsServicio(servicioId: string): Promise<tipo_output_servicio[]>
export async function addOutputServicio(servicioId: string, input: TipoOutputInput): Promise<tipo_output_servicio>
export async function updateOutputServicio(id: string, input: Partial<TipoOutputInput>): Promise<tipo_output_servicio>
export async function deleteOutputServicio(id: string): Promise<void>
```

### 7.2 Motor de composición

`src/modules/costos/shared/utils/calcular-composicion.ts`:

```typescript
export interface ComposicionDetalle {
  servicio_id: string;
  periodo: string;
  config_cct_id: string;
  resumenMOD: ResumenMOD;
  resumenOCP: ResumenOCP;
  resumenEquipos: ResumenEquipos;       // amortización + mantenimiento por unidad
  resumenCombustible: ResumenCombustible;
  subtotales: {
    mod: Decimal;
    ocp: Decimal;
    equipos: Decimal;
    combustible: Decimal;
  };
  total_costo_directo: Decimal;
  margenes: {
    iibb: Decimal;
    debcred: Decimal;
    estructura: Decimal;
    ganancia: Decimal;
    licencia_ordenanza: Decimal;
  };
  total_con_margenes: Decimal;
  precio_mensual: Decimal;
  outputs: { tipo_output_id: string; codigo: string; nombre: string; valor: Decimal; detalle_calculo: object }[];
}

export async function calcularComposicion(
  servicioId: string,
  periodo: string
): Promise<ComposicionDetalle>;
```

**Algoritmo:**

1. Cargar servicio con CCT, asignaciones MOD/Equipo, items_ocp, registros_combustible del período, outputs configurados, márgenes.
2. Calcular `resumenMOD` (Fase 3).
3. Calcular `resumenOCP` (Fase 3).
4. Calcular `resumenEquipos` (Fase 2 por cada `asignacion_equipo_servicio`).
5. Calcular `resumenCombustible` (suma de registros del período).
6. `total_costo_directo = mod + ocp + equipos + combustible`.
7. `suma_margenes = iibb + debcred + estructura + ganancia`.
8. `total_con_margenes = total_costo_directo / (1 - suma_margenes)`.
9. `licencia_aplicada = total_con_margenes × licencia_ordenanza`.
10. `precio_mensual = total_con_margenes + licencia_aplicada`.
11. Para cada `tipo_output_servicio` activo, calcular `valor` según `formula` JSON.

### 7.3 Calculador de outputs

`src/modules/costos/shared/utils/calcular-outputs.ts`:

```typescript
export type FormulaOutput =
  | { tipo: 'precio_div_kms_x_factor'; kms_base: number; factor: number }
  | { tipo: 'precio_div_dias'; dias_habiles: number; factor: number }
  | { tipo: 'precio_div_dias_x_horas'; dias_habiles: number; horas_dia: number; factor: number }
  | { tipo: 'pct_sobre_precio'; porcentaje: string; modo: 'descuento' | 'recargo' };

export function calcularOutput(precio_mensual: Decimal, formula: FormulaOutput): { valor: Decimal; detalle: object };
```

> **Nota Fase 4:** los factores exactos (km excedente, día feriado, hora extra de PECOM) se obtienen por ingeniería inversa al cargar la composición PECOM Junio 2025. Documentar en `referencias/README.md`.

### 7.4 Generación de PDF

`src/modules/costos/shared/pdf/composicion-template.tsx`:

```tsx
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

export const ComposicionPDF: React.FC<{ data: ComposicionDetalle, servicio: ServicioDetalle, customer: customers, company: company }> = ({ ... }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header company={company} customer={customer} servicio={servicio} periodo={data.periodo} />
      <SeccionCostoIndustrial data={data} />
      <SeccionMargenes data={data} />
      <SeccionPrecios data={data} />
      <Footer />
    </Page>
  </Document>
);

export async function renderComposicionPDF(detalle: ComposicionDetalle): Promise<Buffer>;
```

**Subida a Storage:**

```typescript
async function subirPDFComposicion(companyId: string, servicioId: string, periodo: string, buffer: Buffer): Promise<string> {
  const supabase = await supabaseServer();
  const path = `composiciones/${companyId}/${servicioId}/${periodo}.pdf`;
  const { error } = await supabase.storage.from('costos-pdfs').upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;
  return path;
}
```

URL firmada (válida 1h):

```typescript
async function getSignedUrlComposicion(path: string): Promise<string> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.storage.from('costos-pdfs').createSignedUrl(path, 3600);
  if (error || !data) throw error;
  return data.signedUrl;
}
```

### 7.5 UI

**`/dashboard/costos/composicion`**: DataTable de composiciones (todos los servicios). Filtros por servicio y período.

**`/dashboard/costos/composicion/[id]`**: vista detalle con:
- Resumen costo industrial (4 subtotales con drilldown a MOD/OCP/Equipos/Combustible).
- Configuración de márgenes (read-only del servicio, link "Editar en servicio").
- Resumen precios (precio mensual + outputs).
- Botón "Exportar PDF" (genera + descarga vía URL firmada).
- Botón "Recalcular" (re-genera desde fuentes vigentes; advierte si difiere del snapshot guardado).

**Acceso desde `/dashboard/costos/servicios/[id]`** tab "Composición": mismo componente embebido + acción "Generar composición de período YYYY-MM".

### 7.6 Componentes

| Archivo | Responsabilidad |
|---|---|
| `TablaComposiciones.tsx` | Listado |
| `PantallaComposicion.tsx` | Vista detalle |
| `ResumenCostoIndustrial.tsx` | Card con 4 subtotales |
| `ResumenMargenes.tsx` | Card con márgenes aplicados |
| `ResumenPrecios.tsx` | Card precio mensual + outputs |
| `BotonGenerarComposicion.tsx` | Modal con selector de período |
| `BotonExportarPDF.tsx` | Genera PDF y descarga |
| `ConfigOutputsServicio.tsx` | CRUD de tipo_output_servicio |
| `FormTipoOutput.tsx` | Sheet con form dinámico por tipo de fórmula |

### 7.7 Tests

- Test golden PECOM Jun25: precio mensual = 23,560,093.
- Test golden AESA Abr26: precio mensual = 27,183,638.
- Test outputs PECOM (km excedente, día feriado, hora extra) ±$0.01.
- Test PDF: el HTML renderizado contiene los strings esperados (precio, totales).
- Test idempotencia: dos llamadas seguidas a `calcularComposicion` con mismas fuentes dan el mismo resultado.

---

## 8. Fase 5 (E-5) — Fórmula polinómica

### 8.1 Server Actions

`src/modules/costos/features/formula-polinomica/actions.server.ts`:

```typescript
export async function getFormula(servicioId: string): Promise<FormulaConDetalle | null>
export async function createFormula(servicioId: string, input: CreateFormulaInput): Promise<formula_polinomica>
export async function inicializarPonderacionesDesdeComposicion(servicioId: string): Promise<formula_polinomica>
export async function updateFormula(id: string, input: Partial<UpdateFormulaInput>): Promise<formula_polinomica>
export async function addComponente(formulaId: string, input: ComponenteInput): Promise<componente_formula>
export async function updateComponente(id: string, input: Partial<ComponenteInput>): Promise<componente_formula>
export async function deleteComponente(id: string): Promise<void>

export async function listPeriodos(formulaId: string): Promise<PeriodoConValores[]>
export async function upsertPeriodo(formulaId: string, periodo: string, valoresIndices: Record<string, string>, importe_certificado?: string): Promise<PeriodoConValores>
export async function deletePeriodo(id: string): Promise<void>
```

### 8.2 Motor

`src/modules/costos/shared/utils/calcular-formula-polinomica.ts`:

```typescript
export interface CalculoPeriodoPolinomico {
  periodo: string;
  variaciones_por_componente: { componente_id: string; codigo: string; valor_indice: Decimal; variacion_pct: Decimal; contribucion_pct: Decimal }[];
  ajuste_porcentual_acumulado: Decimal;
  ajuste_monto: Decimal;
  valor_ajustado: Decimal;
  retroactivo_periodo?: Decimal;
  retroactivo_acumulado?: Decimal;
}

export function calcularPeriodoFormula(
  formula: formula_polinomica & { componentes: componente_formula[] },
  periodo: string,
  valoresIndices: Map<string, Decimal>,         // { componente_id → I_t }
  importe_certificado?: Decimal
): CalculoPeriodoPolinomico;

export function calcularSerieFormula(
  formula: ...,
  periodos: { periodo: string; valoresIndices: Map<string, Decimal>; importe_certificado?: Decimal }[]
): CalculoPeriodoPolinomico[];
```

**Validación de ponderaciones:**

```typescript
export function validarPonderaciones(componentes: componente_formula[]): { valid: boolean; suma: Decimal; error?: string };
// suma = sum(c.ponderacion). Valid si Math.abs(suma - 1) < 0.0001.
```

**Inicialización automática:**

```typescript
async function inicializarPonderacionesDesdeComposicion(servicioId: string): Promise<formula_polinomica> {
  const compMasReciente = await prisma.composicion_costo.findFirst({
    where: { servicio_id: servicioId },
    orderBy: { periodo: 'desc' },
  });
  if (!compMasReciente) throw new Error('No hay composición previa para este servicio');
  const total = compMasReciente.total_costo_directo;
  const componentes = [
    { codigo: 'I001', nombre: 'MOD',          tipo_indice: 'cct',       ponderacion: compMasReciente.subtotal_mod.div(total) },
    { codigo: 'I002', nombre: 'Equipos',      tipo_indice: 'ipim_34',   ponderacion: compMasReciente.subtotal_equipos.div(total) },
    { codigo: 'I003', nombre: 'Combustible',  tipo_indice: 'gasoil_g3', ponderacion: compMasReciente.subtotal_combustible.div(total) },
    { codigo: 'I004', nombre: 'Otros',        tipo_indice: 'ipim_ng',   ponderacion: compMasReciente.subtotal_ocp.div(total) },
  ];
  // ... persistir formula con precio_base = total_con_margenes y los 4 componentes
}
```

### 8.3 UI

**`/dashboard/costos/formula-polinomica`**: lista de fórmulas (1 por servicio).

**`/dashboard/costos/formula-polinomica/[servicioId]`**:
- Card "Configuración" con precio_base, fecha_base, descripción.
- Card "Componentes" con tabla de ponderaciones + sumatoria visible (rojo si ≠ 1.0).
- Card "Períodos" con tabla cronológica de períodos cargados con sus índices y resultados.
- Gráfico recharts: evolución de `valor_ajustado` por período + línea de `importe_certificado` para visualizar retroactivos.
- Card "Retroactivos" agrupando los retroactivos pendientes.

### 8.4 Componentes

| Archivo | Responsabilidad |
|---|---|
| `TablaFormulas.tsx` | Listado por servicio |
| `ConfigFormulaPolinomica.tsx` | Form precio_base + fecha_base |
| `TablaComponentes.tsx` | Componentes con sumatoria de ponderaciones |
| `FormComponente.tsx` | Sheet con tipo_indice, ponderación, fuente |
| `BotonInicializarPonderaciones.tsx` | Botón "Inicializar desde composición" |
| `TablaIndicesMensuales.tsx` | Períodos con valores de índice y cálculos |
| `FormPeriodoIndices.tsx` | Form para cargar índices de un período |
| `GraficoEvolucionTarifa.tsx` | recharts |
| `ResumenRetroactivos.tsx` | Card de retroactivos pendientes |

### 8.5 Tests

- Test golden PECOM Jul25: valoresIndices conocidos → ajuste 5.769%, valor 20,016,571.
- Test serie completa Jun25–Feb26: cada período coincide con planilla.
- Test cálculo de retroactivo: si `importe_certificado < valor_ajustado`, retroactivo = diferencia.
- Test validarPonderaciones: rechaza suma 0.99, acepta suma 1.0001.

---

## 9. Fase 6 (E-6) — Liquidación de sueldos + deploy

### 9.1 Server Actions

`src/modules/costos/features/liquidacion/actions.server.ts`:

```typescript
export async function listLiquidaciones(filtros: { periodo?: string; estado?: estado_liquidacion; employeeId?: string }): Promise<LiquidacionListItem[]>
export async function getLiquidacion(id: string): Promise<LiquidacionDetalle | null>
export async function generarBorrador(employeeId: string, periodo: string, inputs: InputsLiquidacion): Promise<liquidacion_sueldo>
export async function actualizarBorrador(id: string, inputs: Partial<InputsLiquidacion>): Promise<liquidacion_sueldo>
export async function recalcularLiquidacion(id: string): Promise<liquidacion_sueldo>
export async function confirmarLiquidacion(id: string): Promise<liquidacion_sueldo>
export async function marcarPagada(id: string, fechaPago: string): Promise<liquidacion_sueldo>
export async function generarReciboPDF(id: string): Promise<{ pdfPath: string; signedUrl: string }>
export async function getSignedUrlRecibo(id: string): Promise<string>
```

### 9.2 Motor de liquidación

`src/modules/costos/shared/utils/calcular-liquidacion-cct.ts`:

```typescript
export interface InputsLiquidacion {
  dias_trabajados: number;
  inasistencias_dias: number;
  hs_nocturnas: string;
  hs_extras_50: string;
  hs_extras_100: string;
  dias_feriado: number;
  dias_desarraigo: number;
  inputs_extra?: Record<string, unknown>;
}

export interface LiquidacionResultado {
  conceptos: ConceptoResuelto[];
  conceptos_sac: ConceptoResuelto[];
  totales: {
    remunerativo: Decimal;
    no_remunerativo: Decimal;
    descuentos: Decimal;
    sac: Decimal;
    neto_a_pagar: Decimal;
  };
}

export async function calcularLiquidacion(
  employeeId: string,
  categoriaCCTId: string,
  cctId: string,
  periodo: string,
  inputs: InputsLiquidacion
): Promise<LiquidacionResultado>;
```

**Algoritmo:**

1. Construir `ContextoCalculo` con `ambito='liquidacion'`.
2. Llamar `resolverCCT(cctId, ctx)` (motor de E-1).
3. Filtrar `conceptos` por tipo: rem, no-rem, descuento.
4. **SAC sub-cálculo:** calcular SAC (mitad del mejor sueldo del semestre) y aplicar sus aportes (jubilación, INSSJP, OS, sindicato) — usar el mismo motor con un contexto especial donde el "bruto" es el SAC.
5. `neto = total_remunerativo + total_no_remun + total_sac - total_descuentos`.

### 9.3 PDF de recibo

`src/modules/costos/shared/pdf/recibo-template.tsx`:

```tsx
export const ReciboPDF: React.FC<{ data: LiquidacionDetalle, employee: employees, company: company, cct: config_cct }> = ({ ... }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <HeaderEmpresa company={company} />
      <DatosEmpleado employee={employee} cct={cct} periodo={data.periodo} />
      <TablaConceptos conceptos={data.conceptos_json.lineas} titulo="Conceptos del período" />
      <TablaConceptos conceptos={data.conceptos_json.sac}    titulo="SAC" />
      <Totales data={data} />
      <FooterFirmas />
    </Page>
  </Document>
);
```

### 9.4 UI

**`/dashboard/costos/liquidacion-sueldos`**:
- DataTable de liquidaciones (filtros por período, estado, empleado).
- Botón "Nueva liquidación" → selector de empleado + período + form de inputs.
- Botón "Generar nómina del mes" → genera borradores en lote para todos los empleados con asignación activa.

**Detalle `/dashboard/costos/liquidacion-sueldos/[id]`**:
- Datos del empleado y categoría.
- Inputs editables (días, hs, etc.) — sólo si estado=`borrador`.
- Botón "Recalcular".
- Vista del recibo (preview HTML idéntica al PDF).
- Botones según estado: `Confirmar`, `Marcar pagada`, `Descargar PDF`.

### 9.5 Componentes

| Archivo | Responsabilidad |
|---|---|
| `TablaLiquidaciones.tsx` | DataTable principal |
| `FormNuevaLiquidacion.tsx` | Sheet con employee + período + inputs |
| `BotonGenerarNomina.tsx` | Genera borradores en lote |
| `DetalleLiquidacion.tsx` | Vista del detalle |
| `FormInputsLiquidacion.tsx` | Form de días/horas/etc |
| `VistaConceptosRecibo.tsx` | Render HTML del recibo (preview) |
| `BotonAccionesLiquidacion.tsx` | Switch según estado |
| `BotonGenerarReciboPDF.tsx` | Genera y descarga PDF |
| `ResumenNomina.tsx` | Card con totales agregados del mes |

### 9.6 Tests

- Test golden Bide Abr26: neto = $3,063,102.
- Test golden Guiñazu Abr26: neto = $2,733,369.
- Test golden Moragues Abr26: neto = $4,089,370.
- Test del SAC: medio aguinaldo + aportes correctos.
- Test que `recalcularLiquidacion` produce resultado idéntico a `generarBorrador` con los mismos inputs.

### 9.7 Deploy productivo

Sub-tareas finales del proyecto:

1. Aplicar migrations en orden a producción (manual, fuera del flujo CI/CD según convención del proyecto).
2. Insertar `modules` row para "costos" en producción.
3. Activar `hired_modules` para Transporte SP.
4. Cargar seed CCT 545/08 en producción.
5. Crear bucket `costos-pdfs` en Supabase prod con políticas RLS.
6. Smoke tests: login con usuario Transporte SP → ve sidebar → puede ir a cada pantalla → composición de un servicio real funciona end-to-end.
7. Sesión de capacitación con cliente.
8. Documentación de operación (cómo cargar nueva paritaria, cómo generar liquidación masiva, etc.).

---

## 10. Contratos compartidos

### 10.1 Helpers transversales

| Archivo | Exporta |
|---|---|
| `src/modules/costos/shared/utils/access.ts` | `assertModuloHabilitado(companyId, moduleName)` |
| `src/modules/costos/shared/utils/decimal.ts` | `toClientNumber`, `toClientString`, `parseDecimal` |
| `src/modules/costos/shared/utils/periodo.ts` | `parsePeriodo('YYYY-MM')`, `formatPeriodo(date)`, `comparePeriodos`, `nextPeriodo`, `prevPeriodo` |
| `src/modules/costos/shared/utils/motor-conceptos.ts` | `resolverCCT`, `resolverConceptos`, `validarConceptosCCT` |
| `src/modules/costos/shared/utils/calcular-mod.ts` | `calcularMOD` |
| `src/modules/costos/shared/utils/calcular-ocp.ts` | `calcularOCP` |
| `src/modules/costos/shared/utils/calcular-amortizacion.ts` | `calcularAmortizacionMensual`, `calcularCostoMensualEquipo` |
| `src/modules/costos/shared/utils/calcular-mantenimiento.ts` | `calcularMantenimientoMensual` |
| `src/modules/costos/shared/utils/calcular-composicion.ts` | `calcularComposicion` |
| `src/modules/costos/shared/utils/calcular-outputs.ts` | `calcularOutput`, `FormulaOutput` types |
| `src/modules/costos/shared/utils/calcular-formula-polinomica.ts` | `calcularPeriodoFormula`, `calcularSerieFormula`, `validarPonderaciones`, `inicializarPonderacionesDesdeComposicion` |
| `src/modules/costos/shared/utils/calcular-liquidacion-cct.ts` | `calcularLiquidacion` |
| `src/modules/costos/shared/utils/storage.ts` | `subirPDF`, `getSignedUrlPDF` |

### 10.2 Tipos compartidos del módulo

| Archivo | Exporta |
|---|---|
| `src/modules/costos/shared/types/cct.types.ts` | `CreateCCTInput`, `ConceptoInput`, `ParametrosConcepto`, `ContextoCalculo`, `ConceptoResuelto`, `CCTResuelto` |
| `src/modules/costos/shared/types/equipo.types.ts` | `CostoEquipoInput`, `ItemMantInput`, `VehiculoConCosto` |
| `src/modules/costos/shared/types/combustible.types.ts` | `RegistroCombustibleInput` |
| `src/modules/costos/shared/types/servicio.types.ts` | `CreateServicioInput`, `UpdateServicioInput`, `ConfigServicio`, `ServicioListItem`, `ServicioDetalle` |
| `src/modules/costos/shared/types/mod.types.ts` | `AsignacionMODInput`, `OverridesCalculo`, `ResumenMOD`, `ResumenMODChofer` |
| `src/modules/costos/shared/types/ocp.types.ts` | `ItemOCPInput`, `ResumenOCP`, `ResumenOCPGrupo` |
| `src/modules/costos/shared/types/composicion.types.ts` | `ComposicionDetalle`, `TipoOutputInput`, `FormulaOutput`, `ResumenEquipos`, `ResumenCombustible` |
| `src/modules/costos/shared/types/formula-polinomica.types.ts` | `CreateFormulaInput`, `ComponenteInput`, `CalculoPeriodoPolinomico` |
| `src/modules/costos/shared/types/liquidacion.types.ts` | `InputsLiquidacion`, `LiquidacionResultado`, `LiquidacionDetalle` |

### 10.3 Constantes

`src/modules/costos/shared/constants/index.ts`:

```typescript
export const COSTOS_MODULE_NAME = 'costos' as const;
export const COSTOS_PDF_BUCKET = 'costos-pdfs' as const;
export const COSTOS_PDF_PATHS = {
  composicion: (companyId: string, servicioId: string, periodo: string) => `composiciones/${companyId}/${servicioId}/${periodo}.pdf`,
  liquidacion: (companyId: string, employeeId: string, periodo: string) => `liquidaciones/${companyId}/${employeeId}/${periodo}.pdf`,
};
export const COSTOS_SIGNED_URL_TTL = 3600; // 1h
export const COSTOS_PONDERACION_TOLERANCIA = 0.0001;
```

---

## 11. Plan de migrations

| Migration | Modelos | Aplicar antes de |
|---|---|---|
| `e0_costos_setup` | INSERT en `modules` (name='costos') | Fase 0 |
| `e1_config_cct` | `config_cct`, `categoria_cct`, `concepto_cct`, `valor_concepto_categoria`, `tope_imponible` + 3 enums + relación inversa en `company` | Fase 1 |
| `e2_costo_equipos` | `costo_equipo`, `item_mantenimiento`, `registro_combustible` + relaciones inversas en `vehicles` y `company` | Fase 2 |
| `e3_servicio_mod_ocp` | `servicio_contrato`, `asignacion_mod`, `asignacion_equipo_servicio`, `item_ocp` + relaciones inversas en `customers`, `employees`, `vehicles`, `company`, `config_cct`, `categoria_cct` | Fase 3 |
| `e4_composicion` | `composicion_costo`, `tipo_output_servicio`, `output_composicion` | Fase 4 |
| `e5_formula_polinomica` | `formula_polinomica`, `componente_formula`, `periodo_formula_polinomica`, `valor_componente_periodo` + enum `tipo_indice_polinomico` | Fase 5 |
| `e6_liquidacion` | `liquidacion_sueldo` + enum `estado_liquidacion` + relaciones inversas en `employees`, `company`, `config_cct`, `categoria_cct` | Fase 6 |

**Procedimiento por migration:**

```bash
npm run create-migration -- e1_config_cct
# Editar el SQL generado, validar contra schema.prisma
npx supabase migration up                    # local
npm run gentypes                              # actualiza database.types.ts
npx prisma generate                           # actualiza @/generated/prisma/client
# Tests + dev manual
git commit -am "feat(costos): migration e1 config_cct"
```

**Producción:** `npm run push-migrations` después de PR aprobado y merge a `main`.

---

## 12. Estrategia de testing

### 12.1 Niveles

1. **Unitarios — motores** (Vitest o Jest, lo que use el proyecto):
   - Cada función pura en `shared/utils/calcular-*`.
   - Cobertura objetivo ≥ 80% en estos archivos.
2. **Integración — Server Actions** (mocks de Prisma):
   - Cada Action con su path feliz y 1-2 paths de error.
3. **Golden tests** — reproducción exacta de planillas:
   - 1 test por planilla (6 totales).
   - Datos de fixture en `referencias/` (no committed).
4. **UI smoke** — Playwright o equivalente:
   - Navegación por las 9 pantallas con un user de Transporte SP.
   - Generación de un PDF end-to-end.

### 12.2 Datos de fixture

Cada test golden tiene un fixture `*.fixture.ts` que arma el dataset (CCT + categorías + conceptos + valores + asignaciones) para el caso. Los fixtures NO leen de las planillas en runtime — los valores se transcriben manualmente a partir del análisis hecho en el pre-diseño (ver sec 13 del spec).

Ejemplo:

```typescript
// src/modules/costos/__tests__/fixtures/cct-545-08-pecom-jun25.fixture.ts
export const cct545_pecom_jun25 = {
  config_cct: { cct_codigo: '545/08', vigencia_desde: '2025-06', /* ... */ },
  categorias: [
    { codigo: 'OFESP', nombre: 'Oficial Especializado', orden: 1 },
  ],
  conceptos: [
    { codigo: 'BASICO', nombre: 'Sueldo Básico', tipo: 'remunerativo', clase_calculo: 'FIJO_POR_CATEGORIA', /* ... */ },
    // ... ~30 conceptos
  ],
  valores: [
    { concepto_codigo: 'BASICO', categoria_codigo: 'OFESP', valor: '650863.84' },
  ],
};
```

### 12.3 Aceptación por hito

| Hito | Tests requeridos | Resultado esperado |
|---|---|---|
| P-2 (E-3) | Golden 3 choferes (Bide/Guiñazu/Moragues) — bruto remunerativo del MOD-servicio | Coincide con bruto del recibo ±$0.01 |
| P-3 (E-5) | Serie completa PECOM Jun25–Feb26 | Cada período coincide con planilla ±$0.01 |
| P-4 (E-6) | Golden 3 choferes — neto a pagar | Coincide con planilla ±$0.01 |

### 12.4 Setup de testing en el proyecto

Verificar antes de Fase 0:

```bash
ls vitest.config.ts jest.config.ts jest.config.js 2>/dev/null
grep -E '"(vitest|jest|@testing-library)' package.json
```

Si no hay framework configurado, levantar Vitest como subtarea de Fase 0 (decisión: **Vitest** por velocidad y compatibilidad con Next.js + Vite ecosystem). Esto es trabajo extra no contemplado en el spec; documentar en el ticket correspondiente.

---

*Fin del documento de diseño técnico.*
