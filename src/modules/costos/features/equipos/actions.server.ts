'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { toClientNumber } from '@/modules/costos/shared/utils/decimal';
import { calcularCostoMensualEquipo } from '@/modules/costos/shared/utils/calcular-costo-equipo';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type {
  VehiculoConCosto,
  VehiculoResumen,
  CostoEquipoClient,
  CostoEquipoInput,
} from '@/modules/costos/shared/types/equipo.types';

const EQUIPOS_PATH = '/dashboard/costos/equipos';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const schemaCostoEquipo = z.object({
  vehicle_id: z.string().uuid(),
  valor_compra: z.number().nonnegative(),
  valor_residual_pct: z.number().min(0).max(1),
  anios_amortizacion: z.number().int().positive(),
  km_anuales: z.number().int().nonnegative().default(0),
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

type ItemTipoCalcRow = {
  clase: 'ACCESORIO' | 'MANTENIMIENTO';
  cantidad: string;
  precio_unitario: string;
  is_active: boolean;
};

/** Ítems por tipo de toda la empresa, en un solo query, para evitar el N+1. */
async function itemsPorTipoDeEmpresa(companyId: string): Promise<Map<string, ItemTipoCalcRow[]>> {
  const perfiles = await prisma.costo_tipo_equipo.findMany({
    where: { company_id: companyId },
    include: { items: { where: { is_active: true } } },
  });
  return new Map(
    perfiles.map((p) => [
      p.type_id,
      p.items.map((i) => ({
        clase: i.clase,
        cantidad: i.cantidad.toString(),
        precio_unitario: i.precio_unitario.toString(),
        is_active: i.is_active,
      })),
    ])
  );
}

/** Ítems activos del tipo de un solo equipo. */
async function itemsDelTipo(companyId: string, typeId: string): Promise<ItemTipoCalcRow[]> {
  const perfil = await prisma.costo_tipo_equipo.findUnique({
    where: { company_id_type_id: { company_id: companyId, type_id: typeId } },
    include: { items: { where: { is_active: true } } },
  });
  return (perfil?.items ?? []).map((i) => ({
    clase: i.clase,
    cantidad: i.cantidad.toString(),
    precio_unitario: i.precio_unitario.toString(),
    is_active: i.is_active,
  }));
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listVehiculosConCosto(): Promise<VehiculoConCosto[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const [vehiculos, itemsPorTipo] = await Promise.all([
    prisma.vehicles.findMany({
      where: { company_id: companyId },
      include: {
        brand_rel: { select: { name: true } },
        model_rel: { select: { name: true } },
        costo_equipo: true,
      },
      orderBy: { intern_number: 'asc' },
    }),
    itemsPorTipoDeEmpresa(companyId),
  ]);

  return vehiculos.map((v) => {
    const { marca, modelo } = nombreVehiculo(v);
    const ce = v.costo_equipo;
    let costo_mensual: number | null = null;
    let accesorios_total: number | null = null;

    if (ce) {
      const r = calcularCostoMensualEquipo({
        valor_compra: ce.valor_compra.toString(),
        valor_residual_pct: ce.valor_residual_pct.toString(),
        anios_amortizacion: ce.anios_amortizacion,
        items_tipo: itemsPorTipo.get(v.type) ?? [],
        afectacion_pct: 1,
      });
      costo_mensual = r.costo_mensual.toDecimalPlaces(2).toNumber();
      accesorios_total = r.accesorios_total.toDecimalPlaces(2).toNumber();
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
      accesorios_total,
      items_count: (itemsPorTipo.get(v.type) ?? []).length,
    };
  });
}

/**
 * Detalle para la página de edición: retorna el vehículo aunque todavía no tenga costo
 * cargado (costo/resumen en null). Retorna null solo si el vehículo no existe o no
 * pertenece a la empresa.
 *
 * `accesorios_total` y `mantenimiento_mensual` son del tipo de equipo, no de la
 * unidad: valen aunque el equipo todavía no tenga costo cargado, por eso viven al
 * nivel superior y no dentro de `resumen`.
 */
export async function getEquipoParaEdicion(vehicleId: string): Promise<{
  vehiculo: VehiculoResumen;
  costo: CostoEquipoClient | null;
  tipo: { id: string; nombre: string };
  items_tipo_count: number;
  accesorios_total: number;
  mantenimiento_mensual: number;
  resumen: { amortizacion_mensual: number; costo_mensual: number } | null;
} | null> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const v = await prisma.vehicles.findFirst({
    where: { id: vehicleId, company_id: companyId },
    include: {
      brand_rel: { select: { name: true } },
      model_rel: { select: { name: true } },
      type_rel: { select: { id: true, name: true } },
      costo_equipo: true,
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

  const items_tipo = await itemsDelTipo(companyId, v.type);
  const tipo = { id: v.type, nombre: v.type_rel.name };
  const ce = v.costo_equipo;

  // Sin costo cargado el equipo no amortiza, pero los ítems del tipo se muestran igual.
  const { accesorios_total, amortizacion_mensual, mantenimiento_mensual, costo_mensual } =
    calcularCostoMensualEquipo({
      valor_compra: ce ? ce.valor_compra.toString() : 0,
      valor_residual_pct: ce ? ce.valor_residual_pct.toString() : 0,
      anios_amortizacion: ce ? ce.anios_amortizacion : 0,
      items_tipo,
      afectacion_pct: 1,
    });

  return {
    vehiculo,
    costo: ce
      ? {
          ...ce,
          valor_compra: toClientNumber(ce.valor_compra),
          valor_residual_pct: toClientNumber(ce.valor_residual_pct),
        }
      : null,
    tipo,
    items_tipo_count: items_tipo.length,
    accesorios_total: accesorios_total.toDecimalPlaces(2).toNumber(),
    mantenimiento_mensual: mantenimiento_mensual.toDecimalPlaces(2).toNumber(),
    resumen: ce
      ? {
          amortizacion_mensual: amortizacion_mensual.toDecimalPlaces(2).toNumber(),
          costo_mensual: costo_mensual.toDecimalPlaces(2).toNumber(),
        }
      : null,
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
