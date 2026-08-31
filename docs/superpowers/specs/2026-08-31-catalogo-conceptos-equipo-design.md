# Catálogo de conceptos de costo de equipo

Fecha: 2026-08-31
Estado: aprobado, pendiente de plan de implementación
Antecede: `docs/superpowers/specs/2026-08-30-accesorios-por-tipo-equipo-design.md`

## Problema

El trabajo anterior llevó los accesorios y el mantenimiento al nivel de tipo de equipo, pero
dejó dos limitaciones:

1. **Todos los tipos aparecen costeables.** El listado muestra el catálogo completo de `type`
   de la empresa, aunque costear un tipo sea una decisión que la empresa toma explícitamente.
   En la instalación actual eso además expone un problema de datos preexistente: `type` tiene
   tres filas por cada nombre (creadas el 2026-03-29, misma empresa), de las cuales sólo una
   tiene vehículos asignados, así que cada tipo se ve triplicado en pantalla.
2. **Cada ítem es un importe plano.** No se puede expresar "patentes es el 17% del valor de
   compra del bien", que es como se define realmente buena parte de los costos. Hoy hay que
   calcular el importe a mano y recargarlo cuando cambia el valor del equipo.

## Objetivo

1. Que costear un tipo de equipo sea una **elección explícita** de la empresa, mediante un
   botón "Crear costo de equipo" que crea el perfil y le asocia conceptos.
2. Que los conceptos vivan en un **catálogo por empresa**, se asocien a varios tipos, y puedan
   calcularse como monto fijo o como porcentaje de otro valor.

## Decisiones

| Decisión | Elegido | Descartado |
|---|---|---|
| Resolución de un concepto porcentual | El tipo define la **regla**; el monto se resuelve **por equipo**, con el valor de compra de esa unidad | Importe único por tipo; regla + importe estimado con valor testigo |
| Bases de un porcentaje | Valor del equipo, otro concepto, total de conceptos, kilómetros anuales (las cuatro) | — |
| Actualización de un monto fijo | Manual, desde almacén, y por índice de variación | Historial de vigencias por período |
| Alcance del catálogo | Catálogo por empresa, asociado a tipos, **sin valor propio por tipo** | Conceptos definidos dentro de cada tipo; catálogo con valor por tipo |
| Datos existentes | Los 37 ítems se convierten en conceptos `FIJO` del catálogo, unificando nombres repetidos | Empezar de cero |
| Modelo de cálculo | Replicar el patrón de `concepto_cct` (enum `clase_calculo` + `parametros` JSON + orden topológico) | Generalizar el motor de CCT; columnas tipadas en vez de JSON |

Se descartó generalizar `motor-conceptos.ts` porque obligaría a tocar un motor que ya funciona
para acomodar un caso nuevo, y las clases de cálculo no coinciden: CCT tiene `POR_ANTIGUEDAD_*`,
que no aplica a equipos, y equipos necesita `PCT_VALOR_EQUIPO` y `POR_KM`, que no aplican a CCT.
Se replica la **técnica** (orden topológico, detección de ciclos, validación de referencias),
no el código.

Consecuencia aceptada del catálogo sin valor por tipo: dos conceptos que difieren sólo en la
cantidad ("Neumáticos 6 por año" y "Neumáticos 4 por año") son dos entradas distintas del
catálogo.

## Modelo de datos

```prisma
enum clase_calculo_concepto_equipo {
  FIJO               // { cantidad, precio_unitario }
  PCT_VALOR_EQUIPO   // { pct, base }
  PCT_CONCEPTO       // { pct, concepto_codigo }
  PCT_SUMA_CONCEPTOS // { pct, conceptos_codigos[] }
  POR_KM             // { monto_por_km }
}

enum base_valor_equipo {
  VALOR_COMPRA
  VALOR_COMPRA_MAS_ACCESORIOS
  VALOR_RESIDUAL
}

/// Catálogo de conceptos de costo de la empresa.
model concepto_equipo {
  id                    String                        @id @default(uuid()) @db.Uuid
  created_at            DateTime                      @default(now()) @db.Timestamptz(6)
  company_id            String                        @db.Uuid
  codigo                String                        // referenciable desde otro concepto
  nombre                String
  clase                 clase_item_costo              // ACCESORIO | MANTENIMIENTO
  clase_calculo         clase_calculo_concepto_equipo
  parametros            Json
  product_id            String?                       @db.Uuid  // sólo FIJO
  indice_id             String?                       @db.Uuid  // sólo FIJO
  precio_actualizado_at DateTime?                     @db.Timestamptz(6)
  orden                 Int                           @default(0)
  is_active             Boolean                       @default(true)

  company company   @relation(fields: [company_id], references: [id])
  product products? @relation(fields: [product_id], references: [id])
  indice  indices?  @relation(fields: [indice_id], references: [id])
  tipos   concepto_tipo_equipo[]

  @@unique([company_id, codigo])
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
}
```

