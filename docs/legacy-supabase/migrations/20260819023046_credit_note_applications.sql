-- TKT-586 — Notas de crédito: imputación explícita y uso en Órdenes de Pago.
--
-- Hasta ahora una NC se auto-imputaba a la factura de `original_invoice_id`, y
-- lo que excediera el saldo de esa factura quedaba como crédito inerte: no se
-- podía aplicar a otra factura ni usarse en una OP. Ver
-- .planes/tkt-586-notas-credito-imputacion.md
--
-- Todo lo de acá es aditivo: una tabla nueva, una columna nueva con default y
-- un backfill que solo INSERTA. No modifica ni borra datos existentes.

-- ============================================================
-- 1. Imputaciones de nota de crédito
-- ============================================================

-- Una fila = un tramo de crédito de una NC consumido en algún lado:
--   * contra una factura (imputación desde la cuenta corriente), o
--   * dentro de una OP (bloque de créditos que baja el neto a pagar).
-- Nunca las dos cosas: lo garantiza el CHECK de destino exclusivo.
CREATE TABLE "credit_note_applications" (
  "id"               uuid          NOT NULL DEFAULT gen_random_uuid(),
  "company_id"       uuid          NOT NULL,
  "supplier_id"      uuid          NOT NULL,
  "credit_note_id"   uuid          NOT NULL,
  "invoice_id"       uuid,
  "payment_order_id" uuid,
  -- Importe en la moneda de la NC, igual que payment_order_items.amount.
  "amount"           numeric(15,2) NOT NULL,
  "applied_at"       timestamptz   NOT NULL DEFAULT now(),
  "applied_by"       text          NOT NULL,
  "reversed_at"      timestamptz,
  "reversed_by"      text,
  "notes"            text,
  "created_at"       timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT "credit_note_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "credit_note_applications_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "credit_note_applications_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON UPDATE CASCADE,
  CONSTRAINT "credit_note_applications_credit_note_id_fkey"
    FOREIGN KEY ("credit_note_id") REFERENCES "purchase_invoices"("id") ON UPDATE CASCADE,
  CONSTRAINT "credit_note_applications_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "purchase_invoices"("id") ON UPDATE CASCADE,
  -- Al anular una OP en borrador se borran sus aplicaciones con ella; una OP
  -- confirmada nunca se borra, se anula (y ahí se revierten, no se eliminan).
  CONSTRAINT "credit_note_applications_payment_order_id_fkey"
    FOREIGN KEY ("payment_order_id") REFERENCES "payment_orders"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  -- Una imputación de cero o negativa no tiene sentido y rompería la bolsa.
  CONSTRAINT "credit_note_applications_amount_positive" CHECK ("amount" > 0),
  -- Destino exclusivo: o factura, o OP. Nunca las dos ni ninguna.
  CONSTRAINT "credit_note_applications_single_target"
    CHECK ((("invoice_id" IS NOT NULL))::int + (("payment_order_id" IS NOT NULL))::int = 1)
);

CREATE INDEX "credit_note_applications_company_supplier_idx"
  ON "credit_note_applications" ("company_id", "supplier_id");
CREATE INDEX "credit_note_applications_credit_note_idx"
  ON "credit_note_applications" ("credit_note_id");
CREATE INDEX "credit_note_applications_invoice_idx"
  ON "credit_note_applications" ("invoice_id");
CREATE INDEX "credit_note_applications_payment_order_idx"
  ON "credit_note_applications" ("payment_order_id");

-- ============================================================
-- 2. Créditos aplicados en una OP
-- ============================================================

-- net_to_pay = total_amount - retentions_total - credits_total.
ALTER TABLE "payment_orders"
  ADD COLUMN "credits_total" numeric(15,2) NOT NULL DEFAULT 0;

-- ============================================================
-- 3. Backfill de las imputaciones automáticas vigentes
-- ============================================================

-- Replica exactamente el reparto que hoy hace `allocateCreditNotes` en memoria:
-- por cada factura original, sus NC activas en orden cronológico consumen el
-- saldo disponible; la que no entra queda como crédito libre.
--
-- El saldo se calcula con el MISMO criterio que `recalcPurchaseInvoiceStatus`
-- (solo pagos de OPs en estado PAID, más el crédito a cuenta ya imputado). Usar
-- "OPs no anuladas" haría que una factura con una OP confirmada pero impaga
-- recibiera 0 de crédito y cambiara de PAID a CONFIRMED: el objetivo es que
-- ningún estado se mueva al aplicar esta migración.
--
-- Los importes se comparan en la moneda de cada comprobante, sin conversión:
-- es lo que ya hacía `getCreditNoteAmountsByInvoice`, y una NC se emite en la
-- misma moneda que la factura que corrige.
WITH paid AS (
  SELECT poi.invoice_id, SUM(poi.amount) AS amount
  FROM payment_order_items poi
  JOIN payment_orders po ON po.id = poi.payment_order_id
  WHERE po.status = 'PAID' AND poi.invoice_id IS NOT NULL
  GROUP BY poi.invoice_id
),
applied_credit AS (
  SELECT invoice_id, SUM(amount) AS amount
  FROM supplier_credit_applications
  WHERE reversed_at IS NULL
  GROUP BY invoice_id
),
originals AS (
  SELECT
    i.id,
    GREATEST(i.total - COALESCE(p.amount, 0) - COALESCE(ac.amount, 0), 0) AS applicable
  FROM purchase_invoices i
  LEFT JOIN paid p ON p.invoice_id = i.id
  LEFT JOIN applied_credit ac ON ac.invoice_id = i.id
  -- Una factura anulada dejó de existir: su NC queda entera como crédito libre.
  WHERE i.status <> 'CANCELLED'
),
notes AS (
  SELECT
    n.id,
    n.company_id,
    n.supplier_id,
    n.original_invoice_id,
    n.total,
    -- Lo que consumieron las NC anteriores de la misma factura.
    COALESCE(
      SUM(n.total) OVER (
        PARTITION BY n.original_invoice_id
        ORDER BY n.issue_date, n.created_at, n.id
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ), 0
    ) AS consumed_before
  FROM purchase_invoices n
  WHERE n.voucher_type::text IN ('NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_CREDITO_C')
    AND n.status::text IN ('CONFIRMED', 'PARTIAL_PAID', 'PAID')
    AND n.original_invoice_id IS NOT NULL
)
INSERT INTO "credit_note_applications"
  ("company_id", "supplier_id", "credit_note_id", "invoice_id", "amount", "applied_by", "notes")
SELECT
  n.company_id,
  n.supplier_id,
  n.id,
  n.original_invoice_id,
  LEAST(n.total, GREATEST(o.applicable - n.consumed_before, 0)),
  'system:tkt-586',
  'Backfill de la imputación automática previa a TKT-586'
FROM notes n
JOIN originals o ON o.id = n.original_invoice_id
WHERE LEAST(n.total, GREATEST(o.applicable - n.consumed_before, 0)) > 0;
