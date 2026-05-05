/**
 * Mapeo de rutas (prefijos) a permisos requeridos para el filtro del sidebar
 * y el guard del layout. Centraliza la regla en un único lugar.
 *
 * Convención: la primera coincidencia por prefijo (más larga primero) gana.
 * Una ruta sin entrada explícita no requiere permiso (ej. /dashboard).
 */

export interface RoutePermissionRule {
  prefix: string;
  permission: string;
  module?: string;
}

// Orden importa: poner los prefijos más específicos primero.
export const ROUTE_PERMISSIONS: RoutePermissionRule[] = [
  // Configuración
  { prefix: '/dashboard/settings/roles',        permission: 'roles.view',          module: 'configuracion' },
  { prefix: '/dashboard/settings/notifications',permission: 'notifications.view',  module: 'configuracion' },

  // Compras (incluye OC)
  { prefix: '/dashboard/purchasing',            permission: 'compras.view',        module: 'compras' },

  // Tesorería (incluye OP)
  { prefix: '/dashboard/treasury',              permission: 'tesoreria.view',      module: 'tesoreria' },

  // Almacenes
  { prefix: '/dashboard/warehouse',             permission: 'almacenes.view',      module: 'almacenes' },

  // Proveedores
  { prefix: '/dashboard/suppliers',             permission: 'proveedores.view',    module: 'proveedores' },

  // Productos (parte de almacenes)
  { prefix: '/dashboard/products',              permission: 'almacenes.view',      module: 'almacenes' },

  // Empresa
  { prefix: '/dashboard/company',               permission: 'empresa.view',        module: 'empresa' },

  // Empleados
  { prefix: '/dashboard/employee',              permission: 'empleados.view',      module: 'empleados' },

  // Equipos
  { prefix: '/dashboard/equipment',             permission: 'equipos.view',        module: 'equipos' },

  // Documentación
  { prefix: '/dashboard/document',              permission: 'documentacion.view',  module: 'documentacion' },

  // Mantenimiento
  { prefix: '/dashboard/maintenance',           permission: 'mantenimiento.view',  module: 'mantenimiento' },

  // Operaciones (partes diarios)
  { prefix: '/dashboard/operations',            permission: 'operaciones.view',    module: 'operaciones' },

  // Formularios
  { prefix: '/dashboard/forms',                 permission: 'formularios.view',    module: 'formularios' },

  // HSE — actualmente sin permiso definido, queda libre.

  // Ayuda
  { prefix: '/dashboard/help',                  permission: 'ayuda.view',          module: 'ayuda' },
];

/**
 * Devuelve la regla aplicable a un pathname, o null si la ruta no requiere permiso.
 * Excluye rutas siempre accesibles (no-access, dashboard root).
 */
export function getRouteRule(pathname: string): RoutePermissionRule | null {
  // Rutas siempre accesibles
  if (pathname === '/dashboard' || pathname === '/dashboard/') return null;
  if (pathname.startsWith('/dashboard/no-access')) return null;
  if (pathname.startsWith('/dashboard/settings') && !pathname.startsWith('/dashboard/settings/roles') && !pathname.startsWith('/dashboard/settings/notifications')) {
    return null;
  }

  return ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix)) ?? null;
}
