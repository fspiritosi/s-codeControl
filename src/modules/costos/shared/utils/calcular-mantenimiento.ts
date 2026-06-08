import { Decimal } from './decimal';
import { calcularAmortizacionMensual } from './calcular-amortizacion';

type Num = Decimal | string | number;

export type ItemMantCalc = { precio_anual: Num; is_active?: boolean | null };

/**
 * Mantenimiento mensual: suma de los `precio_anual` de los ítems activos / 12.
 */
export function calcularMantenimientoMensual(items: ItemMantCalc[]): Decimal {
  return items
    .filter((i) => i.is_active !== false)
    .reduce((acc, i) => acc.add(new Decimal(i.precio_anual)), new Decimal(0))
    .div(12);
}

export type CostoEquipoCalcInput = {
  valor_compra: Num;
  valor_residual_pct: Num;
  anios_amortizacion: number;
  accesorios?: Num;
  items: ItemMantCalc[];
  /** Afectación del equipo al servicio (1 = 100%). */
  afectacion_pct?: Num;
};

export type CostoEquipoCalcResult = {
  amortizacion_mensual: Decimal;
  mantenimiento_mensual: Decimal;
  /** (amortización + mantenimiento) × afectación */
  costo_mensual: Decimal;
};

/**
 * Costo mensual total de un equipo: amortización + mantenimiento, ajustado por afectación.
 */
export function calcularCostoMensualEquipo(input: CostoEquipoCalcInput): CostoEquipoCalcResult {
  const amortizacion_mensual = calcularAmortizacionMensual(
    input.valor_compra,
    input.valor_residual_pct,
    input.anios_amortizacion,
    input.accesorios ?? 0
  );
  const mantenimiento_mensual = calcularMantenimientoMensual(input.items);
  const afectacion = new Decimal(input.afectacion_pct ?? 1);
  const costo_mensual = amortizacion_mensual.add(mantenimiento_mensual).mul(afectacion);
  return { amortizacion_mensual, mantenimiento_mensual, costo_mensual };
}
