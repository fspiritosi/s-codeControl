# COD-459 — Enviar PDF de OC al proveedor al aprobar

**Fecha:** 2026-05-04
**Issue:** COD-459
**Estado:** Implementado

## Problema

Al aprobar manualmente una Orden de Compra, no se notifica al proveedor. Se requiere enviar un email al proveedor con el PDF de la OC adjunto al momento de la aprobación. Si el proveedor no tiene email, la aprobación debe completarse igualmente y mostrar un toast informativo.

## Decisiones

1. La OC se aprueba manualmente desde los botones existentes (lista y detalle), que llaman a `approvePurchaseOrder(id)`.
2. Adjuntar el PDF de la OC ya generado por la infra de PDFs (COD-363, ver `.planes/pdf-oc-retiros.md`).
3. Plantilla de email nueva, simple (asunto + cuerpo HTML), reutilizable en `src/shared/lib/email-templates/`.
4. No bloquear aprobación si falla el envío o no hay email del proveedor — el cliente recibe `emailStatus` para mostrar toast adecuado.
5. Email del proveedor desde `suppliers.email`.

## Archivos creados

- `src/shared/lib/email-templates/purchase-order-approved.ts` — Plantilla nueva. Exporta `purchaseOrderApprovedEmail({ supplierName, orderNumber, orderDate, companyName }) => { subject, html }`.
- `src/modules/purchasing/features/purchase-orders/shared/email/sendPurchaseOrderApprovedEmail.ts` — Helper server-only. Carga la OC + supplier + company + pdf_settings, genera el PDF (`generatePurchaseOrderPDF`), arma el mail con la plantilla y envía vía `sendEmail` con el PDF como adjunto. Retorna `{ status: 'SENT' | 'NO_EMAIL' | 'FAILED', errorMessage? }`. No tira excepción.

## Archivos modificados

- `src/shared/actions/email.ts` — `EmailOptions` ahora acepta `attachments: { filename, content, contentType? }[]`. Se propagan al `transporter.sendMail`. `userEmail` pasa a opcional para que la firma sirva para mails sin "user" asociado.
- `src/modules/purchasing/features/purchase-orders/list/actions.server.ts` — `approvePurchaseOrder` ahora:
  - Usa `updateMany` para detectar si la transición ocurrió.
  - Llama (dynamic import) a `sendPurchaseOrderApprovedEmail` después de aprobar.
  - Retorna `{ error, emailStatus?, errorMessage? }`. Tipos definidos localmente (no exportados, por restricción de archivos `'use server'`).
- `src/modules/purchasing/features/purchase-orders/list/components/columns.tsx` — Reemplaza `handleAction` para Aprobar por `handleApprove` que lee `result.emailStatus` y muestra `toast.success`/`toast.warning` según el caso.
- `src/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderDetail.tsx` — Mismo cambio en el botón "Aprobar" del header de detalle.

## Estructura del retorno del action

```ts
type ApprovePurchaseOrderResult = {
  error: string | null;
  emailStatus?: 'SENT' | 'NO_EMAIL' | 'FAILED';
  errorMessage?: string;
};
```

UI:
- `SENT` -> toast success "OC aprobada y notificada al proveedor".
- `NO_EMAIL` -> toast warning "OC aprobada. El proveedor no tiene email cargado, no se envió notificación.".
- `FAILED` -> toast warning "OC aprobada. No se pudo enviar el mail (motivo: ...)".

## Notas / desvíos

- No se hicieron migraciones (no hay cambios de schema).
- El PDF se genera vía `renderToBuffer` (mismo path que la API route `/api/purchase-orders/[id]/pdf`); el helper replica la lógica de carga (supplier, lines, installments, pdf_settings) sin documentos vinculados (sólo la OC limpia para el proveedor).
- `pdf_settings` aplicado igual que en la API route para mantener consistencia visual.
- `npm run check-types`: sin errores nuevos introducidos por estos cambios (los errores existentes en módulos `hse`, `company/portal`, etc. son pre-existentes y ajenos a esta tarea).
