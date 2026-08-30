import { Decimal } from './decimal';
import { calcularAmortizacionMensual } from './calcular-amortizacion';

type Num = Decimal | string | number;

export type ClaseItemCosto = 'ACCESORIO' | 'MANTENIMIENTO';

/**
 * Ítem de costo definido a nivel tipo de equipo.
 * `cantidad` significa "por unidad de equipo" en ACCESORIO y "por año" en MANTENIMIENTO.
 */
export type ItemCostoTipoCalc = {
  clase: ClaseItemCosto;
  cantidad: Num;
  precio_unitario: Num;
  is_active?: boolean | null;
};

/** Σ (cantidad × precio_unitario) de los ítems activos, separado por clase. */
export function sumarItemsTipo(items: ItemCostoTipoCalc[]): {
  accesorios: Decimal;
  mantenimiento_anual: Decimal;
} {
  let accesorios = new Decimal(0);
  let mantenimiento_anual = new Decimal(0);

  for (const item of items) {
    if (item.is_active === false) continue;
    const subtotal = new Decimal(item.cantidad).mul(new Decimal(item.precio_unitario));
    if (item.clase === 'ACCESORIO') {
      accesorios = accesorios.add(subtotal);
    } else {
      mantenimiento_anual = mantenimiento_anual.add(subtotal);
    }
  }

  return { accesorios, mantenimiento_anual };
}

export type CostoEquipoCalcInput = {
  valor_compra: Num;
  valor_residual_pct: Num;
  anios_amortizacion: number;
  /** Accesorios y mantenimiento heredados del tipo de equipo. */
  items_tipo: ItemCostoTipoCalc[];
  /** Afectación del equipo al servicio (1 = 100%). */
  afectacion_pct?: Num;
};

export type CostoEquipoCalcResult = {
  accesorios_total: Decimal;
  amortizacion_mensual: Decimal;
  mantenimiento_mensual: Decimal;
  /** (amortización + mantenimiento) × afectación */
  costo_mensual: Decimal;
};

/**
 * Costo mensual total de un equipo:
 *
 *   accesorios            = Σ (cantidad × precio_unitario)  [ACCESORIO activos]
 *   base                  = valor_compra − valor_compra × residual + accesorios
 *   amortización_mensual  = base / años / 12
 *   mantenimiento_mensual = Σ (cantidad × precio_unitario)  [MANTENIMIENTO activos] / 12
 *   costo_mensual         = (amortización + mantenimiento) × afectación
 *
 * Reproduce la hoja "Equipos" de la planilla del cliente (Transporte SP).
 */
export function calcularCostoMensualEquipo(input: CostoEquipoCalcInput): CostoEquipoCalcResult {
  const { accesorios, mantenimiento_anual } = sumarItemsTipo(input.items_tipo);

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
  };
}
