-- Seed del catálogo global de unidades de medida (measure_units) si está vacío (tsk-511).
-- Se necesita para cargar ítems de servicio de los clientes. Idempotente: solo
-- inserta el set por defecto cuando la tabla no tiene ninguna fila (no-op en prod
-- si ya está poblada), evitando duplicados.
INSERT INTO "measure_units" ("unit", "simbol", "tipo")
SELECT v.unit, v.simbol, v.tipo
FROM (VALUES
  ('Unidad',          'u',    'cantidad'),
  ('Global',          'gl',   'cantidad'),
  ('Servicio',        'serv', 'cantidad'),
  ('Viaje',           'viaje','cantidad'),
  ('Hora',            'h',    'tiempo'),
  ('Día',             'día',  'tiempo'),
  ('Mes',             'mes',  'tiempo'),
  ('Kilómetro',       'km',   'longitud'),
  ('Metro',           'm',    'longitud'),
  ('Metro cuadrado',  'm²',   'superficie'),
  ('Metro cúbico',    'm³',   'volumen'),
  ('Litro',           'l',    'volumen'),
  ('Kilogramo',       'kg',   'peso'),
  ('Gramo',           'g',    'peso'),
  ('Tonelada',        't',    'peso')
) AS v(unit, simbol, tipo)
WHERE NOT EXISTS (SELECT 1 FROM "measure_units");
