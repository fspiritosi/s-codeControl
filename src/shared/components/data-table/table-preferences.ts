/**
 * Persistencia de preferencias de tabla.
 *
 * Fase 1: localStorage (sin BD).
 * Fase 9: server actions + Supabase (con localStorage como fallback).
 *
 * Estrategia: localStorage es la fuente primaria para lectura sincrona.
 * Las escrituras se persisten en localStorage Y en el servidor (fire-and-forget).
 */
'use client';

import type { TablePreferences } from './types';
import {
  saveTableColumnVisibility as saveColumnVisibilityServer,
  saveTableFilterVisibility as saveFilterVisibilityServer,
} from '@/shared/actions/table-preferences';

const STORAGE_KEY_PREFIX = 'dt-pref-';

function getStorageKey(tableId: string) {
  return `${STORAGE_KEY_PREFIX}${tableId}`;
}

export function getTablePreferences(tableId: string): TablePreferences {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(getStorageKey(tableId));
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveTableColumnVisibility(
  tableId: string,
  columnVisibility: Record<string, boolean>,
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(tableId);
    const stored = localStorage.getItem(key);
    const prefs: TablePreferences = stored ? JSON.parse(stored) : {};
    prefs.columnVisibility = columnVisibility;
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    // silently fail
  }
  // Persistir en servidor (fire-and-forget)
  saveColumnVisibilityServer(tableId, columnVisibility).catch(() => {});
}

export function saveTableFilterVisibility(
  tableId: string,
  filterVisibility: Record<string, boolean>,
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(tableId);
    const stored = localStorage.getItem(key);
    const prefs: TablePreferences = stored ? JSON.parse(stored) : {};
    prefs.filterVisibility = filterVisibility;
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    // silently fail
  }
  // Persistir en servidor (fire-and-forget)
  saveFilterVisibilityServer(tableId, filterVisibility).catch(() => {});
}
