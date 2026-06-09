-- Roles únicos por empresa (multi-tenant) + desacople del vínculo legacy por nombre.
--
-- Problema:
--   * roles.name tenía un UNIQUE global (roles_name_key) -> dos empresas no
--     podían tener un rol con el mismo nombre.
--   * Ese UNIQUE existía, en parte, porque profile.role y share_company_users.role
--     eran FKs (string) que referenciaban roles(name). Ese acople legaba la
--     identidad del rol al nombre, impidiendo nombres repetidos entre empresas.
--
-- Solución:
--   1) Quitar las FKs legacy por nombre. El vínculo usuario<->rol multi-tenant
--      vive en user_roles (por role_id). profile.role y share_company_users.role
--      siguen existiendo como string para el fallback de coexistencia, pero ya
--      sin integridad referencial por nombre.
--   2) Reemplazar el UNIQUE global por uno compuesto (name, company_id), de modo
--      que cada empresa tenga su propio conjunto de nombres de rol.
--
-- Seguridad de datos: el UNIQUE global vigente garantiza que hoy no hay nombres
-- repetidos, por lo que el constraint compuesto no puede ser violado por las
-- filas actuales. No se borra ni modifica ninguna fila.

-- 1) Quitar las FKs legacy que referenciaban roles(name)
ALTER TABLE "public"."profile" DROP CONSTRAINT IF EXISTS "profile_role_fkey";
ALTER TABLE "public"."share_company_users" DROP CONSTRAINT IF EXISTS "share_company_users_role_fkey";

-- 2) Reemplazar el UNIQUE global de name por uno por empresa
ALTER TABLE "public"."roles" DROP CONSTRAINT IF EXISTS "roles_name_key";
ALTER TABLE "public"."roles"
  ADD CONSTRAINT "roles_name_company_id_key" UNIQUE ("name", "company_id");
