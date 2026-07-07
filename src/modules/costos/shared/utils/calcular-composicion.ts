import { Decimal } from './decimal';
import { calcularOutput, type ContextoOutput } from './calcular-outputs';
import type {
  ComponerCostosInput,
  ComposicionDetalle,
  FormulaOutput,
  MargenAplicado,
  OutputCalculado,
} from '../types/composicion.types';

function margenAplicado(totalConMargenes: Decimal, pct: number): MargenAplicado {
  return {
    pct,
    monto: totalConMargenes.mul(pct).toDecimalPlaces(2).toNumber(),
  };
}

/**
 * Motor puro de composición de costos. Reproduce la hoja "Resumen" de la
 * planilla del cliente (Transporte SP):
 *
 *   total_directo      = mod + ocp + equipos + combustible
 *   suma_margenes      = iibb + debcred + estructura + ganancia
 *   total_con_margenes = total_directo / (1 − suma_margenes)          (margen por divisor)
 *   licencia_aplicada  = total_con_margenes × licencia_ordenanza
 *   precio_mensual     = total_con_margenes + licencia_aplicada
 *
 * Los subtotales se reciben en precisión completa (Decimal) para reproducir el
 * centavo exacto de la planilla. Los outputs derivados se calculan sobre el
 * precio ya obtenido.
 */
export function componerCostos(input: ComponerCostosInput): ComposicionDetalle {
  const mod = new Decimal(input.subtotales.mod);
  const ocp = new Decimal(input.subtotales.ocp);
  const equipos = new Decimal(input.subtotales.equipos);
  const combustible = new Decimal(input.subtotales.combustible);

  const total_directo = mod.add(ocp).add(equipos).add(combustible);

  const m = input.margenes;
  const suma_margenes = new Decimal(m.margen_iibb)
    .add(m.margen_debcred)
    .add(m.margen_estructura)
    .add(m.margen_ganancia);

  const divisor = new Decimal(1).sub(suma_margenes);
  if (divisor.lte(0)) {
    throw new Error('La suma de márgenes no puede ser ≥ 100%');
  }
  const total_con_margenes = total_directo.div(divisor);
  const licencia_aplicada = total_con_margenes.mul(m.licencia_ordenanza);
  const precio_mensual = total_con_margenes.add(licencia_aplicada);

  // Contexto para los outputs derivados (precisión completa).
  const ctx: ContextoOutput = {
    precio_mensual,
    total_directo,
    total_con_margenes,
    mod,
    ocp,
    equipos,
    combustible,
  };

  const outputs: OutputCalculado[] = input.outputs.map((o) => {
    const { valor, detalle } = calcularOutput(ctx, o.formula as FormulaOutput);
    return {
      tipo_output_id: o.id,
      codigo: o.codigo,
      nombre: o.nombre,
      valor: valor.toDecimalPlaces(4).toNumber(),
      detalle_calculo: detalle,
    };
  });

  return {
    servicio_id: input.servicio_id,
    periodo: input.periodo,
    config_cct_id: input.config_cct_id,

    resumenMOD: input.resumenMOD ?? null,
    resumenOCP: input.resumenOCP ?? null,
    resumenEquipos: input.resumenEquipos ?? null,
    resumenCombustible: input.resumenCombustible ?? null,

    subtotales: {
      mod: mod.toDecimalPlaces(2).toNumber(),
      ocp: ocp.toDecimalPlaces(2).toNumber(),
      equipos: equipos.toDecimalPlaces(2).toNumber(),
      combustible: combustible.toDecimalPlaces(2).toNumber(),
    },
    total_costo_directo: total_directo.toDecimalPlaces(2).toNumber(),

    margenes: {
      iibb: margenAplicado(total_con_margenes, m.margen_iibb),
      debcred: margenAplicado(total_con_margenes, m.margen_debcred),
      estructura: margenAplicado(total_con_margenes, m.margen_estructura),
      ganancia: margenAplicado(total_con_margenes, m.margen_ganancia),
    },
    suma_margenes: suma_margenes.toNumber(),
    total_con_margenes: total_con_margenes.toDecimalPlaces(2).toNumber(),
    licencia_ordenanza: margenAplicado(total_con_margenes, m.licencia_ordenanza),
    precio_mensual: precio_mensual.toDecimalPlaces(2).toNumber(),

    outputs,
  };
}
