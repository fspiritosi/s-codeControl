# TSK-347 — Carga de equipo no aparece en listado

**Fecha de inicio:** 2026-06-26
**Estado:** Implementación completada (fases 1-3)
**Ticket:** TKT-347 (prioridad alta) — Reportado por Gonzalo Peralta (Transporte SP)

---

## 1. Análisis

### 1.1 Problema
Al cargar un equipo/vehículo nuevo, el formulario permite ingresar todos los datos y al
"Aceptar" muestra el toast de éxito ("equipo registrado"), pero el equipo NO aparece en el
listado de equipos. El usuario interpreta que se guardó correctamente cuando en realidad el
`insert` no persistió (o no se está refrescando el listado).

### 1.2 Contexto actual

**Flujo de creación (client):**
`VehicleEquipmentForm.tsx:51` → `form.handleSubmit(... onCreate)` →
`useVehicleForm.ts` `onCreate()` (líneas 138-194).

El payload de creación se arma en `useVehicleForm.ts:143-153`:
```ts
const { data: vehicleData, error } = await insertVehicle({
  ...values,
  domain: domain?.toUpperCase() || null,
  type_of_vehicle: data.tipe_of_vehicles.find((e) => e.name === type_of_vehicle)?.id,
  brand: brand_vehicles?.find((e) => e.name === brand)?.id,
  model: data.models.find((e) => e.name === model)?.id,
  type: vehicleType.find((e) => e.name === values.type)?.id,
  company_id: actualCompany?.id,
  condition: 'operativo',
  kilometer: values.kilometer || 0,   // <-- número 0 sobre columna String?
});
if (error) throw new Error(handleSupabaseError(error));
...
router.push('/dashboard/equipment');
```
Todo lo anterior está envuelto en un `try { ... } catch (error) { console.error(error); }`
(líneas 142-190) y el `toast.promise(..., { ..., success: 'equipo registrado', ... })`
(línea 192).

**Insert (server):** `create/actions.server.ts:21-30` (`insertVehicle`):
```ts
export const insertVehicle = async (vehicleData: any) => {
  try {
    const data = await prisma.vehicles.create({ data: vehicleData });
    await ensurePendingDocumentsForEquipment(data.id);
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting vehicle:', error);
    return { data: null, error: String(error) };  // error devuelto, NO lanzado
  }
};
```
`insertVehicle` NO llama a `revalidatePath`. (En contraste, `deactivateVehicle` y
`reactivateVehicle` sí lo hacen — `actions.server.ts:153-154,177-178`.)

**Listado (server):** `EquipmentListTabs.tsx` → `EquipmentList.tsx:11` →
`list/actions.server.ts` `getEquipmentPaginated()` (líneas 269-298). El `where` base
(`buildEquipmentWhere`, líneas 206-263) filtra únicamente por:
```ts
const baseWhere = { company_id: companyId, is_active: showInactive ? false : true };
```
`companyId` proviene de `getActionContext()` → cookie `actualComp`
(`server-action-context.ts:13-19`).

**Esquema DB (`prisma/schema.prisma:602-644`, modelo `vehicles`):**
- `is_active Boolean? @default(true)` → un insert sin `is_active` queda en `true` (OK, no es la causa).
- `kilometer String?` (línea 623) → **espera String, no number.**
- `picture String` (no nullable, sin default) — en create se envía `''` (OK).
- `type_of_vehicle BigInt`, `brand BigInt`, `model BigInt`, `type String @db.Uuid`,
  `engine String`, `intern_number String`, `year String` → todos NOT NULL.
- `condition condition_enum?` con valor `operativo` (válido, ver enum línea 24-29).

