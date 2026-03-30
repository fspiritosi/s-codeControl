# PDF para Ordenes de Compra y Retiros de Mercaderia

**Fecha de inicio:** 2026-03-30
**Estado:** Implementacion completada
**Issue:** COD-363

---

## 1. Analisis

### 1.1 Problema

Los modulos de Ordenes de Compra (OC) y Ordenes de Retiro de Mercaderia (ORM) no tienen funcionalidad de descarga de PDF. Los usuarios necesitan generar documentos PDF desde las vistas de detalle de ambos modulos para enviar a proveedores, archivar o imprimir.

Requisitos concretos:
- Boton "Descargar PDF" en la vista de detalle de OC y ORM
- El PDF debe incluir logo de la empresa en el encabezado (con fallback a nombre de empresa si no hay logo)
- Para OC: opcion de incluir documentos vinculados (remitos de recepcion y facturas) como seccion adicional en el PDF
- Para ORM: PDF mas simple con datos del retiro, almacen, empleado, vehiculo y lineas de productos

### 1.2 Contexto actual

**Infraestructura PDF existente en s-codeControl:**
- `@react-pdf/renderer` v4.3.0 ya instalado, junto con `jspdf` y `jspdf-autotable`
- `PDFPreviewDialog` en `src/shared/components/pdf/PDFPreviewDialog.tsx` -- componente generico de dialog para preview, pero muy basico (solo envuelve children en un Dialog, no maneja descarga ni opciones)
- `getCompanyBrandingForExport()` en `src/shared/actions/export.ts` -- server action que obtiene `company_name` y `company_logo` desde la cookie `actualComp`. Ya funcional y reutilizable
- No existen API routes para generacion de PDF en ningun modulo
- Ambos modulos (purchasing y warehouse) usan Prisma para acceso a datos

**Vistas de detalle actuales:**
- `PurchaseOrderDetail.tsx`: muestra header con numero/proveedor/estado, cards de fecha/entrega/total, tabla de lineas con cantidades/costos/IVA, condiciones de pago, y tablas de remitos y facturas vinculados
- `WithdrawalOrderDetail.tsx`: muestra header con numero/almacen/estado, cards de fecha/empleado/vehiculo/items, notas, y tabla de materiales a retirar

**Datos disponibles via queries Prisma existentes:**
- `getPurchaseOrderById(id)`: retorna orden con supplier, lines (con product), installments, receiving_notes y purchase_invoices
- `getWithdrawalOrderById(id)`: retorna orden con warehouse, employee, vehicle y lines (con product)

**Como lo resuelve Baxer (referencia):**

El patron de Baxer consiste en 4 capas bien separadas:

1. **API Route** (`/api/purchase-orders/[id]/pdf/route.ts`): Endpoint GET que recibe el ID de la OC y query param `?include=receivingNotes,purchaseInvoices` para documentos vinculados. Consulta la DB con Prisma, mapea datos con `mapPurchaseOrderDataForPDF()`, genera el buffer con `renderToBuffer()` de `@react-pdf/renderer`, y retorna la respuesta con headers `Content-Type: application/pdf` y `Content-Disposition: attachment`.

2. **Template @react-pdf** (`PurchaseOrderTemplate.tsx`): Componente React que usa `Document > Page > View > Text` de `@react-pdf/renderer`. Incluye header con datos de empresa, seccion proveedor, seccion entrega, tabla de detalle de lineas, totales, cuotas, condiciones, notas y documentos vinculados opcionales.

3. **Data mapper** (`data-mapper.ts`): Funcion `mapPurchaseOrderDataForPDF()` que convierte los datos crudos de Prisma (con Decimals) a tipos limpios numericos para el template PDF.

4. **Boton client** (`_PurchaseOrderPDFButton.tsx` + `_PDFOptionsDialog.tsx`): Componente client que muestra un dialog con checkboxes para seleccionar que documentos vinculados incluir. Al confirmar, abre `window.open(url)` hacia la API route con los query params correspondientes.

