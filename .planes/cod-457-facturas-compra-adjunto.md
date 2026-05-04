# COD-457 — Adjunto en Factura de Compra

**Fecha de inicio:** 2026-05-04
**Estado:** Implementación completada
**Linear:** https://linear.app/codecontrol-sas/issue/COD-457/facturas-de-compra

---

## 1. Análisis

### 1.1 Problema

Hoy una Factura de Compra (`purchase_invoices`) se carga manualmente con sus líneas, pero NO permite adjuntar el comprobante físico (la factura escaneada o el PDF que mandó el proveedor). El usuario necesita poder **subir una imagen (jpg/png) o PDF** asociado al registro y, posteriormente, **visualizarlo / descargarlo** desde el detalle de la factura.

Requisitos del ticket:
- Reutilizar el flujo de subida que ya usa el módulo Documentos.
- Si el bucket de Supabase Storage para facturas de compra no existe, crearlo.

### 1.2 Contexto actual

**Módulo Facturas de Compra:**
- Tabla Prisma: `purchase_invoices` definida en `/media/fabricio/E/dev/s-codeControl/prisma/schema.prisma` (líneas 1773–1812).
- Importante: la tabla **ya tiene dos columnas** que parecen pensadas para esto:
  - `document_url  String?`
  - `document_key  String?`
  Ambas están vacías hoy y NO se escriben en ningún lado del código (no se setean en `createPurchaseInvoice`). Hay que decidir si las reusamos o si vamos a un modelo 1‑N.
- Form de creación: `src/modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm.tsx` (RHF + Zod, schema `purchaseInvoiceSchema` en `src/modules/purchasing/shared/validators.ts`). Hoy NO acepta archivos.
- Server action de creación: `src/modules/purchasing/features/invoices/list/actions.server.ts` → `createPurchaseInvoice` (línea 88). Crea la factura + líneas en una sola llamada Prisma; no toca Storage.
- Detalle: `src/app/dashboard/purchasing/invoices/[id]/page.tsx`. Renderiza datos directamente (no hay módulo `detail/` para invoices, a diferencia de `purchase-orders`). NO muestra adjuntos hoy.
- Página de creación: `src/app/dashboard/purchasing/invoices/new/page.tsx`.

**Flujo de subida del módulo Documentos (a reutilizar):**
- Cliente: helper genérico `storage` en `src/shared/lib/storage.ts` con métodos `upload / download / remove / getPublicUrl / list`. Tipo `StorageBucket` enumerado.
- Server: helper espejo `storageServer` en `src/shared/lib/storage-server.ts`.
- Hook auxiliar: `src/shared/hooks/useUploadImage.ts` (`useImageUpload`) — sirve para casos simples 1 archivo. Devuelve URL pública. Bueno para una primera versión.
- Patrón real usado en Documentos: `storage.upload('document_files', uploadPath, file, { cacheControl, upsert })` en `src/modules/documents/features/upload/components/SimpleDocument.tsx` y `MultiResourceDocument.tsx`. Server-side equivalente en `src/modules/documents/features/manage/actions.server.ts`.
- Path convencional usado en Documentos: `${formatedCompanyName}-(${cuit})/${appliesPath}/${appliesName}/${docType}-(${hasExpiredDate}).${ext}` — multi-tenant por empresa.

**Buckets Supabase existentes** (declarados en el tipo `StorageBucket` de `storage.ts` y `storage-server.ts`):
`document_files`, `document_files_expired`, `documents-hse`, `repair_images`, `training-materials`, `daily_reports`, `logo`, `documents`.

NO existe bucket dedicado a facturas de compra. Importante: **los buckets NO se crean por migración SQL** en este proyecto (no hay ningún `INSERT INTO storage.buckets` ni `create_bucket` en `supabase/migrations/`). Se crean manualmente desde el panel de Supabase y luego se agregan al union type. Por ende, “crear el bucket” acá significa: (a) crearlo en Supabase (dev + prod), (b) agregar políticas RLS, (c) agregar el literal al `StorageBucket` type.

