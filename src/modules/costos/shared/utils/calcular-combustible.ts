import { Decimal } from './decimal';

type Num = Decimal | string | number;

export type CombustibleCalcInput = {
  litros_mensuales: Num;
  precio_gasoil_lt: Num;
  litros_urea?: Num;
  precio_urea_lt?: Num;
};

/**
 * Costo mensual de combustible de un equipo:
 *
 *   litros_mensuales × precio_gasoil_lt + litros_urea × precio_urea_lt
 *
 * Reproduce la planilla del cliente (Transporte SP — hoja "Combustible").
 */
export function calcularCostoCombustible(input: CombustibleCalcInput): Decimal {
  const gasoil = new Decimal(input.litros_mensuales).mul(new Decimal(input.precio_gasoil_lt));
  const urea = new Decimal(input.litros_urea ?? 0).mul(new Decimal(input.precio_urea_lt ?? 0));
  return gasoil.add(urea);
}
