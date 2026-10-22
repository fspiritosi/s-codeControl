-- Pago a cuenta a proveedores.
--
-- Permite registrar plata pagada a un proveedor sin imputarla a un comprobante,
-- y aplicarla después a una factura. Ver .planes/pago-a-cuenta-proveedores.md
--
-- Ambos cambios son aditivos: columna nueva con default y tabla nueva.
-- No modifican ni borran datos existentes.

-- Un ítem de OP "a cuenta" va sin invoice_id ni expense_id, con este flag en true.
-- El flag es explícito (en vez de inferirse de "ambos null") para que un ítem al
-- que se le pierda el invoice_id no se convierta en un crédito fantasma.
ALTER TABLE "payment_order_items"
  ADD COLUMN "is_on_account" boolean NOT NULL DEFAULT false;

-- Imputación de saldo a favor del proveedor contra una factura de compra.
-- El saldo a favor NO se persiste: se deriva como
--   Σ ítems a cuenta de OPs pagadas − Σ aplicaciones activas (reversed_at IS NULL)
CREATE TABLE "supplier_credit_applications" (
  "id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
  "company_id"  uuid          NOT NULL,
  "supplier_id" uuid          NOT NULL,
  "invoice_id"  uuid          NOT NULL,
  "amount"      numeric(15,2) NOT NULL,
  "applied_at"  timestamptz   NOT NULL DEFAULT now(),
  "applied_by"  text          NOT NULL,
  "reversed_at" timestamptz,
  "reversed_by" text,
  "notes"       text,
  "created_at"  timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT "supplier_credit_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "supplier_credit_applications_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "supplier_credit_applications_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON UPDATE CASCADE,
  CONSTRAINT "supplier_credit_applications_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "purchase_invoices"("id") ON UPDATE CASCADE,
  -- Una imputación de importe cero o negativo no tiene sentido y rompería el
  -- cálculo de la bolsa.
  CONSTRAINT "supplier_credit_applications_amount_positive" CHECK ("amount" > 0)
);

CREATE INDEX "supplier_credit_applications_company_supplier_idx"
  ON "supplier_credit_applications"("company_id", "supplier_id");
CREATE INDEX "supplier_credit_applications_invoice_idx"
  ON "supplier_credit_applications"("invoice_id");
-- El cálculo de la bolsa filtra siempre por aplicaciones no revertidas.
CREATE INDEX "supplier_credit_applications_active_idx"
  ON "supplier_credit_applications"("supplier_id") WHERE "reversed_at" IS NULL;
