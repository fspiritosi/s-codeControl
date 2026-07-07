import { Decimal } from './decimal';
import { COSTOS_PONDERACION_TOLERANCIA } from '@/modules/costos/shared/constants';
import type { CalculoPeriodoPolinomico, VariacionComponente } from '../types/formula-polinomica.types';

type Num = Decimal | string | number;

/** Componente de la fórmula, en la forma mínima que necesita el motor. */
export type ComponenteCalc = {
  id: string;
  codigo: string;
  nombre: string;
  ponderacion: Num;
  valor_indice_base: Num;
};

export type FormulaCalc = {
  precio_base: Num;
  componentes: ComponenteCalc[];
};

/**
 * Valida que la suma de ponderaciones de los componentes sea 1 (±tolerancia).
 */
export function validarPonderaciones(
  componentes: { ponderacion: Num }[]
): { valid: boolean; suma: Decimal; error?: string } {
  const suma = componentes.reduce((acc, c) => acc.add(new Decimal(c.ponderacion)), new Decimal(0));
  const valid = suma.sub(1).abs().lte(COSTOS_PONDERACION_TOLERANCIA);
  return {
    valid,
    suma,
    error: valid ? undefined : `La suma de ponderaciones debe ser 1.0 (actual: ${suma.toFixed(4)})`,
  };
}

/**
 * Calcula un período de la fórmula polinómica.
 *
 *   variacionᵢ   = I_t(ᵢ) / I_base(ᵢ) − 1        (acumulada desde la base)
 *   contribucionᵢ = ponderaciónᵢ × variacionᵢ
 *   ajuste_acum   = Σ contribucionᵢ
 *   valor_ajustado = PB × (1 + ajuste_acum)
 *
 * Reproduce la hoja "Ev. Tarifa" de la planilla del cliente.
 * `valoresIndices` mapea componente_id → I_t (valor del índice en el período).
 */
export function calcularPeriodoFormula(
  formula: FormulaCalc,
  periodo: string,
  valoresIndices: Map<string, Num>,
  importe_certificado?: Num
): CalculoPeriodoPolinomico {
  const pb = new Decimal(formula.precio_base);

  const variaciones: VariacionComponente[] = [];
  let ajuste_acum = new Decimal(0);

  for (const c of formula.componentes) {
    const base = new Decimal(c.valor_indice_base);
    const valorIndiceRaw = valoresIndices.get(c.id);
    const valorIndice = valorIndiceRaw != null ? new Decimal(valorIndiceRaw) : base;
    const variacion = base.isZero() ? new Decimal(0) : valorIndice.div(base).sub(1);
    const contribucion = new Decimal(c.ponderacion).mul(variacion);
    ajuste_acum = ajuste_acum.add(contribucion);

    variaciones.push({
      componente_id: c.id,
      codigo: c.codigo,
      nombre: c.nombre,
      valor_indice: valorIndice.toDecimalPlaces(4).toNumber(),
      variacion_pct: variacion.toDecimalPlaces(6).toNumber(),
      contribucion_pct: contribucion.toDecimalPlaces(6).toNumber(),
    });
  }

  const ajuste_monto = pb.mul(ajuste_acum);
  const valor_ajustado = pb.add(ajuste_monto);

  const resultado: CalculoPeriodoPolinomico = {
    periodo,
    variaciones,
    ajuste_porcentual_acumulado: ajuste_acum.toDecimalPlaces(6).toNumber(),
    ajuste_monto: ajuste_monto.toDecimalPlaces(2).toNumber(),
    valor_ajustado: valor_ajustado.toDecimalPlaces(2).toNumber(),
  };

  if (importe_certificado != null) {
    const certificado = new Decimal(importe_certificado);
    resultado.importe_certificado = certificado.toDecimalPlaces(2).toNumber();
    resultado.retroactivo_periodo = valor_ajustado.sub(certificado).toDecimalPlaces(2).toNumber();
  }

  return resultado;
}

/**
 * Calcula una serie de períodos, acumulando el retroactivo (Σ de retroactivos
 * por período con certificado cargado).
 */
export function calcularSerieFormula(
  formula: FormulaCalc,
  periodos: { periodo: string; valoresIndices: Map<string, Num>; importe_certificado?: Num }[]
): CalculoPeriodoPolinomico[] {
  let retroAcum = new Decimal(0);
  return periodos.map((p) => {
    const calc = calcularPeriodoFormula(formula, p.periodo, p.valoresIndices, p.importe_certificado);
    if (calc.retroactivo_periodo != null) {
      retroAcum = retroAcum.add(calc.retroactivo_periodo);
      calc.retroactivo_acumulado = retroAcum.toDecimalPlaces(2).toNumber();
    }
    return calc;
  });
}
