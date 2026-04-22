'use server';

import { supabaseServer } from '@/shared/lib/supabase/server';

/**
 * Tipo local para la tabla user_table_preferences.
 * La tabla aun no esta en database.types.ts (se agrega con la migracion
 * 20260313191627_add_user_table_preferences). Cuando se regeneren los tipos
 * con `npm run gentypes`, este tipo puede reemplazarse por el auto-generado.
 */
interface UserTablePreferencesRow {
  id: string;
  user_id: string;
  table_id: string;
  column_visibility: Record<string, boolean>;
  filter_visibility: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

/**
 * Obtiene las preferencias de tabla del usuario autenticado.
 * Retorna null si no hay usuario o no hay preferencias guardadas.
 */
export async function getTablePreferences(tableId: string) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await (supabase.from as SupabaseAny)('user_table_preferences')
    .select('column_visibility, filter_visibility')
    .eq('user_id', user.id)
    .eq('table_id', tableId)
    .single();

  const row = data as UserTablePreferencesRow | null;

  return row
    ? {
        columnVisibility: (row.column_visibility as Record<string, boolean>) ?? {},
        filterVisibility: (row.filter_visibility as Record<string, boolean>) ?? {},
      }
    : null;
}

/**
 * Guarda la visibilidad de columnas para una tabla.
 * Usa upsert para crear o actualizar el registro.
 */
export async function saveTableColumnVisibility(
  tableId: string,
  visibility: Record<string, boolean>,
) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await (supabase.from as SupabaseAny)('user_table_preferences').upsert(
    {
      user_id: user.id,
      table_id: tableId,
      column_visibility: visibility,
    },
    { onConflict: 'user_id,table_id' },
  );
}

/**
 * Guarda la visibilidad de filtros para una tabla.
 * Usa upsert para crear o actualizar el registro.
 */
export async function saveTableFilterVisibility(
  tableId: string,
  filters: Record<string, boolean>,
) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await (supabase.from as SupabaseAny)('user_table_preferences').upsert(
    {
      user_id: user.id,
      table_id: tableId,
      filter_visibility: filters,
    },
    { onConflict: 'user_id,table_id' },
  );
}