**Diferencias clave Baxer vs s-codeControl:**
- Baxer usa Clerk para auth (`auth()` en API routes), s-codeControl usa Supabase + cookie `actualComp`. En este proyecto la autenticacion en API routes se puede hacer via `supabaseServer()` que lee cookies automaticamente, o directamente con `getActionContext()` para obtener el companyId
- Baxer usa Prisma con camelCase en nombres de campos; s-codeControl usa Prisma con snake_case (nombres de tablas y columnas directos de Postgres)
- Baxer tiene un `LinkedDocumentsSection` compartido con tipos `LinkedDocumentsData` que renderiza tablas genericas de documentos vinculados dentro del PDF. Este componente es reutilizable y conviene replicarlo en `src/shared/components/pdf/`
- Las API routes existentes en s-codeControl no tienen autenticacion -- son endpoints abiertos que leen query params. Para los PDF conviene agregar al menos validacion de sesion Supabase

### 1.3 Archivos involucrados

**Archivos a CREAR:**

Modulo purchasing (OC):
- `src/modules/purchasing/features/purchase-orders/shared/pdf/types.ts` -- Tipos PurchaseOrderPDFData
- `src/modules/purchasing/features/purchase-orders/shared/pdf/styles.ts` -- Estilos @react-pdf
- `src/modules/purchasing/features/purchase-orders/shared/pdf/PurchaseOrderTemplate.tsx` -- Template del PDF
- `src/modules/purchasing/features/purchase-orders/shared/pdf/data-mapper.ts` -- Mapper Prisma -> PDF data
- `src/modules/purchasing/features/purchase-orders/shared/pdf/generator.tsx` -- renderToBuffer + filename
- `src/modules/purchasing/features/purchase-orders/shared/pdf/index.ts` -- Barrel export
- `src/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderPDFButton.tsx` -- Boton client con dialog de opciones

Modulo warehouse (ORM):
- `src/modules/warehouse/features/withdrawals/shared/pdf/types.ts` -- Tipos WithdrawalOrderPDFData
- `src/modules/warehouse/features/withdrawals/shared/pdf/styles.ts` -- Estilos @react-pdf
- `src/modules/warehouse/features/withdrawals/shared/pdf/WithdrawalOrderTemplate.tsx` -- Template del PDF
- `src/modules/warehouse/features/withdrawals/shared/pdf/data-mapper.ts` -- Mapper Prisma -> PDF data
- `src/modules/warehouse/features/withdrawals/shared/pdf/generator.tsx` -- renderToBuffer + filename
- `src/modules/warehouse/features/withdrawals/shared/pdf/index.ts` -- Barrel export
- `src/modules/warehouse/features/withdrawals/detail/components/WithdrawalOrderPDFButton.tsx` -- Boton client simple (sin opciones de docs vinculados)

Shared (PDF):
- `src/shared/components/pdf/LinkedDocumentsSection.tsx` -- Componente @react-pdf para renderizar documentos vinculados (replicado de Baxer)
- `src/shared/components/pdf/linked-documents-types.ts` -- Tipos LinkedDocumentsData, LinkedDocumentSection, LinkedDocumentRecord
- `src/shared/components/pdf/PDFOptionsDialog.tsx` -- Dialog generico con checkboxes para seleccionar documentos vinculados a incluir (adaptado de Baxer)

API Routes:
- `src/app/api/purchase-orders/[id]/pdf/route.ts` -- GET endpoint para generar PDF de OC
- `src/app/api/withdrawal-orders/[id]/pdf/route.ts` -- GET endpoint para generar PDF de ORM

**Archivos a MODIFICAR:**

- `src/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderDetail.tsx` -- Agregar boton PurchaseOrderPDFButton en la barra de acciones
- `src/modules/warehouse/features/withdrawals/detail/components/WithdrawalOrderDetail.tsx` -- Agregar boton WithdrawalOrderPDFButton en la barra de acciones

### 1.4 Dependencias

