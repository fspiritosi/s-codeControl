import { Decimal } from './decimal';
import { prisma } from '@/shared/lib/prisma';
import { calcularCostoMensualEquipo, type ItemCostoTipoCalc } from './calcular-costo-equipo';
import type { ResumenEquipos, ResumenEquiposVehiculo } from '../types/composicion.types';

type Num = Decimal | string | number;

/** Datos de un equipo asignado a un servicio, listos para el cálculo. */
export type EquipoServicioCalc = {
  asignacion_id: string;
  vehicle_id: string;
  interno: string;
  descripcion: string;
  afectacion_pct: Num;
  valor_compra: Num;
  valor_residual_pct: Num;
  anios_amortizacion: number;
  /** Accesorios y mantenimiento heredados del tipo de equipo. */
  items_tipo: ItemCostoTipoCalc[];
};

export type EquipoServicioResultado = {
  asignacion_id: string;
  vehicle_id: string;
  interno: string;
  descripcion: string;
  afectacion_pct: Decimal;
  accesorios_total: Decimal;
  amortizacion_mensual: Decimal;
  mantenimiento_mensual: Decimal;
  costo_mensual: Decimal; // ya afectado
};

/**
 * Agrega el costo mensual de todos los equipos de un servicio.
 *
 *   costo_equipo = (amortización + mantenimiento) × afectación
 *   total_equipos = Σ costo_equipo
 *
 * Función pura — reproduce la hoja "Equipos" de la planilla del cliente.
 */
export function agregarEquipos(equipos: EquipoServicioCalc[]): {
  por_vehiculo: EquipoServicioResultado[];
  total_equipos: Decimal;
} {
  const por_vehiculo = equipos.map((e): EquipoServicioResultado => {
    const { accesorios_total, amortizacion_mensual, mantenimiento_mensual, costo_mensual } =
      calcularCostoMensualEquipo({
        valor_compra: e.valor_compra,
        valor_residual_pct: e.valor_residual_pct,
        anios_amortizacion: e.anios_amortizacion,
        items_tipo: e.items_tipo,
        afectacion_pct: e.afectacion_pct,
      });
    return {
      asignacion_id: e.asignacion_id,
      vehicle_id: e.vehicle_id,
      interno: e.interno,
      descripcion: e.descripcion,
      afectacion_pct: new Decimal(e.afectacion_pct),
      accesorios_total,
      amortizacion_mensual,
      mantenimiento_mensual,
      costo_mensual,
    };
  });

  const total_equipos = por_vehiculo.reduce((acc, e) => acc.add(e.costo_mensual), new Decimal(0));
  return { por_vehiculo, total_equipos };
}

/**
 * Versión que consulta la DB (asignaciones de equipos del servicio + los ítems del
 * tipo de cada equipo) y retorna el resumen client-safe (Decimal → number). Sólo
 * considera equipos activos con costo cargado.
 */
export async function calcularEquiposServicio(servicioId: string): Promise<ResumenEquipos> {
  const servicio = await prisma.servicio_contrato.findUniqueOrThrow({
    where: { id: servicioId },
    select: { company_id: true },
  });

  // Los perfiles por tipo se traen en una sola query y se resuelven con un Map, para
  // no disparar un include por vehículo (N+1).
  const [asignaciones, perfiles] = await Promise.all([
    prisma.asignacion_equipo_servicio.findMany({
      where: { servicio_id: servicioId, is_active: true },
      include: {
        vehicle: {
          select: {
            intern_number: true,
            domain: true,
            type: true,
            brand_rel: { select: { name: true } },
            model_rel: { select: { name: true } },
            costo_equipo: true,
          },
        },
      },
      orderBy: { vehicle: { intern_number: 'asc' } },
    }),
    prisma.costo_tipo_equipo.findMany({
      where: { company_id: servicio.company_id },
      include: { items: { where: { is_active: true } } },
    }),
  ]);

  const itemsPorTipo = new Map(
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

  // Se excluye el equipo sin costo_equipo activo. Que su tipo no tenga perfil NO lo
  // excluye: amortiza igual, con accesorios y mantenimiento en cero.
  const conCosto = asignaciones.filter((a) => a.vehicle.costo_equipo && a.vehicle.costo_equipo.is_active);

  const { por_vehiculo, total_equipos } = agregarEquipos(
    conCosto.map((a) => {
      const c = a.vehicle.costo_equipo!;
      const descripcion =
        `${a.vehicle.brand_rel?.name ?? ''} ${a.vehicle.model_rel?.name ?? ''}`.trim() ||
        a.vehicle.domain ||
        '—';
      return {
        asignacion_id: a.id,
        vehicle_id: a.vehicle_id,
        interno: a.vehicle.intern_number ?? '—',
        descripcion,
        afectacion_pct: a.afectacion_pct.toString(),
        valor_compra: c.valor_compra.toString(),
        valor_residual_pct: c.valor_residual_pct.toString(),
        anios_amortizacion: c.anios_amortizacion,
        items_tipo: itemsPorTipo.get(a.vehicle.type) ?? [],
      };
    })
  );

  const por_vehiculoClient: ResumenEquiposVehiculo[] = por_vehiculo.map((e) => ({
    asignacion_id: e.asignacion_id,
    vehicle_id: e.vehicle_id,
    interno: e.interno,
    descripcion: e.descripcion,
    afectacion_pct: e.afectacion_pct.toNumber(),
    amortizacion_mensual: e.amortizacion_mensual.toDecimalPlaces(2).toNumber(),
    mantenimiento_mensual: e.mantenimiento_mensual.toDecimalPlaces(2).toNumber(),
    costo_mensual: e.costo_mensual.toDecimalPlaces(2).toNumber(),
  }));

  return {
    servicio_id: servicioId,
    por_vehiculo: por_vehiculoClient,
    total_equipos: total_equipos.toDecimalPlaces(2).toNumber(),
  };
}
