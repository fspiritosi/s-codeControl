-- tkt-461: vincular el turno de VTV al vencimiento del documento para el que se
-- gestionó. Así una VTV realizada no se re-programa mientras el documento siga
-- con ese mismo vencimiento; recién al renovarse (validity nuevo) se genera el
-- turno del próximo ciclo. Migración aditiva.

ALTER TABLE "public"."vtv_appointments"
  ADD COLUMN IF NOT EXISTS "document_validity" date;

-- Backfill: los turnos existentes toman el vencimiento actual de su documento.
UPDATE "public"."vtv_appointments" va
SET "document_validity" = de."validity"::date
FROM "public"."documents_equipment" de
WHERE va."document_equipment_id" = de."id"
  AND va."document_validity" IS NULL;
