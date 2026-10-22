-- tkt-480: VTV con dos indicadores independientes (Orden y Turno de Verificación)
-- Migración aditiva (solo-ADD). No altera ni borra datos existentes.
--
-- Antes existía un único eje de estado ('orden_solicitada' fundía "orden" y "turno").
-- Ahora cada VTV en gestión tiene dos flags independientes y el semáforo se deriva:
--   ambos true -> verde | uno true -> amarillo | ninguno -> rojo.
-- Los estados 'realizada'/'cancelada' del enum se mantienen como terminales.

-- 1. Flags independientes (default false = sin gestionar / rojo).
ALTER TABLE "public"."vtv_appointments"
  ADD COLUMN IF NOT EXISTS "has_verification_order" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."vtv_appointments"
  ADD COLUMN IF NOT EXISTS "has_verification_appointment" boolean NOT NULL DEFAULT false;

-- 2. Backfill: los turnos existentes 'orden_solicitada' representaban "el usuario ya
--    gestionó el turno" -> marcamos SOLO el Turno de Verificación (quedan en amarillo
--    hasta que el usuario indique también la Orden). Decisión de negocio tkt-480.
UPDATE "public"."vtv_appointments"
  SET "has_verification_appointment" = true
  WHERE "status" = 'orden_solicitada';
