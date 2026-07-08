# Descuentos en Facturas de Compra

**Fecha de inicio:** 2026-05-13
**Estado:** Implementacion en progreso (Fases 1 y 4 completadas)

---

## 1. Analisis

### 1.1 Problema

Las facturas de compra actualmente no soportan descuentos. En la realidad comercial, los proveedores aplican descuentos de dos formas:

1. **Descuento global** sobre el total de la factura (ej. 5% por pronto pago, descuento comercial fijo).
2. **Descuento por linea** sobre cada item individual (ej. bonificacion por volumen en un producto).

El descuento puede expresarse como **porcentaje** o como **monto fijo**. Esto impacta directamente en los calculos de subtotal, IVA y total, ya que el IVA debe calcularse sobre el neto despues de descuentos.

### 1.2 Contexto actual

**Modelo de datos (Prisma):**
- `purchase_invoices`: tiene `subtotal`, `vat_amount`, `other_taxes`, `total` (Decimal 12,2). No tiene campos de descuento.
- `purchase_invoice_lines`: tiene `quantity`, `unit_cost`, `vat_rate`, `vat_amount`, `subtotal`, `total` (Decimal 12,3). No tiene campos de descuento.
- No existe ningun campo `discount` en el schema actual de purchasing.

**Calculo actual en el server action (`createPurchaseInvoice`):**
```
linea.subtotal = quantity * unit_cost
linea.vat_amount = subtotal * (vat_rate / 100)
linea.total = subtotal + vat_amount
factura.subtotal = SUM(linea.subtotal)
factura.vat_amount = SUM(linea.vat_amount)
factura.total = factura.subtotal + factura.vat_amount + other_taxes(percepciones)
```

**Calculo actual en el frontend (`PurchaseInvoiceForm.tsx` - useMemo totals):**
```
subtotal = SUM(quantity * unit_cost)
vatAmount = SUM(subtotal_linea * vat_rate/100)
total = subtotal + vatAmount + percepciones
```

**Formulario:** No tiene campos de descuento. Cada linea muestra: Producto, OC, Descripcion, Cantidad, Costo, IVA%, Subtotal. Los totales muestran: Subtotal, IVA, Percepciones, Total.

### 1.3 Archivos involucrados

**Cambios obligatorios (core):**

| Archivo | Razon |
|---------|-------|
| `prisma/schema.prisma` — modelo `purchase_invoice_lines` | Agregar campos `discount_type`, `discount_value`, `discount_amount` |
| `prisma/schema.prisma` — modelo `purchase_invoices` | Agregar campo `discount_amount` (total de descuentos) |
| `src/modules/purchasing/shared/validators.ts` — `purchaseInvoiceLineSchema` | Agregar campos de descuento al schema Zod |
| `src/modules/purchasing/shared/validators.ts` — `purchaseInvoiceSchema` | Agregar descuento global (opcional) |
| `src/modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm.tsx` | UI de descuento por linea + descuento global + recalculo de totales |
| `src/modules/purchasing/features/invoices/list/actions.server.ts` — `createPurchaseInvoice` | Calcular neto despues de descuento, IVA sobre neto con descuento |
| Migracion SQL | ADD columns, no DROP |

**Cambios en vistas (display):**

| Archivo | Razon |
|---------|-------|
| `src/app/dashboard/purchasing/invoices/[id]/page.tsx` | Mostrar descuentos en la tabla de lineas y en los totales |
| `src/modules/purchasing/features/invoices/list/components/columns.tsx` | Opcionalmente mostrar descuento en la columna de lista |

**Flujos dependientes que usan `invoice.total` (impacto indirecto, solo se benefician):**

