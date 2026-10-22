-- Enum para estado de gasto
CREATE TYPE expense_status AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIAL_PAID', 'PAID', 'CANCELLED');

-- Categorias de gastos
CREATE TABLE expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Gastos
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  number integer NOT NULL,
  full_number text NOT NULL,
  description text NOT NULL,
  amount numeric(15,2) NOT NULL,
  date date NOT NULL,
  due_date date,
  status expense_status NOT NULL DEFAULT 'DRAFT',
  notes text,
  category_id uuid NOT NULL REFERENCES expense_categories(id),
  supplier_id uuid REFERENCES suppliers(id),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, number)
);

-- Adjuntos de gastos
CREATE TABLE expense_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_key text NOT NULL,
  file_size integer,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Extender payment_order_items para soportar gastos
ALTER TABLE payment_order_items
  ADD COLUMN expense_id uuid REFERENCES expenses(id);

-- Indices
CREATE INDEX idx_expenses_company_id ON expenses(company_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_supplier_id ON expenses(supplier_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expense_categories_company_id ON expense_categories(company_id);
CREATE INDEX idx_expense_attachments_expense_id ON expense_attachments(expense_id);
CREATE INDEX idx_payment_order_items_expense_id ON payment_order_items(expense_id);

-- Permisos del módulo de gastos
INSERT INTO permissions (code, module, action, description) VALUES
  ('compras.gastos.view', 'compras', 'view', 'Ver gastos'),
  ('compras.gastos.create', 'compras', 'create', 'Crear gastos'),
  ('compras.gastos.update', 'compras', 'update', 'Editar gastos'),
  ('compras.gastos.confirm', 'compras', 'confirm', 'Confirmar gastos'),
  ('compras.gastos.delete', 'compras', 'delete', 'Eliminar gastos')
ON CONFLICT (code) DO NOTHING;
