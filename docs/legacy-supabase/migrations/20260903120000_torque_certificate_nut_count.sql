-- Cantidad de tuercas de la rueda en el certificado de torqueo (tsk-575).
--
-- El diagrama de la sección 4 del PDF dejaba de ser fijo: hasta ahora se
-- imprimía el recorte del papel con las tres secuencias juntas (6, 8 y 10
-- tuercas) y el mecánico marcaba a mano cuál aplicaba. Ahora se elige en el
-- formulario y el PDF imprime solo ese diagrama.
--
-- Nullable a propósito: los certificados ya emitidos no tienen esa elección,
-- y al reimprimirlos tienen que salir igual que el día que se firmaron (con
-- el diagrama de las tres secuencias). No se les inventa un valor.
ALTER TABLE "torque_certificates"
  ADD COLUMN "nut_count" integer;

ALTER TABLE "torque_certificates"
  ADD CONSTRAINT "torque_certificates_nut_count_check"
  CHECK ("nut_count" IS NULL OR "nut_count" IN (6, 8, 10));
