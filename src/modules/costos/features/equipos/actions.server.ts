'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { toClientNumber } from '@/modules/costos/shared/utils/decimal';
import { calcularCostoMensualEquipo } from '@/modules/costos/shared/utils/calcular-mantenimiento';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type {
  VehiculoConCosto,
  VehiculoResumen,
  CostoEquipoClient,
  CostoEquipoDetalle,
  CostoEquipoInput,
  ItemMantenimientoClient,
  ItemMantInput,
} from '@/modules/costos/shared/types/equipo.types';

const EQUIPOS_PATH = '/dashboard/costos/equipos';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const schemaCostoEquipo = z.object({
  vehicle_id: z.string().uuid(),
  valor_compra: z.number().nonnegative(),
  valor_residual_pct: z.number().min(0).max(1),
  anios_amortizacion: z.number().int().positive(),
  km_anuales: z.number().int().nonnegative().default(0),
  accesorios: z.number().nonnegative().default(0),
  is_active: z.boolean().optional(),
});

const schemaItem = z.object({
  nombre: z.string().min(1).max(200),
  precio_anual: z.number().nonnegative(),
  orden: z.number().int().nonnegative().default(0),
  is_active: z.boolean().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nombreVehiculo(v: {
  brand_rel?: { name: string | null } | null;
  model_rel?: { name: string | null } | null;
}) {
  return {
    marca: v.brand_rel?.name ?? '—',
    modelo: v.model_rel?.name ?? '—',
  };
}

async function assertCostoEquipoPertenece(costoEquipoId: string, companyId: string) {
  const ce = await prisma.costo_equipo.findFirst({
    where: { id: costoEquipoId, company_id: companyId },
    select: { id: true },
  });
  if (!ce) throw new Error('Costo de equipo no encontrado o sin acceso');
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listVehiculosConCosto(): Promise<VehiculoConCosto[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const vehiculos = await prisma.vehicles.findMany({
    where: { company_id: companyId },
    include: {
      brand_rel: { select: { name: true } },
      model_rel: { select: { name: true } },
      costo_equipo: { include: { items_mantenimiento: true } },
    },
    orderBy: { intern_number: 'asc' },
  });

  return vehiculos.map((v) => {
    const { marca, modelo } = nombreVehiculo(v);
    const ce = v.costo_equipo;
    let costo_mensual: number | null = null;
    if (ce) {
      const { costo_mensual: cm } = calcularCostoMensualEquipo({
        valor_compra: ce.valor_compra.toString(),
        valor_residual_pct: ce.valor_residual_pct.toString(),
        anios_amortizacion: ce.anios_amortizacion,
        accesorios: ce.accesorios.toString(),
        items: ce.items_mantenimiento.map((i) => ({
          precio_anual: i.precio_anual.toString(),
          is_active: i.is_active,
        })),
        afectacion_pct: 1,
      });
      costo_mensual = cm.toDecimalPlaces(2).toNumber();
    }

    return {
      id: v.id,
      interno: v.intern_number,
      dominio: v.domain,
      marca,
      modelo,
      anio: v.year,
      tiene_costo: !!ce,
      valor_compra: ce ? toClientNumber(ce.valor_compra) : null,
      costo_mensual,
      items_count: ce?.items_mantenimiento.length ?? 0,
    };
  });
}

export async function getCostoEquipo(vehicleId: string): Promise<CostoEquipoDetalle | null> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const v = await prisma.vehicles.findFirst({
    where: { id: vehicleId, company_id: companyId },
    include: {
      brand_rel: { select: { name: true } },
      model_rel: { select: { name: true } },
      costo_equipo: { include: { items_mantenimiento: { orderBy: { orden: 'asc' } } } },
    },
  });
  if (!v || !v.costo_equipo) return null;

  const ce = v.costo_equipo;
  const { marca, modelo } = nombreVehiculo(v);

  const { amortizacion_mensual, mantenimiento_mensual, costo_mensual } = calcularCostoMensualEquipo({
    valor_compra: ce.valor_compra.toString(),
    valor_residual_pct: ce.valor_residual_pct.toString(),
    anios_amortizacion: ce.anios_amortizacion,
    accesorios: ce.accesorios.toString(),
    items: ce.items_mantenimiento.map((i) => ({
      precio_anual: i.precio_anual.toString(),
      is_active: i.is_active,
    })),
    afectacion_pct: 1,
  });

  const { items_mantenimiento, ...ceScalar } = ce;
  return {
    vehiculo: { id: v.id, interno: v.intern_number, dominio: v.domain, marca, modelo, anio: v.year },
    costo: {
      ...ceScalar,
      valor_compra: toClientNumber(ce.valor_compra),
      valor_residual_pct: toClientNumber(ce.valor_residual_pct),
      accesorios: toClientNumber(ce.accesorios),
    },
    items: items_mantenimiento.map((i) => ({ ...i, precio_anual: toClientNumber(i.precio_anual) })),
    amortizacion_mensual: amortizacion_mensual.toDecimalPlaces(2).toNumber(),
    mantenimiento_mensual: mantenimiento_mensual.toDecimalPlaces(2).toNumber(),
    costo_mensual: costo_mensual.toDecimalPlaces(2).toNumber(),
  };
}

/**
 * Detalle para la página de edición. A diferencia de `getCostoEquipo`, retorna el
 * vehículo aunque todavía no tenga costo cargado (costo/items/resumen en null).
 * Retorna null solo si el vehículo no existe o no pertenece a la empresa.
 */
export async function getEquipoParaEdicion(vehicleId: string): Promise<{
  vehiculo: VehiculoResumen;
  costo: CostoEquipoClient | null;
  items: ItemMantenimientoClient[];
  resumen: { amortizacion_mensual: number; mantenimiento_mensual: number; costo_mensual: number } | null;
} | null> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const v = await prisma.vehicles.findFirst({
    where: { id: vehicleId, company_id: companyId },
    include: {
      brand_rel: { select: { name: true } },
      model_rel: { select: { name: true } },
      costo_equipo: { include: { items_mantenimiento: { orderBy: { orden: 'asc' } } } },
    },
  });
  if (!v) return null;

  const { marca, modelo } = nombreVehiculo(v);
  const vehiculo: VehiculoResumen = {
    id: v.id,
    interno: v.intern_number,
    dominio: v.domain,
    marca,
    modelo,
    anio: v.year,
  };

  const ce = v.costo_equipo;
  if (!ce) return { vehiculo, costo: null, items: [], resumen: null };

  const { items_mantenimiento, ...ceScalar } = ce;

  const { amortizacion_mensual, mantenimiento_mensual, costo_mensual } = calcularCostoMensualEquipo({
    valor_compra: ce.valor_compra.toString(),
    valor_residual_pct: ce.valor_residual_pct.toString(),
    anios_amortizacion: ce.anios_amortizacion,
    accesorios: ce.accesorios.toString(),
    items: items_mantenimiento.map((i) => ({
      precio_anual: i.precio_anual.toString(),
      is_active: i.is_active,
    })),
    afectacion_pct: 1,
  });

  return {
    vehiculo,
    costo: {
      ...ceScalar,
      valor_compra: toClientNumber(ce.valor_compra),
      valor_residual_pct: toClientNumber(ce.valor_residual_pct),
      accesorios: toClientNumber(ce.accesorios),
    },
    items: items_mantenimiento.map((i) => ({ ...i, precio_anual: toClientNumber(i.precio_anual) })),
    resumen: {
      amortizacion_mensual: amortizacion_mensual.toDecimalPlaces(2).toNumber(),
      mantenimiento_mensual: mantenimiento_mensual.toDecimalPlaces(2).toNumber(),
      costo_mensual: costo_mensual.toDecimalPlaces(2).toNumber(),
    },
  };
}

// ─── Mutations: costo_equipo ──────────────────────────────────────────────────

export async function upsertCostoEquipo(input: CostoEquipoInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const parsed = schemaCostoEquipo.parse(input);

  // El vehículo debe pertenecer a la empresa.
  const vehiculo = await prisma.vehicles.findFirst({
    where: { id: parsed.vehicle_id, company_id: companyId },
    select: { id: true },
  });
  if (!vehiculo) throw new Error('Vehículo no encontrado o sin acceso');

  const data = {
    valor_compra: parsed.valor_compra,
    valor_residual_pct: parsed.valor_residual_pct,
    anios_amortizacion: parsed.anios_amortizacion,
    km_anuales: parsed.km_anuales,
    accesorios: parsed.accesorios,
    is_active: parsed.is_active ?? true,
  };

  const costo = await prisma.costo_equipo.upsert({
    where: { vehicle_id: parsed.vehicle_id },
    create: { vehicle_id: parsed.vehicle_id, company_id: companyId, ...data },
    update: data,
  });

  revalidatePath(EQUIPOS_PATH);
  revalidatePath(`${EQUIPOS_PATH}/${parsed.vehicle_id}`);
  return costo;
}

// ─── Mutations: items de mantenimiento ────────────────────────────────────────

export async function addItemMantenimiento(costoEquipoId: string, input: ItemMantInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertCostoEquipoPertenece(costoEquipoId, companyId);
  const parsed = schemaItem.parse(input);

  const item = await prisma.item_mantenimiento.create({
    data: { costo_equipo_id: costoEquipoId, ...parsed },
  });
  revalidatePath(EQUIPOS_PATH);
  return item;
}

export async function updateItemMantenimiento(id: string, input: Partial<ItemMantInput>) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existing = await prisma.item_mantenimiento.findUnique({
    where: { id },
    select: { costo_equipo_id: true },
  });
  if (!existing) throw new Error('Ítem no encontrado');
  await assertCostoEquipoPertenece(existing.costo_equipo_id, companyId);

  const parsed = schemaItem.partial().parse(input);
  const item = await prisma.item_mantenimiento.update({ where: { id }, data: parsed });
  revalidatePath(EQUIPOS_PATH);
  return item;
}

export async function deleteItemMantenimiento(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existing = await prisma.item_mantenimiento.findUnique({
    where: { id },
    select: { costo_equipo_id: true },
  });
  if (!existing) throw new Error('Ítem no encontrado');
  await assertCostoEquipoPertenece(existing.costo_equipo_id, companyId);

  await prisma.item_mantenimiento.delete({ where: { id } });
  revalidatePath(EQUIPOS_PATH);
}

/** Carga masiva de ítems (usada por el dialog de importación). Retorna la cantidad insertada. */
export async function bulkAddItemsMantenimiento(
  costoEquipoId: string,
  items: ItemMantInput[]
): Promise<number> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertCostoEquipoPertenece(costoEquipoId, companyId);

  const parsed = z.array(schemaItem).min(1).parse(items);
  const result = await prisma.item_mantenimiento.createMany({
    data: parsed.map((i, idx) => ({
      costo_equipo_id: costoEquipoId,
      nombre: i.nombre,
      precio_anual: i.precio_anual,
      orden: i.orden ?? idx,
      is_active: i.is_active ?? true,
    })),
  });
  revalidatePath(EQUIPOS_PATH);
  return result.count;
}
