# SPEC DE IMPLEMENTACIÓN
## Módulo de Gestión de Costos de Servicios — Transporte SP SRL
**Codecontrol SAS · Mayo 2026 · v1.2 · Estado: APROBADO · Planificación completada · Diseño revisado contra planillas**

> **v1.2 (2026-05-04):** Rediseño del modelo CCT y de los motores de cálculo tras analizar las planillas reales del cliente (PECOM, AESA, fórmula polinómica Jun25–Feb26, 3 liquidaciones). Cambios estructurales:
> - **Modelo CCT genérico (configurador)**: reemplaza `escala_salarial`/`tasa_aporte_patronal`/`adicional_cct` por `config_cct` + `categoria_cct` + `concepto_cct` + `valor_concepto_categoria`. Esto permite que la empresa modele los 4+ CCTs activos sin tocar código y agregue conceptos nuevos cuando aparece un acta paritaria. Se mantiene la regla "1 cotización = 1 CCT".
> - **Motor de cálculo basado en clases**: 7 clases predefinidas (`FIJO_GLOBAL`, `FIJO_POR_CATEGORIA`, `PCT_CONCEPTO`, `PCT_SUMA_CONCEPTOS`, `POR_ANTIGUEDAD_VALOR`, `POR_ANTIGUEDAD_PCT`, `POR_UNIDAD`). Sin evaluador de fórmulas libres.
> - **Topes imponibles a nivel sistema** (no del CCT): nueva tabla `tope_imponible` global, referenciada por código desde los conceptos descuento.
> - **Fórmula polinómica corregida**: `P = PB × (1 + Σ Pi × ΔIi%)` (estándar argentino de redeterminación), reemplaza la versión incorrecta del spec original.
> - **Outputs de composición flexibles**: cada servicio tiene su propio set de derivados (km excedente, día feriado, hora extra, descuento, etc.) modelados en `output_composicion`, no como columnas fijas.
> - **Liquidación con `conceptos_json` flexible**: ~32-35 líneas reales por recibo (no 45), variables por paritaria.
> - Sección 13 nueva con la trazabilidad completa de los hallazgos de planillas.
>
> **v1.1 (2026-05-04):** Ajustes de arquitectura para alinear el spec con el codebase real de Codecontrol. Rutas bajo `src/app/dashboard/costos/`, estructura modular `src/modules/costos/features/{feature}/`, eliminación de API Routes, paths corregidos, helper de acceso vía `getActionContext()`, UUIDs con `@db.Uuid`. Trazabilidad de las 12 discrepancias en sección 2.1.

---

| Campo | Valor |
|---|---|
| Proyecto | Módulo de Costos — Transporte SP |
| Cliente | Transporte SP SRL |
| Desarrollador | Codecontrol SAS |
| Duración total | 15 semanas · 300 horas · 4 hs/día |
| Precio total | $10.500.000 + IVA |

---

## Tabla de Contenidos