| Archivo | Flujo |
|---------|-------|
| `src/modules/treasury/features/payment-orders/actions.server.ts` — `getPendingPurchaseInvoices` | Lee `invoice.total` para calcular saldo pendiente de pago. Si el total ya refleja descuentos, este flujo funciona correctamente sin cambios. |
| `src/modules/treasury/features/payment-orders/actions.server.ts` — `confirmAndPayPaymentOrder` | Compara `paidSum >= total` para marcar PAID. Funciona sin cambios si total ya descuenta. |
| `src/modules/treasury/features/pending-balances/actions.server.ts` | Lee `total` y calcula `pending_amount`. Sin cambios necesarios. |
| `src/modules/purchasing/features/invoices/list/actions.server.ts` — `confirmPurchaseInvoice` | Compara `invoicedTotal >= orderTotal` para determinar `FULLY_INVOICED`. El total con descuento sera menor, lo que es correcto: la OC no deberia marcarse como fully invoiced si la factura tiene descuento y no cubre el monto. |
| `src/modules/purchasing/features/invoices/list/actions.server.ts` — `getInvoiceLinesForReceiving` | Lee cantidades para recepcion, no montos. Sin impacto. |

### 1.4 Dependencias

| Tipo | Detalle |
|------|---------|
| **DB** | Nueva migracion Supabase (ADD column, no destructiva) |
| **Prisma** | Regenerar tipos despues de migracion (`npm run gentypes` + `npx prisma generate`) |
| **Zod** | Actualizar schemas de validacion |
| **React Hook Form** | Ya en uso, se agregan campos al `useFieldArray` existente |
| **UI** | No se necesitan nuevos componentes de Shadcn. Se usa Select para tipo de descuento e Input para valor. |

### 1.5 Restricciones y reglas

- **Migraciones solo ADD**: nunca DROP columns ni perder datos (regla del proyecto).
- **No cross-module imports**: los cambios en treasury no son necesarios porque usan `invoice.total` que ya reflejara el descuento.
- **Server actions en modules**: toda la logica de calculo va en `actions.server.ts` del feature invoices.
- **`database.types.ts` auto-generado**: regenerar con `npm run gentypes` despues de la migracion.
- **Calculo del IVA**: el IVA se calcula sobre el neto despues de descuento (normativa fiscal argentina). `iva = (subtotal - descuento) * tasa_iva / 100`.

### 1.6 Riesgos identificados

| Riesgo | Mitigacion |
|--------|-----------|
| **Descuento mal aplicado al IVA**: si el descuento se aplica despues del IVA en vez de antes, los montos seran incorrectos fiscalmente | El calculo debe ser: neto = qty * unit_cost - descuento; iva = neto * tasa; total_linea = neto + iva |
| **Descuento global vs. por linea**: si se permite ambos simultaneamente, hay que definir el orden de aplicacion | Propuesta: descuento por linea se aplica primero, descuento global se aplica sobre el subtotal neto resultante. Alternativamente, solo soportar descuento por linea (mas simple y comun en facturas argentinas) |
| **Retrocompatibilidad**: facturas existentes no tienen descuento | Los nuevos campos tendran DEFAULT 0 / NULL, asi facturas existentes no se ven afectadas |
| **Precision decimal**: redondeos pueden generar diferencias de centavos | Usar la misma estrategia actual: redondeo a 3 decimales en lineas, 2 en cabecera |
| **Cierre de OC con descuento**: si la factura tiene descuento, su total sera menor que el total de la OC, y la OC podria no marcarse como FULLY_INVOICED | Esto es correcto fiscalmente: si el proveedor desconto, el monto facturado es menor. La logica actual ya contempla PARTIALLY_INVOICED. Documentar este comportamiento |
| **Notas de credito**: actualmente existen como `voucher_type`. Un descuento NO es lo mismo que una nota de credito. No mezclar conceptos | Los descuentos van dentro de la factura misma. Las NC son documentos separados que ya se soportan |
| **Orden de pago / PDF**: el PDF de OP muestra el total de la factura. Si el total ya incluye descuento, el PDF mostrara el valor correcto sin cambios | Verificar que no haya logica que recalcule el total de la factura en la OP |

### 1.7 Decision de diseno pendiente

Antes de planificar, definir cual modelo de descuento se implementa:

