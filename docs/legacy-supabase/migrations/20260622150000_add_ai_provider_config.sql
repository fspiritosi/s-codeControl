-- Configuración global de proveedores de IA para extracción de facturas.
-- Tabla global (sin company_id), administrada solo por admin de plataforma.
-- Exactamente una fila debe tener is_active = true (proveedor en uso).
-- api_key se guarda CIFRADA con AES-256-GCM (formato iv:tag:cipher en base64).

CREATE TABLE ai_provider_config (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider   TEXT        NOT NULL UNIQUE,            -- 'gemini' | 'openai'
  api_key    TEXT,                                   -- cifrado (iv:tag:cipher base64); NULL si no configurada
  model      TEXT,                                   -- ej 'gemini-2.5-flash' | 'gpt-4o-mini'
  is_active  BOOLEAN     NOT NULL DEFAULT false,     -- exactamente UNA fila true = proveedor en uso
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed idempotente.
-- NOTA: la fila 'gemini' trae un api_key cifrado de PRUEBA atado a la ENCRYPTION_KEY
-- vigente al crear esta migración. Se reemplaza desde la UI (Settings > IA).
-- Si la ENCRYPTION_KEY cambia, este valor dejará de descifrar (hay que recargar la key desde la UI).
INSERT INTO ai_provider_config (provider, api_key, model, is_active)
VALUES
  (
    'gemini',
    'MTpGCrzAE4tGLG8c:hcRYFtaYyXc92dRnBOrdzQ==:hjQSxY4gpNa1PCNjoSm4BBkFfVOr4bn8/pipLH/MCvtnCemYWrM+lAusx0n9QgwkHh5PWtU=',
    'gemini-2.5-flash',
    true
  ),
  (
    'openai',
    NULL,
    'gpt-4o-mini',
    false
  )
ON CONFLICT (provider) DO NOTHING;