1. [Contexto y Objetivo](#1-contexto-y-objetivo)
2. [Arquitectura del Módulo](#2-arquitectura-del-módulo-de-costos)
3. [Modelo de Datos — Schema Prisma](#3-modelo-de-datos--extensión-del-schema-prisma)
4. [Plan de Implementación por Módulo](#4-plan-de-implementación-por-módulo)
5. [Permisos y Seguridad](#5-permisos-y-seguridad)
6. [Generación y Almacenamiento de PDFs](#6-generación-y-almacenamiento-de-pdfs)
7. [Navegación y UI](#7-navegación-y-ui)
8. [Precisión Numérica](#8-precisión-numérica-y-manejo-de-decimales)
9. [Migrations y Deployment](#9-migrations-y-deployment)
10. [Resumen de Entregables y Cronograma](#10-resumen-de-entregables-cronograma-y-pagos)
11. [Fuera de Alcance](#11-fuera-de-alcance-no-implementar)
12. [Checklist de Inicio para Claude Code](#12-checklist-de-inicio-para-claude-code)

---

## 1. Contexto y Objetivo

Transporte SP SRL opera servicios de traslado de personal hacia yacimientos petroleros en la provincia de Neuquén. Actualmente gestiona tres procesos críticos mediante planillas Excel: (1) composición de costos de cada servicio/contrato, (2) actualización mensual de tarifas vía fórmula polinómica indexada, y (3) liquidación de sueldos de choferes bajo el CCT 545/08 UOCRA Petroleros.

El objetivo de este proyecto es digitalizar y automatizar estos tres procesos dentro de la aplicación web Codecontrol que el cliente ya tiene en producción, reutilizando los módulos existentes de Clientes, Empleados y Equipos.

### 1.1 Stack tecnológico existente

| Componente | Tecnología |
|---|---|
| Framework frontend | Next.js (App Router) — versión en producción |
| Lenguaje | TypeScript |
| ORM | Prisma ORM |
| Base de datos | PostgreSQL (gestionado vía Supabase) |
| Auth | Supabase Auth + JWT (sistema de roles existente) |
| Storage | Supabase Storage (para PDFs exportados) |
| Control de versiones | Git — repositorio existente |
| UI Components | shadcn/ui + Tailwind CSS |

### 1.2 Principio rector de implementación

Este proyecto es un **módulo integrado en el monolito existente**. NO se crean microservicios, nuevas aplicaciones ni nuevas bases de datos. Se extiende el schema Prisma existente y se agregan nuevos módulos bajo `src/modules/` siguiendo la arquitectura domain-driven ya establecida en el codebase.

---

## 2. Arquitectura del Módulo de Costos

### 2.1 Estructura de carpetas a crear

Seguir exactamente la estructura modular del codebase existente (`CLAUDE.md` en la raíz del proyecto). El patrón es `src/modules/{domain}/features/{feature}/` con un `actions.server.ts` por feature y `shared/` interno para tipos/utilidades transversales del módulo.

```
src/
├── app/dashboard/
│   └── costos/                              # Rutas protegidas (middleware /dashboard/*)
│       ├── layout.tsx                       # Verifica módulo 'costos' en hired_modules
│       ├── page.tsx                         # Dashboard del módulo (resumen)
│       ├── configuracion-cct/page.tsx
│       ├── equipos/page.tsx
│       ├── combustible/page.tsx
│       ├── servicios/
│       │   ├── page.tsx                     # Listado de servicios/contratos
│       │   └── [id]/page.tsx                # Detalle: tabs MOD/OCP/equipos/composición
│       ├── mano-de-obra/page.tsx
│       ├── otros-costos-personal/page.tsx
│       ├── composicion/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── formula-polinomica/page.tsx
│       └── liquidacion-sueldos/page.tsx
│
└── modules/
    └── costos/
        ├── features/
        │   ├── cct/
        │   │   ├── actions.server.ts        # Queries + mutations del feature
        │   │   ├── components/
        │   │   └── index.ts                 # Barrel export
        │   ├── equipos/
        │   ├── combustible/
        │   ├── servicios/                   # CRUD de servicio_contrato
        │   ├── mod/
        │   ├── ocp/
        │   ├── composicion/
        │   ├── formula-polinomica/
        │   └── liquidacion/
        ├── shared/                          # Compartido dentro del módulo
        │   ├── types/
        │   ├── utils/                       # Cálculos financieros (decimal.js)
        │   └── constants/
        └── index.ts                         # Barrel export del módulo
```

> **Sin API Routes.** El módulo opera íntegramente vía Server Actions (`actions.server.ts`). Sólo se crearía un `route.ts` puntual si se necesita callback externo o URL pública con caché HTTP — caso no previsto en este alcance.

### 2.2 Patrón de capas

Respetar estrictamente el patrón de capas del proyecto:

- **Presentación (`app/dashboard/costos/`):** Solo `page.tsx` y `layout.tsx`. Sin lógica de negocio. Importan vistas/componentes desde `@/modules/costos/...`.
- **Módulo (`src/modules/costos/`):** Cada feature en `features/{feature}/` con `actions.server.ts`, `components/`, `index.ts`. Tipos/utilidades transversales del módulo en `shared/`.
- **Lógica de negocio:** Server Actions en `actions.server.ts` con directiva `'use server'` al tope. Acceden a Prisma vía `@/shared/lib/prisma` y obtienen `companyId`/usuario con `getActionContext()` (cookie `actualComp` + sesión Supabase).
- **Cálculos financieros:** Siempre server-side. **NUNCA en el cliente.** Implementar en `src/modules/costos/shared/utils/` con `decimal.js`.
- **Sin API Routes para este módulo.** Usar Server Actions exclusivamente. Si en el futuro un caso lo requiere (callback externo, descarga pública), evaluar puntualmente.

### 2.3 Módulos existentes a reutilizar (NO reimplementar)

| Módulo | Entidad Prisma | Uso en el módulo de costos |
|---|---|---|
| Clientes | `customers` | Los servicios/contratos se vinculan a clientes existentes (PECOM, AESA, etc.) |
| Empleados | `employees` | Choferes asignados a servicios. Fuente para MOD y Liquidación de sueldos. |
| Equipos | `vehicles` | Se extiende con campos de costo. El módulo `costo_equipo` referencia `vehicles`. |

---

## 3. Modelo de Datos — Extensión del Schema Prisma

Agregar los siguientes modelos al schema Prisma existente (`prisma/schema.prisma`). **NO tocar modelos existentes** salvo las extensiones indicadas. Crear una migration por cada entregable (E-0 setup + E-1 a E-6).

> **Convenciones del schema real (respetarlas en todos los modelos nuevos):**
> - IDs: `String @id @default(uuid()) @db.Uuid`
> - FKs: `String @db.Uuid`
> - Timestamps: `DateTime @default(now()) @db.Timestamptz(6)`
> - Períodos `'YYYY-MM'`: `String @db.VarChar(7)`
> - Cliente Prisma: importar desde `@/generated/prisma/client` (no `@prisma/client`)

### 3.1 Enums nuevos

> Los enums del configurador CCT (`tipo_concepto_cct`, `ambito_concepto_cct`, `clase_calculo_concepto`) se definen en la sección 3.2. Los enums del módulo polinómico (`tipo_indice_polinomico`) en 3.5.

```prisma
enum estado_liquidacion {
  borrador
  confirmada
  pagada
}
```

### 3.2 Configurador de CCT (RF-1)

> **Cambio de diseño v1.2:** Reemplaza el modelo rígido del v1.0 (escala/tasas/adicionales como tablas separadas con columnas fijas) por un **configurador genérico de conceptos** validado contra las planillas reales. Razón: Transporte SP tiene 4+ CCTs activos y cada paritaria puede agregar conceptos nuevos por acta (ej. "Asignación Vaca Muerta", "SNR Acta 3 de Junio"). El sistema debe modelar conceptos dinámicos sin cambios de schema.
>
> **Regla de negocio:** una cotización (`servicio_contrato`) usa exactamente un CCT. Cuando un CCT abarca múltiples servicios, cada uno tiene su FK a la misma `config_cct`.

```prisma
// CCT vigente en una paritaria — una entrada por acuerdo sindical
model config_cct {
  id              String   @id @default(uuid()) @db.Uuid
  created_at      DateTime @default(now()) @db.Timestamptz(6)
  company_id      String   @db.Uuid
  cct_codigo      String   // '545/08', '40/89', '130/75', 'UTA'
  cct_nombre      String   // 'UOCRA Petroleros', 'Camioneros', 'Comercio'
  vigencia_desde  String   @db.VarChar(7)   // 'YYYY-MM'
  vigencia_hasta  String?  @db.VarChar(7)   // null = vigente
  is_active       Boolean  @default(true)
  descripcion     String?  // 'Paritaria abril 2026 + Acta 3 de junio'

  company       company             @relation(fields: [company_id], references: [id])
  categorias    categoria_cct[]
  conceptos     concepto_cct[]
  servicios     servicio_contrato[]
  liquidaciones liquidacion_sueldo[]

  @@index([company_id, cct_codigo, is_active])
}

// Categorías del CCT (G B, J B, M B, Of. Especializado, etc.)
model categoria_cct {
  id            String  @id @default(uuid()) @db.Uuid
  config_cct_id String  @db.Uuid
  codigo        String  // 'GB', 'JB', 'MB', 'OFESP'
  nombre        String  // 'Junior B', 'Master B', 'Oficial Especializado'
  orden         Int     @default(0)

  config_cct      config_cct                  @relation(fields: [config_cct_id], references: [id])
  valores         valor_concepto_categoria[]
  asignaciones   asignacion_mod[]

  @@unique([config_cct_id, codigo])
}

// Definición de cada concepto del CCT (básico, zona, antigüedad, aportes, descuentos, viandas, etc.)
model concepto_cct {
  id            String                    @id @default(uuid()) @db.Uuid
  config_cct_id String                    @db.Uuid
  codigo        String                    // 'BASICO', 'ZONA_85', 'ANTIG', 'BONO_PAZ_SOC', 'JUBILACION', 'OS', 'SIPA', 'VIANDA', etc.
  nombre        String                    // legible para UI/recibo
  tipo          tipo_concepto_cct
  aplica_en     ambito_concepto_cct[]     // [mod_servicio, liquidacion]
  clase_calculo clase_calculo_concepto
  parametros    Json                      // depende de la clase (ver tabla más abajo)
  orden         Int                       @default(0)
  is_active     Boolean                   @default(true)

  config_cct config_cct                 @relation(fields: [config_cct_id], references: [id])
  valores    valor_concepto_categoria[]

  @@unique([config_cct_id, codigo])
}

// Valores fijos cuando un concepto varía por categoría (típicamente Básico)
model valor_concepto_categoria {
  id               String  @id @default(uuid()) @db.Uuid
  concepto_cct_id  String  @db.Uuid
  categoria_cct_id String  @db.Uuid
  valor            Decimal @db.Decimal(15,2)

  concepto  concepto_cct  @relation(fields: [concepto_cct_id], references: [id])
  categoria categoria_cct @relation(fields: [categoria_cct_id], references: [id])

  @@unique([concepto_cct_id, categoria_cct_id])
}

// Topes imponibles AFIP/ANSES — global del sistema, no por empresa ni por CCT
model tope_imponible {
  id              String  @id @default(uuid()) @db.Uuid
  codigo          String  // 'jubilatorio_max', 'jubilatorio_min'
  vigencia_desde  String  @db.VarChar(7)
  valor           Decimal @db.Decimal(15,2)
  fuente          String? // 'Resol ANSES xxx/2026'

  @@unique([codigo, vigencia_desde])
}

enum tipo_concepto_cct {
  remunerativo
  no_remunerativo
  descuento          // se restan al neto del trabajador
  aporte_patronal    // contribuciones a cargo del empleador (van al MOD)
  provision          // SAC, vacaciones (van al MOD)
  prevision          // indemnización, preaviso, exámenes (van al MOD)
  ausentismo         // % aplicado al sub-total (va al MOD)
}

enum ambito_concepto_cct {
  mod_servicio       // se usa al calcular el costo MOD del servicio/contrato
  liquidacion        // se usa al armar el recibo de sueldo
}

enum clase_calculo_concepto {
  FIJO_GLOBAL              // valor único — parámetros: { valor }
  FIJO_POR_CATEGORIA       // lookup en valor_concepto_categoria
  PCT_CONCEPTO             // % de otro concepto — parámetros: { concepto_codigo, porcentaje }
  PCT_SUMA_CONCEPTOS       // % sobre suma — parámetros: { conceptos_codigos: [], porcentaje, tope_codigo? }
  POR_ANTIGUEDAD_VALOR     // valor × años — parámetros: { valor_por_anio }
  POR_ANTIGUEDAD_PCT       // % × años × concepto base — parámetros: { porcentaje_por_anio, concepto_base_codigo }
  POR_UNIDAD               // valor unitario × cantidad — parámetros: { unidad: 'horas'|'dias', recargo?, derivacion? }
}
```

#### 3.2.1 Tabla de referencia: parámetros por clase de cálculo

| Clase | Parámetros JSON | Ejemplo de uso |
|---|---|---|
| `FIJO_GLOBAL` | `{ valor: number }` | Bono Paz Social $227,559 igual para todas las categorías |
| `FIJO_POR_CATEGORIA` | _(sin parámetros — los valores van en `valor_concepto_categoria`)_ | Sueldo Básico (G B = 584,641 / J B = 690,940 / M B = 812,186) |
| `PCT_CONCEPTO` | `{ concepto_codigo: string, porcentaje: number }` | Zona 85% sobre Básico — `{ concepto_codigo: "BASICO", porcentaje: 0.85 }` |
| `PCT_SUMA_CONCEPTOS` | `{ conceptos_codigos: string[], porcentaje: number, tope_codigo?: string }` | Jubilación 11% sobre remunerativos hasta tope — `{ conceptos_codigos: ["BASICO","ZONA_85","ANTIG",...], porcentaje: 0.11, tope_codigo: "jubilatorio_max" }` |
| `POR_ANTIGUEDAD_VALOR` | `{ valor_por_anio: number }` | Antigüedad $5,429 × año |
| `POR_ANTIGUEDAD_PCT` | `{ porcentaje_por_anio: number, concepto_base_codigo: string }` | Antigüedad 1% × año × Básico |
| `POR_UNIDAD` | `{ unidad: 'horas'\|'dias', recargo?: number, derivacion?: { base: string, divisor: string } }` | Hs Nocturnas: derivado del básico/horas mensuales con recargo 30% |

#### 3.2.2 Notas del motor de cálculo

- El motor recibe un **contexto** (chofer + categoría + antigüedad + días trabajados + horas declaradas) y resuelve los conceptos en **orden topológico** (un `PCT_CONCEPTO` debe esperar a que el referenciado esté calculado).
- Cuando un concepto declara `tope_codigo`, el motor busca en `tope_imponible` el valor con `vigencia_desde <= período` más reciente y limita la base.
- Si `aplica_en` incluye `liquidacion`, el concepto aparece como línea del recibo. Si incluye `mod_servicio`, suma al subtotal MOD del servicio.
- Los valores `Decimal` se manejan con `decimal.js`; las conversiones a `number` ocurren sólo al cruzar la frontera server→client (ver sección 8).

> **Sin clase `FORMULA` (expresiones libres) en MVP.** Si aparece un caso real que no encaja en las 7 clases, se agrega una clase nueva concreta con tests, no se incorpora un evaluador genérico.

### 3.3 Costo de Equipos (RF-2)

```prisma
// Extensión de datos de costo para un vehículo existente
model costo_equipo {
  id                  String  @id @default(uuid())
  created_at          DateTime @default(now())
  vehicle_id          String  @unique   // FK al modelo vehicles existente
  company_id          String
  valor_compra        Decimal @db.Decimal(15,2)
  valor_residual      Decimal @db.Decimal(15,2)
  anios_amortizacion  Int
  km_vida_util        Int
  is_active           Boolean @default(true)

  vehicle  vehicles @relation(fields: [vehicle_id], references: [id])
  company  company  @relation(fields: [company_id], references: [id])

  items_mantenimiento item_mantenimiento[]
}

// ~40 ítems de mantenimiento predictivo por equipo
model item_mantenimiento {
  id                String  @id @default(uuid())
  costo_equipo_id   String
  nombre            String  // ej: 'Neumáticos traseros', 'Filtro aceite'
  frecuencia_km     Int
  precio_unitario   Decimal @db.Decimal(15,2)
  cantidad          Int     @default(1)
  is_active         Boolean @default(true)

  costo_equipo costo_equipo @relation(fields: [costo_equipo_id], references: [id])
}
```

### 3.4 Servicio/Contrato y Composición de Costos (RF-3 a RF-6)

```prisma
// Servicio/contrato: agrupador maestro de todos los módulos de costo
model servicio_contrato {
  id                  String  @id @default(uuid())
  created_at          DateTime @default(now())
  company_id          String
  customer_id         String  // FK a customers (PECOM, AESA, etc.)
  nombre              String  // ej: 'Servicio PECOM RDLS 44+1'
  descripcion         String?
  fecha_inicio        String
  fecha_fin           String?
  is_active           Boolean @default(true)

  // Márgenes comerciales configurables
  margen_iibb         Decimal @db.Decimal(5,2) @default(0)
  margen_debcred      Decimal @db.Decimal(5,2) @default(0)
  margen_estructura   Decimal @db.Decimal(5,2) @default(0)
  margen_ganancia     Decimal @db.Decimal(5,2) @default(0)
  licencia_ordenanza  Decimal @db.Decimal(5,2) @default(0)

  company  company   @relation(fields: [company_id], references: [id])
  customer customers @relation(fields: [customer_id], references: [id])

  config_cct_id         String  @db.Uuid                     // CCT aplicable a este servicio (1 a 1)
  config_cct            config_cct @relation(fields: [config_cct_id], references: [id])

  asignaciones_mod      asignacion_mod[]
  asignaciones_equipo   asignacion_equipo_servicio[]
  items_ocp             item_ocp[]
  registros_combustible registro_combustible[]
  composiciones_costo   composicion_costo[]
  outputs_configurados  tipo_output_servicio[]
  periodos_polinomico   periodo_formula_polinomica[]
  formula_polinomica    formula_polinomica?
}

// Asignación de choferes a un servicio con % de afectación
model asignacion_mod {
  id                String    @id @default(uuid()) @db.Uuid
  servicio_id       String    @db.Uuid
  employee_id       String    @db.Uuid                       // FK a employees existente
  categoria_cct_id  String    @db.Uuid                       // FK a categoria_cct (snapshot del CCT vigente)
  afectacion_pct    Decimal   @db.Decimal(5,2)               // ej: 57.00 = 57%
  antiguedad_anios  Int       @default(0)
  is_active         Boolean   @default(true)

  // Overrides puntuales por chofer/servicio (horas extras estimadas, viandas extra, etc.)
  // Estructura: { hs_nocturnas: 12, hs_extras_50: 9, hs_extras_100: 0, viandas_extra: 0, ... }
  overrides_calculo Json?

  servicio  servicio_contrato @relation(fields: [servicio_id], references: [id])
  employee  employees         @relation(fields: [employee_id], references: [id])
  categoria categoria_cct     @relation(fields: [categoria_cct_id], references: [id])
}

// Asignación de equipos a un servicio
model asignacion_equipo_servicio {
  id              String  @id @default(uuid())
  servicio_id     String
  vehicle_id      String
  km_mensuales    Int     @default(0)
  is_active       Boolean @default(true)

  servicio servicio_contrato @relation(fields: [servicio_id], references: [id])
  vehicle  vehicles           @relation(fields: [vehicle_id], references: [id])
}

// Otros Costos de Personal (OCP): vestimenta, EPP, médicos, carnets
model item_ocp {
  id                  String  @id @default(uuid())
  servicio_id         String
  concepto            String  // ej: 'Uniforme anual', 'EPP básico', 'Carnet REPSOL'
  costo_anual         Decimal @db.Decimal(15,2)
  cantidad_empleados  Int     @default(1)
  is_active           Boolean @default(true)

  servicio servicio_contrato @relation(fields: [servicio_id], references: [id])
}

// Precios mensuales de combustible por período
model registro_combustible {
  id                  String  @id @default(uuid())
  servicio_id         String
  periodo             String  // 'YYYY-MM'
  litros_mensuales    Decimal @db.Decimal(10,2)
  precio_gasoil_lt    Decimal @db.Decimal(15,2)
  precio_urea_lt      Decimal @db.Decimal(15,2) @default(0)

  servicio servicio_contrato @relation(fields: [servicio_id], references: [id])
  @@unique([servicio_id, periodo])
}

// Snapshot de la composición completa de costos para un período
model composicion_costo {
  id                  String   @id @default(uuid()) @db.Uuid
  created_at          DateTime @default(now()) @db.Timestamptz(6)
  servicio_id         String   @db.Uuid
  periodo             String   @db.VarChar(7)
  config_cct_id       String   @db.Uuid

  // Subtotales calculados (server-side, guardados para auditoría)
  subtotal_mod         Decimal @db.Decimal(15,2)
  subtotal_equipos     Decimal @db.Decimal(15,2)
  subtotal_combustible Decimal @db.Decimal(15,2)
  subtotal_ocp         Decimal @db.Decimal(15,2)
  total_costo_directo  Decimal @db.Decimal(15,2)
  total_con_margenes   Decimal @db.Decimal(15,2)
  precio_mensual       Decimal @db.Decimal(15,2)

  // JSON con el detalle completo (todas las líneas de cada subtotal) para reconstrucción/auditoría
  detalle_json        Json
  pdf_path            String?

  servicio   servicio_contrato    @relation(fields: [servicio_id], references: [id])
  config_cct config_cct           @relation(fields: [config_cct_id], references: [id])
  outputs    output_composicion[]

  @@unique([servicio_id, periodo])
}

// Outputs derivados del precio mensual: km excedente, día feriado, hora extra, descuento, stand by, etc.
// Cada servicio define qué outputs emite (PECOM tiene km excedente + día feriado + hora extra + descuento 7%;
// AESA tiene km excedente + día stand by; otros pueden tener cualquier combinación).
model output_composicion {
  id                String  @id @default(uuid()) @db.Uuid
  composicion_id    String  @db.Uuid
  tipo_output_id    String  @db.Uuid
  valor             Decimal @db.Decimal(15,4)
  detalle_calculo   Json?   // valores intermedios usados para llegar al output

  composicion composicion_costo @relation(fields: [composicion_id], references: [id])
  tipo_output tipo_output_servicio @relation(fields: [tipo_output_id], references: [id])

  @@unique([composicion_id, tipo_output_id])
}

// Catálogo de tipos de output configurables por servicio (cada servicio activa los que negoció con su cliente)
model tipo_output_servicio {
  id                  String  @id @default(uuid()) @db.Uuid
  servicio_id         String  @db.Uuid
  codigo              String  // 'KM_EXCEDENTE', 'DIA_FERIADO', 'HORA_EXTRA', 'DESCUENTO_PCT', 'STAND_BY', etc.
  nombre              String
  formula             Json    // descripción declarativa del cálculo (ej: { tipo: 'precio/kms*factor', kms_base: 2500, factor: 0.5 })
  orden               Int     @default(0)
  is_active           Boolean @default(true)

  servicio servicio_contrato     @relation(fields: [servicio_id], references: [id])
  outputs  output_composicion[]

  @@unique([servicio_id, codigo])
}
```

### 3.5 Fórmula Polinómica (RF-7)

> **Cambio v1.2:** La fórmula polinómica del v1.0 estaba mal planteada (usaba ratios `indice_t / indice_base`). La fórmula real, validada contra la planilla PECOM Jun25–Feb26, es la **fórmula argentina estándar de redeterminación**:
>
> $$P = PB \times \left(1 + \sum_i P_i \times \Delta I_i\%\right)$$
>
> donde `Pi` es la ponderación del componente y `ΔIi%` es la **variación porcentual acumulada** del índice respecto a la base. Las ponderaciones por defecto se derivan de la composición del costo (`Pmo = subtotal_mod / total_industrial`, etc.) y suman 1.0. Pueden overridearse manualmente.
>
> Los **retroactivos** se calculan por unidad/equipo, acumulando la diferencia `(valor_ajustado - importe_certificado)` por cada período hasta que el cliente acepta el ajuste.

```prisma
enum tipo_indice_polinomico {
  cct           // valor escala CCT (MOD)
  ipim_34       // IPIM Vehículos automotores (Equipos)
  gasoil_g3     // Gasoil grado 3 (Combustible)
  ipim_ng       // IPIM Nivel General (Otros)
  custom        // permite agregar índices custom por servicio
}

// Definición de ponderaciones de la fórmula para un servicio
model formula_polinomica {
  id              String   @id @default(uuid()) @db.Uuid
  servicio_id     String   @unique @db.Uuid
  descripcion     String?
  fecha_base      String   @db.VarChar(7)              // período base (P0)
  precio_base     Decimal  @db.Decimal(15,2)           // PB

  servicio    servicio_contrato            @relation(fields: [servicio_id], references: [id])
  componentes componente_formula[]
  periodos    periodo_formula_polinomica[]
}

// Componentes de la fórmula con su ponderación e índice asociado.
// Suma de ponderaciones de todos los componentes activos = 1.0 (validación server-side).
model componente_formula {
  id                    String   @id @default(uuid()) @db.Uuid
  formula_id            String   @db.Uuid
  codigo                String   // 'I001', 'I002', 'I003', 'I004', 'I005' (custom)
  nombre                String   // 'Mano de Obra Directa', 'Equipos', 'Combustible', 'Otros'
  tipo_indice           tipo_indice_polinomico
  ponderacion           Decimal  @db.Decimal(5,4)      // ej: 0.3128 (suma de todos = 1.0)
  valor_indice_base     Decimal  @db.Decimal(15,4)     // I_base
  fuente_indice         String?  // 'INDEC IPIM 34', 'Sec Energía Gasoil G3', 'CCT 545/08'

  formula           formula_polinomica         @relation(fields: [formula_id], references: [id])
  valores_periodo   valor_componente_periodo[]

  @@unique([formula_id, codigo])
}

// Registro mensual de la fórmula: valores de índices y coeficientes calculados.
model periodo_formula_polinomica {
  id                          String   @id @default(uuid()) @db.Uuid
  formula_id                  String   @db.Uuid
  servicio_id                 String   @db.Uuid
  periodo                     String   @db.VarChar(7)

  // Resultados calculados (server-side, almacenados para auditoría)
  ajuste_porcentual_acumulado Decimal  @db.Decimal(10,6)  // Σ Pi × ΔIi%
  ajuste_monto                Decimal  @db.Decimal(15,2)  // PB × ajuste_porcentual
  valor_ajustado              Decimal  @db.Decimal(15,2)  // PB + ajuste_monto
  importe_certificado         Decimal? @db.Decimal(15,2)  // lo que el cliente efectivamente pagó (puede quedar atrás)
  retroactivo_acumulado       Decimal? @db.Decimal(15,2)  // diferencia pendiente de cobro

  formula  formula_polinomica         @relation(fields: [formula_id], references: [id])
  servicio servicio_contrato          @relation(fields: [servicio_id], references: [id])
  valores  valor_componente_periodo[]

  @@unique([formula_id, periodo])
}

// Valor de cada componente en cada período (índice del mes + variación calculada).
model valor_componente_periodo {
  id                String   @id @default(uuid()) @db.Uuid
  periodo_id        String   @db.Uuid
  componente_id     String   @db.Uuid
  valor_indice      Decimal  @db.Decimal(15,4)     // I_t (valor del índice en el período)
  variacion_pct     Decimal  @db.Decimal(10,6)     // ΔIi% = (I_t - I_base) / I_base
  contribucion_pct  Decimal  @db.Decimal(10,6)     // Pi × ΔIi% (lo que aporta este componente al ajuste total)

  periodo    periodo_formula_polinomica @relation(fields: [periodo_id], references: [id])
  componente componente_formula         @relation(fields: [componente_id], references: [id])

  @@unique([periodo_id, componente_id])
}
```

**Algoritmo de cálculo (server-side, `decimal.js`):**

```typescript
// Para cada período t:
//   variación de cada componente respecto a la base
for (const comp of componentes) {
  const I_t = valor_indice_periodo(comp, t);
  variacion_pct_i = (I_t - comp.valor_indice_base) / comp.valor_indice_base;
  contribucion_pct_i = comp.ponderacion × variacion_pct_i;
}

// Ajuste total
ajuste_porcentual_acumulado = Σ contribucion_pct_i;
ajuste_monto                = formula.precio_base × ajuste_porcentual_acumulado;
valor_ajustado              = formula.precio_base + ajuste_monto;

// Retroactivo (si el cliente venía pagando un valor menor)
retroactivo_acumulado = Σ (valor_ajustado_periodo - importe_certificado_periodo)  para cada período
                        desde la última aceptación de tarifa hasta hoy.
```

### 3.6 Liquidación de Sueldos (RF-8)

> **Cambio v1.2:** El recibo real tiene ~32-35 conceptos (no 45) y varía por paritaria/acta. El motor reusa el configurador de conceptos del CCT (sección 3.2): cada concepto con `aplica_en` que incluya `liquidacion` aparece como línea del recibo. El SAC se calcula en una sub-liquidación aparte dentro del mismo registro. Los valores y bases de cada concepto quedan en `conceptos_json` para auditoría.

```prisma
model liquidacion_sueldo {
  id                  String             @id @default(uuid()) @db.Uuid
  created_at          DateTime           @default(now()) @db.Timestamptz(6)
  company_id          String             @db.Uuid
  employee_id         String             @db.Uuid
  config_cct_id       String             @db.Uuid
  categoria_cct_id    String             @db.Uuid               // categoría aplicada al chofer en este período
  periodo             String             @db.VarChar(7)
  estado              estado_liquidacion @default(borrador)

  // Inputs del período (días, horas, etc.)
  dias_trabajados     Int                @default(30)
  inasistencias_dias  Int                @default(0)
  hs_nocturnas        Decimal            @default(0) @db.Decimal(8,2)
  hs_extras_50        Decimal            @default(0) @db.Decimal(8,2)
  hs_extras_100       Decimal            @default(0) @db.Decimal(8,2)
  dias_feriado        Int                @default(0)
  dias_desarraigo     Int                @default(0)
  inputs_extra        Json?              // overrides por chofer (viandas extras, embargos, adelantos, etc.)

  // Totales calculados (server-side, persistidos para auditoría)
  total_remunerativo  Decimal @db.Decimal(15,2)
  total_no_remun      Decimal @db.Decimal(15,2)
  total_descuentos    Decimal @db.Decimal(15,2)
  total_sac           Decimal @db.Decimal(15,2) @default(0)
  neto_a_pagar        Decimal @db.Decimal(15,2)

  // Detalle completo del recibo: array de líneas con
  //   { concepto_codigo, concepto_nombre, tipo, cantidad, valor_unitario, base, importe }
  // El SAC se guarda con clave 'sac' en este mismo JSON.
  conceptos_json      Json
  pdf_path            String?

  company    company       @relation(fields: [company_id], references: [id])
  employee   employees     @relation(fields: [employee_id], references: [id])
  config_cct config_cct    @relation(fields: [config_cct_id], references: [id])
  categoria  categoria_cct @relation(fields: [categoria_cct_id], references: [id])

  @@unique([employee_id, periodo])
}
```

### 3.7 Extensiones a modelos existentes

Agregar únicamente las relaciones inversas. **NO modificar campos existentes.**

```prisma
// En model vehicles — agregar:
costo_equipo              costo_equipo?
asignaciones_servicio     asignacion_equipo_servicio[]

// En model employees — agregar:
asignaciones_mod          asignacion_mod[]
liquidaciones_sueldos     liquidacion_sueldo[]

// En model categoria_cct — relaciones ya declaradas en sec 3.2

// (No es necesario agregar relación inversa de tope_imponible: es global)

// En model customers — agregar:
servicios_contrato        servicio_contrato[]

// En model company — agregar:
config_cct                config_cct[]
costo_equipos             costo_equipo[]
servicios_contrato        servicio_contrato[]
liquidaciones_sueldos     liquidacion_sueldo[]
```

---

## 4. Plan de Implementación por Módulo

Los módulos se implementan en el orden indicado. Cada entregable cierra con su migration de Prisma, pruebas de cálculo contra las planillas Excel del cliente, y validación de exportación PDF donde corresponda.

---

### 4.1 E-1: Configurador de CCT (Semanas 1–3)

| Campo | Valor |
|---|---|
| Modelos Prisma | `config_cct`, `categoria_cct`, `concepto_cct`, `valor_concepto_categoria`, `tope_imponible` |
| Enums | `tipo_concepto_cct`, `ambito_concepto_cct`, `clase_calculo_concepto`, `tipo_indice_polinomico` |
| Semanas | 1–3 · 60 hs estimadas |
| Criterio de aceptación | Configurador funcional. El cliente modela un CCT completo (categorías + ~25 conceptos con sus clases de cálculo) sin asistencia técnica. Carga las 7 categorías y los conceptos del CCT 545/08 reproduciendo los valores de las planillas (Bide / Guiñazu / Moragues). |

**Archivos a crear:**

```
src/modules/costos/features/cct/
├── actions.server.ts                    # CRUD config_cct + categorias + conceptos + valores
├── components/
│   ├── PanelCCT.tsx                     # Lista CCTs activos + selector
│   ├── SelectorParitaria.tsx            # Selector de período paritario dentro del CCT
│   ├── FormNuevoCCT.tsx                 # Crear CCT (codigo + nombre)
│   ├── FormNuevaParitaria.tsx           # Crear nueva paritaria (clona del anterior)
│   ├── TabCategorias.tsx                # CRUD categorías
│   ├── TabConceptos.tsx                 # Lista de conceptos con filtros por tipo y ámbito
│   ├── FormConcepto.tsx                 # Form dinámico según clase_calculo (UI distinta por clase)
│   ├── TabValoresPorCategoria.tsx       # Grilla concepto × categoría para valores fijos
│   └── PanelTopesImponibles.tsx         # Admin global (sólo rol admin del sistema)
└── index.ts

src/modules/costos/shared/
├── types/cct.types.ts
└── utils/
    ├── motor-conceptos.ts               # Resuelve conceptos en orden topológico
    └── seed-cct-545-08.ts               # Helper para seed inicial desde planillas

src/app/dashboard/costos/
├── layout.tsx                           # Verifica módulo 'costos' en hired_modules
├── configuracion-cct/page.tsx           # Configurador
└── topes-imponibles/page.tsx            # Admin de topes (acceso restringido)
```

**Reglas de negocio:**

- Solo puede haber un período activo (`vigencia_hasta = null`) por **CCT × empresa** simultáneamente. Una empresa puede tener varios CCTs activos a la vez (uno por convenio).
- Al crear una nueva paritaria del mismo CCT, el sistema setea `vigencia_hasta` del período anterior y **clona** sus categorías + conceptos como punto de partida (el usuario edita lo que cambió).
- Un período no puede editarse si tiene composiciones de costo o liquidaciones asociadas (modo solo lectura / clonar).
- La suma de ponderaciones en `componente_formula` (fórmula polinómica) debe validarse igual a 1.0 (tolerancia ±0.0001).
- **Validación del motor de conceptos:** las referencias `concepto_codigo` dentro de los `parametros` JSON deben existir en el mismo CCT (validación al guardar). Detección de ciclos en orden topológico (rechazar al guardar).
- **Topes imponibles:** sólo el admin del sistema (no el cliente final) los crea/edita. El motor consulta la vigencia más reciente con `vigencia_desde <= período liquidado`.

---

### 4.2 E-2: Módulo Costo de Equipos + Combustible (Semanas 4–6)

| Campo | Valor |
|---|---|
| Modelos Prisma | `costo_equipo`, `item_mantenimiento`, `registro_combustible` |
| Semanas | 4–6 · 60 hs estimadas |
| Criterio de aceptación | Cálculo mensual de amortización y mantenimiento validado contra planilla Excel del IVECO 10-190 y omnibuses existentes. |

**Archivos a crear:**

```
src/modules/costos/features/equipos/
├── actions.server.ts                    # CRUD costo_equipo + items_mantenimiento
├── components/
│   ├── TablaEquiposCosto.tsx
│   ├── FormCostoEquipo.tsx
│   ├── TablaItemsMantenimiento.tsx
│   └── ResumenCostoEquipo.tsx
└── index.ts

src/modules/costos/features/combustible/
├── actions.server.ts                    # Registros mensuales por servicio
├── components/
│   └── RegistroCombustible.tsx
└── index.ts

src/modules/costos/shared/
├── types/equipo-costo.types.ts
├── types/combustible.types.ts
└── utils/
    ├── calcular-amortizacion.ts
    └── calcular-mantenimiento.ts

src/app/dashboard/costos/
├── equipos/page.tsx
└── combustible/page.tsx
```

**Fórmulas de cálculo (server-side):**

```typescript
// Amortización mensual
const amortizacion_mensual = (valor_compra - valor_residual) / (anios_amortizacion * 12);

// Provisión mensual de un ítem de mantenimiento
const provision_item = (precio_unitario * cantidad) / frecuencia_km * km_mensuales;

// Costo mensual total del equipo
const costo_mensual_equipo = amortizacion_mensual + sum(provision_items);
```

---

### 4.3 E-3: Módulo MOD + OCP (Semanas 7–9) · HITO P-2

| Campo | Valor |
|---|---|
| Modelos Prisma | `servicio_contrato`, `asignacion_mod`, `item_ocp` |
| Semanas | 7–9 · 60 hs estimadas |
| **Hito de pago** | **P-2: 30% — $3.150.000** |
| Criterio de aceptación | Cálculo completo de MOD y OCP validado comparando contra planillas Excel actuales del cliente para 3 choferes. |

**Archivos a crear:**

```
src/modules/costos/features/servicios/
├── actions.server.ts                    # CRUD servicio_contrato + asignacion_equipo_servicio
├── components/
│   └── FormServicioContrato.tsx
└── index.ts

src/modules/costos/features/mod/
├── actions.server.ts                    # asignacion_mod (CRUD) + cálculo MOD
├── components/
│   ├── AsignacionChoferes.tsx
│   └── ResumenMOD.tsx
└── index.ts

src/modules/costos/features/ocp/
├── actions.server.ts                    # item_ocp por servicio
├── components/
│   ├── TablaItemsOCP.tsx
│   └── ResumenOCP.tsx
└── index.ts

src/modules/costos/shared/
├── types/servicio.types.ts
├── types/mod.types.ts
├── types/ocp.types.ts
└── utils/calcular-mod.ts                # Motor MOD con decimal.js

src/app/dashboard/costos/
├── servicios/
│   ├── page.tsx                         # Listado
│   └── [id]/page.tsx                    # Detalle con tabs MOD/OCP/equipos
├── mano-de-obra/page.tsx
└── otros-costos-personal/page.tsx
```

**Motor MOD genérico (`calcular-mod.ts`)**

> **Cambio v1.2:** El motor ya no hardcodea conceptos (básico/zona/antigüedad/etc.). Resuelve automáticamente todos los `concepto_cct` con `aplica_en` que incluye `mod_servicio`, en orden topológico, usando el contexto del chofer (categoría, antigüedad, días, horas) y los `overrides_calculo` de la `asignacion_mod`.

```typescript
// Pseudocódigo del motor
function calcularMODServicio(servicio: ServicioContrato, periodo: string) {
  const cct = servicio.config_cct;
  const conceptos = cct.conceptos.filter(c => c.aplica_en.includes('mod_servicio'));
  const ordenados = ordenTopologico(conceptos);  // resuelve dependencias por concepto_codigo

  let subtotal_mod = 0;
  for (const asignacion of servicio.asignaciones_mod) {
    const ctx = construirContexto(asignacion, periodo);  // categoría, antigüedad, hs, días
    const valores: Record<string, Decimal> = {};
    for (const c of ordenados) {
      valores[c.codigo] = calcularConcepto(c, ctx, valores);  // dispatch por clase_calculo
    }
    const mod_chofer = sumarConceptos(valores, asignacion.afectacion_pct);
    subtotal_mod += mod_chofer;
  }
  return subtotal_mod;
}
```

**Validación del motor:** correr contra los 3 choferes reales (Bide, Guiñazu, Moragues) — el sub-total MOD por chofer debe coincidir al centavo con el bruto de la liquidación correspondiente.

---

### 4.4 E-4: Composición de Costos de Servicio (Semanas 10–11)

| Campo | Valor |
|---|---|
| Modelos Prisma | `composicion_costo` (snapshot + PDF en Supabase Storage) |
| Semanas | 10–11 · 40 hs estimadas |
| Criterio de aceptación | Pantalla maestra funcional. Precio final con márgenes. PDF exportable. Validado contra servicios PECOM y AESA. |

**Archivos a crear:**

```
src/modules/costos/features/composicion/
├── actions.server.ts                    # calcularComposicion, generarPDF, getSignedUrl
├── components/
│   ├── PantallaComposicion.tsx
│   ├── ResumenCostosAgrupados.tsx
│   ├── ConfigMargenes.tsx
│   ├── ResumenPrecios.tsx
│   └── BotonExportarPDF.tsx
└── index.ts

src/modules/costos/shared/
├── types/composicion.types.ts
└── utils/
    ├── calcular-composicion.ts
    └── generar-pdf-composicion.tsx     # @react-pdf/renderer

src/app/dashboard/costos/composicion/
├── page.tsx                             # Listado de composiciones por servicio/período
└── [id]/page.tsx                        # Detalle + export
```

**Fórmula de márgenes (CONFIRMADA contra planillas PECOM y AESA):**

```typescript
const total_costo_directo =
  subtotal_mod + subtotal_equipos + subtotal_combustible + subtotal_ocp;

// Divisor acumulado: el costo directo es el (1 - sumaMárgenes) del precio
const suma_margenes = margen_iibb + margen_debcred + margen_estructura + margen_ganancia;
const total_con_margenes = total_costo_directo / (1 - suma_margenes);

// Licencia comercial ordenanza: suma sobre el subtotal con márgenes
const precio_mensual = total_con_margenes + (total_con_margenes × licencia_ordenanza);
```

**Validación:** PECOM Junio 2025 → 18,924,708 / 0.81 = 23,363,837 + 196,256 = **23,560,093** ✓ coincide con planilla.

**Outputs derivados — flexibles por servicio (`tipo_output_servicio`):**

Cada servicio configura los outputs que negoció con su cliente. Ejemplos típicos extraídos de planillas:

| Servicio | Outputs configurados |
|---|---|
| PECOM RDLS-BDT 44+1 | `KM_EXCEDENTE`, `DIA_FERIADO`, `HORA_EXTRA`, `DESCUENTO_7PCT` |
| AESA CHNS-LM 14+1 | `KM_EXCEDENTE`, `STAND_BY_DIA` |

La fórmula declarativa de cada output va en `tipo_output_servicio.formula` (JSON):

```json
// Ejemplo PECOM km excedente:
{ "tipo": "precio_div_kms_x_factor", "kms_base": 2500, "factor": 0.5 }
// Ejemplo PECOM día feriado:
{ "tipo": "precio_div_dias", "dias_habiles": 22, "factor": 1.0 }
// Ejemplo PECOM descuento 7%:
{ "tipo": "pct_sobre_precio", "porcentaje": 0.07, "modo": "descuento" }
```

> **Pendiente E-4:** durante la implementación, hacer ingeniería inversa de los factores exactos (`factor`, `dias_habiles`, `kms_base`) tomando los valores de las planillas y los precios mensuales, y documentarlos en `referencias/README.md`.

---

### 4.5 E-5: Módulo Fórmula Polinómica (Semanas 12–13) · HITO P-3

| Campo | Valor |
|---|---|
| Modelos Prisma | `formula_polinomica`, `componente_formula`, `periodo_formula_polinomica`, `valor_componente_periodo` |
| Semanas | 12–13 · 40 hs estimadas |
| **Hito de pago** | **P-3: 25% — $2.625.000** |
| Criterio de aceptación | Serie Jun 2025 – Feb 2026 del servicio PECOM validada. Cálculo de retroactivos correcto. |

**Archivos a crear:**

```
src/modules/costos/features/formula-polinomica/
├── actions.server.ts                    # CRUD fórmula + períodos + cálculo coef
├── components/
│   ├── ConfigFormulaPolinomica.tsx
│   ├── TablaIndicesMensuales.tsx
│   ├── GraficoEvolucionTarifa.tsx       # recharts
│   └── ResumenRetroactivos.tsx
└── index.ts

src/modules/costos/shared/
├── types/formula-polinomica.types.ts
└── utils/calcular-formula-polinomica.ts

src/app/dashboard/costos/formula-polinomica/page.tsx
```

**Algoritmo de cálculo (CONFIRMADO contra planilla PECOM Jun25–Feb26):**

```typescript
// Para cada componente i en el período t:
const variacion_pct_i    = (indice_t_i - indice_base_i) / indice_base_i;
const contribucion_pct_i = ponderacion_i × variacion_pct_i;

// Ajuste total del período t
const ajuste_porcentual = sum(contribucion_pct_i);
const ajuste_monto      = precio_base × ajuste_porcentual;
const valor_ajustado    = precio_base + ajuste_monto;

// Retroactivo (por unidad/equipo, hasta que el cliente acepte el ajuste)
const retroactivo_t = valor_ajustado_t - importe_certificado_t;  // se acumula período a período
```

**Validación PECOM Jun25 (período base):** ajuste 0%, valor ajustado = 18,924,708 ✓
**Validación PECOM Jul25:** ajuste 5.769%, valor ajustado = 20,016,571 ✓ coincide con planilla.

**Ponderaciones por defecto:** se calculan automáticamente como `subtotal_i / total_industrial` de la composición vigente al período base. El usuario puede overridearlas (deben sumar 1.0).

---

### 4.6 E-6: Liquidación de Sueldos + Producción (Semanas 14–15) · HITO P-4

| Campo | Valor |
|---|---|
| Modelos Prisma | `liquidacion_sueldo` |
| Semanas | 14–15 · 40 hs estimadas |
| **Hito de pago** | **P-4: 15% — $1.575.000** |
| Criterio de aceptación | Liquidaciones validadas contra recibos reales. Despliegue en producción. Entrega de código fuente. |

**Archivos a crear:**

```
src/modules/costos/features/liquidacion/
├── actions.server.ts                    # generarBorrador, confirmar, marcarPagada, generarRecibo
├── components/
│   ├── TablaLiquidaciones.tsx
│   ├── FormLiquidacion.tsx
│   ├── VistaConceptosRecibo.tsx
│   ├── BotonGenerarRecibo.tsx
│   └── ResumenNomina.tsx
└── index.ts

src/modules/costos/shared/
├── types/liquidacion.types.ts
└── utils/calcular-liquidacion-cct.ts    # Reusa calcular-mod.ts + descuentos

src/app/dashboard/costos/liquidacion-sueldos/page.tsx
```

**Motor de liquidación genérico (`calcular-liquidacion-cct.ts`)**

Reusa el motor de conceptos de E-1 con `aplica_en` que incluye `liquidacion`. El recibo se arma con todos los conceptos activos del CCT del período liquidado, en el orden declarado (`concepto_cct.orden`).

```typescript
function generarLiquidacion(empleado: Employee, categoria: CategoriaCCT, cct: ConfigCCT, periodo: string, inputs: InputsLiquidacion) {
  const conceptos = cct.conceptos.filter(c => c.aplica_en.includes('liquidacion') && c.is_active);
  const ordenados = ordenTopologico(conceptos);
  const ctx = construirContextoLiquidacion(empleado, categoria, periodo, inputs);

  const valores: Record<string, Decimal> = {};
  const lineas: LineaRecibo[] = [];
  for (const c of ordenados) {
    const importe = calcularConcepto(c, ctx, valores);
    valores[c.codigo] = importe;
    lineas.push({ concepto_codigo: c.codigo, concepto_nombre: c.nombre, tipo: c.tipo, ...detalle, importe });
  }

  // SAC: sub-cálculo separado (segunda hoja del recibo)
  const sac_lineas = calcularSAC(empleado, categoria, cct, periodo, valores);

  return {
    total_remunerativo: sumar(lineas, 'remunerativo'),
    total_no_remun:     sumar(lineas, 'no_remunerativo'),
    total_descuentos:   sumar(lineas, 'descuento'),
    total_sac:          sumar(sac_lineas, ['remunerativo', 'no_remunerativo']) - sumar(sac_lineas, 'descuento'),
    neto_a_pagar:       …,
    conceptos_json:     { lineas, sac: sac_lineas, ctx_snapshot: ctx },
  };
}
```

**Validación:** correr contra los 3 recibos reales (Bide $3,063,102 / Guiñazu $2,733,369 / Moragues $4,089,370). Coincidencia al centavo es criterio de hito P-4.

**Topes imponibles:** los conceptos descuento (jubilación, INSSJP, obra social) declaran `tope_codigo` en sus `parametros`. El motor consulta `tope_imponible` con `vigencia_desde <= periodo` más reciente.

---

## 5. Permisos y Seguridad

Reutilizar el sistema de autenticación y roles existente (Supabase Auth + `share_company_users` + `hired_modules`). El codebase ya provee un helper estándar — usarlo en lugar de reimplementar la verificación.

```typescript
'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/auth/getActionContext'; // ajustar path real

// Patrón estándar dentro de cada actions.server.ts del módulo
export async function listCCTHistory() {
  const { user, companyId } = await getActionContext(); // valida sesión + cookie actualComp + acceso a la empresa

  await assertModuloHabilitado(companyId, 'costos');

  return prisma.config_cct.findMany({
    where: { company_id: companyId },
    orderBy: { vigencia_desde: 'desc' },
  });
}

// Helper local del módulo: src/modules/costos/shared/utils/access.ts
export async function assertModuloHabilitado(companyId: string, modulo: 'costos') {
  const habilitado = await prisma.hired_modules.findFirst({
    where: { company_id: companyId, modulo, is_active: true },
  });
  if (!habilitado) throw new Error(`Módulo ${modulo} no habilitado para esta empresa`);
}
```

**Migration de Fase 0 (E-0 setup):** agregar valor `costos` al enum `modulos` en `prisma/schema.prisma` y habilitar el registro en `hired_modules` para Transporte SP.

**Reglas de acceso:**

- Panel CCT y configuraciones: solo roles con módulo `costos` habilitado en `hired_modules`.
- Composición de costos y fórmula polinómica: lectura para auditores, escritura para administradores.
- Liquidación de sueldos: acceso restringido, registro de auditoría en cada generación.
- Los datos de un `company_id` **nunca** deben ser visibles a otro `company_id`.

---

## 6. Generación y Almacenamiento de PDFs

Los PDFs se generan server-side y se almacenan en Supabase Storage. El cliente descarga desde una URL firmada.

```typescript
// Estrategia recomendada: @react-pdf/renderer (server-side compatible con Next.js)
// Alternativa: puppeteer con página /print/composicion/[id]

// Estructura del bucket en Supabase Storage:
// costos-pdfs/
// ├── composiciones/{companyId}/{servicioId}/{periodo}.pdf
// └── liquidaciones/{companyId}/{employeeId}/{periodo}.pdf

// Flujo:
// 1. Calcular composición/liquidación en Server Action
// 2. Generar buffer PDF
// 3. Subir: supabase.storage.from('costos-pdfs').upload(path, buffer)
// 4. Guardar path en composicion_costo.pdf_path / liquidacion_sueldo.pdf_path
// 5. URL firmada: supabase.storage.from('costos-pdfs').createSignedUrl(path, 3600)
```

---

## 7. Navegación y UI

### 7.1 Agregar módulo Costos al sidebar

Agregar en `src/shared/components/layout/SideLinks.tsx` (o `Sidebar.tsx` según la convención de items vigente). Las URLs viven bajo `/dashboard/costos/`:

```typescript
{
  title: 'Gestión de Costos',
  icon: CalculatorIcon,           // lucide-react
  url: '/dashboard/costos',
  module: 'costos',               // verificar contra hired_modules
  items: [
    { title: 'Configuración CCT',     url: '/dashboard/costos/configuracion-cct' },
    { title: 'Costo de Equipos',      url: '/dashboard/costos/equipos' },
    { title: 'Combustible',           url: '/dashboard/costos/combustible' },
    { title: 'Servicios / Contratos', url: '/dashboard/costos/servicios' },
    { title: 'Mano de Obra',          url: '/dashboard/costos/mano-de-obra' },
    { title: 'Otros Costos Personal', url: '/dashboard/costos/otros-costos-personal' },
    { title: 'Composición Costos',    url: '/dashboard/costos/composicion' },
    { title: 'Fórmula Polinómica',    url: '/dashboard/costos/formula-polinomica' },
    { title: 'Liquidación Sueldos',   url: '/dashboard/costos/liquidacion-sueldos' },
  ]
}
```

### 7.2 Componentes UI a reutilizar de shared/

- `DataTable` de `shared/components/ui/data-table.tsx` para todas las listas.
- `Dialog`/`Sheet` de shadcn para formularios modales.
- `Form` + `Input` + `Select` de shadcn con React Hook Form + Zod para validaciones.
- `Card` de shadcn para los resúmenes de cálculo.
- `recharts` para el gráfico de evolución de la fórmula polinómica.

### 7.3 Formato numérico

Usar el formateador centralizado en `src/shared/lib/utils/formatters.ts` (crear o extender en Fase 0 si no existe). **Nunca usar `toFixed()` directamente en el render.**

```typescript
import { formatCurrencyARS, formatPercentage } from '@/shared/lib/utils/formatters';

formatCurrencyARS(valor)        // $ 1.234.567,89
formatPercentage(valor, 2)      // 65,00%
```

---

## 8. Precisión Numérica y Manejo de Decimales

Los cálculos financieros presentan riesgos de precisión en JavaScript. **Seguir estas reglas sin excepción:**

- En Prisma schema: `Decimal @db.Decimal(15,2)` para valores monetarios, `Decimal @db.Decimal(5,4)` para ponderaciones y coeficientes.
- Prisma retorna campos `Decimal` como objetos `Decimal` del runtime. **NO convertir a `number` para cálculos intermedios.**
- **Importante (codebase Codecontrol):** los valores `Decimal` de Prisma se convierten a `number` o `string` **antes de cruzar la frontera server→client** (ver memoria del proyecto y módulos existentes), para evitar errores de serialización en RSC. La conversión ocurre **al final** del cálculo, nunca antes.
- Usar `decimal.js` para todos los cálculos del motor. Importar el `Decimal` del cliente Prisma generado:

```typescript
import { Decimal } from '@/generated/prisma/client/runtime/library'; // o desde 'decimal.js' directo

// ✅ CORRECTO
const basico = new Decimal(escala.basico.toString());
const zona   = basico.mul(new Decimal('0.85'));
const total  = basico.plus(zona).toDecimalPlaces(2);

// ❌ INCORRECTO — error de punto flotante
const total  = Number(escala.basico) * 0.85;
```

- Redondear únicamente al final de cada bloque de cálculo, nunca en pasos intermedios.
- Los campos `detalle_json` y `conceptos_json` guardan todos los valores intermedios como strings para auditoría exacta.

---

## 9. Migrations y Deployment

### 9.1 Estrategia de migrations

Crear una migration de Prisma por entregable:

```
prisma/migrations/
├── YYYYMMDD_e1_config_cct/
├── YYYYMMDD_e2_costo_equipos/
├── YYYYMMDD_e3_mod_ocp/
├── YYYYMMDD_e4_composicion/
├── YYYYMMDD_e5_formula_polinomica/
└── YYYYMMDD_e6_liquidacion/
```

### 9.2 Checklist de deployment por entregable

- [ ] Ejecutar `prisma migrate deploy` en staging antes de producción.
- [ ] Verificar que las relaciones inversas en `vehicles`, `employees`, `customers`, `company` no rompen queries existentes.
- [ ] Correr scripts de seed con las escalas salariales de la paritaria vigente.
- [ ] Verificar que el módulo `costos` aparece en `hired_modules` solo para Transporte SP.
- [ ] Testear generación de PDFs en staging con el bucket de Supabase configurado.

---

## 10. Resumen de Entregables, Cronograma y Pagos

| # | Entregable | Criterio clave | Semana | Hito de pago |
|---|---|---|---|---|
| E-1 | Panel CCT + Schema | Escalas cargables sin asistencia técnica | 3 | — (anticipo P-1) |
| E-2 | Costo Equipos + Combustible | Costo mensual validado contra planilla IVECO | 6 | — (anticipo P-1) |
| E-3 | MOD + OCP | MOD validado vs planillas Excel (3 choferes) | 9 | **P-2: 30% — $3.150.000** |
| E-4 | Composición + PDF | Precio final con márgenes. PDF exportable. Validado PECOM + AESA | 11 | — (anticipo P-1) |
| E-5 | Fórmula Polinómica | Serie Jun25–Feb26 PECOM validada. Retroactivos correctos. | 13 | **P-3: 25% — $2.625.000** |
| E-6 | Liquidación + Deploy | Recibos validados contra recibos reales. Producción desplegada. | 15 | **P-4: 15% — $1.575.000** |
| | **TOTAL** | **300 horas · 15 semanas** | **15** | **$10.500.000 + IVA** |

---

## 11. Fuera de Alcance (NO Implementar)

Las siguientes funcionalidades **NO deben implementarse**. Cualquier incorporación requiere un Cambio de Alcance formal:

- Integración automática con fuentes externas de índices (INDEC, BCRA, Secretaría de Energía). Los índices se cargan manualmente.
- Migración de datos históricos desde planillas Excel. Los datos se cargan desde cero.
- Módulos de facturación electrónica (AFIP/ARCA).
- Integración con sistemas de liquidación externos (SUELDOS.ar, Tango, etc.).
- Aplicación mobile.
- Soporte para CCT distintos al CCT 545/08 UOCRA Petroleros.
- Actualización automática de escalas salariales vía scraping o integración con el sindicato.
- Capacitación de usuarios finales (excepto la incluida en E-6).
- Hosting, dominio y costos de infraestructura (a cargo del cliente).

---

## 12. Checklist de Inicio para Claude Code

### 12.1 Exploración del codebase existente

Antes de escribir cualquier archivo nuevo, leer lo siguiente:

- [ ] `CLAUDE.md` (raíz) — convenciones exactas del proyecto.
- [ ] `src/modules/employees/features/*/actions.server.ts` — patrón de referencia de Server Actions con `getActionContext()`.
- [ ] `src/modules/equipment/` — cómo se extiende un módulo y se reusa con vehicles.
- [ ] `prisma/schema.prisma` completo — entender enums (`modulos`, etc.) y modelos `vehicles`, `employees`, `customers`, `company`, `share_company_users`, `hired_modules` antes de agregar relaciones inversas.
- [ ] `package.json` — versión exacta de Next.js, Prisma, `@react-pdf/renderer`, `decimal.js`.
- [ ] `src/shared/lib/supabase/server.ts` — `supabaseServer()` y `adminSupabaseServer()`.
- [ ] `src/shared/lib/prisma.ts` — cliente Prisma compartido.
- [ ] `src/shared/lib/auth/` (o ubicación equivalente) — helper `getActionContext()` real (path exacto a confirmar en Fase 0).
- [ ] `src/shared/components/data-table/` — API del DataTable (filtros, export, paginado).
- [ ] `src/shared/components/layout/SideLinks.tsx` y `Sidebar.tsx` — agregar enlace del módulo costos.
- [ ] `src/shared/lib/utils/` — verificar formateadores existentes antes de crear nuevos.
- [ ] `database.types.ts` — confirmar tipos generados tras `npm run gentypes`.

### 12.2 Confirmaciones necesarias con el cliente (antes de E-3 y E-4)

- [ ] Confirmar la fórmula exacta de aplicación de márgenes en la composición de costos (cascada vs. sobre costo directo).
- [ ] Confirmar la fórmula exacta de valor km excedente, día feriado y hora extra.
- [ ] Solicitar planillas Excel de los servicios PECOM y AESA para validar los cálculos de E-4.
- [ ] Solicitar la serie histórica de índices Jun 2025 – Feb 2026 para validar E-5.
- [ ] Confirmar los ~45 conceptos del CCT con las planillas de liquidación reales para E-6.

---

*— Fin del Spec de Implementación —*
*Codecontrol SAS · Mayo 2026 · Confidencial*

---

## 2. Planificación

> Esta sección complementa el spec aprobado con un plan de implementación adaptado a la arquitectura real del proyecto Codecontrol (`src/modules/{domain}/features/{feature}/`). Donde haya discrepancias entre el spec y el codebase, se documentan al final.

### 2.1 Discrepancias spec ↔ codebase a resolver

| # | Discrepancia | Spec dice | Codebase real | Resolución propuesta |
|---|---|---|---|---|
| D-1 | Ruta raíz del módulo | `src/app/(core)/costos/` (route group `(core)`) | No existe `(core)`. Las rutas protegidas viven bajo `src/app/dashboard/` (ej: `dashboard/employee/page.tsx`). Middleware aplica auth a `/dashboard/*` y `/admin/*`. | Crear el módulo en **`src/app/dashboard/costos/`**. Esto reutiliza el middleware existente y la estructura del sidebar. Reemplazar todas las rutas `/costos/...` del spec por `/dashboard/costos/...`. |
| D-2 | Estructura de módulo | `src/modules/costos/{components,hooks,services,types,utils,constants}` plana | El patrón es `src/modules/{domain}/features/{feature}/{actions.server.ts,components,index.ts}` + `shared/` interno | Crear `src/modules/costos/features/{cct,equipos,combustible,mod,ocp,composicion,formula-polinomica,liquidacion}/` cada uno con su `actions.server.ts`, `components/`, `index.ts`. Utilidades de cálculo y types compartidos del módulo van en `src/modules/costos/shared/{utils,types,constants}/`. |
| D-3 | Capa "services" con server actions | `services/*.actions.ts` en raíz del módulo | Convención: archivos `actions.server.ts` por feature, con `'use server'`, leyendo `companyId` con `getActionContext()` desde cookies | Cada feature tiene **un único** `actions.server.ts` que agrupa queries + mutations. Renombrar `cct.actions.ts` → `features/cct/actions.server.ts`, etc. Usar `getActionContext()` y `fetchCurrentUser()` (no `createClient` directo como sugiere la sección 5 del spec). |
| D-4 | Path import Prisma/Supabase | `@/lib/prisma`, `@/lib/supabase/server` | Real: `@/shared/lib/prisma`, `@/shared/lib/supabase/server` (cliente `supabaseServer()`) | Adaptar imports en todos los snippets. |
| D-5 | API Routes | El spec lista `src/app/api/costos/*/route.ts` para todos los módulos | El codebase prefiere Server Actions; sólo hay API routes para servicios públicos (HSE, QR, repairs) | Implementar **sólo Server Actions** salvo necesidad puntual (export PDF firmado, callback externo). Eliminar el árbol `app/api/costos/*` propuesto. |
| D-6 | Enum `modulos` | Spec dice "agregar `costos @map('costos')`" | Confirmado: enum existe en `prisma/schema.prisma` con valores `empresa, empleados, equipos, documentación, mantenimiento, dashboard, ayuda, operaciones, formularios, proveedores, almacenes, compras, tesoreria`. **Falta `costos`.** | Agregar valor `costos` al enum en la migration de Fase 0. |
| D-7 | `share_company_users` y `hired_modules` | Mencionados como existentes | Confirmado: ambos modelos existen en `prisma/schema.prisma`. `hired_modules` referencia el enum `modulos`. | Reusar tal cual. La verificación de acceso debe ir en `getActionContext()` o helper análogo, no inline en cada action. |
| D-8 | Sidebar | `nav-main.tsx`/`app-sidebar.tsx` | Real: `src/shared/components/layout/Sidebar.tsx` y `SideLinks.tsx` | Agregar entrada al sidebar real. Verificar contra `hired_modules` con `module: 'costos'`. |
| D-9 | `formatters` | `shared/utils/formatters.ts` | El directorio `src/shared/utils/` no existe; existe `src/shared/lib/utils/` y `src/shared/lib/utils.ts`. Hay también helpers en `data-table` | Verificar en Fase 0 si existe formateador de moneda ARS reutilizable. Si no, crear `src/shared/lib/utils/formatters.ts` (uso transversal justifica vivir en shared). |
| D-10 | Naming snake_case | Spec usa `company_id`, `customer_id` | Confirmado: snake_case + `@db.Uuid` es el estándar del schema | OK, mantener. Cambiar `String @id @default(uuid())` a `String @id @default(uuid()) @db.Uuid` para consistencia. |
| D-11 | Generación de tipos | `npm run gentypes` regenera `database.types.ts` desde Supabase | Tras cada migration, hay que correr `npm run gentypes` para que TS conozca los nuevos modelos (Prisma client se regenera con `prisma generate` también) | Incluir en cada definición de "criterio de completitud" la regeneración de tipos. |
| D-12 | Cliente Prisma path | Spec usa `@prisma/client` | Real: import desde `@/generated/prisma/client` (cliente generado en path custom) | Adaptar imports de tipos y enums Prisma. |

### 2.2 Fases de implementación

#### Fase 0: Preparación e infraestructura del módulo

- **Objetivo:** Dejar el módulo listo para empezar a desarrollar features sin frenarse en decisiones transversales. Confirmar stack, agregar enum, reservar rutas, scaffolding base.
- **Tareas:**
  - [ ] Confirmar con el usuario las discrepancias D-1 a D-12 (especialmente D-1 ruta y D-5 sin API routes).
  - [ ] Crear migration `e0_costos_setup` que agrega `costos` al enum `modulos`.
  - [ ] Correr `npm run gentypes` y `prisma generate`. Verificar que `hired_modules` puede llevar `costos`.
  - [ ] Crear estructura base de carpetas: `src/modules/costos/`, `src/modules/costos/shared/{types,utils,constants}/`, `src/modules/costos/index.ts`.
  - [ ] Crear `src/app/dashboard/costos/layout.tsx` con verificación de módulo `costos` en `hired_modules`.
  - [ ] Agregar entrada "Gestión de Costos" al sidebar (`SideLinks.tsx` o `Sidebar.tsx`) condicionada a `hired_modules.includes('costos')`.
  - [ ] Verificar/crear formateadores ARS en `src/shared/lib/utils/formatters.ts` (`formatCurrencyARS`, `formatPercentage`).
  - [ ] Instalar `decimal.js` si no está; verificar versión disponible vía Prisma.
  - [ ] Crear bucket `costos-pdfs` en Supabase Storage (manual o vía supabase migration policies).
  - [ ] Escribir helper `verificarAccesoCostos(companyId)` en `src/modules/costos/shared/utils/access.ts` (sin cross-module imports; usa `share_company_users` directo via Prisma).
  - [ ] Habilitar `costos` en `hired_modules` para Transporte SP en entorno de staging.
- **Archivos:**
  - `prisma/schema.prisma` (agregar valor enum)
  - `prisma/migrations/YYYYMMDD_e0_costos_setup/`
  - `src/modules/costos/index.ts`
  - `src/modules/costos/shared/utils/access.ts`
  - `src/app/dashboard/costos/layout.tsx`
  - `src/shared/components/layout/SideLinks.tsx` (modificar)
  - `src/shared/lib/utils/formatters.ts` (crear o extender)
- **Criterio de completitud:** En staging, un usuario admin de Transporte SP ve "Gestión de Costos" en el sidebar; al hacer click llega a `/dashboard/costos` con un placeholder; un usuario de otra empresa no ve la entrada. `npm run check-types` y `npm run lint` pasan.
- **Hito de pago:** ninguno (cubierto por anticipo P-1).

#### Fase 1: E-1 Configurador de CCT (semanas 1–3)

- **Objetivo:** El cliente modela cualquier CCT (4+ activos en Transporte SP) definiendo sus categorías y conceptos con sus clases de cálculo, sin asistencia técnica. Reproduce los valores de las planillas reales.
- **Tareas:**
  - [ ] Migration `e1_config_cct`: modelos `config_cct`, `categoria_cct`, `concepto_cct`, `valor_concepto_categoria`, `tope_imponible` + enums `tipo_concepto_cct`, `ambito_concepto_cct`, `clase_calculo_concepto`. UUIDs con `@db.Uuid`. Relaciones inversas en `company`.
  - [ ] `npm run gentypes` y `prisma generate`. Verificar tipos.
  - [ ] **Motor de cálculo de conceptos** (`src/modules/costos/shared/utils/motor-conceptos.ts`):
    - Resolución topológica de dependencias (`PCT_CONCEPTO`, `PCT_SUMA_CONCEPTOS` referencian otros conceptos).
    - Detección de ciclos (rechazar al guardar concepto si introduce ciclo).
    - Dispatch por `clase_calculo` con función pura por clase.
    - Aplicación de tope vía `tope_imponible` con vigencia.
    - Manejo de `decimal.js` end-to-end. Tests unitarios por clase.
  - [ ] `src/modules/costos/features/cct/actions.server.ts`: `listCCTs`, `getCCT(id)`, `createCCT`, `clonarParitaria`, `addCategoria`, `updateCategoria`, `addConcepto`, `updateConcepto`, `setValorPorCategoria`, `closeParitaria`. Plus topes: `listTopes`, `addTope`, `updateTope` (sólo admin).
  - [ ] Componentes (ver árbol en sec 4.1).
  - [ ] **Form dinámico de concepto:** según `clase_calculo` muestra campos distintos (combo de clase + form condicional). Selectores de "concepto referenciado" leen los conceptos del mismo CCT.
  - [ ] Páginas: `src/app/dashboard/costos/configuracion-cct/page.tsx`, `src/app/dashboard/costos/topes-imponibles/page.tsx` (acceso restringido a admin del sistema).
  - [ ] Validar: un período activo (`vigencia_hasta=null`) por **CCT × empresa**.
  - [ ] Bloqueo de edición si hay composiciones o liquidaciones que referencian la paritaria (modo solo lectura + botón "Clonar paritaria").
  - [ ] Seed: cargar CCT 545/08 UOCRA Petroleros con sus 7 categorías (G B / H B / I B / J B / M B / VII B / Of. Esp.) y los conceptos derivados de las planillas (`scripts/seed-cct-545-08.ts`).
  - [ ] Validar reproducción exacta de los conceptos del recibo Bide / Guiñazu / Moragues (test golden).
- **Criterio de completitud:** Cliente reproduce un CCT completo en UI. Motor de conceptos resuelve los conceptos del CCT 545/08 con valores idénticos a las 3 liquidaciones reales (±$0.01). `check-types` y `lint` ok. Migration aplicada en staging.
- **Hito de pago:** ninguno (anticipo P-1 ya percibido).

#### Fase 2: E-2 Costo de Equipos + Combustible (semanas 4–6)

- **Objetivo:** Cargar costos de cada vehículo (amortización + ~40 ítems) y precios mensuales de combustible por servicio.
- **Tareas:**
  - [ ] Migration `e2_costo_equipos`: modelos `costo_equipo`, `item_mantenimiento`, `registro_combustible` + relación inversa en `vehicles`.
  - [ ] `src/modules/costos/features/equipos/actions.server.ts` (CRUD costo_equipo + items_mantenimiento, listado de vehículos disponibles via Prisma sobre `vehicles`).
  - [ ] `src/modules/costos/features/combustible/actions.server.ts` (registros mensuales por servicio).
  - [ ] Utilidades `src/modules/costos/shared/utils/calcular-amortizacion.ts` y `calcular-mantenimiento.ts` (server-side, `decimal.js`).
  - [ ] Componentes: `TablaEquiposCosto.tsx`, `FormCostoEquipo.tsx`, `TablaItemsMantenimiento.tsx`, `ResumenCostoEquipo.tsx`, `RegistroCombustible.tsx`.
  - [ ] Páginas: `src/app/dashboard/costos/equipos/page.tsx`, `src/app/dashboard/costos/combustible/page.tsx`.
  - [ ] Reusar `vehicles` (no reimplementar) — fetch via Prisma con `company_id` scope.
  - [ ] Test manual de cálculo contra planilla IVECO 10-190 (3 escenarios).
- **Criterio de completitud:** Costo mensual calculado coincide al centavo con la planilla del IVECO; `registro_combustible` único por servicio+período.
- **Hito de pago:** ninguno (anticipo P-1).

#### Fase 3: E-3 MOD + OCP + Servicio/Contrato (semanas 7–9) — HITO P-2

- **Objetivo:** Crear servicios/contratos, asignar choferes y equipos, calcular MOD completo (todos los conceptos del CCT) y OCP.
- **Tareas:**
  - [ ] **Bloqueante:** confirmaciones cliente 12.2 (formulas MOD).
  - [ ] Migration `e3_mod_ocp`: `servicio_contrato` (con FK a `config_cct`), `asignacion_mod` (con FK a `categoria_cct`), `asignacion_equipo_servicio`, `item_ocp` + relaciones inversas en `customers`, `employees`, `vehicles`, `company`, `config_cct`.
  - [ ] `features/servicios/actions.server.ts`: CRUD `servicio_contrato` con selección de CCT (1 a 1).
  - [ ] `features/mod/actions.server.ts`: CRUD `asignacion_mod` con selector de categoría del CCT del servicio. Form de overrides (hs nocturnas estimadas, hs extras, viandas extras).
  - [ ] `features/ocp/actions.server.ts`: items de OCP por servicio (vestimenta, EPP, gastos médicos, carnet — agrupados con cantidad de personas).
  - [ ] **Motor MOD del servicio** `src/modules/costos/shared/utils/calcular-mod.ts`: itera asignaciones, construye contexto (categoría, antigüedad, hs declaradas, días), invoca el motor de conceptos del CCT con `aplica_en=mod_servicio`, suma por chofer aplicando `afectacion_pct`. Reusa el motor de E-1.
  - [ ] Tests unitarios contra los 3 choferes reales: el bruto remunerativo del servicio debe coincidir con el de las liquidaciones (±$0.01).
  - [ ] Componentes: `FormServicioContrato.tsx`, `AsignacionChoferes.tsx`, `ResumenMOD.tsx`, `TablaItemsOCP.tsx`, `ResumenOCP.tsx`.
  - [ ] Páginas: `src/app/dashboard/costos/servicios/page.tsx` (listado), `src/app/dashboard/costos/servicios/[id]/page.tsx` (detalle con tabs MOD/OCP/equipos), `src/app/dashboard/costos/mano-de-obra/page.tsx`, `src/app/dashboard/costos/otros-costos-personal/page.tsx`.
  - [ ] Validación cruzada: 3 choferes reales del cliente, total MOD coincide con Excel ±$0,01.
- **Criterio de completitud:** MOD validado por contador del cliente. Migration aplicada. Cobertura de tests del motor MOD ≥ 80%.
- **Hito de pago:** **P-2: 30% — $3.150.000**.

#### Fase 4: E-4 Composición de Costos (semanas 10–11)

- **Objetivo:** Pantalla maestra que agrupa MOD + Equipos + Combustible + OCP, aplica márgenes y emite PDF auditado.
- **Tareas:**
  - [ ] ~~Bloqueante márgenes~~ **RESUELTO** (planilla confirma divisor `(1 - sumaMárgenes)` + licencia ordenanza sumada).
  - [ ] **Bloqueante reducido:** ingeniería inversa de los factores exactos de cada output (km excedente, día feriado, hora extra) usando los precios mensuales y los outputs de las planillas PECOM y AESA.
  - [ ] Migration `e4_composicion`: `composicion_costo`, `output_composicion`, `tipo_output_servicio` + relaciones inversas en `servicio_contrato`.
  - [ ] `features/composicion/actions.server.ts`: `calcularComposicion(servicioId, periodo)` que arma snapshot consistente leyendo CCT vigente, asignaciones, costo_equipo, registro_combustible, OCP, márgenes. Calcula outputs configurados del servicio. `generarPDFComposicion`.
  - [ ] CRUD `tipo_output_servicio` para que el cliente configure qué outputs emite cada servicio.
  - [ ] `src/modules/costos/shared/utils/calcular-composicion.ts` y `generar-pdf-composicion.tsx` (`@react-pdf/renderer`, ya en stack).
  - [ ] Subida a Supabase Storage `costos-pdfs/composiciones/{companyId}/{servicioId}/{periodo}.pdf` y guardado de `pdf_path`.
  - [ ] Endpoint para URL firmada (puede ser server action que retorna URL firmada de 1h).
  - [ ] Componentes: `PantallaComposicion.tsx`, `ResumenCostosAgrupados.tsx`, `ConfigMargenes.tsx`, `ResumenPrecios.tsx`, `BotonExportarPDF.tsx`.
  - [ ] Páginas: `src/app/dashboard/costos/composicion/page.tsx`, `src/app/dashboard/costos/composicion/[id]/page.tsx`.
  - [ ] Validación contra planillas PECOM y AESA.
- **Criterio de completitud:** Precio mensual y derivados coinciden con Excel del cliente para PECOM y AESA. PDF descargable y persistido.
- **Hito de pago:** ninguno (anticipo P-1).

#### Fase 5: E-5 Fórmula Polinómica (semanas 12–13) — HITO P-3

- **Objetivo:** Configurar ponderaciones y registrar índices mensuales para calcular tarifa ajustada y retroactivos.
- **Tareas:**
  - [ ] ~~Bloqueante serie histórica~~ **RESUELTO** (planilla `formula-polinomica-pecom-rdls-bdt-44p1-jun25-feb26.xlsx` provista).
  - [ ] Migration `e5_formula_polinomica`: `formula_polinomica`, `componente_formula`, `periodo_formula_polinomica`, `valor_componente_periodo` + enum `tipo_indice_polinomico`.
  - [ ] `features/formula-polinomica/actions.server.ts`: CRUD fórmula y componentes (4-N), CRUD períodos con valores de índices, cálculo automático de coeficientes y retroactivos. Validar suma de ponderaciones = 1.0 (±0.0001).
  - [ ] **Auto-derivación de ponderaciones:** botón "Inicializar desde composición" que toma `subtotal_i / total_industrial` de la composición del período base y los aplica como ponderaciones por defecto (overrideables).
  - [ ] `src/modules/costos/shared/utils/calcular-formula-polinomica.ts`: motor con fórmula `P = PB × (1 + Σ Pi × ΔIi%)`, retroactivos por unidad/equipo.
  - [ ] Componentes: `ConfigFormulaPolinomica.tsx`, `TablaIndicesMensuales.tsx`, `GraficoEvolucionTarifa.tsx` (recharts), `ResumenRetroactivos.tsx`.
  - [ ] Página: `src/app/dashboard/costos/formula-polinomica/page.tsx`.
  - [ ] Validación: serie PECOM Jun 2025 – Feb 2026 reproducida exactamente.
- **Criterio de completitud:** Serie histórica reproducida; cálculo de retroactivo aprobado.
- **Hito de pago:** **P-3: 25% — $2.625.000**.

#### Fase 6: E-6 Liquidación de Sueldos + Deploy (semanas 14–15) — HITO P-4

- **Objetivo:** Generar liquidaciones individuales con los ~45 conceptos del CCT, almacenar PDF de recibo, desplegar a producción.
- **Tareas:**
  - [ ] ~~Bloqueante conceptos~~ **RESUELTO** (3 recibos reales analizados — ~32-35 conceptos por recibo, no 45 como decía el spec).
  - [ ] Migration `e6_liquidacion`: `liquidacion_sueldo` (con FK a `categoria_cct`) + enum `estado_liquidacion`. Relaciones inversas en `employees`, `company`, `config_cct`, `categoria_cct`.
  - [ ] `features/liquidacion/actions.server.ts`: `generarBorradorLiquidacion(employeeId, periodo, inputs)`, `confirmarLiquidacion`, `marcarPagada`, `generarReciboPDF`.
  - [ ] `src/modules/costos/shared/utils/calcular-liquidacion-cct.ts`: motor que reusa el **motor de conceptos** de E-1 con `aplica_en=liquidacion`. Sub-cálculo de SAC en hoja aparte (segunda hoja del recibo). Aplicación de topes imponibles vía `tope_imponible`.
  - [ ] Componentes: `TablaLiquidaciones.tsx`, `FormLiquidacion.tsx`, `VistaConceptosRecibo.tsx`, `BotonGenerarRecibo.tsx`, `ResumenNomina.tsx`.
  - [ ] Página: `src/app/dashboard/costos/liquidacion-sueldos/page.tsx`.
  - [ ] PDF en Supabase Storage `costos-pdfs/liquidaciones/{companyId}/{employeeId}/{periodo}.pdf`.
  - [ ] Auditoría: log en `debug_logs` o tabla similar al confirmar liquidación.
  - [ ] Validación contra recibos reales de 3 choferes.
  - [ ] **Deploy producción:** correr migrations en orden, habilitar `costos` en `hired_modules` de Transporte SP, smoke tests.
  - [ ] Capacitación incluida (sesión).
- **Criterio de completitud:** Recibos validados por contador. Producción operativa con 3 choferes liquidados en período real.
- **Hito de pago:** **P-4: 15% — $1.575.000**.

### 2.3 Orden de ejecución y dependencias

- **Fase 0 → todo lo demás.** El enum `costos` y el layout protegido son prerrequisito.
- **Fase 1 (CCT)** debe estar antes de **Fase 3 (MOD)**: las escalas, tasas y adicionales del CCT alimentan el motor MOD.
- **Fase 2 (Equipos + Combustible)** es independiente de Fase 1 y 3 — puede solaparse si hay disponibilidad, pero el spec las secuencia para concentrar foco.
- **Fase 3 (MOD/OCP)** requiere Fase 1 (CCT) y crea `servicio_contrato` que es el agregador de Fase 4. Estrictamente bloqueante.
- **Fase 4 (Composición)** depende de Fases 1, 2, 3 (lee todos los subtotales). Bloqueante.
- **Fase 5 (Polinómica)** depende de Fase 4 (`tarifa_base` proviene de la composición). Bloqueante.
- **Fase 6 (Liquidación)** depende de Fase 1 (CCT) y reusa el motor MOD de Fase 3. Independiente de Fases 4–5 a nivel modelo, pero por cronograma cierra el proyecto.

### 2.4 Estimación de complejidad

| Fase | Hs spec | Complejidad | Riesgos principales |
|---|---|---|---|
| Fase 0 | ~10 (no facturadas) | Baja | Decisión D-1 (ruta) y D-5 (sin API routes) requieren confirmación |
| Fase 1 (E-1) | 60 | Media | Reglas de unicidad de período activo + validación contra paritaria real |
| Fase 2 (E-2) | 60 | Media | ~40 ítems de mantenimiento por equipo: UI de carga masiva, precisión decimal |
| Fase 3 (E-3) | 60 | **Alta** | Motor MOD con ~12 conceptos + decimal.js + validación contra Excel. Bloqueado por confirmaciones cliente |
| Fase 4 (E-4) | 40 | **Alta** | Snapshot consistente multi-fuente + márgenes (fórmula sin confirmar) + PDF |
| Fase 5 (E-5) | 40 | Media-alta | Serie histórica + retroactivos. Riesgo bajo si los datos están limpios |
| Fase 6 (E-6) | 40 | **Alta** | ~45 conceptos del recibo + auditoría + deploy productivo |

### 2.5 Confirmaciones pendientes con cliente (bloqueantes)

> **Actualización v1.2 (post-análisis de planillas):** la mayoría de los bloqueantes originales se resolvieron leyendo las planillas Excel del cliente. Quedan sólo 2 ítems abiertos.

| Confirmación | Estado | Bloquea |
|---|---|---|
| Fórmula de márgenes | ✅ Resuelto: divisor `(1-sumaMárgenes)` + licencia ordenanza | — |
| Planillas PECOM y AESA | ✅ Provistas | — |
| Serie histórica polinómica Jun25–Feb26 | ✅ Provista | — |
| Conceptos del CCT | ✅ 3 liquidaciones reales analizadas | — |
| Fórmula polinómica | ✅ Identificada como redeterminación argentina estándar | — |
| Fórmulas MOD por concepto | ✅ Inferibles del configurador (cliente las modela) | — |
| Discrepancias D-1 a D-12 | ✅ Aprobadas por el usuario (2026-05-04) | — |
| **Escala salarial maestra UOCRA Petroleros vigente** | 🟡 PENDIENTE | Validación final E-1 (puede arrancar implementación; se pide al cliente al avanzar) |
| **Factores exactos de outputs** (km excedente, día feriado, hora extra) | 🟡 INGENIERÍA INVERSA durante E-4 | Inicio de Fase 4 (los valores están en planillas, hay que inferir el factor) |

---

## 13. Hallazgos del análisis de planillas (2026-05-04)

> Esta sección documenta el resultado del pre-análisis de las 6 planillas Excel del cliente provistas en `referencias/`. Lo que está acá motiva los cambios introducidos en v1.2 y queda como trazabilidad para el equipo.

### 13.1 Planillas analizadas

| Archivo | Servicio / Sujeto | Período |
|---|---|---|
| `composicion-pecom-rdls-bdt-omnibus-44p1-jun25.xls` | PECOM RDLS-BDT 44+1 (omnibus) | Jun 2025 |
| `composicion-aesa-rdls-chns-lm-14p1-10hs-abr26.xlsx` | AESA RDLS CHNS-LM 14+1 | Abr 2026 |
| `formula-polinomica-pecom-rdls-bdt-44p1-jun25-feb26.xlsx` | Fórmula PECOM | Jun25–Feb26 |
| `liquidacion-bide-m-petroleros.xlsx` | Bide M. — categoría I B — antigüedad 6 años | Abr 2026 |
| `liquidacion-guinazu-m-petroleros.xlsx` | Guiñazu M. — categoría J B — antigüedad 17 años | Abr 2026 |
| `liquidacion-moragues-j-petroleros.xlsx` | Moragues J. — categoría I B — antigüedad 7 años | Abr 2026 |

### 13.2 Hallazgos que cambian el diseño

#### H-1 · La fórmula de márgenes es divisor acumulado (CONFIRMADO)

PECOM y AESA usan idéntico patrón:

```
costo_industrial / (1 - IIBB - DebCred - Estructura - Margen) + licencia_ordenanza
```

Validación PECOM Jun25: 18,924,708 / 0.81 + 196,256 = **23,560,093** ✓

#### H-2 · La fórmula polinómica del v1.0 estaba INCORRECTA

**v1.0 decía:** `coef = Σ pi × (Ii_t / Ii_base)` y `tarifa = base × coef`.

**Real (PECOM Jun25–Feb26):** `P = PB × (1 + Σ Pi × ΔIi%)` donde `ΔIi%` es la variación porcentual acumulada del índice respecto a la base. Es la fórmula argentina estándar de redeterminación.

Validación Jul25: ajuste 5.769% → valor ajustado 20,016,571 ✓ coincide con planilla.

Las **ponderaciones** se derivan de la composición del costo (`Pmo = subtotal_mod / total_industrial = 0.3128`, etc.) y suman 1.0. Pueden overridearse manualmente.

Los **retroactivos** se calculan **por unidad/equipo**, acumulando `(valor_ajustado - importe_certificado)` período a período hasta que el cliente acepta el ajuste. La planilla muestra dos series (Omnibus 1 y Omnibus 2), cada una con su propia historia.

#### H-3 · Los conceptos MOD difieren entre cotizaciones del MISMO CCT por paritaria, no por servicio

PECOM Jun 2025 y AESA Abr 2026 son ambos CCT 545/08 UOCRA Petroleros, pero muestran conceptos distintos:

| Concepto | PECOM Jun25 | AESA Abr26 |
|---|---|---|
| Adic UOCRA Yacimiento | ✓ | ✓ |
| Adic Asistencia 20% | ✓ | — |
| Adic Disponibilidad | — | ✓ |
| Bono Paz Social | — | ✓ |
| Asignación Vaca Muerta | — | ✓ |
| Adicional Personal 8 hs | — | ✓ |
| Premio Trim. Presentismo | — | ✓ |
| SNR Acta 3 de Junio 2025 | — | ✓ |
| Aportes patronales totales | 40.40% | 19.95% |

**Conclusión:** las diferencias se explican por **10 meses de paritarias intermedias**. Confirmación del usuario: "siempre que el CCT sea el mismo, aplican los mismos conceptos". Por eso `concepto_cct` cuelga del `config_cct` (la paritaria), no del servicio.

#### H-4 · Los outputs derivados varían por servicio

PECOM tiene: km excedente, día feriado, hora excedente, descuento 7%.
AESA tiene: km excedente, día stand by.

Por eso `composicion_costo` ya no tiene columnas fijas (`valor_km_excedente`, `valor_dia_feriado`, `valor_hora_extra`) sino la tabla hija `output_composicion(tipo, valor)` referenciando `tipo_output_servicio` configurable por servicio.

#### H-5 · El recibo tiene ~32-35 líneas, no ~45

Los 3 recibos analizados tienen exactamente la misma estructura (53 filas Sueldo + 17-18 SAC). Composición típica:
- ~16 conceptos remunerativos
- ~9 no remunerativos
- ~12 descuentos
- SAC en hoja aparte

**Topes imponibles:** `Tope base imponible 4,045,590` aplicado a Jubilación e INSSJP (no a OS ni Sindicato). Justifica el modelo `tope_imponible` global con `vigencia_desde`.

**Doble base imponible:** algunos descuentos se calculan sobre el bruto remunerativo y otros sobre el SNR Acta (no remunerativo). El motor lo soporta porque cada concepto declara `conceptos_codigos` en sus `parametros`.

### 13.3 Faltantes detectados

| Faltante | Impacto | Resolución |
|---|---|---|
| Planilla maestra de la última paritaria UOCRA Petroleros vigente | Bajo (los valores se reconstruyen desde recibos y composiciones) | Pedir al cliente al iniciar Fase 1; opcional. |
| Planilla específica de costo de equipo por unidad | Nulo | Embebida en composiciones. |
| Formato `.xls` de PECOM | Nulo | Lib `xlsx` lo maneja. Pedir al cliente que en producción exporte `.xlsx`. |

### 13.4 Decisiones tomadas (sin esperar al cliente)

1. **Fórmula de márgenes:** divisor + licencia ordenanza sumada. Confirmada.
2. **Fórmula polinómica:** redeterminación estándar `P = PB × (1 + Σ Pi × ΔIi%)`. Confirmada.
3. **Configurador de CCT:** 7 clases de cálculo predefinidas (sin evaluador de fórmulas libre).
4. **Topes imponibles:** tabla global del sistema, no por empresa ni por CCT.
5. **Outputs de composición:** tabla hija configurable por servicio (`tipo_output_servicio`).
6. **Liquidación:** `conceptos_json` flexible; reusa el motor de conceptos del CCT.
7. **1 servicio = 1 CCT:** confirmado por el usuario (2026-05-04). El sistema soporta múltiples CCTs activos en paralelo (4+ en Transporte SP).
8. **Conceptos por paritaria, no por servicio:** las diferencias entre cotizaciones del mismo CCT son por antigüedad de la paritaria.

### 13.5 Casos de test golden

| Test | Input | Output esperado | Fuente |
|---|---|---|---|
| Composición PECOM Jun25 | servicio=PECOM, periodo=2025-06 | precio_mensual = 23,560,093 | `composicion-pecom-*.xls` |
| Composición AESA Abr26 | servicio=AESA, periodo=2026-04 | precio_mensual = 27,183,638 | `composicion-aesa-*.xlsx` |
| Polinómica PECOM Jul25 | servicio=PECOM, periodo=2025-07 | ajuste 5.769%, valor 20,016,571 | `formula-polinomica-pecom-*.xlsx` |
| Liquidación Bide Abr26 | empleado=Bide, categoría=I B, antig=6 | neto = 3,063,102 | `liquidacion-bide-*.xlsx` |
| Liquidación Guiñazu Abr26 | empleado=Guiñazu, categoría=J B, antig=17 | neto = 2,733,369 | `liquidacion-guinazu-*.xlsx` |
| Liquidación Moragues Abr26 | empleado=Moragues, categoría=I B, antig=7 | neto = 4,089,370 | `liquidacion-moragues-*.xlsx` |

Estos 6 tests son criterio de aceptación de los hitos P-2, P-3 y P-4.

