-- Corrige el link_template de la notificación de órdenes de compra.
-- La ruta real de detalle de una OC es /dashboard/purchasing/orders/[id],
-- no /dashboard/purchasing/purchase-orders/[id] (esa ruta no existe y caía en 404).
BEGIN;

UPDATE "notification_types"
SET "link_template" = '/dashboard/purchasing/orders/{{purchaseOrderId}}'
WHERE "code" = 'purchase_orders.pending_approval'
  AND "link_template" = '/dashboard/purchasing/purchase-orders/{{purchaseOrderId}}';

-- Corrige los links ya materializados en notificaciones existentes.
UPDATE "notifications"
SET "link" = REPLACE("link", '/dashboard/purchasing/purchase-orders/', '/dashboard/purchasing/orders/')
WHERE "link" LIKE '/dashboard/purchasing/purchase-orders/%';

COMMIT;
