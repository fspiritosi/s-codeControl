import { Decimal } from './decimal';
import type { BaseComposicion, FormulaOutput } from '../types/composicion.types';

/**
 * Magnitudes de una composición ya calculada, disponibles como bases de las
 * fórmulas de outputs. Todas en precisión completa (Decimal).
 */
export type ContextoOutput = {
  precio_mensual: Decimal;
  total_directo: Decimal;
  total_con_margenes: Decimal;
  mod: Decimal;
  ocp: Decimal;
  equipos: Decimal;
  combustible: Decimal;
};

function valorBase(ctx: ContextoOutput, base: BaseComposicion): Decimal {
  switch (base) {
    case 'precio_mensual':
      return ctx.precio_mensual;
    case 'total_directo':
      return ctx.total_directo;
    case 'total_con_margenes':
      return ctx.total_con_margenes;
    case 'mod':
      return ctx.mod;
    case 'ocp':
      return ctx.ocp;
    case 'equipos':
      return ctx.equipos;
    case 'combustible':
      return ctx.combustible;
    default: {
      const _exhaustive: never = base;
      throw new Error(`Base de composición desconocida: ${_exhaustive}`);
    }
  }
}

/**
 * Calcula el valor de un output derivado a partir de las magnitudes de la
 * composición y una fórmula configurable.
 *
 * Devuelve el valor en precisión completa (Decimal) y un `detalle` con los
 * componentes intermedios (para trazabilidad / almacenamiento en JSON).
 */
export function calcularOutput(
  ctx: ContextoOutput,
  formula: FormulaOutput
): { valor: Decimal; detalle: Record<string, unknown> } {
  switch (formula.tipo) {
    case 'precio_div_kms_x_factor': {
      const { kms_base, factor } = formula;
      if (kms_base <= 0) throw new Error('kms_base debe ser > 0');
      const valor = ctx.precio_mensual.div(kms_base).mul(factor);
      return {
        valor,
        detalle: { tipo: formula.tipo, precio_mensual: ctx.precio_mensual.toNumber(), kms_base, factor },
      };
    }

    case 'pct_sobre_precio': {
      const pct = new Decimal(formula.porcentaje);
      const factor = formula.modo === 'descuento' ? new Decimal(1).sub(pct) : new Decimal(1).add(pct);
      const valor = ctx.precio_mensual.mul(factor);
      return {
        valor,
        detalle: {
          tipo: formula.tipo,
          precio_mensual: ctx.precio_mensual.toNumber(),
          porcentaje: formula.porcentaje,
          modo: formula.modo,
        },
      };
    }

    case 'base_div_divisor': {
      const { base, divisor, factor_previo } = formula;
      if (divisor <= 0) throw new Error('divisor debe ser > 0');
      const base_valor = valorBase(ctx, base);
      const previo = factor_previo ?? 1;
      const valor = base_valor.mul(previo).div(divisor);
      return {
        valor,
        detalle: { tipo: formula.tipo, base, base_valor: base_valor.toNumber(), factor_previo: previo, divisor },
      };
    }

    case 'precio_ponderado_div_divisor': {
      const { divisor, componentes } = formula;
      if (divisor <= 0) throw new Error('divisor debe ser > 0');
      if (ctx.total_directo.isZero()) throw new Error('total_directo no puede ser 0 para ponderar');
      const ponderacion = componentes.reduce((acc, c) => {
        const proporcion = valorBase(ctx, c.base).div(ctx.total_directo);
        return acc.add(proporcion.mul(c.factor));
      }, new Decimal(0));
      const valor = ctx.precio_mensual.mul(ponderacion).div(divisor);
      return {
        valor,
        detalle: {
          tipo: formula.tipo,
          precio_mensual: ctx.precio_mensual.toNumber(),
          ponderacion: ponderacion.toNumber(),
          divisor,
          componentes,
        },
      };
    }

    default: {
      const _exhaustive: never = formula;
      throw new Error(`Tipo de fórmula de output desconocido: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
