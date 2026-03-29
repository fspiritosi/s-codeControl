-- Seed de datos de test para desarrollo local
-- Ejecutar: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/seed-test-data.sql
-- company_id: 5136966a-41d3-4026-8b0c-5dc7a477a61b (CODECONTROL SAS)

BEGIN;

-- ============================================================
-- 1. Auth users (necesario para que supabase.auth.getUser() funcione)
--    GoTrue requiere que los campos varchar sean '' en lugar de NULL
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  email_change_confirm_status,
  phone_change, phone_change_token, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user, is_anonymous
) VALUES
  (
    '74b282e3-703f-4fe2-84eb-f30bcddaacd5',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'ventas@codecontrol.com.ar',
    crypt('@Masha0911', gen_salt('bf')),
    now(), now(), now(),
    '', '',
    '', '', '',
    0,
    '', '', '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Fabricio Spiritosi"}',
    false, false, false
  ),
  (
    '463b65c3-7cde-498d-ad39-a3e7e1b66f20',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'fspiritosi@codecontrol.com.ar',
    crypt('@Masha0911', gen_salt('bf')),
    now(), now(), now(),
    '', '',
    '', '', '',
    0,
    '', '', '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Fabricio Spiritosi"}',
    false, false, false
  )
ON CONFLICT (id) DO NOTHING;