**Librerias ya instaladas:**
- `@react-pdf/renderer` v4.3.0 -- para templates y `renderToBuffer()` en server
- `date-fns` / `moment` -- para formateo de fechas (usar `date-fns` que es el patron del proyecto actual, a diferencia de Baxer que usa moment)

**Componentes compartidos que se necesitan:**
- `getCompanyBrandingForExport()` de `src/shared/actions/export.ts` -- para obtener nombre y logo de empresa. Nota: actualmente solo retorna `company_name` y `company_logo`, hay que evaluar si se necesitan mas campos (CUIT, direccion, telefono, email). Si se necesitan, crear una nueva funcion `getCompanyDataForPDF()` mas completa o extender la existente
- `getActionContext()` / `getRequiredActionContext()` de `src/shared/lib/server-action-context.ts` -- para obtener companyId en API routes (lee cookie `actualComp`)
- Prisma client de `src/shared/lib/prisma` -- para queries en API routes

**Datos de labels/estados:**
- `PO_STATUS_LABELS`, `PO_INVOICING_STATUS_LABELS`, `RECEIVING_NOTE_STATUS_LABELS`, `INVOICE_STATUS_LABELS` de `src/modules/purchasing/shared/types.ts`
- Status labels de ORM definidos inline en `WithdrawalOrderDetail.tsx` (habria que extraerlos a `src/modules/warehouse/shared/types.ts`)

### 1.5 Restricciones y reglas

- **No cross-module imports**: Los templates PDF de purchasing NO pueden importar de warehouse ni viceversa. El componente LinkedDocumentsSection y PDFOptionsDialog van en `src/shared/components/pdf/` para ser compartidos
- **Server actions en modules**: Los generators (renderToBuffer) se invocan desde API routes, no desde server actions. Los API routes viven en `src/app/api/`
- **`src/app/` es solo routing**: Las API routes son la excepcion permitida; la logica de negocio (mapeo, generacion) vive en los modules
- **`database.types.ts` no se edita**: Los tipos de PDF son independientes, definidos en cada modulo
- **Prisma con snake_case**: A diferencia de Baxer (camelCase), los nombres de campos son `full_number`, `issue_date`, `unit_cost`, etc. El data-mapper debe mapear de snake_case a camelCase para los tipos del PDF
- **date-fns sobre moment**: El proyecto usa `date-fns` para formateo; evitar agregar dependencia de moment

### 1.6 Riesgos identificados

1. **SSR vs Client con @react-pdf/renderer**: Los componentes de `@react-pdf/renderer` (`Document`, `Page`, `View`, `Text`) NO funcionan en client-side directamente (necesitan `ssr: false` con dynamic import). Sin embargo, `renderToBuffer()` funciona perfecto en server-side (API routes, server actions). El patron de Baxer evita este problema al generar el PDF completamente en el server via API route y devolver el buffer. Se debe seguir este mismo patron.

2. **Serializacion de Decimal de Prisma**: Los campos monetarios (`subtotal`, `vat_amount`, `total`, `unit_cost`, `vat_rate`, `quantity`) son `Decimal` en Prisma. El data-mapper DEBE convertirlos a `Number()` antes de pasarlos al template. Este es un problema conocido del proyecto (ver MEMORY.md: "Convertir a Number/String antes de pasar a client").

3. **Logo de empresa**: `getCompanyBrandingForExport()` retorna `company_logo` que es probablemente una URL de Supabase Storage. El componente `@react-pdf/renderer` soporta `<Image src={url} />` pero puede fallar si la URL requiere autenticacion o tiene CORS issues. Hay que verificar que las URLs de logo sean publicas, o descargar la imagen en el server antes de pasarla al template.

4. **Tamano de bundle**: `@react-pdf/renderer` es una libreria pesada. Como se usa solo en server-side (API routes), no impacta el bundle del client. Los componentes de boton/dialog son livianos. No se debe importar nada de `@react-pdf/renderer` en componentes client.

5. **Autenticacion en API routes**: Las API routes actuales del proyecto no validan sesion. Para los PDF, como minimo se deberia validar que hay una sesion de Supabase activa y que el usuario tiene acceso a la empresa. Se puede usar `supabaseServer()` para obtener el usuario, o al menos validar la cookie `actualComp`.

