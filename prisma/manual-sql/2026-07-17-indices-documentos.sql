-- Índices para acelerar el listado de documentos de empleados (y queries que
-- escopan por empresa vía el join a employees). Medido en prod: sin estos índices
-- el render RSC de /dashboard/document tardaba ~4.5s (full scan + join).
--
-- CREATE INDEX CONCURRENTLY = NO bloquea escrituras en la tabla (seguro en prod).
-- IMPORTANTE: CONCURRENTLY no puede correr dentro de una transacción. Ejecutar cada
-- statement por separado (el SQL editor de Supabase lo permite). Si alguno queda
-- "INVALID" (falla a mitad), borrarlo con DROP INDEX y reintentar.
--
-- Estos índices coinciden con los @@index agregados a prisma/schema.prisma, así que
-- una futura `prisma migrate` los verá como ya existentes.

-- documents_employees: FKs del join (Postgres NO indexa FKs solo) + filtro/orden
CREATE INDEX CONCURRENTLY IF NOT EXISTS "documents_employees_applies_idx"
  ON "public"."documents_employees" ("applies");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "documents_employees_id_document_types_idx"
  ON "public"."documents_employees" ("id_document_types");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "documents_employees_state_idx"
  ON "public"."documents_employees" ("state");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "documents_employees_created_at_idx"
  ON "public"."documents_employees" ("created_at");

-- employees: scope por empresa (casi toda query filtra por company_id + is_active)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "employees_company_id_idx"
  ON "public"."employees" ("company_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "employees_company_id_is_active_idx"
  ON "public"."employees" ("company_id", "is_active");
