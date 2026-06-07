'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { toClientNumber } from '@/modules/costos/shared/utils/decimal';
import { calcularOCP } from '@/modules/costos/shared/utils/calcular-ocp';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ItemOCPInput, ItemOCPClient, ResumenOCP } from '@/modules/costos/shared/types/ocp.types';
import { GRUPOS_OCP } from '@/modules/costos/shared/types/ocp.types';

function servicioPath(servicioId: string) {
  return `/dashboard/costos/servicios/${servicioId}`;
}

const schemaItem = z.object({
  grupo: z.enum(GRUPOS_OCP),
  concepto: z.string().min(1).max(160),
  costo_anual: z.number().nonnegative(),
  cantidad_personas: z.number().positive().default(1),
});

async function getServicioScoped(servicioId: string, companyId: string) {
  const s = await prisma.servicio_contrato.findFirst({
    where: { id: servicioId, company_id: companyId },
    select: { id: true },
  });
  if (!s) throw new Error('Servicio no encontrado o sin acceso');
  return s;
}

async function getServicioIdDeItem(itemId: string, companyId: string) {
  const item = await prisma.item_ocp.findUnique({ where: { id: itemId }, select: { servicio_id: true } });
  if (!item) throw new Error('Ítem OCP no encontrado');
  await getServicioScoped(item.servicio_id, companyId);
  return item.servicio_id;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listItemsOCP(servicioId: string): Promise<ItemOCPClient[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getServicioScoped(servicioId, companyId);

  const items = await prisma.item_ocp.findMany({
    where: { servicio_id: servicioId },
    orderBy: [{ grupo: 'asc' }, { concepto: 'asc' }],
  });
  return items.map((i) => ({
    ...i,
    costo_anual: toClientNumber(i.costo_anual),
    cantidad_personas: toClientNumber(i.cantidad_personas),
  }));
}

/** Todos los ítems OCP de la empresa (vista transversal otros-costos-personal). */
export async function listItemsOCPEmpresa() {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const items = await prisma.item_ocp.findMany({
    where: { servicio: { company_id: companyId } },
    include: { servicio: { select: { id: true, nombre: true } } },
    orderBy: [{ servicio: { nombre: 'asc' } }, { grupo: 'asc' }, { concepto: 'asc' }],
  });

  return items.map((i) => ({
    id: i.id,
    servicio_id: i.servicio.id,
    servicio_nombre: i.servicio.nombre,
    grupo: i.grupo,
    concepto: i.concepto,
    costo_anual: toClientNumber(i.costo_anual),
    cantidad_personas: toClientNumber(i.cantidad_personas),
  }));
}

export async function calcularResumenOCP(servicioId: string): Promise<ResumenOCP> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getServicioScoped(servicioId, companyId);
  return calcularOCP(servicioId);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function addItemOCP(servicioId: string, input: ItemOCPInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getServicioScoped(servicioId, companyId);
  const parsed = schemaItem.parse(input);

  const item = await prisma.item_ocp.create({ data: { servicio_id: servicioId, ...parsed } });
  revalidatePath(servicioPath(servicioId));
  return item;
}

export async function updateItemOCP(id: string, input: Partial<ItemOCPInput>) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const servicioId = await getServicioIdDeItem(id, companyId);
  const parsed = schemaItem.partial().parse(input);

  const item = await prisma.item_ocp.update({ where: { id }, data: parsed });
  revalidatePath(servicioPath(servicioId));
  return item;
}

export async function deleteItemOCP(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const servicioId = await getServicioIdDeItem(id, companyId);

  await prisma.item_ocp.delete({ where: { id } });
  revalidatePath(servicioPath(servicioId));
}