**Opcion A — Solo descuento por linea (recomendada):**
- Cada linea puede tener un descuento (% o monto fijo).
- Es lo mas comun en facturas de proveedores argentinos.
- Mas simple de implementar y auditar.
- El campo `discount_amount` en la cabecera es la suma de los descuentos de cada linea (informativo).

**Opcion B — Descuento global + por linea:**
- Se permite un descuento global que se prorratea entre las lineas.
- Mas complejo, genera problemas de redondeo al prorratear.
- Util para descuentos comerciales generales.

**Opcion C — Descuento global solamente:**
- Un unico descuento sobre el subtotal total.
- Simple pero limitado.

---

## 2. Planificacion

**Decision:** Opcion B — Descuento global + por linea.
**Orden:** Descuento por linea primero, descuento global sobre el subtotal neto resultante, IVA sobre neto final.

### 2.1 Fases de implementacion

#### Fase 1: Modelo de datos (migracion + Prisma)
- **Objetivo:** Agregar los campos de descuento en la DB y en Prisma para lineas y cabecera.
- **Tareas:**
  - [x] Crear enum `discount_type` en Supabase con valores `PERCENTAGE` y `FIXED` (en la migracion SQL, tipo `text CHECK` o enum nativo; en Prisma como `enum discount_type`)
  - [x] Agregar a `purchase_invoice_lines`: `discount_type` (discount_type, nullable, default null), `discount_value` (Decimal(12,3), nullable, default null), `discount_amount` (Decimal(12,3), not null, default 0)
  - [x] Agregar a `purchase_invoices`: `global_discount_type` (discount_type, nullable, default null), `global_discount_value` (Decimal(12,2), nullable, default null), `discount_amount` (Decimal(12,2), not null, default 0)
  - [x] Crear la migracion SQL: `npm run create-migration -- add_discount_fields_purchase_invoices`
  - [x] Actualizar `prisma/schema.prisma` con los nuevos campos y el enum
  - [x] Ejecutar `npx prisma generate` para regenerar el client
  - [ ] Ejecutar `npm run gentypes` para regenerar tipos de Supabase
- **Archivos:**
  - `supabase/migrations/XXXXXXX_add_discount_fields_purchase_invoices.sql` (nuevo)
  - `prisma/schema.prisma` — modelos `purchase_invoices`, `purchase_invoice_lines`, enum `discount_type`
  - `src/database.types.ts` (auto-generado)
- **Criterio de completitud:** `npx prisma generate` sin errores, los campos existen en la DB local, facturas existentes no se ven afectadas (discount_amount = 0, discount_type = null).

---

#### Fase 2: Validacion Zod
- **Objetivo:** Actualizar los schemas de validacion para aceptar los campos de descuento en lineas y cabecera.
- **Tareas:**
  - [ ] En `purchaseInvoiceLineSchema`: agregar `discount_type` como `z.enum(['PERCENTAGE', 'FIXED']).nullable().optional()`, `discount_value` como `z.coerce.number().min(0).nullable().optional()`, `discount_amount` como `z.coerce.number().min(0).optional().default(0)`
  - [ ] En `purchaseInvoiceSchema`: agregar `global_discount_type` como `z.enum(['PERCENTAGE', 'FIXED']).nullable().optional()`, `global_discount_value` como `z.coerce.number().min(0).nullable().optional()`
  - [ ] Agregar validacion custom con `.refine()` en la linea: si `discount_type` es `PERCENTAGE`, `discount_value` debe estar entre 0 y 100; si `discount_type` es `FIXED`, `discount_value` no debe superar `quantity * unit_cost`
  - [ ] Agregar validacion custom en cabecera: si `global_discount_type` es `PERCENTAGE`, `global_discount_value` debe estar entre 0 y 100
- **Archivos:**
  - `src/modules/purchasing/shared/validators.ts`
- **Criterio de completitud:** Los schemas validan correctamente con y sin descuentos. Facturas sin descuento siguen pasando validacion sin cambios.

---