`clase_item_costo` (`ACCESORIO` | `MANTENIMIENTO`) ya existe y se reutiliza: la declara el
concepto, y determina si su importe entra a la base amortizable o al gasto anual.

Se conserva `costo_tipo_equipo` tal cual está. Se elimina `item_costo_tipo`: su rol lo cumplen
el catálogo más la asociación.

`codigo` con unicidad por empresa es lo que permite que `PCT_CONCEPTO` referencie a otro
concepto sin ambigüedad, igual que en el motor de CCT.

Todos los porcentajes se guardan como **fracción** (`0.17` = 17%), igual que
`costo_equipo.valor_residual_pct`, y la UI los muestra y los pide en porcentaje. La conversión
vive sólo en el formulario.

## Migración

Una sola migración, en este orden:

1. Crear los dos enums y las dos tablas.
2. Respaldar `item_costo_tipo` en `item_costo_tipo_backup_20260831` (tabla completa), por el
   mismo criterio del trabajo anterior: la conversión es irreversible y conviene poder auditarla.
3. Por cada `(company_id, nombre, clase)` distinto presente en `item_costo_tipo`, crear un
   `concepto_equipo` con `clase_calculo = 'FIJO'` y
   `parametros = {"cantidad": <cantidad>, "precio_unitario": <precio_unitario>}`, conservando
   `product_id` y `precio_actualizado_at`. Los nombres repetidos entre tipos se unifican en un
   único concepto (se toma el de menor `orden`, desempatando por el `id` menor para que la
   migración sea determinista). El `codigo` se deriva del nombre: minúsculas, sin acentos, no
   alfanuméricos a `_`, truncado a 40 caracteres, con sufijo numérico ante colisión.
4. Poblar `concepto_tipo_equipo` con la asociación de cada perfil a los conceptos que tenía,
   conservando el `orden`.
5. `DROP TABLE item_costo_tipo`.

Los conceptos migrados quedan todos `FIJO` con los mismos importes: **ningún costo se mueve**.
Convertir alguno a porcentual es una decisión posterior del usuario, desde la pantalla.

## Motor de cálculo

Archivo nuevo `calcular-conceptos-equipo.ts`, que replica la técnica de `motor-conceptos.ts`
sin importarlo:

```ts
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

export function ordenTopologicoConceptos(conceptos: ConceptoEquipoCalc[]): ConceptoEquipoCalc[];

export function calcularConceptosEquipo(
  conceptos: ConceptoEquipoCalc[],
  ctx: ContextoEquipo
): { accesorios: Decimal; mantenimiento_anual: Decimal; por_concepto: Map<string, Decimal> };
```

Resolución por clase:

```
FIJO               → cantidad × precio_unitario
PCT_VALOR_EQUIPO   → pct × base, con base ∈ { valor_compra,
                                              valor_compra + accesorios_ya_resueltos,
                                              valor_compra × valor_residual_pct }
PCT_CONCEPTO       → pct × valor_ya_resuelto(concepto_codigo)
PCT_SUMA_CONCEPTOS → pct × Σ valor_ya_resuelto(conceptos_codigos)
POR_KM             → monto_por_km × km_anuales
```

Los conceptos se resuelven en orden topológico, de modo que un `PCT_CONCEPTO` siempre encuentra
resuelta su base. Se reutilizan las dos clases de error del motor de CCT como equivalentes
propios: ciclo detectado y referencia a un concepto inexistente. Un concepto inactivo no se
calcula ni cuenta como base de otro.

Un concepto con base `VALOR_COMPRA_MAS_ACCESORIOS` **depende implícitamente de todos los
conceptos de clase `ACCESORIO`**: esa dependencia se agrega al grafo antes del orden topológico.
Así la base siempre está completa cuando se resuelve, y un concepto `ACCESORIO` que use esa base
queda detectado como ciclo, que es lo correcto — se estaría definiendo en términos de sí mismo.

El costo del equipo queda:

```
accesorios            = Σ conceptos de clase ACCESORIO
base                  = valor_compra − valor_compra × residual + accesorios
amortización_mensual  = base / años / 12
mantenimiento_mensual = Σ conceptos de clase MANTENIMIENTO / 12
costo_mensual         = (amortización + mantenimiento) × afectación
```

Es la misma fórmula de cierre que hoy: lo único que cambia es de dónde salen `accesorios` y el
mantenimiento. El golden test del trabajo anterior se conserva, expresando sus 32 ítems como
conceptos `FIJO`, y **debe seguir dando $7.794.945,28**.

## Capa servidor

Feature nuevo `src/modules/costos/features/conceptos/actions.server.ts` (catálogo):

| Action | Responsabilidad |
|---|---|
| `listConceptos()` | Catálogo de la empresa, con en cuántos tipos se usa cada concepto |
| `createConcepto(input)` / `updateConcepto(id, input)` / `deleteConcepto(id)` | CRUD, con validación de la forma de `parametros` según `clase_calculo` |
| `refrescarPreciosConceptos()` | Para los `FIJO` con `product_id`: `precio_unitario ← products.cost_price` |
| `aplicarIndiceConceptos(indiceId, anio, mes)` | Para los `FIJO` con ese `indice_id`: aplica la variación del período al `precio_unitario` |

