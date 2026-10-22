'use server';

import { fetchCurrentUser } from '@/shared/actions/auth';
import { prisma } from '@/shared/lib/prisma';

type Visibility = Record<string, boolean>;

/**
 * Obtiene las preferencias de tabla del usuario autenticado.
 * Retorna null si no hay usuario o no hay preferencias guardadas.
 */
export async function getTablePreferences(tableId: string) {
  const user = await fetchCurrentUser();
  if (!user) return null;

  const row = await prisma.user_table_preferences.findUnique({
    where: { user_id_table_id: { user_id: user.id, table_id: tableId } },
    select: { column_visibility: true, filter_visibility: true },
  });

  return row
    ? {
        columnVisibility: (row.column_visibility as Visibility | null) ?? {},
        filterVisibility: (row.filter_visibility as Visibility | null) ?? {},
      }
    : null;
}

/** Guarda la visibilidad de columnas para una tabla (crea o actualiza). */
export async function saveTableColumnVisibility(tableId: string, visibility: Visibility) {
  const user = await fetchCurrentUser();
  if (!user) return;

  await prisma.user_table_preferences.upsert({
    where: { user_id_table_id: { user_id: user.id, table_id: tableId } },
    create: { user_id: user.id, table_id: tableId, column_visibility: visibility },
    update: { column_visibility: visibility },
  });
}

/** Guarda la visibilidad de filtros para una tabla (crea o actualiza). */
export async function saveTableFilterVisibility(tableId: string, filters: Visibility) {
  const user = await fetchCurrentUser();
  if (!user) return;

  await prisma.user_table_preferences.upsert({
    where: { user_id_table_id: { user_id: user.id, table_id: tableId } },
    create: { user_id: user.id, table_id: tableId, filter_visibility: filters },
    update: { filter_visibility: filters },
  });
}