#### Fase 3: Server action — calculo de descuentos
- **Objetivo:** Actualizar `createPurchaseInvoice` para calcular montos con descuentos por linea y descuento global.
- **Tareas:**
  - [ ] Actualizar el tipo del parametro `data.lines[]` para incluir `discount_type`, `discount_value`
  - [ ] Agregar `global_discount_type` y `global_discount_value` al tipo del parametro `data`
  - [ ] En el mapeo de lineas, calcular el descuento por linea:
    ```
    subtotal_bruto = quantity * unit_cost
    discount_amount = discount_type == 'PERCENTAGE'
      ? subtotal_bruto * discount_value / 100
      : (discount_type == 'FIXED' ? discount_value : 0)
    subtotal = subtotal_bruto - discount_amount  // neto
    vat_amount = subtotal * (vat_rate / 100)
    total = subtotal + vat_amount
    ```
  - [ ] Persistir `discount_type`, `discount_value`, `discount_amount` en cada linea al crear
  - [ ] Calcular totales de cabecera con descuento global:
    ```
    subtotal_after_line_discounts = SUM(line.subtotal)  // ya con descuentos por linea
    global_discount_amount = global_discount_type == 'PERCENTAGE'
      ? subtotal_after_line_discounts * global_discount_value / 100
      : (global_discount_type == 'FIXED' ? global_discount_value : 0)
    ```
  - [ ] Recalcular IVA por linea con prorrateo del descuento global: para cada linea, calcular su proporcion del subtotal neto (`line.subtotal / subtotal_after_line_discounts`), aplicar esa proporcion al descuento global, y recalcular `vat_amount = (line.subtotal - line_global_share) * (vat_rate / 100)`. Sumar todos los IVA recalculados para la cabecera.
  - [ ] Persistir en cabecera: `global_discount_type`, `global_discount_value`, `discount_amount` (line_discounts + global_discount_amount), `subtotal` (subtotal_after_line_discounts - global_discount_amount), `vat_amount` (IVA recalculado), `total` (subtotal + vat_amount + other_taxes)
  - [ ] Redondeos: lineas a 3 decimales, cabecera a 2 decimales (misma estrategia actual)
- **Archivos:**
  - `src/modules/purchasing/features/invoices/list/actions.server.ts` — funcion `createPurchaseInvoice`
- **Criterio de completitud:** Crear una factura sin descuento produce exactamente los mismos montos que antes. Crear una factura con descuento por linea y/o global produce los montos correctos segun la formula definida.

---

#### Fase 4: Formulario — UI de descuentos
- **Objetivo:** Agregar los campos de descuento por linea y descuento global en el formulario de creacion.
- **Tareas:**
  - [x] Actualizar el tipo `LineField` para incluir `discount_type`, `discount_value`
  - [x] Actualizar `defaultValues` de cada linea nueva (append y default): `discount_type: null`, `discount_value: null`
  - [x] En la tabla de lineas, agregar 2 columnas entre "IVA%" y "Subtotal":
    - "Dto." — Select inline con opciones: vacio (sin descuento), "%" (PERCENTAGE), "$" (FIXED). Ancho: `w-[70px]`
    - "Valor dto." — Input numerico, visible solo si discount_type no es null. Ancho: `w-[90px]`
  - [x] Renombrar la columna "Subtotal" existente a "Neto" para reflejar que ya tiene descuento aplicado
  - [x] Actualizar el calculo de `lineSubtotal` en el render de cada fila: aplicar descuento segun tipo
  - [x] Agregar seccion de descuento global debajo de la tabla de lineas / arriba de los totales:
    - Fila con: label "Descuento global", Select (%, $), Input valor. Mostrar monto calculado a la derecha.
    - Registrar con `form.register` directo (no useFieldArray, es un solo grupo de campos)
  - [x] Actualizar el `useMemo` de `totals` para incorporar descuentos por linea y descuento global con prorrateo de IVA
  - [x] Mostrar en la seccion de totales: "Subtotal bruto", "Descuentos" (si > 0), "Subtotal neto", "IVA", "Percepciones", "Total"
  - [x] Actualizar `onSubmit` para enviar los campos de descuento de cada linea y los campos de descuento global al server action
  - [x] Cuando se cargan lineas desde OC (handleOrdersChange), las lineas importadas deben venir sin descuento (discount_type: null, discount_value: null)