-- Identities (requerido por Supabase auth para login con email)
INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
  (
    '74b282e3-703f-4fe2-84eb-f30bcddaacd5',
    '74b282e3-703f-4fe2-84eb-f30bcddaacd5',
    '74b282e3-703f-4fe2-84eb-f30bcddaacd5',
    '{"sub":"74b282e3-703f-4fe2-84eb-f30bcddaacd5","email":"ventas@codecontrol.com.ar"}',
    'email', now(), now(), now()
  ),
  (
    '463b65c3-7cde-498d-ad39-a3e7e1b66f20',
    '463b65c3-7cde-498d-ad39-a3e7e1b66f20',
    '463b65c3-7cde-498d-ad39-a3e7e1b66f20',
    '{"sub":"463b65c3-7cde-498d-ad39-a3e7e1b66f20","email":"fspiritosi@codecontrol.com.ar"}',
    'email', now(), now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Profiles (tabla pública vinculada a auth.users)
-- ============================================================
INSERT INTO profile (id, credential_id, email, fullname, role) VALUES
  (
    '74b282e3-703f-4fe2-84eb-f30bcddaacd5',
    '74b282e3-703f-4fe2-84eb-f30bcddaacd5',
    'ventas@codecontrol.com.ar',
    'Fabricio Spiritosi',
    'Propietario'
  ),
  (
    '463b65c3-7cde-498d-ad39-a3e7e1b66f20',
    '463b65c3-7cde-498d-ad39-a3e7e1b66f20',
    'fspiritosi@codecontrol.com.ar',
    'Fabricio Spiritosi',
    'Admin'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Company
-- ============================================================
INSERT INTO company (
  id, company_name, description, website, contact_email, contact_phone,
  address, city, country, industry, company_cuit, province_id, owner_id, by_defect, is_active
) VALUES (
  '5136966a-41d3-4026-8b0c-5dc7a477a61b',
  'CODECONTROL SAS',
  'Empresa de desarrollo de software para gestión de flotas y personal',
  'https://codecontrol.com.ar',
  'ventas@codecontrol.com.ar',
  '3512345678',
  'Av. Colón 1234',
  (SELECT id FROM cities WHERE name = 'Córdoba' LIMIT 1),
  'Argentina',
  'Tecnología e Informática',
  '30-71234567-9',
  5,
  '74b282e3-703f-4fe2-84eb-f30bcddaacd5',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. share_company_users (asocia usuarios a la empresa con roles y módulos)
-- ============================================================
INSERT INTO share_company_users (profile_id, company_id, role, modules) VALUES
  (
    '74b282e3-703f-4fe2-84eb-f30bcddaacd5',
    '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    'Propietario',
    ARRAY['empresa','empleados','equipos','documentación','mantenimiento','dashboard','ayuda','operaciones','formularios']::modulos[]
  ),
  (
    '463b65c3-7cde-498d-ad39-a3e7e1b66f20',
    '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    'Admin',
    ARRAY['empresa','empleados','equipos','documentación','mantenimiento','dashboard','ayuda','operaciones','formularios']::modulos[]
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. types_of_repairs (necesario para /dashboard/maintenance)
-- ============================================================
INSERT INTO types_of_repairs (name, description, company_id, is_active, criticity, type_of_maintenance) VALUES
  ('Cambio de aceite', 'Cambio de aceite de motor y filtro', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Baja', 'Preventivo'),
  ('Cambio de filtros', 'Reemplazo de filtros de aire, combustible y habitáculo', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Baja', 'Preventivo'),
  ('Revisión de frenos', 'Inspección y reemplazo de pastillas/discos de freno', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Alta', 'Preventivo'),
  ('Alineación y balanceo', 'Alineación de dirección y balanceo de ruedas', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Media', 'Preventivo'),
  ('Service completo', 'Revisión general de 10.000 km', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Media', 'Preventivo'),
  ('Cambio de correas', 'Reemplazo de correa de distribución y accesorios', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Alta', 'Preventivo'),
  ('Reparación de motor', 'Diagnóstico y reparación de fallas de motor', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Alta', 'Correctivo'),
  ('Reparación de caja', 'Reparación de caja de cambios', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Alta', 'Correctivo'),
  ('Sistema eléctrico', 'Diagnóstico y reparación de fallas eléctricas', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Media', 'Correctivo'),
  ('Reparación de suspensión', 'Reemplazo de amortiguadores y componentes de suspensión', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Media', 'Correctivo'),
  ('Chapa y pintura', 'Reparación de carrocería y pintura', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Baja', 'Correctivo'),
  ('Reparación de neumáticos', 'Parche o reemplazo de neumáticos dañados', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true, 'Media', 'Correctivo')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. Catálogos de vehículos
-- ============================================================

-- Tipos de vehículo
INSERT INTO types_of_vehicles (name, is_active) VALUES
  ('Camión', true),
  ('Camioneta', true),
  ('Auto', true),
  ('Utilitario', true),
  ('Semi-remolque', true),
  ('Maquinaria pesada', true),
  ('Motocicleta', true)
ON CONFLICT DO NOTHING;

-- Marcas de vehículo
INSERT INTO brand_vehicles (name, company_id, is_active) VALUES
  ('Toyota', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Ford', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Volkswagen', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Chevrolet', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Mercedes-Benz', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Iveco', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Scania', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Renault', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true)
ON CONFLICT (name) DO NOTHING;

-- Modelos de vehículo (referenciando marcas por subquery)
INSERT INTO model_vehicles (name, brand, is_active) VALUES
  ('Hilux', (SELECT id FROM brand_vehicles WHERE name = 'Toyota' LIMIT 1), true),
  ('Corolla', (SELECT id FROM brand_vehicles WHERE name = 'Toyota' LIMIT 1), true),
  ('Ranger', (SELECT id FROM brand_vehicles WHERE name = 'Ford' LIMIT 1), true),
  ('F-100', (SELECT id FROM brand_vehicles WHERE name = 'Ford' LIMIT 1), true),
  ('Amarok', (SELECT id FROM brand_vehicles WHERE name = 'Volkswagen' LIMIT 1), true),
  ('Gol Trend', (SELECT id FROM brand_vehicles WHERE name = 'Volkswagen' LIMIT 1), true),
  ('S10', (SELECT id FROM brand_vehicles WHERE name = 'Chevrolet' LIMIT 1), true),
  ('Cruze', (SELECT id FROM brand_vehicles WHERE name = 'Chevrolet' LIMIT 1), true),
  ('Sprinter', (SELECT id FROM brand_vehicles WHERE name = 'Mercedes-Benz' LIMIT 1), true),
  ('Atego 1726', (SELECT id FROM brand_vehicles WHERE name = 'Mercedes-Benz' LIMIT 1), true),
  ('Daily 70C17', (SELECT id FROM brand_vehicles WHERE name = 'Iveco' LIMIT 1), true),
  ('Tector 170E22', (SELECT id FROM brand_vehicles WHERE name = 'Iveco' LIMIT 1), true),
  ('R450', (SELECT id FROM brand_vehicles WHERE name = 'Scania' LIMIT 1), true),
  ('Kangoo', (SELECT id FROM brand_vehicles WHERE name = 'Renault' LIMIT 1), true),
  ('Master', (SELECT id FROM brand_vehicles WHERE name = 'Renault' LIMIT 1), true)
ON CONFLICT DO NOTHING;

-- Tipos de uso de equipo
INSERT INTO type (name, company_id, is_active) VALUES
  ('Transporte de personal', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Transporte de carga', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Operación en campo', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Logística', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Supervisión', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true),
  ('Mantenimiento', '5136966a-41d3-4026-8b0c-5dc7a477a61b', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. Vehículos de prueba
-- ============================================================
INSERT INTO vehicles (
  picture, type_of_vehicle, domain, chassis, engine, serie, intern_number,
  year, brand, model, is_active, company_id, type, status, condition, kilometer
) VALUES
  (
    '',
    (SELECT id FROM types_of_vehicles WHERE name = 'Camioneta' LIMIT 1),
    'AB123CD', 'CHS-2024-001', 'MOT-2024-001', 'SER-001', '101',
    '2023',
    (SELECT id FROM brand_vehicles WHERE name = 'Toyota' LIMIT 1),
    (SELECT id FROM model_vehicles WHERE name = 'Hilux' LIMIT 1),
    true, '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    (SELECT id FROM type WHERE name = 'Supervisión' LIMIT 1),
    'Avalado', 'operativo', '45000'
  ),
  (
    '',
    (SELECT id FROM types_of_vehicles WHERE name = 'Camioneta' LIMIT 1),
    'CD456EF', 'CHS-2024-002', 'MOT-2024-002', 'SER-002', '102',
    '2022',
    (SELECT id FROM brand_vehicles WHERE name = 'Ford' LIMIT 1),
    (SELECT id FROM model_vehicles WHERE name = 'Ranger' LIMIT 1),
    true, '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    (SELECT id FROM type WHERE name = 'Operación en campo' LIMIT 1),
    'Avalado', 'operativo', '78000'
  ),
  (
    '',
    (SELECT id FROM types_of_vehicles WHERE name = 'Camioneta' LIMIT 1),
    'EF789GH', 'CHS-2024-003', 'MOT-2024-003', 'SER-003', '103',
    '2024',
    (SELECT id FROM brand_vehicles WHERE name = 'Volkswagen' LIMIT 1),
    (SELECT id FROM model_vehicles WHERE name = 'Amarok' LIMIT 1),
    true, '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    (SELECT id FROM type WHERE name = 'Transporte de personal' LIMIT 1),
    'Avalado', 'operativo', '12000'
  ),
  (
    '',
    (SELECT id FROM types_of_vehicles WHERE name = 'Camión' LIMIT 1),
    'GH012IJ', 'CHS-2024-004', 'MOT-2024-004', 'SER-004', '201',
    '2021',
    (SELECT id FROM brand_vehicles WHERE name = 'Mercedes-Benz' LIMIT 1),
    (SELECT id FROM model_vehicles WHERE name = 'Atego 1726' LIMIT 1),
    true, '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    (SELECT id FROM type WHERE name = 'Transporte de carga' LIMIT 1),
    'No avalado', 'operativo', '120000'
  ),
  (
    '',
    (SELECT id FROM types_of_vehicles WHERE name = 'Camión' LIMIT 1),
    'IJ345KL', 'CHS-2024-005', 'MOT-2024-005', 'SER-005', '202',
    '2020',
    (SELECT id FROM brand_vehicles WHERE name = 'Iveco' LIMIT 1),
    (SELECT id FROM model_vehicles WHERE name = 'Tector 170E22' LIMIT 1),
    true, '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    (SELECT id FROM type WHERE name = 'Transporte de carga' LIMIT 1),
    'Avalado', 'en reparación', '185000'
  ),
  (
    '',
    (SELECT id FROM types_of_vehicles WHERE name = 'Utilitario' LIMIT 1),
    'KL678MN', 'CHS-2024-006', 'MOT-2024-006', 'SER-006', '301',
    '2023',
    (SELECT id FROM brand_vehicles WHERE name = 'Renault' LIMIT 1),
    (SELECT id FROM model_vehicles WHERE name = 'Kangoo' LIMIT 1),
    true, '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    (SELECT id FROM type WHERE name = 'Logística' LIMIT 1),
    'Avalado', 'operativo', '32000'
  ),
  (
    '',
    (SELECT id FROM types_of_vehicles WHERE name = 'Utilitario' LIMIT 1),
    'MN901OP', 'CHS-2024-007', 'MOT-2024-007', 'SER-007', '302',
    '2022',
    (SELECT id FROM brand_vehicles WHERE name = 'Mercedes-Benz' LIMIT 1),
    (SELECT id FROM model_vehicles WHERE name = 'Sprinter' LIMIT 1),
    true, '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    (SELECT id FROM type WHERE name = 'Transporte de personal' LIMIT 1),
    'Avalado', 'operativo', '67000'
  ),
  (
    '',
    (SELECT id FROM types_of_vehicles WHERE name = 'Auto' LIMIT 1),
    'OP234QR', 'CHS-2024-008', 'MOT-2024-008', 'SER-008', '401',
    '2024',
    (SELECT id FROM brand_vehicles WHERE name = 'Chevrolet' LIMIT 1),
    (SELECT id FROM model_vehicles WHERE name = 'Cruze' LIMIT 1),
    true, '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    (SELECT id FROM type WHERE name = 'Supervisión' LIMIT 1),
    'Avalado', 'operativo', '8000'
  ),
  (
    '',
    (SELECT id FROM types_of_vehicles WHERE name = 'Camión' LIMIT 1),
    'QR567ST', 'CHS-2024-009', 'MOT-2024-009', 'SER-009', '203',
    '2019',
    (SELECT id FROM brand_vehicles WHERE name = 'Scania' LIMIT 1),
    (SELECT id FROM model_vehicles WHERE name = 'R450' LIMIT 1),
    true, '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    (SELECT id FROM type WHERE name = 'Transporte de carga' LIMIT 1),
    'Completo con doc vencida', 'operativo condicionado', '250000'
  ),
  (
    '',
    (SELECT id FROM types_of_vehicles WHERE name = 'Camioneta' LIMIT 1),
    'ST890UV', 'CHS-2024-010', 'MOT-2024-010', 'SER-010', '104',
    '2021',
    (SELECT id FROM brand_vehicles WHERE name = 'Chevrolet' LIMIT 1),
    (SELECT id FROM model_vehicles WHERE name = 'S10' LIMIT 1),
    false, '5136966a-41d3-4026-8b0c-5dc7a477a61b',
    (SELECT id FROM type WHERE name = 'Operación en campo' LIMIT 1),
    'No avalado', 'no operativo', '145000'
  )
ON CONFLICT DO NOTHING;

COMMIT;