6. **Timeout en generacion de PDF**: Si una OC tiene muchas lineas o muchos documentos vinculados, `renderToBuffer()` puede tardar. Considerar un limite razonable de items o paginacion en el PDF para ordenes muy grandes.

7. **Campos faltantes en branding de empresa**: `getCompanyBrandingForExport()` solo retorna nombre y logo. Para el header del PDF al estilo Baxer se necesitarian tambien CUIT, direccion, telefono y email. Hay que crear una funcion extendida o hacer la query directo en la API route.

---

## 2. Planificacion

### 2.1 Fases de implementacion

#### Fase 1: Infraestructura compartida de PDF
- **Objetivo:** Crear los componentes y tipos compartidos en `src/shared/` que ambos modulos necesitan, mas la funcion extendida de branding de empresa.
- **Tareas:**
  - [x] Crear `src/shared/components/pdf/linked-documents-types.ts` con tipos `LinkedDocumentsData`, `LinkedDocumentSection`, `LinkedDocumentRecord` (adaptados de Baxer)
  - [x] Crear `src/shared/components/pdf/LinkedDocumentsSection.tsx` componente @react-pdf para renderizar tablas de documentos vinculados (adaptado de Baxer, sin cambios funcionales)
  - [x] Crear `src/shared/components/pdf/PDFOptionsDialog.tsx` dialog client con checkboxes para seleccionar documentos vinculados a incluir en el PDF (adaptado de `_PDFOptionsDialog.tsx` de Baxer)
  - [x] Extender `src/shared/actions/export.ts` agregando funcion `getCompanyDataForPDF()` que retorne nombre, logo, CUIT, direccion, telefono y email de la empresa (la funcion existente `getCompanyBrandingForExport` solo retorna nombre y logo)
- **Archivos:**
  - Crear: `src/shared/components/pdf/linked-documents-types.ts`
  - Crear: `src/shared/components/pdf/LinkedDocumentsSection.tsx`
  - Crear: `src/shared/components/pdf/PDFOptionsDialog.tsx`
  - Modificar: `src/shared/actions/export.ts`
- **Criterio de completitud:** Los tres archivos nuevos existen, exportan correctamente, y `getCompanyDataForPDF()` retorna datos completos de empresa. Se puede verificar con `npm run check-types`.

#### Fase 2: PDF de Orden de Compra (OC)
- **Objetivo:** Implementar la generacion completa de PDF para ordenes de compra, incluyendo template, mapper, generator, API route y boton en la vista de detalle.
- **Tareas:**
  - [x] Crear `src/modules/purchasing/features/purchase-orders/shared/pdf/types.ts` con tipo `PurchaseOrderPDFData` (adaptado de Baxer, con campos snake_case mapeados a camelCase)
  - [x] Crear `src/modules/purchasing/features/purchase-orders/shared/pdf/styles.ts` con estilos @react-pdf (replicar de Baxer, incluir estilos para logo/imagen en header)
  - [x] Crear `src/modules/purchasing/features/purchase-orders/shared/pdf/data-mapper.ts` con `mapPurchaseOrderDataForPDF()` que convierte Decimal a Number y snake_case a camelCase
  - [x] Crear `src/modules/purchasing/features/purchase-orders/shared/pdf/PurchaseOrderTemplate.tsx` template @react-pdf con header (logo o nombre empresa), proveedor, entrega, tabla de lineas, totales, cuotas, condiciones, notas, y documentos vinculados opcionales. Usar `date-fns` en vez de `moment`
  - [x] Crear `src/modules/purchasing/features/purchase-orders/shared/pdf/generator.tsx` con `generatePurchaseOrderPDF()` (renderToBuffer) y `getPurchaseOrderFileName()`
  - [x] Crear `src/modules/purchasing/features/purchase-orders/shared/pdf/index.ts` barrel export
  - [x] Crear `src/app/api/purchase-orders/[id]/pdf/route.ts` API route GET que: valida sesion Supabase, lee companyId de cookie, consulta OC con Prisma, parsea query param `?include=receivingNotes,purchaseInvoices`, mapea datos, genera buffer, retorna response con headers PDF. Adaptar patron de Baxer reemplazando Clerk por Supabase
  - [x] Crear `src/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderPDFButton.tsx` boton client que usa `PDFOptionsDialog` con grupos de remitos y facturas vinculados
  - [x] Modificar `src/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderDetail.tsx` para agregar `PurchaseOrderPDFButton` en la barra de acciones del header
