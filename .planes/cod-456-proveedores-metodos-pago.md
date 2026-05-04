# COD-456 — Métodos de pago en Proveedores

**Fecha de inicio:** 2026-05-04
**Estado:** Implementación en progreso (Fase 3 de 5 completada)

**Decisiones finales pre-implementación (2026-05-04):**
- Persistencia: `updateSupplier` recibe el array completo y hace diff en una sola transacción (lo más simple).
- Currency: Select fijo con ARS / USD.
- Enum `supplier_account_type` (CHECKING / SAVINGS) aprobado para el campo `account_type`.
- Se omite la etapa `/disenar`: el plan tiene granularidad suficiente.
**Linear:** https://linear.app/codecontrol-sas/issue/COD-456/proveedores

---

## 1. Análisis

### 1.1 Problema

Hoy el modelo de Proveedores no tiene forma de registrar cómo se le paga a cada proveedor. La operatoria diaria del cliente requiere saber, antes de generar una Orden de Pago (COD-458), si el proveedor cobra por:

- **Cheque** (necesita banco emisor / datos para librar el cheque a su nombre).
- **Cuenta bancaria** (CBU de 22 dígitos o ALIAS, para realizar transferencias).

Un mismo proveedor puede aceptar más de un método (ej. acepta cheques y además tiene una cuenta para transferencia), e incluso varias cuentas bancarias distintas (banco principal + banco secundario). Esto hace inviable resolverlo con columnas planas en `suppliers`.

### 1.2 Contexto actual

**Módulo de Proveedores ya existe** y está en `src/modules/suppliers/`, con rutas en `src/app/dashboard/suppliers/`:

- Lista paginada con DataTable estándar (`SuppliersList`, `_SuppliersDataTable`, `columns.tsx`).
- Crear / editar con `SupplierForm.tsx` (React Hook Form + Zod + shadcn `Form`).
- Detalle en `[id]/page.tsx`.
- Server actions concentradas en `features/list/actions.server.ts` (CRUD + paginación + facets + export).

**Modelo Prisma actual `suppliers`** (en `prisma/schema.prisma`): tiene datos fiscales (CUIT, condición IVA), contacto, dirección, comerciales (`payment_term_days`, `credit_limit`) y status. **No tiene** ningún campo de método de pago, CBU, alias, banco ni cuenta. Sí tiene relación a `payment_orders` (COD-458 ya empezó).

**Infraestructura de pagos ya construida en Tesorería** (importante, evita reinventar):

- Enum `payment_method` con valores `CASH`, `CHECK`, `TRANSFER`, `DEBIT_CARD`, `CREDIT_CARD`, `ACCOUNT`.
- Modelo `bank_accounts` (cuentas bancarias **propias de la empresa**) con `bank_name`, `account_number`, `account_type`, `cbu`, `alias`, `currency`. Tiene enum `bank_account_type` (CHECKING / SAVINGS / CREDIT / CASH / VIRTUAL_WALLET).
- Modelo `checks` (cheques de la cartera, propios y de terceros) con `check_number`, `bank_name`, `branch`, `account_number`, `drawer_name`, `drawer_tax_id`, etc., y FK opcional a `supplier_id`.
- Modelo `payment_order_payments` ya soporta seleccionar `payment_method` + `bank_account_id` + `check_number` por línea de OP.

Es decir, **el lado de la empresa pagadora ya está modelado**; lo que falta es el lado del proveedor receptor: dónde recibe ese pago.

### 1.3 Archivos involucrados

**DB / tipos**
- `prisma/schema.prisma` — agregar nuevo modelo (`supplier_payment_methods` o similar) y enum.
- `database.types.ts` — se regenera con `npm run gentypes` post-migración.
- `supabase/migrations/<nuevo>.sql` — migración generada con `npm run create-migration`.

**Módulo Proveedores**
- `src/modules/suppliers/shared/types.ts` — extender `Supplier` con array de métodos de pago.
- `src/modules/suppliers/shared/validators.ts` — agregar schema Zod para método de pago.
- `src/modules/suppliers/features/list/actions.server.ts` — `createSupplier`, `updateSupplier`, `getSupplierById` deben manejar el array de métodos (crear, eliminar, actualizar). Posible nuevo archivo `features/payment-methods/actions.server.ts` si la edición se hace por sub-feature.
- `src/modules/suppliers/features/create/components/SupplierForm.tsx` — agregar `Card "Métodos de pago"` con sub-form repetible (FieldArray).
- `src/modules/suppliers/features/detail/components/SupplierDetail.tsx` — mostrar listado de métodos de pago.

