# Accesorios y mantenimiento por tipo de equipo

Fecha: 2026-08-30
Estado: aprobado, pendiente de plan de implementación

## Problema

Hoy el costo de un equipo se carga íntegramente por dominio (por unidad):
`costo_equipo` extiende 1:1 a `vehicles` y contiene `valor_compra`,
`valor_residual_pct`, `anios_amortizacion` y un único `accesorios` (Decimal), más
una lista `item_mantenimiento` con N ítems de `precio_anual`.

Eso obliga a recargar la misma lista de 32 ítems en cada unidad de una flota
homogénea, y no hay forma de mantener los precios alineados con lo que la empresa
efectivamente compra: los precios se escriben a mano y quedan congelados.

## Objetivo

1. Que accesorios y mantenimiento se definan una vez por **tipo de equipo** y los
   compartan todas las unidades de ese tipo.
2. Que cada ítem pueda vincularse **opcionalmente** a un producto de almacén, para
   poder refrescar su precio desde el catálogo de productos.

El valor de compra, el valor residual y los años de amortización siguen siendo por
dominio: son propios de cada unidad.

## Decisiones

| Decisión | Elegido | Descartado |
|---|---|---|
| Entidad de agrupación | Tabla `type` (catálogo por empresa; lo que la UI ya llama "Tipo de equipo") | marca+modelo, `types_of_vehicles` global, entidad nueva |
| Alcance | Accesorios **y** mantenimiento suben al tipo | sólo accesorios; herencia con override por dominio |
| Fuente del precio | Snapshot en el ítem + acción manual "Actualizar precios desde almacén" | leer `cost_price` en vivo; última compra facturada; que las compras actualicen `cost_price` |
| Composición del precio | `cantidad × precio_unitario` | precio anual cargado a mano; cantidad + frecuencia explícita |
| Datos existentes | Migrar los ítems del equipo donante de cada tipo | empezar de cero |
| Estructura de tablas | Perfil por tipo + **una** tabla de ítems con discriminador `clase` | listas colgando directo de `type`; tablas separadas por clase |

`type.company_id` es **nullable**, así que puede haber tipos globales compartidos
entre empresas. Por eso las listas no cuelgan de `type` directamente sino de un
perfil con `@@unique([company_id, type_id])`: sin eso, los accesorios de una
empresa se filtrarían a otra.

## Modelo de datos

```prisma
enum clase_item_costo { ACCESORIO  MANTENIMIENTO }

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
/// `cantidad` significa "por unidad de equipo" en ACCESORIO y "por año" en MANTENIMIENTO.
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

El subtotal (`cantidad × precio_unitario`) se calcula, no se almacena.
`product_id` es nullable y con borrado restrictivo: un producto referenciado por un
ítem no se puede eliminar del almacén.

Bajas:

- `costo_equipo.accesorios` — eliminada.
- Tabla `item_mantenimiento` — eliminada.

`costo_equipo` queda con `valor_compra`, `valor_residual_pct`,
`anios_amortizacion`, `km_anuales` y los campos de multimoneda del legajo.

## Migración

Una única migración SQL, en este orden:

1. Crear el enum y las dos tablas.
2. Por cada par `(costo_equipo.company_id, vehicles.type)` con al menos un
   vehículo que tenga `costo_equipo`, crear un `costo_tipo_equipo`. El
   `company_id` sale de `costo_equipo`, no de `vehicles` (donde es nullable).
3. Elegir el **equipo donante** de cada par: el que más `item_mantenimiento` con
   `is_active = true` tenga; desempate por `costo_equipo.created_at` más antiguo.
4. Copiar los ítems del donante a `item_costo_tipo` con `clase = MANTENIMIENTO`,
   `cantidad = 1`, `precio_unitario = precio_anual`, conservando `nombre` y `orden`.
5. Si el donante tenía `accesorios > 0`, crear un ítem `clase = ACCESORIO`,
   `nombre = 'Accesorios (migrado)'`, `cantidad = 1`, `precio_unitario = accesorios`.
6. `RAISE NOTICE` con la cantidad de ítems descartados por tipo, para revisión
   posterior.
7. `DROP TABLE item_mantenimiento` y `ALTER TABLE costo_equipo DROP COLUMN accesorios`.

Con `cantidad = 1` y `precio_unitario = precio_anual`, el valor anual queda idéntico
al actual: **ningún costo se mueve por efecto de la migración**. Los ítems de los
equipos no donantes se descartan deliberadamente.

## Motor de cálculo

`calcular-mantenimiento.ts` se renombra a `calcular-costo-equipo.ts`: el nombre
actual ya no describe lo que hace.

```ts
export type ItemCostoTipoCalc = {
  clase: 'ACCESORIO' | 'MANTENIMIENTO';
  cantidad: Num;
  precio_unitario: Num;
  is_active?: boolean | null;
};