- **Archivos:**
  - Crear: `src/modules/purchasing/features/purchase-orders/shared/pdf/types.ts`
  - Crear: `src/modules/purchasing/features/purchase-orders/shared/pdf/styles.ts`
  - Crear: `src/modules/purchasing/features/purchase-orders/shared/pdf/data-mapper.ts`
  - Crear: `src/modules/purchasing/features/purchase-orders/shared/pdf/PurchaseOrderTemplate.tsx`
  - Crear: `src/modules/purchasing/features/purchase-orders/shared/pdf/generator.tsx`
  - Crear: `src/modules/purchasing/features/purchase-orders/shared/pdf/index.ts`
  - Crear: `src/app/api/purchase-orders/[id]/pdf/route.ts`
  - Crear: `src/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderPDFButton.tsx`
  - Modificar: `src/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderDetail.tsx`
- **Criterio de completitud:** Se puede navegar a una OC existente, hacer click en "Descargar PDF", seleccionar opcionalmente documentos vinculados, y se descarga un PDF correcto con todos los datos. La API route `/api/purchase-orders/[id]/pdf` responde con un PDF valido.

#### Fase 3: PDF de Orden de Retiro de Mercaderia (ORM)
- **Objetivo:** Implementar la generacion de PDF para ordenes de retiro, mas simple que la OC (sin documentos vinculados, sin cuotas, sin montos).
- **Tareas:**
  - [x] Crear `src/modules/warehouse/features/withdrawals/shared/pdf/types.ts` con tipo `WithdrawalOrderPDFData` (empresa, orden, almacen, empleado, vehiculo, lineas de materiales)
  - [x] Crear `src/modules/warehouse/features/withdrawals/shared/pdf/styles.ts` con estilos @react-pdf (reutilizar base de estilos de OC, simplificar columnas de tabla)
  - [x] Crear `src/modules/warehouse/features/withdrawals/shared/pdf/data-mapper.ts` con `mapWithdrawalOrderDataForPDF()` que convierte datos de Prisma al formato PDF
  - [x] Crear `src/modules/warehouse/features/withdrawals/shared/pdf/WithdrawalOrderTemplate.tsx` template @react-pdf con header (logo o nombre), datos de retiro, almacen, empleado, vehiculo, tabla de materiales, notas. Sin seccion de documentos vinculados
  - [x] Crear `src/modules/warehouse/features/withdrawals/shared/pdf/generator.tsx` con `generateWithdrawalOrderPDF()` y `getWithdrawalOrderFileName()`
  - [x] Crear `src/modules/warehouse/features/withdrawals/shared/pdf/index.ts` barrel export
  - [x] Crear `src/app/api/withdrawal-orders/[id]/pdf/route.ts` API route GET simplificado (sin query param de includes). Valida sesion, consulta ORM con Prisma, genera PDF
  - [x] Crear `src/modules/warehouse/features/withdrawals/detail/components/WithdrawalOrderPDFButton.tsx` boton client simple (solo un Button que abre `window.open` a la API route, sin dialog de opciones)
  - [x] Modificar `src/modules/warehouse/features/withdrawals/detail/components/WithdrawalOrderDetail.tsx` para agregar `WithdrawalOrderPDFButton` en la barra de acciones