- **Archivos:**
  - `src/modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm.tsx`
- **Criterio de completitud:** El formulario muestra los campos de descuento, calcula correctamente en tiempo real, y envia los datos al server action. Sin descuentos se comporta exactamente igual que antes.

---

#### Fase 5: Vista de detalle — mostrar descuentos
- **Objetivo:** Mostrar los descuentos en la pagina de detalle de la factura.
- **Tareas:**
  - [ ] En la tabla de lineas, agregar columna "Descuento" entre "IVA" y "Subtotal". Mostrar el descuento formateado: "10%" o "$500.00" o "-" si no tiene.
  - [ ] Renombrar "Subtotal" a "Neto" en la tabla de lineas (consistente con el form)
  - [ ] En la seccion de totales (debajo de la tabla), agregar fila "Descuentos" si `invoice.discount_amount > 0`, mostrando el monto total de descuentos con signo negativo: `-$X.XX`
  - [ ] Si hay descuento global, mostrar una fila informativa: "Descuento global: X% sobre neto" o "Descuento global: $X.XX"
  - [ ] Acceder a los nuevos campos: `line.discount_type`, `line.discount_value`, `line.discount_amount`, `invoice.global_discount_type`, `invoice.global_discount_value`, `invoice.discount_amount`
- **Archivos:**
  - `src/app/dashboard/purchasing/invoices/[id]/page.tsx`
- **Criterio de completitud:** Facturas sin descuento se ven exactamente igual que antes. Facturas con descuento muestran la informacion de descuentos de forma clara.

---

#### Fase 6: Verificacion integral
- **Objetivo:** Validar que todo funciona end-to-end y no hay regresiones.
- **Tareas:**
  - [ ] `npm run check-types` pasa sin errores
  - [ ] `npm run build` pasa sin errores
  - [ ] Probar crear factura SIN descuento: mismos montos que antes
  - [ ] Probar crear factura CON descuento por linea (porcentaje): verificar calculo
  - [ ] Probar crear factura CON descuento por linea (monto fijo): verificar calculo
  - [ ] Probar crear factura CON descuento global (porcentaje): verificar calculo
  - [ ] Probar crear factura CON ambos descuentos (linea + global): verificar que el orden es correcto (linea primero, global despues)
  - [ ] Verificar vista de detalle muestra descuentos correctamente
  - [ ] Verificar que facturas existentes (sin descuento) siguen mostrandose bien
  - [ ] Verificar que el flujo de ordenes de pago (treasury) sigue funcionando con facturas descontadas
- **Archivos:** Ningun archivo nuevo, solo ejecucion de pruebas.
- **Criterio de completitud:** Todas las pruebas manuales pasan. Build y types ok.

### 2.2 Orden de ejecucion

```
Fase 1 (DB)
  └─► Fase 2 (Zod) ─── no depende de Fase 1 directamente, pero
  └─► Fase 3 (Server)   necesita los tipos generados de Fase 1
        └─► Fase 4 (Form) ── necesita que el server action acepte los campos
        └─► Fase 5 (Detalle) ── necesita que los datos esten en DB
              └─► Fase 6 (Verificacion)
```

- **Fase 1 y 2** pueden hacerse en paralelo (schema Prisma + Zod son independientes), pero conviene hacer Fase 1 primero para que `prisma generate` genere los tipos que despues se usan en Fase 3.
- **Fase 3** depende de Fase 1 (campos en DB) y Fase 2 (validacion).
- **Fase 4** depende de Fase 2 (schema Zod) y Fase 3 (server action acepta los datos).
- **Fase 5** depende de Fase 1 (campos en DB, datos guardados).
- **Fase 6** depende de todas las anteriores.