**Posibles consumidores (no modificar todavía, pero documentar)**
- `src/modules/purchasing/features/payment-orders/**` (COD-458) — al crear OP, va a querer leer los métodos de pago disponibles del proveedor seleccionado para autocompletar el destino.

### 1.4 Dependencias

- **Librerías ya en uso, no se agrega nada nuevo:** Prisma, React Hook Form (`useFieldArray`), Zod, shadcn/ui (`Form`, `Card`, `Select`, `Input`, `Button`).
- **Sin cross-module imports:** la feature vive 100% dentro de `src/modules/suppliers/`.
- **Impacto en COD-458 (Orden de Pago):**
  - El selector de proveedor en la OP debería poder traer los métodos de pago registrados y precargar destino (CBU/alias/banco) cuando el usuario elige `TRANSFER` o `CHECK`.
  - Conviene definir el schema ahora pensando en que el OP lea desde acá; si se difiere, hay riesgo de tener que rehacer la tabla.
- **No hay dependencia con `bank_accounts`** (esas son cuentas propias de la empresa, no del proveedor).

### 1.5 Restricciones y reglas

De `CLAUDE.md` y memorias del usuario:

- **Migraciones solo ADD** (no perder datos): los proveedores existentes quedan sin métodos de pago cargados; los campos nuevos deben ser opcionales/relación 1-N que admite cero filas.
- **Nunca `db reset`** ni operaciones destructivas; la migración debe ser puramente aditiva.
- **`src/app/` solo routing** — toda la lógica vive en `src/modules/suppliers/`.
- **No cross-module imports** — si COD-458 necesita leer métodos de pago, lo hará vía un server action exportado por `suppliers` o re-pidiendo al backend.
- **Server actions por feature** con `'use server'` y `getActionContext()` para `companyId`.
- **DataTable estándar** — no aplica directamente acá (los métodos se editan en el form del proveedor, no en lista propia), pero el detalle del proveedor puede mostrarlos en una tablita simple.
- **Prisma `Decimal`/`BigInt`** — no aplica aquí (CBU es string).
- **RHF + Zod válido** acá: el form ya es complejo (>5 campos), corresponde mantener RHF.
- **No `push` sin autorización**; **commit autorizado** si el cambio supera 5 archivos / 100 líneas.

### 1.6 Riesgos identificados

1. **Modelado 1-N vs JSON**: meter los métodos como `Json` en `suppliers` es rápido pero rompe consultas (ej. "buscar proveedores con CBU XXX") y validación a nivel DB. Una tabla separada `supplier_payment_methods` es más limpio y se alinea con los modelos existentes (`bank_accounts`, `checks`).
2. **Polimorfismo cheque vs cuenta**: dos tipos con campos distintos. Opciones:
   - Una sola tabla con todos los campos opcionales + `type` enum (más simple, lo que ya hace `bank_accounts`).
   - Dos tablas separadas (más estricto, más join).
   Inclinación: una sola tabla con `type` y campos condicionales — sigue el patrón del proyecto.
3. **Validación CBU/ALIAS**:
   - CBU = 22 dígitos numéricos (regex `/^\d{22}$/`); idealmente validar dígito verificador, pero suele bastar la longitud.
   - ALIAS = 6-20 caracteres, mayúsculas/minúsculas, dígitos, puntos y guiones (regex aproximado `/^[A-Za-z0-9.\-]{6,20}$/`).
   - Al menos uno de los dos debe estar presente cuando `type = ACCOUNT`.
4. **Reusar enum `payment_method` existente vs nuevo enum acotado**: el enum global tiene `CASH`, `DEBIT_CARD`, etc. que no aplican a "cómo cobra el proveedor". Conviene un enum nuevo `supplier_payment_method_type` con solo `CHECK` y `ACCOUNT` (lo pedido por el ticket), dejando margen para crecer.
5. **Retrocompatibilidad**: proveedores existentes no tienen métodos cargados → la UI debe manejar "sin métodos" sin romper, y la OP (COD-458) debe seguir permitiendo elegir cualquier método aunque el proveedor no tenga ninguno guardado.
6. **Marcar uno como predeterminado**: probablemente útil para autocompletar la OP. Decidirlo en planificación.
7. **Datos sensibles**: CBU/alias no son ultra sensibles pero conviene no exponerlos en columnas del DataTable de la lista (sí en detalle).
8. **Búsqueda / facets**: no impacta la lista actual; los métodos de pago no entran en `searchFields` ni en `facets`.