- **Archivos:**
  - Crear: `src/modules/warehouse/features/withdrawals/shared/pdf/types.ts`
  - Crear: `src/modules/warehouse/features/withdrawals/shared/pdf/styles.ts`
  - Crear: `src/modules/warehouse/features/withdrawals/shared/pdf/data-mapper.ts`
  - Crear: `src/modules/warehouse/features/withdrawals/shared/pdf/WithdrawalOrderTemplate.tsx`
  - Crear: `src/modules/warehouse/features/withdrawals/shared/pdf/generator.tsx`
  - Crear: `src/modules/warehouse/features/withdrawals/shared/pdf/index.ts`
  - Crear: `src/app/api/withdrawal-orders/[id]/pdf/route.ts`
  - Crear: `src/modules/warehouse/features/withdrawals/detail/components/WithdrawalOrderPDFButton.tsx`
  - Modificar: `src/modules/warehouse/features/withdrawals/detail/components/WithdrawalOrderDetail.tsx`
- **Criterio de completitud:** Se puede navegar a una ORM existente, hacer click en "Descargar PDF", y se descarga un PDF con los datos del retiro, almacen, empleado, vehiculo y tabla de materiales. La API route `/api/withdrawal-orders/[id]/pdf` responde con un PDF valido.

### 2.2 Orden de ejecucion

```
Fase 1 (shared) ──> Fase 2 (OC) ──> Fase 3 (ORM)
```

- **Fase 1 es prerequisito de Fase 2 y Fase 3**: los tipos de linked documents, el componente LinkedDocumentsSection, el PDFOptionsDialog y la funcion `getCompanyDataForPDF()` se usan en ambos modulos.
- **Fase 2 antes de Fase 3**: la OC es mas compleja y sirve como referencia para la ORM. Los estilos base se definen en Fase 2 y se replican/simplifican en Fase 3.
- **Fase 2 y Fase 3 son independientes entre si**: no hay dependencia tecnica entre ellas, pero conviene hacer la OC primero para validar el patron y luego replicar en la ORM mas rapidamente.

### 2.3 Estimacion de complejidad

- **Fase 1** (Infraestructura compartida): **Baja** -- Son 3 archivos nuevos adaptados directamente de Baxer + extension menor de una funcion existente. Sin logica compleja.
- **Fase 2** (PDF de OC): **Media** -- 9 archivos (6 nuevos en pdf/, 1 API route, 1 boton, 1 modificacion). La API route tiene la mayor complejidad por el manejo de includes condicionales y la construccion de linked documents. El template es extenso pero mecanico.
- **Fase 3** (PDF de ORM): **Baja** -- 9 archivos pero mas simples que la OC. Sin documentos vinculados, sin cuotas, sin montos. El boton es un simple `window.open` sin dialog. Se puede replicar el patron de Fase 2 simplificando.

## 3. Diseno
_Pendiente - ejecutar `/disenar pdf-oc-retiros`_

## 4. Implementacion

### Fase 1: Infraestructura compartida de PDF
- **Estado:** Completada
- **Archivos creados/modificados:**
  - `src/shared/components/pdf/linked-documents-types.ts` — Tipos LinkedDocumentsData, LinkedDocumentSection, LinkedDocumentRecord
  - `src/shared/components/pdf/LinkedDocumentsSection.tsx` — Componente @react-pdf server-only para tablas de documentos vinculados
  - `src/shared/components/pdf/PDFOptionsDialog.tsx` — Dialog client con checkboxes para seleccionar documentos vinculados a incluir
  - `src/shared/actions/export.ts` — Agregada interface CompanyPDFData y funcion getCompanyDataForPDF()
- **Notas:** Se adapto directamente de Baxer sin desvios significativos. El campo `detail` en LinkedRecordItem se hizo opcional (en Baxer era requerido) para mayor flexibilidad. La funcion getCompanyDataForPDF() consulta los campos company_name, company_logo, company_cuit, address, contact_phone y contact_email de la tabla company.