### 2.3 Estimacion de complejidad

| Fase | Complejidad | Justificacion |
|------|-------------|---------------|
| Fase 1: Modelo de datos | Baja | Migracion ADD de 6 campos + 1 enum. Sin riesgo de datos. |
| Fase 2: Validacion Zod | Baja | 6 campos nuevos en schemas existentes + refine simple. |
| Fase 3: Server action | Media | El calculo de prorrateo del descuento global sobre el IVA es la parte mas delicada. Requiere atencion a redondeos. |
| Fase 4: Formulario | Media-Alta | Es el archivo mas grande a modificar. Agregar columnas a la tabla de lineas, seccion de descuento global, recalculo del useMemo con prorrateo. UX debe ser clara y no romper el flujo actual. |
| Fase 5: Vista de detalle | Baja | Solo display de datos que ya estan en DB. |
| Fase 6: Verificacion | Baja | Pruebas manuales, build, types. |

**Estimacion total:** ~3-4 horas de implementacion.

## 3. Diseno
_Pendiente - ejecutar `/disenar cod-descuentos-facturas`_

## 4. Implementacion

### Fase 1: Modelo de datos (completada 2026-05-13)

**Migracion SQL:** `supabase/migrations/20260513122737_add_discount_fields_purchase_invoices.sql`
- Creado enum `discount_type` con valores `PERCENTAGE` y `FIXED`
- Agregados campos en `purchase_invoice_lines`: `discount_type`, `discount_value`, `discount_amount` (default 0)
- Agregados campos en `purchase_invoices`: `global_discount_type`, `global_discount_value`, `discount_amount` (default 0)
- Solo ADD columns, retrocompatible con facturas existentes (discount_amount = 0, tipos null)

**Prisma schema:** `prisma/schema.prisma`
- Agregado enum `discount_type { PERCENTAGE FIXED }`
- Campos de descuento en ambos modelos con los tipos y defaults correspondientes

**Prisma client:** regenerado con `npx prisma generate` sin errores.

**Pendiente:** `npm run gentypes` requiere que la migracion este aplicada en la DB remota o local.

### Fase 4: Formulario UI (completada 2026-05-13)

**Archivo:** `src/modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm.tsx`

Cambios realizados:
1. **Tipo `LineField`**: agregados `discount_type?: 'PERCENTAGE' | 'FIXED' | null` y `discount_value?: number | null`
2. **defaultValues**: todas las lineas nuevas (append, default, replace en cambio de proveedor, carga de OC) incluyen `discount_type: null, discount_value: null`
3. **Tabla de lineas**: 2 nuevas columnas entre IVA% y Neto:
   - "Dto." (w-[70px]): Select inline con opciones "-", "%", "$"
   - "Valor dto." (w-[90px]): Input numerico, hidden si discount_type es null
4. **Columna "Subtotal" renombrada a "Neto"**: muestra el calculo bruto - descuento
5. **Calculo por linea**: `bruto = qty * cost`, descuento segun tipo (% o $), `lineNeto = bruto - descuento`
6. **Seccion descuento global**: debajo de la tabla, antes de totales. Select tipo + Input valor + monto calculado en rojo
7. **useMemo `totals`**: calcula subtotalBruto, lineDiscounts, globalDiscount, subtotal neto, IVA con prorrateo del descuento global, percepciones, total
8. **Seccion de totales**: muestra Subtotal bruto, Descuentos (si > 0, en rojo), Subtotal neto, IVA, Percepciones, Total
9. **onSubmit**: envia `discount_type`, `discount_value` por linea y `global_discount_type`, `global_discount_value` al server action
10. **Watchers**: `globalDiscountType` y `globalDiscountValue` via `useWatch` para reactividad en el useMemo

**Verificacion:** `npx tsc --noEmit` pasa sin errores. Sin descuentos el form se comporta identico al anterior.

## 5. Verificacion
_Pendiente - ejecutar `/verificar cod-descuentos-facturas`_
