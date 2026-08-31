'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { Decimal, toClientNumber } from '@/modules/costos/shared/utils/decimal';
import { calcularCostoMensualEquipo } from '@/modules/costos/shared/utils/calcular-costo-equipo';
import type { ConceptoEquipoCalc } from '@/modules/costos/shared/utils/calcular-conceptos-equipo';
import { describirCalculo } from '@/modules/costos/shared/validators/concepto-equipo';
import { conceptosPorTipoDeEmpresa } from '@/modules/costos/shared/utils/conceptos-por-tipo';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type {
  VehiculoConCosto,
  VehiculoResumen,
  CostoEquipoClient,
  CostoEquipoInput,
  ConceptoResueltoClient,
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

/**
 * Conceptos activos del tipo de un solo equipo, en una query, con el nombre de cada uno:
 * el desglose de la pantalla de edición necesita mostrarlos por nombre, y el motor sólo
 * trabaja con códigos.
 */
async function conceptosDelTipo(
  companyId: string,
  typeId: string
): Promise<{ conceptos: ConceptoEquipoCalc[]; nombrePorCodigo: Map<string, string> }> {
  const perfil = await prisma.costo_tipo_equipo.findUnique({
    where: { company_id_type_id: { company_id: companyId, type_id: typeId } },
    include: {
      conceptos: { where: { is_active: true }, orderBy: { orden: 'asc' }, include: { concepto: true } },
    },
  });
  const activos = (perfil?.conceptos ?? []).map((a) => a.concepto).filter((c) => c.is_active);

  return {
    conceptos: activos.map((c) => ({
      codigo: c.codigo,
      clase: c.clase,
      clase_calculo: c.clase_calculo,
      parametros: (c.parametros ?? {}) as Record<string, unknown>,
    })),
    nombrePorCodigo: new Map(activos.map((c) => [c.codigo, c.nombre])),
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listVehiculosConCosto(): Promise<VehiculoConCosto[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const [vehiculos, conceptosPorTipo] = await Promise.all([
    prisma.vehicles.findMany({
      where: { company_id: companyId },
      include: {
        brand_rel: { select: { name: true } },
        model_rel: { select: { name: true } },
        costo_equipo: true,
      },
      orderBy: { intern_number: 'asc' },
    }),
    conceptosPorTipoDeEmpresa(companyId),
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
        km_anuales: ce.km_anuales,
        conceptos: conceptosPorTipo.get(v.type) ?? [],
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
      items_count: (conceptosPorTipo.get(v.type) ?? []).length,
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
  /** Desglose por concepto ya resuelto para ESTA unidad: es donde el 17% se vuelve un número. */
  conceptos_resueltos: ConceptoResueltoClient[];
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

  const { conceptos, nombrePorCodigo } = await conceptosDelTipo(companyId, v.type);
  const tipo = { id: v.type, nombre: v.type_rel.name };
  const ce = v.costo_equipo;

  // Sin costo cargado el equipo no amortiza, pero los conceptos del tipo se muestran igual.
  const {
    accesorios_total,
    amortizacion_mensual,
    mantenimiento_mensual,
    costo_mensual,
    por_concepto,
  } = calcularCostoMensualEquipo({
    valor_compra: ce ? ce.valor_compra.toString() : 0,
    valor_residual_pct: ce ? ce.valor_residual_pct.toString() : 0,
    anios_amortizacion: ce ? ce.anios_amortizacion : 0,
    km_anuales: ce ? ce.km_anuales : 0,
    conceptos,
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
    items_tipo_count: conceptos.length,
    accesorios_total: accesorios_total.toDecimalPlaces(2).toNumber(),
    mantenimiento_mensual: mantenimiento_mensual.toDecimalPlaces(2).toNumber(),
    conceptos_resueltos: conceptos.map((c) => ({
      codigo: c.codigo,
      nombre: nombrePorCodigo.get(c.codigo) ?? c.codigo,
      clase: c.clase,
      descripcion_calculo: describirCalculo(c.clase_calculo, c.parametros),
      importe: (por_concepto.get(c.codigo) ?? new Decimal(0)).toDecimalPlaces(2).toNumber(),
    })),
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