### 1.3 Archivos involucrados
- `src/modules/equipment/features/create/components/useVehicleForm.ts` (onCreate, líneas 138-194) — **núcleo del bug**
- `src/modules/equipment/features/create/components/VehicleEquipmentForm.tsx` (submit línea 51; campo kilometer líneas 202-208)
- `src/modules/equipment/features/create/actions.server.ts` (`insertVehicle` líneas 21-30; falta `revalidatePath`)
- `src/modules/equipment/features/list/actions.server.ts` (`getEquipmentPaginated`/`buildEquipmentWhere` líneas 206-298)
- `src/modules/equipment/features/list/components/EquipmentList.tsx` / `EquipmentListTabs.tsx`
- `prisma/schema.prisma` (modelo `vehicles` líneas 602-644; enums líneas 24-29 y 141-147)
- `src/shared/lib/server-action-context.ts` (cookie `actualComp`)

### 1.4 Dependencias
- Prisma (cliente con validación estricta de tipos por columna).
- Supabase (DB Postgres; RLS no aplica aquí porque el insert/list van por Prisma con conexión directa).
- `sonner` (`toast.promise`).
- Next.js App Router (Router Cache del cliente + `revalidatePath`).
- Zustand (`useLoggedUserStore.actualCompany`) y cookie `actualComp` como dos fuentes de companyId.

### 1.5 Restricciones y reglas
- CLAUDE.md: server actions por feature en `actions.server.ts`; la cookie `actualComp` es la fuente
  de company en queries server; `database.types.ts` autogenerado (no editar). Migraciones solo ADD,
  nunca perder datos (MEMORY).
- No hacer push sin autorización; commit según reglas (>5 archivos / >100 líneas → commit al terminar).

### 1.6 Riesgos identificados
- El `catch` silencioso oculta el error real: sin logs del navegador del usuario no se confirma cuál de
  las causas de fallo se dispara. Conviene primero dejar de tragar el error y propagar el `error` real
  al `toast` (ya viene de `insertVehicle`).
- Si la causa real fuera caché (insert OK pero listado stale), el fix de toast no resolvería la visibilidad;
  hay que agregar `revalidatePath('/dashboard/equipment')`.
- `actualCompany?.id` (store) vs cookie `actualComp` (listado): si difieren, el equipo se inserta con
  un company_id y el listado filtra por otro.

### 1.7 Causa raíz probable (hipótesis priorizadas)

**H1 — El toast de éxito está desacoplado del resultado real (bug estructural, CONFIRMADO en código).**
En `useVehicleForm.ts` el `onCreate` envuelve toda la lógica en `try { ... } catch (error) { console.error(error); }`
(líneas 142, 188-190) SIN re-lanzar, y `toast.promise(..., { success: 'equipo registrado' })` (línea 192)
muestra éxito siempre que la promesa resuelva. Como el `catch` se traga cualquier excepción (incluido el
`throw new Error(...)` de la línea 154 cuando `insertVehicle` devuelve `error`), la promesa SIEMPRE resuelve
OK → el usuario ve "equipo registrado" aunque el insert haya fallado y `router.push` (línea 187) ni siquiera
se ejecute. Esto explica exactamente "dice que se cargó correctamente PERO no aparece". Este es el mecanismo
del síntoma; la causa de que el insert falle es alguna de las siguientes.

