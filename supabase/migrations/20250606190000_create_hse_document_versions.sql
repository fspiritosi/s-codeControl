-- Crear la tabla hse_document_versions
CREATE TABLE IF NOT EXISTS public.hse_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  version TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  change_log TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_document
    FOREIGN KEY(document_id) 
    REFERENCES hse_documents(id)
    ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_hse_document_versions_document_id ON public.hse_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_hse_document_versions_created_at ON public.hse_document_versions(created_at);

-- Función para crear la tabla (usada por la aplicación)
CREATE OR REPLACE FUNCTION public.create_document_versions_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Crear la tabla si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hse_document_versions') THEN
    EXECUTE '
    CREATE TABLE public.hse_document_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL,
      version TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      file_type TEXT NOT NULL,
      change_log TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT fk_document
        FOREIGN KEY(document_id) 
        REFERENCES hse_documents(id)
        ON DELETE CASCADE
    )';
    
    -- Crear índices
    CREATE INDEX idx_hse_document_versions_document_id ON public.hse_document_versions(document_id);
    CREATE INDEX idx_hse_document_versions_created_at ON public.hse_document_versions(created_at);
    
    -- Otorgar permisos
    GRANTE ALL ON TABLE public.hse_document_versions TO authenticated;
    GRANTE ALL ON TABLE public.hse_document_versions TO service_role;
    
    RAISE NOTICE 'Tabla hse_document_versions creada exitosamente';
  ELSE
    RAISE NOTICE 'La tabla hse_document_versions ya existe';
  END IF;
END;
$$;
