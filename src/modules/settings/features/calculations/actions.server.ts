'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { requirePermission } from '@/shared/lib/permissions';
import { revalidatePath } from 'next/cache';
import type { ExchangeRateData, IndexValueData, IndiceData } from './types';

const PERM = 'empresa.update';

// Formatea un Date de columna `date` a 'YYYY-MM-DD' sin desfase de zona.
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Tipo de cambio ───────────────────────────────────────────────────────────

export async function listExchangeRates(): Promise<ExchangeRateData[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];
  const rows = await prisma.exchange_rates.findMany({
    where: { company_id: companyId },
    orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }],
  });
  return rows.map((r) => ({
    id: r.id,
    moneda_origen: r.moneda_origen,
    moneda_destino: r.moneda_destino,
    valor: Number(r.valor),
    fecha: toISODate(r.fecha),
    fuente: r.fuente,
  }));
}

interface UpsertRateInput {
  id?: string;
  valor: number;
  fecha: string; // 'YYYY-MM-DD'
  fuente?: string | null;
}

export async function upsertExchangeRate(input: UpsertRateInput) {
  try {
    await requirePermission(PERM);
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No hay empresa activa' };

    if (!Number.isFinite(input.valor) || input.valor <= 0) {
      return { error: 'El valor del tipo de cambio debe ser mayor a 0' };
    }
    if (!input.fecha) return { error: 'La fecha es requerida' };

    const data = {
      moneda_origen: 'USD',
      moneda_destino: 'ARS',
      valor: input.valor,
      fecha: new Date(`${input.fecha}T00:00:00Z`),
      fuente: input.fuente?.trim() || null,
    };

    if (input.id) {
      // Scope a la empresa: no permitir editar filas de otra empresa.
      const owned = await prisma.exchange_rates.findFirst({
        where: { id: input.id, company_id: companyId },
        select: { id: true },
      });
      if (!owned) return { error: 'Cotización no encontrada' };
      await prisma.exchange_rates.update({ where: { id: input.id }, data });
    } else {
      await prisma.exchange_rates.create({ data: { ...data, company_id: companyId } });
    }
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error upserting exchange_rate:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteExchangeRate(id: string) {
  try {
    await requirePermission(PERM);
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No hay empresa activa' };
    const owned = await prisma.exchange_rates.findFirst({
      where: { id, company_id: companyId },
      select: { id: true },
    });
    if (!owned) return { error: 'Cotización no encontrada' };
    await prisma.exchange_rates.delete({ where: { id } });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error deleting exchange_rate:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ── Índices (catálogo) ───────────────────────────────────────────────────────

export async function listIndices(): Promise<IndiceData[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];
  const rows = await prisma.indices.findMany({
    where: { company_id: companyId },
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { values: true } } },
  });
  return rows.map((r) => ({ id: r.id, nombre: r.nombre, valuesCount: r._count.values }));
}

export async function upsertIndice(input: { id?: string; nombre: string }) {
  try {
    await requirePermission(PERM);
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No hay empresa activa' };

    const nombre = input.nombre.trim();
    if (!nombre) return { error: 'El nombre del índice es requerido' };

    const collision = await prisma.indices.findFirst({
      where: { company_id: companyId, nombre, ...(input.id ? { id: { not: input.id } } : {}) },
      select: { id: true },
    });
    if (collision) return { error: `Ya existe un índice llamado "${nombre}"` };

    if (input.id) {
      const owned = await prisma.indices.findFirst({
        where: { id: input.id, company_id: companyId },
        select: { id: true },
      });
      if (!owned) return { error: 'Índice no encontrado' };
      await prisma.indices.update({ where: { id: input.id }, data: { nombre } });
    } else {
      await prisma.indices.create({ data: { nombre, company_id: companyId } });
    }
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error upserting indice:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteIndice(id: string) {
  try {
    await requirePermission(PERM);
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No hay empresa activa' };
    const owned = await prisma.indices.findFirst({
      where: { id, company_id: companyId },
      select: { id: true },
    });
    if (!owned) return { error: 'Índice no encontrado' };
    // Los valores se borran en cascada (onDelete: Cascade).
    await prisma.indices.delete({ where: { id } });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error deleting indice:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ── Valores de índice ────────────────────────────────────────────────────────

async function indiceBelongsToCompany(indiceId: string, companyId: string): Promise<boolean> {
  const owned = await prisma.indices.findFirst({
    where: { id: indiceId, company_id: companyId },
    select: { id: true },
  });
  return !!owned;
}

export async function listIndexValues(indiceId: string): Promise<IndexValueData[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];
  if (!(await indiceBelongsToCompany(indiceId, companyId))) return [];
  const rows = await prisma.index_values.findMany({
    where: { indice_id: indiceId },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  });
  return rows.map((r) => ({
    id: r.id,
    indice_id: r.indice_id,
    mes: r.mes,
    anio: r.anio,
    variacion: Number(r.variacion),
  }));
}

export async function upsertIndexValue(input: {
  id?: string;
  indice_id: string;
  mes: number;
  anio: number;
  variacion: number;
}) {
  try {
    await requirePermission(PERM);
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No hay empresa activa' };
    if (!(await indiceBelongsToCompany(input.indice_id, companyId))) {
      return { error: 'Índice no encontrado' };
    }
    if (input.mes < 1 || input.mes > 12) return { error: 'Mes inválido' };
    if (input.anio < 1900 || input.anio > 2999) return { error: 'Año inválido' };
    if (!Number.isFinite(input.variacion)) return { error: 'Variación inválida' };

    // Unicidad (indice_id, anio, mes)
    const collision = await prisma.index_values.findFirst({
      where: {
        indice_id: input.indice_id,
        anio: input.anio,
        mes: input.mes,
        ...(input.id ? { id: { not: input.id } } : {}),
      },
      select: { id: true },
    });
    if (collision) return { error: 'Ya hay un valor cargado para ese mes/año' };

    const data = { mes: input.mes, anio: input.anio, variacion: input.variacion };
    if (input.id) {
      await prisma.index_values.update({ where: { id: input.id }, data });
    } else {
      await prisma.index_values.create({ data: { ...data, indice_id: input.indice_id } });
    }
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error upserting index_value:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteIndexValue(id: string) {
  try {
    await requirePermission(PERM);
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No hay empresa activa' };
    const row = await prisma.index_values.findUnique({
      where: { id },
      select: { indice: { select: { company_id: true } } },
    });
    if (!row || row.indice.company_id !== companyId) return { error: 'Valor no encontrado' };
    await prisma.index_values.delete({ where: { id } });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error deleting index_value:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
