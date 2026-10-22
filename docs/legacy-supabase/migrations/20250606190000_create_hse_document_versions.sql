-- Crear tabla hse_document_versions y hse_document_assignment_versions

CREATE TABLE IF NOT EXISTS public.hse_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  document_id UUID NOT NULL REFERENCES hse_documents(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  version TEXT NOT NULL,
  title TEXT,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  status TEXT,
  change_log TEXT,
  expiry_date TEXT
);

CREATE INDEX IF NOT EXISTS idx_hse_document_versions_document_id ON public.hse_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_hse_document_versions_created_at ON public.hse_document_versions(created_at);

-- hse_document_assignment_versions
CREATE TABLE IF NOT EXISTS public.hse_document_assignment_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES hse_document_assignments(id),
  document_version_id UUID NOT NULL REFERENCES hse_document_versions(id),
  assignee_id UUID NOT NULL REFERENCES employees(id),
  status TEXT NOT NULL DEFAULT 'pendiente',
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  declined_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