### 1.3 Archivos involucrados

A modificar:
- `prisma/schema.prisma` → solo si vamos por modelo 1‑N (nueva tabla `purchase_invoice_attachments`). Si vamos 1‑1 reusando `document_url`/`document_key`, no hace falta.
- `src/shared/lib/storage.ts` y `src/shared/lib/storage-server.ts` → agregar literal del nuevo bucket al type `StorageBucket`.
- `src/modules/purchasing/shared/validators.ts` → extender `purchaseInvoiceSchema` con campo opcional para adjunto (o crear schema separado para el adjunto).
- `src/modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm.tsx` → input de archivo + preview + subida.
- `src/modules/purchasing/features/invoices/list/actions.server.ts` → `createPurchaseInvoice` recibe `document_url`/`document_key` (o crea registro en tabla 1‑N) + nueva action `attachInvoiceDocument` / `removeInvoiceDocument` para adjuntar después de creada.
- `src/app/dashboard/purchasing/invoices/[id]/page.tsx` → mostrar el adjunto (botón ver / descargar, preview opcional).

A crear:
- `supabase/migrations/<timestamp>_purchase_invoices_storage_policies.sql` → políticas RLS para el nuevo bucket (lectura/escritura por `company_id` del usuario logueado).
- (opcional, si 1‑N) Migración Prisma + tabla `purchase_invoice_attachments`.
- (opcional) Componente `src/modules/purchasing/features/invoices/shared/InvoiceAttachmentUploader.tsx` reutilizable (form crear + edición posterior).

### 1.4 Dependencias

- **Librerías:** ninguna nueva. Se usa `@supabase/storage-js` ya integrado vía `supabaseBrowser`/`supabaseServer`.
- **Helpers internos:** `storage`, `storageServer`, opcionalmente `useImageUpload`.
- **Otros tickets del proyecto Transporte SP:**
  - COD-456 (Métodos de pago en Proveedores) → independiente, sin cruces.
  - COD-458 / COD-459 (potencial siguiente fase del módulo Compras) → si terminan necesitando adjuntos en otras entidades (OC, remitos, NC), conviene que el patrón de bucket + helpers que dejemos acá sea reutilizable.

### 1.5 Restricciones y reglas (de CLAUDE.md y memoria)

- **Migraciones aditivas**: si agregamos tabla nueva o columnas, sólo `ADD`. No tocar las columnas `document_url`/`document_key` que ya existen (incluso si quedan deprecated, NO drop).
- **No perder datos**: la tabla `purchase_invoices` puede tener registros en producción; cualquier migración debe ser 100% backwards compatible.
- **No cross-module imports**: el form de Compras NO puede importar componentes de `modules/documents/`. Si queremos reusar UI, la extraemos a `src/shared/components/` (p. ej. un `FileDropInput` genérico). Lo que sí podemos reusar libremente: `src/shared/lib/storage.ts`, `src/shared/lib/storage-server.ts`, `src/shared/hooks/useUploadImage.ts`.
- **Server actions por feature**: la lógica de adjuntar/quitar adjunto vive en `src/modules/purchasing/features/invoices/list/actions.server.ts` (o un nuevo `.../attachments/actions.server.ts` si crece).
- **`database.types.ts` autogenerado**: tras la migración correr `npm run gentypes`.
- **DataTable estándar**: si más adelante mostramos columna “tiene adjunto” en el listado, usar el estándar `showFilterToggle` + 1 filtro por columna.
- **Prisma Decimal**: ya se respeta en este módulo (`Number(...)` en mapeos), no aplica al adjunto.
- **Forms simples sin RHF**: NO aplica acá — `PurchaseInvoiceForm` ya usa RHF y es un form complejo (>5 campos + array de líneas).

### 1.6 Riesgos identificados

