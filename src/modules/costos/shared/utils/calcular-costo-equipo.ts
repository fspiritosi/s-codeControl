import { Decimal } from './decimal';
import { calcularAmortizacionMensual } from './calcular-amortizacion';
import { calcularConceptosEquipo, type ConceptoEquipoCalc } from './calcular-conceptos-equipo';

type Num = Decimal | string | number;

export type ClaseItemCosto = 'ACCESORIO' | 'MANTENIMIENTO';

export type CostoEquipoCalcInput = {
  valor_compra: Num;
  valor_residual_pct: Num;
  anios_amortizacion: number;
  km_anuales: number;
  /** Conceptos heredados del tipo, resueltos con los valores de ESTA unidad. */
  conceptos: ConceptoEquipoCalc[];
  afectacion_pct?: Num;
};

export type CostoEquipoCalcResult = {
  accesorios_total: Decimal;
  amortizacion_mensual: Decimal;
  mantenimiento_mensual: Decimal;
  costo_mensual: Decimal;
  /** Importe resuelto de cada concepto para esta unidad, por código. */
  por_concepto: Map<string, Decimal>;
};

/**
 * Costo mensual total de un equipo:
 *
 *   accesorios, mantenimiento_anual = resolución de los conceptos del tipo para ESTA unidad
 *   base                  = valor_compra − valor_compra × residual + accesorios
 *   amortización_mensual  = base / años / 12
 *   mantenimiento_mensual = mantenimiento_anual / 12
 *   costo_mensual         = (amortización + mantenimiento) × afectación
 *
 * Reproduce la hoja "Equipos" de la planilla del cliente (Transporte SP).
 */
export function calcularCostoMensualEquipo(input: CostoEquipoCalcInput): CostoEquipoCalcResult {
  const { accesorios, mantenimiento_anual, por_concepto } = calcularConceptosEquipo(
    input.conceptos,
    {
      valor_compra: input.valor_compra,
      valor_residual_pct: input.valor_residual_pct,
      km_anuales: input.km_anuales,
    }
  );

  const amortizacion_mensual = calcularAmortizacionMensual(
    input.valor_compra,
    input.valor_residual_pct,
    input.anios_amortizacion,
    accesorios
  );
  const mantenimiento_mensual = mantenimiento_anual.div(12);
  const afectacion = new Decimal(input.afectacion_pct ?? 1);
  const costo_mensual = amortizacion_mensual.add(mantenimiento_mensual).mul(afectacion);

  return {
    accesorios_total: accesorios,
    amortizacion_mensual,
    mantenimiento_mensual,
    costo_mensual,
    por_concepto,
  };
}
