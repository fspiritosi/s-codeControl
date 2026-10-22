-- Crear tablas HSE y training_tags que fueron creadas directamente en producción
-- sin migraciones. Esta migración las añade para que el entorno local funcione.

-- Enum hse_doc_status
DO $$ BEGIN
  CREATE TYPE hse_doc_status AS ENUM ('pendiente', 'aceptado', 'rechazado', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- training_tags (referenciada por hse_document_tag_assignments y hse_document_type_assignmente)
CREATE TABLE IF NOT EXISTS public.training_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- training_tag_assignments
CREATE TABLE IF NOT EXISTS public.training_tag_assignments (
  training_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  PRIMARY KEY (training_id, tag_id),
  CONSTRAINT fk_tag FOREIGN KEY (tag_id) REFERENCES training_tags(id) ON DELETE CASCADE
);

-- hse_doc_types
CREATE TABLE IF NOT EXISTS public.hse_doc_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  short_description TEXT,
  company_id UUID REFERENCES company(id),
  is_active BOOLEAN DEFAULT true
);

-- hse_documents
CREATE TABLE IF NOT EXISTS public.hse_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID REFERENCES company(id),
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TEXT,
  docs_types UUID REFERENCES hse_doc_types(id)
);

-- hse_document_assignments
CREATE TABLE IF NOT EXISTS public.hse_document_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES hse_documents(id),
  assignee_id UUID REFERENCES employees(id),
  assignee_type TEXT NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status hse_doc_status NOT NULL,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  declined_reason TEXT
);

-- hse_document_tags
CREATE TABLE IF NOT EXISTS public.hse_document_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  color TEXT,
  company_id UUID REFERENCES company(id),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ
);

-- hse_document_tag_assignments
CREATE TABLE IF NOT EXISTS public.hse_document_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  document_id UUID NOT NULL REFERENCES hse_documents(id),
  tag_id UUID NOT NULL REFERENCES training_tags(id)
);

-- hse_document_type_assignmente (nota: nombre original con typo preservado)
CREATE TABLE IF NOT EXISTS public.hse_document_type_assignmente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  document_id UUID NOT NULL REFERENCES hse_documents(id),
  "docType_id" UUID NOT NULL REFERENCES training_tags(id)
);
