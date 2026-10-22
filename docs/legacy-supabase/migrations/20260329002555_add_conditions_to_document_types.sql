ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "conditions" jsonb[] DEFAULT '{}';