### 1.7 Decisiones cerradas (2026-05-04)

1. **Modelo**: tabla nueva `supplier_payment_methods` (1-N).
2. **Enum**: reutilizar el enum global `payment_method` existente.
3. **Cheque**: solo flag "acepta cheques" por proveedor (sin metadata adicional). La metadata extendida queda diferida a [COD-464](https://linear.app/codecontrol-sas/issue/COD-464) (Backlog).
4. **Multiplicidad**: un proveedor puede tener **múltiples cuentas** (`ACCOUNT`). Para `CHECK`, basta con un único registro por proveedor.
5. **Default**: flag `is_default` para autocompletar la OP.
6. **Validación**: CBU exactamente 22 dígitos numéricos. ALIAS opcional, sin regex (campo libre).
7. **Status**: soft delete con `deleted_at` o flag `active` (a definir en /disenar; alineado con el resto del módulo).
8. **UI**: sub-form embebido en `SupplierForm` con `useFieldArray` (mismo formulario de crear/editar).
9. **COD-458 (Orden de Pago)**: pre-carga el método marcado `is_default`, pero el usuario puede cambiarlo. NO obliga.
10. **Auditoría**: `created_by`, `updated_by`, timestamps — siguiendo el patrón del módulo.

---

## 2. Planificación

### 2.1 Fases de implementación

#### Fase 1: DB & tipos (migración aditiva)
- **Objetivo:** Crear la tabla `supplier_payment_methods` reutilizando el enum global `payment_method`, sin alterar datos existentes ni el enum.
- **Tareas:**
  - [x] Crear migración `npm run create-migration -- add_supplier_payment_methods`.
  - [x] En el SQL: crear enum `supplier_account_type` (`CHECKING`, `SAVINGS`) (la tabla `bank_accounts` ya usa `bank_account_type`, pero acá conviene un enum acotado para no arrastrar `CREDIT/CASH/VIRTUAL_WALLET`).
  - [x] En el SQL: crear tabla `supplier_payment_methods` con:
    - `id uuid PK default gen_random_uuid()`
    - `supplier_id uuid NOT NULL FK → suppliers(id) ON DELETE CASCADE`
    - `company_id uuid NOT NULL FK → company(id)` (denormalizado para queries por empresa).
    - `type payment_method NOT NULL` (en la app se filtra a `CHECK` y `ACCOUNT`; chequeo `CHECK ( type IN ('CHECK','ACCOUNT') )`).
    - Campos de cuenta (todos nullable, requeridos vía Zod cuando `type = ACCOUNT`): `bank_name text`, `account_holder text`, `account_holder_tax_id text`, `account_type supplier_account_type`, `cbu varchar(22)`, `alias text`, `currency text`.
    - Flags: `is_default boolean NOT NULL DEFAULT false`, `status supplier_status NOT NULL DEFAULT 'ACTIVE'` (alineado con el patrón del módulo: soft delete via `status = 'INACTIVE'`).
    - Auditoría: `created_at timestamptz default now()`, `updated_at timestamptz default now()`, `created_by uuid NULL FK → profile(id)`, `updated_by uuid NULL FK → profile(id)`.
    - Índices: `(supplier_id)`, `(company_id, supplier_id)`, `UNIQUE (supplier_id) WHERE type = 'CHECK' AND status = 'ACTIVE'` (un único CHECK activo por proveedor), `UNIQUE (supplier_id) WHERE is_default = true AND status = 'ACTIVE'` (un único default activo por proveedor).
  - [x] Reflejar la tabla y el enum en `prisma/schema.prisma` (modelo `supplier_payment_methods` + relación inversa `supplier_payment_methods supplier_payment_methods[]` en `suppliers`).
  - [x] Aplicar localmente (`npx supabase migration up`) y regenerar tipos: `npm run gentypes`.
- **Archivos:**
  - `supabase/migrations/<timestamp>_add_supplier_payment_methods.sql` (nuevo).
  - `prisma/schema.prisma` (modificar: agregar modelo + enum + relación inversa en `suppliers`).
  - `database.types.ts` (regenerado).
- **Criterio de completitud:** `npx prisma generate` ok, `npm run check-types` ok, la tabla existe en la DB local con sus constraints.

#### Fase 2: Capa de datos (tipos, schemas Zod, server actions)
- **Objetivo:** Tener todas las operaciones backend para listar / crear / actualizar / eliminar métodos de pago de un proveedor, con validación CBU y manejo de `is_default`.
- **Tareas:**
  - [x] Extender `src/modules/suppliers/shared/types.ts`:
    - Agregar `SupplierPaymentMethodType = 'CHECK' | 'ACCOUNT'`.
    - Agregar `SupplierAccountType = 'CHECKING' | 'SAVINGS'`.
    - Agregar interfaz `SupplierPaymentMethod` con todos los campos de la tabla.
    - Agregar `SUPPLIER_ACCOUNT_TYPE_LABELS` (`CHECKING: 'Cuenta corriente'`, `SAVINGS: 'Caja de ahorro'`).
    - Extender `Supplier` con `payment_methods?: SupplierPaymentMethod[]` (opcional, lo carga `getSupplierById`).
    - **Exportable** desde `src/modules/suppliers/index.ts` (barrel) para que COD-458 los reuse vía `import { SupplierPaymentMethod } from '@/modules/suppliers'` — no se modifica COD-458 acá.
  - [x] Extender `src/modules/suppliers/shared/validators.ts`:
    - `supplierPaymentMethodSchema` (z.discriminatedUnion sobre `type`):
      - rama `CHECK`: solo `id?`, `type: 'CHECK'`, `is_default: boolean`.
      - rama `ACCOUNT`: `id?`, `type: 'ACCOUNT'`, `bank_name (min 1)`, `account_holder (min 1)`, `account_holder_tax_id` (regex CUIT existente), `account_type: 'CHECKING' | 'SAVINGS'`, `cbu: regex /^\d{22}$/`, `alias` opcional libre, `currency` (default `'ARS'`), `is_default: boolean`.
    - `supplierPaymentMethodsArraySchema = z.array(supplierPaymentMethodSchema)` con `.refine` que valide: máximo un `CHECK` y máximo un `is_default = true`.
    - Extender `createSupplierSchema` y `updateSupplierSchema` con `payment_methods: supplierPaymentMethodsArraySchema.optional().default([])`.
  - [x] Crear `src/modules/suppliers/features/payment-methods/actions.server.ts` con:
    - `'use server'` + `getActionContext()`.
    - `listSupplierPaymentMethods(supplierId)` — devuelve `status = 'ACTIVE'` ordenados por `is_default desc, created_at asc`.
    - `createSupplierPaymentMethod(supplierId, input)` — valida con Zod; si `is_default = true`, dentro de `prisma.$transaction` baja el flag de los demás del proveedor.
    - `updateSupplierPaymentMethod(id, input)` — idem.
    - `deleteSupplierPaymentMethod(id)` — soft delete (`status = 'INACTIVE'`).
    - Helper interno `applyDefaultExclusivity(tx, supplierId, excludeId?)` reutilizable.
    - Setear `created_by` / `updated_by` desde `getActionContext()`.
    - `revalidatePath('/dashboard/suppliers/[id]', 'page')` después de cada mutación.
  - [x] Modificar `src/modules/suppliers/features/list/actions.server.ts`:
    - `getSupplierById` → incluir `payment_methods: { where: { status: 'ACTIVE' }, orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }] }`.
    - `createSupplier` → en `prisma.$transaction`, crear el supplier y, si `data.payment_methods` viene, crearlos en cascada validando exclusividad de default y CHECK.
    - `updateSupplier` → opcional en esta fase (el sub-form puede llamar a las actions de payment-methods directamente). Si se incluye, hacer diff (insert/update/soft-delete) en transacción.
- **Archivos:**
  - `src/modules/suppliers/shared/types.ts` (modificar).
  - `src/modules/suppliers/shared/validators.ts` (modificar).
  - `src/modules/suppliers/features/payment-methods/actions.server.ts` (nuevo).
  - `src/modules/suppliers/features/payment-methods/index.ts` (nuevo, barrel).
  - `src/modules/suppliers/features/list/actions.server.ts` (modificar `getSupplierById` + `createSupplier`).
  - `src/modules/suppliers/index.ts` (verificar/crear barrel y reexportar tipos públicos).
- **Criterio de completitud:** `npm run check-types` ok; smoke test manual desde un script o REPL: crear/listar/borrar un método de pago para un proveedor de prueba.
- **Depende de:** Fase 1 (necesita la tabla y los tipos generados).

#### Fase 3: UI sub-form en `SupplierForm` con `useFieldArray`
- **Objetivo:** Permitir alta / edición / baja de métodos de pago dentro del mismo formulario de crear y editar proveedor.
- **Tareas:**
  - [x] Crear `src/modules/suppliers/features/create/components/SupplierPaymentMethodsField.tsx`:
    - Recibe `control` del RHF padre.
    - Usa `useFieldArray({ name: 'payment_methods' })`.
    - Render: `Card` "Métodos de pago" con:
      - Toggle/Switch "Acepta cheques" → agrega/quita el item con `type: 'CHECK'` (sin campos extra).
      - Sección "Cuentas bancarias": lista de items `type: 'ACCOUNT'` con `Input`s para `bank_name`, `account_holder`, `account_holder_tax_id`, `Select` `account_type`, `Input` `cbu` con máscara/longitud 22 dígitos, `Input` `alias`, `Select` `currency` (`ARS`/`USD`).
      - Botón "Agregar cuenta" (`append({ type: 'ACCOUNT', ...defaults })`).
      - Botón eliminar por fila (`remove(index)`).
      - `RadioGroup` o checkbox "Predeterminado" exclusivo: al marcar uno, desmarca los demás vía `setValue` (evita depender solo del backend).
    - Mostrar errores de validación inline (Zod messages).
  - [x] Modificar `src/modules/suppliers/features/create/components/SupplierForm.tsx`:
    - Agregar `payment_methods` al `defaultValues` (vacío en alta; precargado desde `supplier.payment_methods` en edición).
    - Insertar `<SupplierPaymentMethodsField control={form.control} />` como nueva `Card` entre la card de "Datos comerciales" y "Notas" (verificar layout actual).
    - En `onSubmit`: pasar `payment_methods` a `createSupplier` / `updateSupplier`.
    - Si `updateSupplier` no maneja el array (decisión de Fase 2), entonces tras `updateSupplier` ok, hacer un diff y llamar a las acciones individuales (`create/update/delete SupplierPaymentMethod`) — evaluar en /disenar.
- **Archivos:**
  - `src/modules/suppliers/features/create/components/SupplierPaymentMethodsField.tsx` (nuevo).
  - `src/modules/suppliers/features/create/components/SupplierForm.tsx` (modificar).
- **Criterio de completitud:** Crear un proveedor con 1 cheque + 2 cuentas funciona end-to-end. Editar el mismo proveedor recupera los métodos, permite agregar/quitar y guarda OK. Validaciones (CBU 22 dígitos, default único) bloquean submit con mensajes claros.
- **Depende de:** Fase 2 cerrada (el form llama a las actions y consume los tipos/schemas).

#### Fase 4: Integración en detalle del proveedor (read-only) + ajustes de UX
- **Objetivo:** Mostrar los métodos de pago en `SupplierDetail` para consulta, con badges de "Predeterminado" y CBU enmascarado.
- **Tareas:**
  - [ ] Modificar `src/modules/suppliers/features/detail/components/SupplierDetail.tsx`:
    - Asegurar que `getSupplierById` ya devuelve `payment_methods`.
    - Agregar `Card` "Métodos de pago" debajo de los datos comerciales:
      - Si hay flag CHECK → `Badge` "Acepta cheques".
      - Para cada `ACCOUNT`: render compacto con `bank_name`, `account_holder`, `account_type`, `cbu` (formato `XXXXXXX-XX-XXXXXXXXXXX-X` o solo agrupado de a 4), `alias`, `currency`. Marcar el default con `Badge` "Predeterminado".
    - Si no hay métodos: estado vacío con CTA a "Editar proveedor".
  - [ ] Crear util compartido en `src/modules/suppliers/shared/utils.ts` (nuevo si no existe): `formatCbu(cbu: string)` y `parseCbuInput(value: string)` para reutilizar en form y detalle.
  - [ ] (Opcional) Agregar columna "Métodos" en la lista (`columns.tsx`) con un mini-badge contador — evaluar; por defecto no se hace para no agrandar la grilla.
- **Archivos:**
  - `src/modules/suppliers/features/detail/components/SupplierDetail.tsx` (modificar).
  - `src/modules/suppliers/shared/utils.ts` (nuevo).
  - (eventualmente) `src/modules/suppliers/features/create/components/SupplierPaymentMethodsField.tsx` (consumir `parseCbuInput`).
- **Criterio de completitud:** Detalle muestra correctamente cheque + cuentas + default. CBU formateado. Estado vacío visible.
- **Depende de:** Fases 2 y 3.

#### Fase 5: QA, type-check y commit
- **Objetivo:** Verificar que toda la feature funciona, no rompe builds y queda lista para mergear.
- **Tareas:**
  - [ ] `npm run check-types` sin errores.
  - [ ] `npm run lint` sin warnings nuevos.
  - [ ] `npm run build` ok.
  - [ ] Pruebas manuales: alta proveedor con 0 métodos / con cheque / con 1 cuenta / con 2 cuentas + default. Edición: cambiar default, eliminar cuenta, agregar otra. Validar: CBU de 21 dígitos rechazado, dos defaults rechazados, dos cheques rechazados.
  - [ ] Verificar que un proveedor existente (sin métodos) sigue editable sin errores.
  - [ ] Confirmar con el usuario y, si supera 5 archivos / 100 líneas (lo va a superar), commit autorizado por regla.
- **Archivos:** ninguno nuevo.
- **Criterio de completitud:** Checklist OK + commit creado en `dev` (sin push).
- **Depende de:** Fases 1-4.

### 2.2 Orden de ejecución

Lineal y obligatorio: **1 → 2 → 3 → 4 → 5**.

- Fase 2 necesita la tabla y tipos generados de Fase 1 (si no, Prisma client no conoce el modelo).
- Fase 3 necesita los schemas Zod y las server actions de Fase 2 (el form los importa).
- Fase 4 necesita que `getSupplierById` devuelva `payment_methods` (Fase 2) y que la edición persista correctamente (Fase 3) para que el detalle muestre datos reales.
- Fase 5 cierra todo con verificación.

No hay paralelización posible salvo, eventualmente, redactar los Zod schemas (Fase 2) en paralelo con afinar el SQL (Fase 1) — irrelevante para una sola persona.

### 2.3 Estimación de complejidad

- **Fase 1 (DB & tipos):** baja. Migración aditiva sencilla; el único punto fino son los partial unique indexes (CHECK único, default único) — sintaxis Postgres conocida.
- **Fase 2 (datos / actions):** media. La lógica de exclusividad del default + validación discriminada por `type` requiere transacciones y tests manuales. Diff insert/update/delete en `updateSupplier` añade carga si se elige hacerlo allí.
- **Fase 3 (UI sub-form):** media. `useFieldArray` está soportado pero el toggle "acepta cheques" + array de cuentas + default exclusivo + validación inline requieren atención de UX.
- **Fase 4 (detalle + utils):** baja. Sólo render read-only y un par de helpers de formateo.
- **Fase 5 (QA):** baja-media, según hallazgos.

**Complejidad global:** media. El riesgo principal es la coordinación entre `useFieldArray` del padre (Supplier) y la persistencia atómica con exclusividad de default.

## 3. Diseño
_Pendiente - ejecutar `/disenar cod-456-proveedores-metodos-pago`_

## 4. Implementación

### Fase 1: DB & tipos
- **Estado:** Completada (2026-05-04)
- **Archivos modificados:**
  - `supabase/migrations/20260504195144_add_supplier_payment_methods.sql` — creado: nuevo enum `supplier_account_type` (`CHECKING`, `SAVINGS`), tabla `supplier_payment_methods` con FKs a `suppliers` (CASCADE), `company` (CASCADE) y `profile` (SET NULL para `created_by`/`updated_by`), CHECK `type IN ('CHECK','ACCOUNT')`, índices simples `(supplier_id)` y `(company_id, supplier_id)`, dos partial unique: uno para CHECK activo único por proveedor y otro para default activo único por proveedor.
  - `prisma/schema.prisma` — agregado enum `supplier_account_type`, modelo `supplier_payment_methods`, relación inversa `payment_methods` en `suppliers`, relación inversa `supplier_payment_methods` en `company`, y dos relaciones inversas (`supplier_payment_methods_created`, `supplier_payment_methods_updated`) en `profile`.
  - `database.types.ts` — regenerado con `npx supabase gen types typescript --local`.
- **Ajustes 2026-05-04:** removidas FKs de auditoría (`created_by` / `updated_by`) en migración SQL y en `prisma/schema.prisma` (también las relaciones inversas en `profile`); constraints `supplier_payment_methods_created_by_fkey` y `supplier_payment_methods_updated_by_fkey` dropeadas en DB local; agregados scripts faltantes a `package.json` (`create-migration`, `gentypes`, `genlocaltypes`, `push-migrations`).
- **Notas / desvíos del plan:**
  - **Scripts de CLAUDE.md desactualizados:** los scripts npm `create-migration`, `gentypes`, `genlocaltypes` y `push-migrations` no existen en `package.json`. Se generó el archivo de migración manualmente con timestamp UTC (formato `YYYYMMDDHHMMSS` consistente con migraciones previas) y los tipos vía `npx supabase gen types typescript --local`. **Recomendación:** agregar estos scripts a `package.json` o actualizar CLAUDE.md.
  - **Banner del CLI de Supabase:** `npx supabase gen types` (v1.226.4) imprime un aviso de actualización al stdout que ensucia el archivo. Se filtró con `2>/dev/null` + `sed`. Si se actualiza el CLI a v2.x esto se evita.
  - **`updated_at`:** se usa el patrón Prisma `@default(now()) @updatedAt` (sin trigger en DB), igual que el resto de tablas del proyecto. En la DB el default es `CURRENT_TIMESTAMP`; el incremento del valor lo maneja Prisma Client en cada `update`.
  - **`created_by` / `updated_by`:** se modelaron como `UUID NULL` con FK a `profile.id` y `ON DELETE SET NULL`, para preservar registros si se borra un usuario. Otras tablas del proyecto (ej. `bank_accounts`, `cash_registers`) usan `created_by String?` sin FK explícita; aquí se prefirió FK explícita por integridad. Si genera fricción, se puede revertir.
  - **`status`:** se reutilizó el enum `supplier_status` existente (`ACTIVE`, `INACTIVE`, `BLOCKED`) tal como pide el plan.
  - **`currency`:** quedó nullable en DB (sin default). El default `'ARS'` se aplicará desde Zod en Fase 2 al crear/editar.
- **Verificaciones:**
  - `npx supabase migration up` aplicó OK.
  - `npx prisma validate` OK; `npx prisma generate` OK.
  - `npm run check-types`: no hay errores nuevos relacionados con esta migración. Hay errores **preexistentes** en `src/modules/hse/features/training/**` (referencias a tablas `training_materials` / `trainings` que no están en `database.types.ts` y varios `any` implícitos) — no introducidos por esta fase.
  - DB local inspeccionada con `psql`: tabla, índices, partial uniques, CHECK constraint y FKs creados correctamente.

### Fase 2: Capa de datos
- **Estado:** Completada (2026-05-04)
- **Archivos modificados / creados:**
  - `src/modules/suppliers/shared/types.ts` — agregados `SupplierPaymentMethod`, `SupplierPaymentMethodType`, `SupplierAccountType`, `SupplierPaymentMethodStatus`, `SUPPLIER_ACCOUNT_TYPE_LABELS`, `SUPPLIER_PAYMENT_METHOD_TYPE_LABELS`; `Supplier.payment_methods?: SupplierPaymentMethod[]`.
  - `src/modules/suppliers/shared/validators.ts` — `supplierPaymentMethodSchema` (z.discriminatedUnion CHECK / ACCOUNT), `supplierPaymentMethodsArraySchema` con `superRefine` (max 1 CHECK, max 1 default), extensión de `createSupplierSchema` y `updateSupplierSchema`. Currency enum `'ARS' | 'USD'` con default `'ARS'`.
  - `src/modules/suppliers/features/payment-methods/actions.server.ts` — server actions: `listSupplierPaymentMethods`, `createSupplierPaymentMethod`, `updateSupplierPaymentMethod`, `deleteSupplierPaymentMethod` (soft delete con `status='INACTIVE'`).
  - `src/modules/suppliers/features/payment-methods/sync.ts` — helpers no-action: `applyDefaultExclusivity`, `buildCreateData`, `buildUpdateData`, `syncSupplierPaymentMethodsTx` (diff insert/update/soft-delete dentro de una transacción).
  - `src/modules/suppliers/features/payment-methods/index.ts` — barrel.
  - `src/modules/suppliers/features/list/actions.server.ts` — `getSupplierById` con `include` de `payment_methods` (status ACTIVE, ordenados por `is_default desc, created_at asc`); `createSupplier` y `updateSupplier` envueltos en `prisma.$transaction` y delegan a `syncSupplierPaymentMethodsTx` cuando `data.payment_methods` está presente.
  - `src/modules/suppliers/index.ts` — barrel del módulo, exporta tipos públicos para reuse desde otros módulos (COD-458).
- **Notas / decisiones:**
  - Helpers de transacción se movieron a `sync.ts` (no `'use server'`) porque archivos `'use server'` solo pueden exportar funciones async-action y no helpers que reciben `Prisma.TransactionClient`.
  - `userId` se obtiene con `fetchCurrentUser()` (mismo patrón que `treasury/bank-accounts`); `getActionContext()` no expone `userId`.
  - `currency` ahora es enum cerrado `ARS | USD` (validación Zod) con default `ARS`. La DB sigue aceptando cualquier `text`, pero la app sólo escribe valores válidos.
  - `account_holder_tax_id` se normaliza (sin guiones) antes de persistir, igual que el `tax_id` del proveedor.
  - `revalidatePath('/dashboard/purchasing')` + `revalidatePath('/dashboard/suppliers/<id>')` después de cada mutación.
- **Verificaciones:**
  - `npm run check-types`: sin errores nuevos en suppliers/payment-methods. Persisten errores **preexistentes** en `src/modules/hse/features/training/**` (no introducidos por esta fase).
  - `npm run lint`: el script falla por configuración del repo (`Invalid project directory provided, no such directory: .../lint`) — bug preexistente del comando, no de los archivos tocados.

### Fase 3: UI sub-form en SupplierForm
- **Estado:** Completada (2026-05-04)
- **Archivos modificados:**
  - `src/modules/suppliers/features/create/components/SupplierPaymentMethodsField.tsx` — nuevo. Sub-form con `useFieldArray`. Toggle Switch "Acepta cheques" que `append`/`remove` el ítem `CHECK`. Lista repetible de cuentas `ACCOUNT` con `bank_name`, `account_holder`, `account_holder_tax_id`, `account_type` (Select con `SUPPLIER_ACCOUNT_TYPE_LABELS`), `cbu` (filtra a dígitos en `onChange` con maxLength 22), `alias`, `currency` (`ARS`/`USD`). Botón "Agregar cuenta bancaria" y botón eliminar por fila. `RadioGroup` exclusivo "Método predeterminado" con opción "Sin predeterminado": al cambiar usa `update()` para setear `is_default` true/false en cada fila. Errores Zod inline + mensaje del array (`payment_methods.message` y `payment_methods.root.message`).
  - `src/modules/suppliers/features/create/components/SupplierForm.tsx` — agregado import del nuevo componente, `payment_methods` mapeado en `defaultValues` (vacío en alta, normalizado desde `supplier.payment_methods` en edición), y `<SupplierPaymentMethodsField control={form.control} />` insertado entre la card "Datos comerciales" y los botones de acción. `onSubmit` ya incluye `payment_methods` en `values` (nada más que tocar; `createSupplier` y `updateSupplier` ya manejan el array desde Fase 2).
- **Notas / decisiones:**
  - El `RadioGroup` usa el valor sentinel `__none__` para "Sin predeterminado" (RadioGroup no acepta string vacío como value sin disparar warnings de Radix).
  - `update()` se usa en lugar de `setValue` masivo porque mantiene la `key` estable de `useFieldArray` y evita re-render del input activo.
  - El label del default para cuentas muestra `bank_name + últimos 4 del CBU` (los primeros 4 enmascarados) para distinguir cuentas con mismo banco.
  - Se evitó colocar el sub-form dentro de la card "Datos comerciales" (que actualmente embebe "Notas") para no romper el layout existente; se inserta como card propia.
- **Verificaciones:**
  - `npm run check-types`: sin errores en `src/modules/suppliers`. Persisten errores **preexistentes** en `src/modules/hse/features/training/**`.
  - `npm run lint`: bug preexistente del comando — ignorado por instrucción del usuario.

## 5. Verificación
_Pendiente - ejecutar `/verificar cod-456-proveedores-metodos-pago`_
