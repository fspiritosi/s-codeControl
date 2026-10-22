-- Agrega 'tesoreria' al enum modulos para que aparezca en el sidebar
-- cuando una empresa lo tenga contratado.
ALTER TYPE modulos ADD VALUE IF NOT EXISTS 'tesoreria';