En `features/tipos-equipo/actions.server.ts`:

| Action | Responsabilidad |
|---|---|
| `listTiposCosteados()` | **Reemplaza** a `listTiposEquipoConCosto`: lista sólo los tipos con perfil creado |
| `listTiposDisponibles()` | Tipos de la empresa **sin** perfil, para el selector del formulario de alta |
| `crearCostoTipoEquipo(typeId, conceptoIds)` | Crea el perfil y asocia los conceptos elegidos |
| `asociarConcepto` / `desasociarConcepto` | Gestión de la asociación desde el detalle del tipo |
| `eliminarCostoTipoEquipo(perfilId)` | Deshacer la elección de costear un tipo |

Validación al crear o actualizar un concepto: la forma de `parametros` se valida con un esquema
Zod por `clase_calculo` (un discriminated union), y las referencias de `PCT_CONCEPTO` y
`PCT_SUMA_CONCEPTOS` deben existir en el catálogo de la empresa y no introducir un ciclo. El
chequeo de ciclo se hace contra el catálogo completo antes de escribir.

Se mantiene el blindaje del módulo: `getRequiredActionContext()` + `assertModuloHabilitado()`,
y verificación de pertenencia por `company_id` en toda mutación, incluido el `product_id` y el
`indice_id`.

## UI

**`/dashboard/costos/tipos-equipo`** — el listado pasa a mostrar sólo los tipos costeados, con
un botón **"Crear costo de equipo"**. El diálogo pide el tipo (entre los que todavía no tienen
perfil) y permite marcar los conceptos del catálogo a asociar.

Las columnas de importe cambian: con conceptos porcentuales el mantenimiento anual del tipo
deja de ser un número único, así que el listado muestra **cantidad de conceptos** (accesorios y
mantenimiento) y el **total de los conceptos fijos**, con la aclaración de que los porcentuales
se resuelven por equipo. Los importes exactos viven en la pantalla del equipo.

**`/dashboard/costos/tipos-equipo/[typeId]`** — dos bloques, accesorios y mantenimiento, con
los conceptos asociados. Cada fila muestra el nombre, cómo se calcula (el importe si es fijo, o
la regla legible si es porcentual: "17% del valor de compra") y el botón para desasociarlo. Un
botón "Asociar concepto" abre el catálogo.

**`/dashboard/costos/conceptos`** — pantalla nueva del catálogo. Tabla de conceptos con su
clase, su forma de cálculo y en cuántos tipos se usa. El formulario cambia según la clase de
cálculo elegida: importe y cantidad para `FIJO` (con el selector de producto de almacén y el de
índice), porcentaje y base para `PCT_VALOR_EQUIPO`, porcentaje y concepto para `PCT_CONCEPTO`,
porcentaje y lista de conceptos para `PCT_SUMA_CONCEPTOS`, y monto por kilómetro para `POR_KM`.

**`/dashboard/costos/equipos/[vehicleId]`** — el bloque heredado del tipo pasa a mostrar el
desglose **resuelto para esa unidad**: cada concepto con el importe que le corresponde a ese
equipo. Es donde el "17% del valor de compra" se vuelve un número concreto.

## Testing

- El golden del trabajo anterior se conserva con los 32 ítems como conceptos `FIJO` y debe
  seguir dando `$7.794.945,28`.
- `PCT_VALOR_EQUIPO`: patentes 17% sobre un valor de compra de 319.325.000 da 54.285.250, y dos
  equipos con valores de compra distintos dan importes distintos con el mismo concepto.
- `PCT_CONCEPTO` y `PCT_SUMA_CONCEPTOS` resuelven después de su base, en cualquier orden de
  entrada.
- `POR_KM` con `km_anuales = 0` da cero.
- Ciclo (`A` = % de `B`, `B` = % de `A`) lanza el error de ciclo; referencia a un concepto
  inexistente lanza el error de referencia.
- Un concepto inactivo no se calcula ni sirve de base.
- `VALOR_COMPRA_MAS_ACCESORIOS` toma los accesorios ya resueltos.
- La derivación de `codigo` desde el nombre es determinista y resuelve colisiones.

## Fuera de alcance

- Valor propio por tipo para un concepto del catálogo (dos cantidades distintas son dos
  conceptos distintos).
- Historial de vigencias por período: el concepto guarda un valor vigente, sin fecha desde.
- Limpiar los `type` duplicados de la base: es un problema de datos preexistente que afecta
  también al selector del legajo de equipos, y merece su propio cambio.
- La decisión sobre los equipos con `anios_amortizacion = 0` autocreados desde el legajo, que
  quedó planteada al cierre del trabajo anterior.