/** Σ (cantidad × precio_unitario) de los ítems activos, separado por clase. */
export function sumarItemsTipo(items: ItemCostoTipoCalc[]): {
  accesorios: Decimal;
  mantenimiento_anual: Decimal;
};
```

`calcularCostoMensualEquipo` reemplaza sus parámetros `accesorios: Num` e
`items: ItemMantCalc[]` por `items_tipo: ItemCostoTipoCalc[]`, y suma
`accesorios_total` a su resultado. La fórmula no cambia:

```
accesorios            = Σ (cantidad × precio_unitario)  [ACCESORIO activos]
base                  = valor_compra − valor_compra × residual + accesorios
amortización_mensual  = base / años / 12
mantenimiento_mensual = Σ (cantidad × precio_unitario)  [MANTENIMIENTO activos] / 12
costo_mensual         = (amortización + mantenimiento) × afectación
```

`calcularAmortizacionMensual` queda intacta: sigue recibiendo `accesorios` como un
`Num`, sólo que ahora ese número lo produce `sumarItemsTipo`. Se mantiene el
criterio actual de precisión: todo en `Decimal`, redondeo a 2 decimales sólo al
salir al cliente.

## Capa servidor

Feature nuevo `src/modules/costos/features/tipos-equipo/actions.server.ts`, con el
mismo blindaje que el resto del módulo (`getRequiredActionContext` +
`assertModuloHabilitado` + verificación de `company_id` en cada mutación):

| Action | Responsabilidad |
|---|---|
| `listTiposEquipoConCosto()` | Tipos de la empresa con nº de equipos, nº de accesorios, nº de ítems, total accesorios y mantenimiento anual |
| `getCostoTipoEquipo(typeId)` | Perfil + ítems ordenados; `null` si el tipo aún no tiene perfil |
| `ensureCostoTipoEquipo(typeId)` | Crea el perfil on-demand al cargar el primer ítem |
| `addItemCostoTipo` / `updateItemCostoTipo` / `deleteItemCostoTipo` | CRUD de ítems, validado con Zod |
| `bulkAddItemsCostoTipo` | Importación masiva; reutiliza el parser es-AR de `ImportarItemsDialog` |
| `refrescarPreciosDesdeAlmacen(perfilId)` | Para cada ítem con `product_id`: `precio_unitario ← products.cost_price` y `precio_actualizado_at ← now()`. No toca `nombre` ni `cantidad`. Devuelve cuántos cambió y el delta total |

Cambios en `features/equipos/actions.server.ts`:

- `schemaCostoEquipo` pierde `accesorios`.
- Se eliminan las cuatro actions de `item_mantenimiento` (se mudan al feature nuevo).
- `listVehiculosConCosto`, `getCostoEquipo` y `getEquipoParaEdicion` resuelven el
  perfil del tipo de cada vehículo y se lo pasan al motor. `listVehiculosConCosto`
  trae **todos los perfiles de la empresa en una sola query** y arma un
  `Map<type_id, items>`: un `include` anidado por vehículo sería un N+1 con una
  flota de 200 unidades.

`calcular-equipos-servicio.ts` toma el `company_id` de `servicio_contrato`,
resuelve los perfiles con el mismo `Map` y arma los `items_tipo` de cada vehículo.
Se mantiene el criterio de exclusión actual: se excluye el equipo sin
`costo_equipo` activo; que su tipo no tenga perfil **no** lo excluye — amortiza
igual, con accesorios y mantenimiento en cero.

## UI

Ruta nueva `/dashboard/costos/tipos-equipo`:

- `page.tsx` — tabla de tipos: nombre, nº de equipos, nº de accesorios, nº de ítems
  de mantenimiento, total accesorios y mantenimiento anual.
- `[typeId]/page.tsx` — detalle. Importa `getProductsByCompany` de
  `@/modules/products/...` y lo pasa por props, siguiendo el patrón ya establecido
  en `src/app/dashboard/purchasing/invoices/new/page.tsx`: la ruta es el punto de
  composición, así no hay import cross-module.
- Card nueva en `CostosDashboard` ("Tipos de equipo", icono `Layers`), entre CCTs y
  Equipos.

El detalle muestra dos tablas alimentadas por un mismo componente
`TablaItemsCostoTipo` parametrizado por `clase`. La diferencia semántica entre
clases se resuelve en los labels:

| | ACCESORIO | MANTENIMIENTO |
|---|---|---|
| Columna cantidad | "Cantidad" | "Cantidad anual" |
| Total del bloque | "Total accesorios (a la base amortizable)" | "Mantenimiento anual" |

Cada fila: nombre · producto vinculado (badge con el `code`, o "—") · cantidad ·
precio unitario · subtotal · fecha del último refresco · acciones.

Vínculo con almacén: el form del ítem tiene un combobox de producto **opcional**.
Al elegir uno, precarga el nombre y el `precio_unitario` con `cost_price`; el
nombre queda editable. El botón "Actualizar precios desde almacén" del header se
habilita sólo si hay al menos un ítem vinculado, y su toast informa cuántos precios
cambiaron y el delta sobre el costo mensual, para que el impacto no sea invisible.

`ImportarItemsDialog` se recicla apuntando al perfil, con la clase como parámetro.

El detalle del equipo (`/dashboard/costos/equipos/[vehicleId]`) pierde el input
`accesorios` y la tabla editable de mantenimiento. En su lugar, un bloque de sólo
lectura "Accesorios y mantenimiento del tipo «X»" con los totales y un link a la
pantalla del tipo. `ResumenCostoEquipo` suma una cuarta card con el total de
accesorios, para que se vea de dónde sale la base amortizable.

## Testing

Criterio de aceptación principal: **el golden test debe seguir dando
$7.794.945,28**. `calcular-equipo.test.ts` se adapta cargando los mismos 32 ítems de mantenimiento y el accesorio
del fixture PECOM 112 como `items_tipo` con `cantidad: 1` y
`precio_unitario: precio_anual`. Si el número se mueve, la refactorización está mal.

Casos nuevos:

- `sumarItemsTipo`: separa por clase, ignora inactivos, y `6 × 860.000` exacto en
  `Decimal`.
- Un accesorio con `cantidad: 2` impacta la base amortizable y no el mantenimiento.
- Equipo cuyo tipo no tiene perfil: amortiza igual, accesorios y mantenimiento en cero.
- `calcular-equipos-servicio.test.ts` adaptado, más un caso de dos equipos del mismo
  tipo compartiendo lista.
- La resolución de precio del refresco se extrae a función pura y se testea.

Cierre: `npm run check-types` y `npm run lint` en verde, más un smoke manual sobre
un tipo con dos equipos y un ítem vinculado a almacén.

## Fuera de alcance

- Override por dominio de un ítem heredado del tipo (excluirlo o pisarle el precio).
- Que confirmar una factura de compra actualice `products.cost_price`. Hoy no
  ocurre: el costo real de cada compra queda sólo en `purchase_invoice_lines.unit_cost`
  y `cost_price` se mantiene a mano. El refresco de este spec lee `cost_price`, así
  que hereda esa limitación.
- Usar `km_anuales` / `km_mensuales` en algún cálculo: se siguen guardando sin uso.
- Mover el módulo de costos a la sección Comercial.