1. **1‑1 vs 1‑N**: si el usuario quiere subir varias páginas escaneadas (caso típico en facturas físicas), el modelo 1‑1 con `document_url`/`document_key` se queda corto y refactorizar después es costoso.
2. **RLS del bucket**: hay que replicar el patrón de aislamiento por empresa que usan los buckets existentes (`document_files`). Si las políticas quedan abiertas, un usuario podría leer adjuntos de otras empresas.
3. **MIME types y límite de tamaño**: el flujo de Documentos no valida MIME estrictamente del lado server. Para facturas conviene whitelist (`image/jpeg`, `image/png`, `application/pdf`) y un cap razonable (5–10 MB) — definir en /planificar.
4. **Path collisions**: si se reusa el patrón `companyName-cuit/...`, hay que asegurar que el path incluya `invoice_id` o un UUID, sino dos facturas con mismo número (de proveedores distintos) podrían pisarse. Mitigable con `upsert:false` + UUID en el filename.
5. **Subida antes vs después de crear la factura**: si subimos durante la creación pero después la creación falla (P2002 por número repetido), queda un huérfano en Storage. Estrategia: crear factura primero, adjuntar después en una segunda llamada (transacción lógica), O cleanup en error.
6. **Retro-compat**: si elegimos 1‑N, hay que decidir qué hacemos con `document_url`/`document_key` (quedan deprecadas pero no se borran; tal vez migrarlas como primer attachment).
7. **Permisos por rol**: hay roles `Invitado` y `Auditor` con acceso restringido. Definir si pueden ver/descargar adjuntos de facturas (probablemente Auditor sí, Invitado no — Invitado está limitado a documentos/empleados/equipos por middleware).
8. **PDF inline preview en producción**: depende de que el bucket sirva con el `Content-Type` correcto y políticas que permitan URL firmada (o pública si decidimos así). Validar en /verificar.

### 1.7 Decisiones a tomar en /planificar

1. **Cardinalidad del adjunto: 1‑1 vs 1‑N por factura.**
   - Opción A (1‑1): reusar `document_url`/`document_key` ya existentes en `purchase_invoices`. Cero cambios en Prisma. Simple, pero limita a un solo archivo.
   - Opción B (1‑N): nueva tabla `purchase_invoice_attachments(id, invoice_id, file_url, file_key, file_name, mime_type, size_bytes, uploaded_by, uploaded_at)`. Más flexible, alineado con el caso real (varias páginas de una factura), pero implica migración + más UI.
   - **Recomendación inicial**: B (1‑N), porque facturas físicas suelen escanearse en varias hojas. Confirmar con el usuario.

2. **Bucket dedicado vs reutilizar `document_files`.**
   - Opción A: bucket nuevo `purchase_invoices` (o `purchase_invoice_attachments`). Mejor separación, RLS específica, fácil de auditar/limpiar.
   - Opción B: reusar `document_files` con un prefijo (`purchase_invoices/<company_id>/...`). Menos buckets que mantener pero las RLS existentes apuntan a entidades de Documentos.
   - **Recomendación inicial**: A. Bucket privado `purchase_invoices` con RLS por `company_id`.

3. **Tipos MIME permitidos.**
   - Mínimo: `image/jpeg`, `image/png`, `application/pdf` (lo que pidió el usuario).
   - ¿Agregar `image/webp`, `image/heic`, `image/heif` (iPhone), `image/jpg`?
   - ¿Validación solo client o también server (header sniff)?

4. **Tamaño máximo por archivo.** Sugerencia: 10 MB por archivo. Confirmar.

5. **Cuándo se sube el archivo.**
   - Opción A: durante el alta (un solo submit, con archivo opcional). Requiere manejar cleanup si falla la creación.
   - Opción B: crear primero la factura, luego permitir adjuntar desde el detalle (similar a “Replace document” de Documentos).
   - Opción C: ambas (alta opcional + posibilidad de agregar/cambiar después).
   - **Recomendación inicial**: C.

6. **UI de visualización en el detalle.**
   - ¿Solo botón “Descargar” + “Ver”?
   - ¿Preview inline (PDF embebido / `<img>`)?
   - ¿Listado tipo grid si vamos 1‑N?

