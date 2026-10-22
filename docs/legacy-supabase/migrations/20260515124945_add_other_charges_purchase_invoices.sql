-- Add other_charges field to purchase_invoices header
ALTER TABLE purchase_invoices
  ADD COLUMN other_charges numeric(12,2) NOT NULL DEFAULT 0;

-- Create table for other charges line items
CREATE TABLE purchase_invoice_other_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(12,3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_invoice_other_charges_invoice
  ON purchase_invoice_other_charges(invoice_id);
