-- Registrar módulo 'costos' en catálogo de módulos del sistema (M0-T02)
INSERT INTO modules (id, created_at, name, description, price)
VALUES (
  gen_random_uuid(),
  now(),
  'costos',
  'Gestión de Costos de Servicios — composición, fórmula polinómica y liquidación de sueldos',
  0
)
ON CONFLICT DO NOTHING;