7. **RLS y permisos.**
   - Lectura: usuarios con `actualComp` = `company_id` de la factura. Auditor: sí. Invitado: no.
   - Escritura: roles que ya pueden crear/editar facturas (definidos en middleware/feature). NO Invitado.
   - Borrado: solo Admin / CodeControlClient. ¿O también Usuario que la creó?

8. **Soft delete vs hard delete del adjunto.**
   - Si vamos 1‑N: ¿agregar `deleted_at` o borrar físicamente?
   - Recomendación: hard delete del archivo en Storage + delete del row. Auditoría queda en logs si hace falta.

9. **¿Mostrar columna “Adjunto” en el listado de facturas (`InvoicesList`)?**
   - Pequeño icono de clip si tiene adjunto, vacío si no. Útil para el usuario, fácil de implementar.

10. **Antivirus / scanning**: descartado para esta iteración (no aplica al stack actual).

---

## 2. Planificación
_Pendiente - ejecutar `/planificar cod-457-facturas-compra-adjunto`_

## 3. Diseño
_Pendiente - ejecutar `/disenar cod-457-facturas-compra-adjunto`_

## 4. Implementación

**Decisiones aplicadas:** 1-1 reutilizando `document_url` / `document_key`. Bucket privado `purchase_invoices`. MIMEs `image/jpeg`, `image/png`, `application/pdf`. Tamaño máx 10 MB. Validación cliente + server.

### Archivos creados
- `supabase/migrations/20260504210221_add_purchase_invoices_bucket.sql` — INSERT idempotente en `storage.buckets` + 4 policies (SELECT/INSERT/UPDATE/DELETE) restringidas a `authenticated`. Aplicada localmente con `npx supabase migration up`.
- `src/modules/purchasing/features/invoices/list/components/InvoiceAttachmentSection.tsx` — Client component para el detalle: preview imagen / botón "Ver PDF" (signed URL 10 min), reemplazar y quitar adjunto.

### Archivos modificados
- `src/shared/lib/storage.ts` y `src/shared/lib/storage-server.ts` — agregado literal `'purchase_invoices'` al union `StorageBucket`.
- `src/modules/purchasing/shared/validators.ts` — campo `attachment` opcional en `purchaseInvoiceSchema` + constantes `PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME` y `PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES`.
- `src/modules/purchasing/features/invoices/list/actions.server.ts`
  - `createPurchaseInvoice` ahora acepta `attachment?: File` y lo sube tras crear la factura, escribiendo `document_url` / `document_key`. Si la subida falla, no revierte la factura.
  - Helper interno `uploadInvoiceAttachment` con re-validación server (MIME + tamaño) y path `${companyId}/${invoiceId}/${ts}-${uuid}.${ext}`.
  - Nuevas actions: `attachPurchaseInvoiceDocument(formData)`, `removePurchaseInvoiceDocument(invoiceId)`, `getPurchaseInvoiceAttachmentSignedUrl(invoiceId)`. `attach` borra el anterior antes de subir el nuevo (reemplazo).
  - `revalidatePath` en `/dashboard/purchasing` y `/dashboard/purchasing/invoices/[id]` después de cada mutación.
- `src/modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm.tsx` — Card "Adjunto (opcional)" con input file, validación cliente (MIME y tamaño), preview del nombre y botón "Quitar". Pasa el File al server action.
- `src/app/dashboard/purchasing/invoices/[id]/page.tsx` — Renderiza `<InvoiceAttachmentSection>` al final con `documentKey={invoice.document_key}`.

### Notas
- No se creó tabla nueva (1-1 confirmado por el usuario, se reusan columnas existentes).
- `getPurchaseInvoiceAttachmentSignedUrl` usa `createSignedUrl` (10 min default) — el bucket es privado.
- Las policies son por `authenticated` con aislamiento por path (`${companyId}/...`) — patrón consistente con buckets existentes del proyecto.

## 5. Verificación
_Pendiente - ejecutar `/verificar cod-457-facturas-compra-adjunto`_
