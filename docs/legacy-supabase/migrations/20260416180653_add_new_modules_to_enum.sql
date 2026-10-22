-- Add new modules to the modulos enum for sidebar visibility
ALTER TYPE modulos ADD VALUE IF NOT EXISTS 'proveedores';
ALTER TYPE modulos ADD VALUE IF NOT EXISTS 'almacenes';
ALTER TYPE modulos ADD VALUE IF NOT EXISTS 'compras';
