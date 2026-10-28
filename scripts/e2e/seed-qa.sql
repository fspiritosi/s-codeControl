-- Datos de prueba para la suite E2E. Se aplican SOLO en la base del clon (nunca en prod). Idempotente.
-- Empresa "QA E2E" con un usuario dueño (el dueño tiene todos los permisos) y el módulo de costos contratado.
-- El hash es bcrypt de la clave que viene en E2E_PASSWORD; se pasa con: psql -v hash="$HASH" -f seed-qa.sql
BEGIN;

INSERT INTO public.profile (id, credential_id, email, fullname, role, password_hash, email_verified_at)
VALUES ('e2e00000-0000-4000-8000-000000000001', 'e2e00000-0000-4000-8000-000000000001',
        'qa-e2e@codecontrol.test', 'QA E2E', 'CodeControlClient', :'hash', now())
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email_verified_at = now();

INSERT INTO public.company (id, company_name, description, contact_email, contact_phone, address, city, country,
                            industry, company_cuit, owner_id, is_active)
VALUES ('e2e00000-0000-4000-8000-0000000000c1', 'QA E2E', 'Empresa de pruebas automáticas', 'qa-e2e@codecontrol.test',
        '1100000000', 'Calle Falsa 123', 1444, 'argentina', 'Software', '30999999990',
        'e2e00000-0000-4000-8000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hired_modules (company_id, module_id, due_to)
SELECT 'e2e00000-0000-4000-8000-0000000000c1', m.id, (now() + interval '10 years')::date
FROM public.modules m
WHERE m.name = 'costos'
  AND NOT EXISTS (SELECT 1 FROM public.hired_modules h
                  WHERE h.company_id = 'e2e00000-0000-4000-8000-0000000000c1' AND h.module_id = m.id);

COMMIT;
