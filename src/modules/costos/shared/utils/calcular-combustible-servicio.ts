import { Decimal } from './decimal';
import { prisma } from '@/shared/lib/prisma';
import { calcularCostoCombustible } from './calcular-combustible';
import type { ResumenCombustible, ResumenCombustibleVehiculo } from '../types/composicion.types';

type Num = Decimal | string | number;

/** Registro de combustible de un servicio/período, listo para el cálculo. */
export type RegistroCombustibleCalc = {
  vehicle_id: string;
  interno: string;
  litros_mensuales: Num;
  precio_gasoil_lt: Num;
  litros_urea?: Num;
  precio_urea_lt?: Num;
};

/**
 * Agrega el costo de combustible de un servicio para un período.
 *
 *   costo_registro = litros × precio_gasoil + litros_urea × precio_urea
 *   total_combustible = Σ costo_registro
 *
 * Función pura — reproduce la hoja "Combustible" de la planilla del cliente.
 */
export function agregarCombustible(registros: RegistroCombustibleCalc[]): {
  por_vehiculo: (RegistroCombustibleCalc & { costo_total: Decimal })[];
  total_combustible: Decimal;
} {
  const por_vehiculo = registros.map((r) => ({
    ...r,
    costo_total: calcularCostoCombustible({
      litros_mensuales: r.litros_mensuales,
      precio_gasoil_lt: r.precio_gasoil_lt,
      litros_urea: r.litros_urea ?? 0,
      precio_urea_lt: r.precio_urea_lt ?? 0,
    }),
  }));
  const total_combustible = por_vehiculo.reduce((acc, r) => acc.add(r.costo_total), new Decimal(0));
  return { por_vehiculo, total_combustible };
}

/**
 * Versión que consulta la DB (registros de combustible del servicio en el
 * período) y retorna el resumen client-safe (Decimal → number).
 */
export async function calcularCombustibleServicio(
  servicioId: string,
  periodo: string
): Promise<ResumenCombustible> {
  const registros = await prisma.registro_combustible.findMany({
    where: { servicio_id: servicioId, periodo },
    include: { vehicle: { select: { intern_number: true } } },
    orderBy: { vehicle: { intern_number: 'asc' } },
  });

  const { por_vehiculo, total_combustible } = agregarCombustible(
    registros.map((r) => ({
      vehicle_id: r.vehicle_id,
      interno: r.vehicle?.intern_number ?? '—',
      litros_mensuales: r.litros_mensuales.toString(),
      precio_gasoil_lt: r.precio_gasoil_lt.toString(),
      litros_urea: r.litros_urea.toString(),
      precio_urea_lt: r.precio_urea_lt.toString(),
    }))
  );

  const por_vehiculoClient: ResumenCombustibleVehiculo[] = por_vehiculo.map((r) => ({
    vehicle_id: r.vehicle_id,
    interno: r.interno,
    litros_mensuales: new Decimal(r.litros_mensuales).toNumber(),
    precio_gasoil_lt: new Decimal(r.precio_gasoil_lt).toNumber(),
    litros_urea: new Decimal(r.litros_urea ?? 0).toNumber(),
    precio_urea_lt: new Decimal(r.precio_urea_lt ?? 0).toNumber(),
    costo_total: r.costo_total.toDecimalPlaces(2).toNumber(),
  }));

  return {
    servicio_id: servicioId,
    periodo,
    por_vehiculo: por_vehiculoClient,
    total_combustible: total_combustible.toDecimalPlaces(2).toNumber(),
  };
}
