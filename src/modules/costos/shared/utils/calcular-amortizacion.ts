import { Decimal } from './decimal';

type Num = Decimal | string | number;

/**
 * Amortización mensual de un equipo (método lineal).
 *
 *   base_amortizable = valor_compra − (valor_compra × valor_residual_pct) + accesorios
 *   amortización_mensual = base_amortizable / años / 12
 *
 * Reproduce la planilla del cliente (Transporte SP — hoja "Equipos").
 */
export function calcularAmortizacionMensual(
  valor_compra: Num,
  valor_residual_pct: Num,
  anios_amortizacion: number,
  accesorios: Num = 0
): Decimal {
  const compra = new Decimal(valor_compra);
  const residual = compra.mul(new Decimal(valor_residual_pct));
  const base = compra.sub(residual).add(new Decimal(accesorios));
  if (anios_amortizacion <= 0) return new Decimal(0);
  return base.div(anios_amortizacion).div(12);
}