**H2 — `kilometer: values.kilometer || 0` envía un `number` a una columna `String?` → Prisma lanza (MUY PROBABLE).**
`useVehicleForm.ts:152` hace `kilometer: values.kilometer || 0`. El campo kilometer es opcional en el schema
de validación (`useVehicleForm.ts:73`) y en el form (`VehicleEquipmentForm.tsx:202-208`), por lo que es común
dejarlo vacío. Cuando está vacío/undefined, `'' || 0` da el **número 0**, pero `prisma/schema.prisma:623`
define `kilometer String?`. Prisma valida tipos y lanza `PrismaClientValidationError` ("Got invalid value 0…
Expected String"). Ese throw lo captura `insertVehicle` (devuelve `error`), luego `throw` en línea 154, y lo
traga el catch de H1 → success toast, sin fila en DB. Es determinístico para cualquier alta sin kilometraje.

**H3 — Falta `revalidatePath` + Router Cache de Next 14 (si el insert SÍ persiste).**
`insertVehicle` no llama a `revalidatePath('/dashboard/equipment')` (a diferencia de deactivate/reactivate).
Tras el alta se hace `router.push('/dashboard/equipment')` (navegación client-side). El App Router sirve la
ruta desde el Router Cache del cliente (RSC cacheado), por lo que el equipo recién creado puede no verse hasta
un refresh duro o expiración de caché. Si el QA confirma que la fila SÍ está en la DB, esta es la causa de visibilidad.

**H4 — FK resueltas a `undefined` por catálogo no cargado (race) → Prisma lanza NOT NULL.**
`type_of_vehicle`/`brand`/`model`/`type` se resuelven con `.find((e)=>e.name===...)?.id`
(`useVehicleForm.ts:146-149`) sobre estados que se cargan async (`data.tipe_of_vehicles`, `data.models`,
props). Si alguno no está cargado al enviar, el `?.id` es `undefined`; como esas columnas son NOT NULL,
Prisma lanza → mismo desenlace silencioso de H1. Menos determinístico que H2 (el usuario "carga todo perfecto"),
pero posible bajo race conditions.

**H5 (a descartar) — Discrepancia de company_id store vs cookie.**
El insert usa `actualCompany?.id` (Zustand) y el listado usa cookie `actualComp`. Normalmente coinciden, pero
si el usuario cambió de empresa y una fuente quedó desfasada, el equipo se insertaría en otra empresa y no
aparecería. Verificar que `actualCompany?.id === cookie actualComp` al momento del alta.

**Recomendación de orden de ataque:** quitar el `catch` silencioso / propagar el `error` real al toast (H1),
lo que de inmediato revelará en pantalla si la causa es H2/H4 (Prisma) o si el insert fue OK y el problema es
caché (H3). Corregir `kilometer` a String/`null` (H2) y agregar `revalidatePath('/dashboard/equipment')` en
`insertVehicle` o `router.refresh()` tras el push (H3).

---

## 2. Planificación

### 2.1 Fases de implementación

#### Fase 1: Dejar de tragar el error y propagar el resultado real al toast
- **Objetivo:** Que el toast refleje el resultado real del insert. Si el insert falla, el usuario ve el error; si tiene éxito, recién ahí navega. Esto, además de ser el fix correcto, elimina el síntoma central del ticket (falso "se cargó correctamente").
- **Tareas:**
  - [ ] En `useVehicleForm.ts` `onCreate` (líneas 138-194): quitar el `catch (error) { console.error(error); }` que traga la excepción, o re-lanzarla (`throw error`) para que `toast.promise` la enrute al callback `error`.
  - [ ] Mover `router.push('/dashboard/equipment')` para que se ejecute solo en el camino de éxito (después de que la promesa resuelva OK), no dentro del cuerpo que puede abortar a mitad.
  - [ ] Verificar que el callback `error: (error) => error` del `toast.promise` muestre un mensaje legible (el `error` ya viene formateado por `handleSupabaseError`).
- **Archivos:** `src/modules/equipment/features/create/components/useVehicleForm.ts`
- **Criterio de completitud:** Forzando un insert que falla, el toast muestra error (no "equipo registrado") y no se navega al listado.

#### Fase 2: Corregir el tipo de `kilometer` (causa raíz del fallo del insert)
- **Objetivo:** Enviar a Prisma un valor compatible con la columna `kilometer String?` cuando el campo viene vacío.
- **Tareas:**
  - [ ] En `useVehicleForm.ts:152`: cambiar `kilometer: values.kilometer || 0` por `kilometer: values.kilometer || null` (o `values.kilometer?.trim() || null`).
  - [ ] Revisar `onUpdate` y cualquier otro punto del módulo equipment que arme el payload con `kilometer || 0` para aplicar el mismo criterio (consistencia).
- **Archivos:** `src/modules/equipment/features/create/components/useVehicleForm.ts`
- **Criterio de completitud:** Crear un equipo sin completar kilometraje persiste la fila (no lanza `PrismaClientValidationError`).

#### Fase 3: Invalidar caché del listado tras el alta
- **Objetivo:** Garantizar que el equipo recién creado se vea sin refresh manual.
- **Tareas:**
  - [ ] En `insertVehicle` (`create/actions.server.ts:21-30`): agregar `revalidatePath('/dashboard/equipment')` (y `/dashboard/document` si aplica, en línea con deactivate/reactivate) antes del `return` de éxito.
  - [ ] Alternativamente/complementariamente, agregar `router.refresh()` tras el `router.push` en `onCreate`.
- **Archivos:** `src/modules/equipment/features/create/actions.server.ts`, opcionalmente `useVehicleForm.ts`
- **Criterio de completitud:** Tras crear un equipo, aparece en el listado sin necesidad de F5.

#### Fase 4 (opcional, defensiva): Robustecer resolución de FK
- **Objetivo:** Evitar inserts con FK `undefined` por catálogos cargados async (hipótesis H4).
- **Tareas:**
  - [ ] En `onCreate`, validar antes de `insertVehicle` que `type_of_vehicle`, `brand`, `model`, `type` resolvieron a un id; si no, abortar con mensaje claro.
- **Archivos:** `src/modules/equipment/features/create/components/useVehicleForm.ts`
- **Criterio de completitud:** Si un catálogo no cargó, el usuario ve un error explícito en vez de un fallo silencioso.

### 2.2 Orden de ejecución
- **Fase 1 primero:** es la que vuelve visible cualquier error y valida que el resto de los fixes funcionen (sin esto seguiríamos a ciegas).
- **Fase 2 luego:** corrige la causa determinística del fallo del insert.
- **Fase 3 después:** resuelve la visibilidad en el caso de que el insert ya persista.
- **Fase 4 al final y opcional:** sólo si tras 1-3 todavía se observan altas fallidas por race de catálogos.

Fases 1, 2 y 3 son el fix mínimo completo del ticket. La Fase 4 es endurecimiento.

### 2.3 Estimación de complejidad
- Fase 1: baja
- Fase 2: baja
- Fase 3: baja
- Fase 4: baja-media (opcional)

**Alcance total:** 2 archivos, < 30 líneas. Por las reglas de CLAUDE.md, el commit se hace cuando el usuario lo indique (cambio menor a 5 archivos / 100 líneas).

## 3. Diseño
_Pendiente - ejecutar `/disenar tsk-347-carga-equipo`_

## 4. Implementación

**Estado:** Fases 1-3 implementadas. Fase 4 (defensiva) no aplicada por ahora.

### Cambios realizados

**Fase 1 + 2 — `src/modules/equipment/features/create/components/useVehicleForm.ts` (`onCreate`)**
- Se eliminó el `try { ... } catch (error) { console.error(error); }` que tragaba la excepción. Ahora cualquier error (Prisma, documentos, imagen) se propaga al `toast.promise` y se muestra al usuario vía el callback `error: (error) => error`.
- `router.push('/dashboard/equipment')` queda como última línea del cuerpo: solo se ejecuta si no hubo throw (navegación únicamente en éxito).
- `kilometer: values.kilometer || 0` → `kilometer: values.kilometer || null`. Evita enviar un `number` a la columna `kilometer String?` cuando el campo viene vacío (causa raíz del fallo determinístico del insert).

**Fase 3 — `src/modules/equipment/features/create/actions.server.ts` (`insertVehicle`)**
- Se agregó `revalidatePath('/dashboard/equipment')` y `revalidatePath('/dashboard/document')` antes del `return` de éxito, en línea con `deactivateVehicle`/`reactivateVehicle`. Garantiza que el equipo recién creado se vea sin refresh manual.

### Verificación de tipos
- `npm run check-types`: sin errores en `equipment`/`useVehicleForm`. Los errores reportados por el comando son preexistentes y ajenos (módulos `ayuda`/`settings`: falta `@tanstack/react-query` y client Prisma desactualizado para `ai_provider_config`).

### Notas
- `onUpdate` (línea ~232) ya usaba `values.kilometer` directo (string), no requería cambio.
- Fase 4 (validar FK de catálogos antes del insert) queda pendiente como endurecimiento; con Fase 1 ya se vuelve visible si ese caso ocurre.

## 5. Verificación
_Pendiente - ejecutar `/verificar tsk-347-carga-equipo`_