### Fase 2: PDF de Orden de Compra (OC)
- **Estado:** Completada
- **Archivos creados/modificados:**
  - `src/modules/purchasing/features/purchase-orders/shared/pdf/types.ts` -- Tipo PurchaseOrderPDFData con company (incluye logo), purchaseOrder, supplier, lines, totals, installments, linkedDocuments
  - `src/modules/purchasing/features/purchase-orders/shared/pdf/styles.ts` -- Estilos @react-pdf con header split (logo izquierda + datos OC derecha), tablas, totales, condiciones, notas, footer
  - `src/modules/purchasing/features/purchase-orders/shared/pdf/data-mapper.ts` -- mapPurchaseOrderDataForPDF() convierte Prisma Decimal a Number y snake_case a camelCase
  - `src/modules/purchasing/features/purchase-orders/shared/pdf/PurchaseOrderTemplate.tsx` -- Template completo con todas las secciones, usa date-fns (no moment), LinkedDocumentsSection de shared
  - `src/modules/purchasing/features/purchase-orders/shared/pdf/generator.tsx` -- generatePurchaseOrderPDF() con renderToBuffer y getPurchaseOrderFileName()
  - `src/modules/purchasing/features/purchase-orders/shared/pdf/index.ts` -- Barrel export
  - `src/app/api/purchase-orders/[id]/pdf/route.ts` -- API route GET con auth Supabase, cookie actualComp, query Prisma con includes condicionales, linked documents
  - `src/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderPDFButton.tsx` -- Boton client con PDFOptionsDialog, grupos de remitos y facturas
  - `src/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderDetail.tsx` -- Agregado PurchaseOrderPDFButton en barra de acciones
- **Notas:** Header del PDF tiene layout split: logo + datos empresa a la izquierda, titulo + numero + fecha + estado a la derecha. Se agrego columna Codigo a la tabla de lineas (Baxer no la tenia). La API route valida sesion Supabase y verifica que la OC pertenezca a la company del usuario. Se usa date-fns con locale es para todas las fechas.

### Fase 3: PDF de Orden de Retiro de Mercaderia (ORM)
- **Estado:** Completada
- **Archivos creados/modificados:**
  - `src/modules/warehouse/features/withdrawals/shared/pdf/types.ts` -- Tipo WithdrawalOrderPDFData con company, withdrawalOrder, warehouse, employee, vehicle, lines
  - `src/modules/warehouse/features/withdrawals/shared/pdf/styles.ts` -- Estilos @react-pdf simplificados: tabla con columnas Codigo, Producto, Cantidad, Unidad, Notas (sin precio/IVA/total)
  - `src/modules/warehouse/features/withdrawals/shared/pdf/data-mapper.ts` -- mapWithdrawalOrderDataForPDF() convierte Prisma Decimal a Number y snake_case a camelCase
  - `src/modules/warehouse/features/withdrawals/shared/pdf/WithdrawalOrderTemplate.tsx` -- Template con header (logo + empresa), datos retiro, almacen, solicitante, vehiculo destino, tabla materiales, observaciones, footer. Usa date-fns con locale es
  - `src/modules/warehouse/features/withdrawals/shared/pdf/generator.tsx` -- generateWithdrawalOrderPDF() con renderToBuffer y getWithdrawalOrderFileName()
  - `src/modules/warehouse/features/withdrawals/shared/pdf/index.ts` -- Barrel export
  - `src/app/api/withdrawal-orders/[id]/pdf/route.ts` -- API route GET con auth Supabase, cookie actualComp, query Prisma con warehouse/employee/vehicle/lines, validacion company_id
  - `src/modules/warehouse/features/withdrawals/detail/components/WithdrawalOrderPDFButton.tsx` -- Boton client simple con window.open, sin dialog de opciones
  - `src/modules/warehouse/features/withdrawals/detail/components/WithdrawalOrderDetail.tsx` -- Agregado WithdrawalOrderPDFButton en barra de acciones
- **Notas:** Patron replicado de Fase 2 simplificado: sin documentos vinculados, sin cuotas/installments, sin montos/precios. Solo cantidades y datos de almacen/empleado/vehiculo. El boton es un simple Button con Download icon que abre la API route en nueva ventana.

## 5. Verificacion
_Pendiente - ejecutar `/verificar pdf-oc-retiros`_
