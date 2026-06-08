'use server';

import { Decimal } from './decimal';
import { prisma } from '@/shared/lib/prisma';
import { ejecutarMotor } from './motor-conceptos';
import type {
  ConceptoCCTClient,
  ContextoCalculo,
  TopeImponibleClient,
  ResultadoMotor,
} from '../types/cct.types';
import type { ResumenMOD, ResumenMODChofer, OverridesCalculo } from '../types/mod.types';

/**
 * Carga los conceptos activos de un CCT (con sus valores por categoría enriquecidos
 * con `categoria_codigo`) y los topes imponibles, listos para `ejecutarMotor`.
 */
export async function cargarConceptosCCT(
  configCctId: string
): Promise<{ conceptos: ConceptoCCTClient[]; topes: TopeImponibleClient[] }> {
  const [conceptosRaw, topesRaw] = await Promise.all([
    prisma.concepto_cct.findMany({
      where: { config_cct_id: configCctId, is_active: true },
      orderBy: { orden: 'asc' },
      include: { valores: { include: { categoria: { select: { codigo: true } } } } },
    }),
    prisma.tope_imponible.findMany(),
  ]);

  const conceptos: ConceptoCCTClient[] = conceptosRaw.map((c) => ({
    ...c,
    parametros: c.parametros as ConceptoCCTClient['parametros'],
    valores: c.valores.map((v) => ({
      ...v,
      valor: Number(v.valor),
      // El motor (FIJO_POR_CATEGORIA) busca por categoria_codigo.
      categoria_codigo: v.categoria.codigo,
    })) as ConceptoCCTClient['valores'],
  }));

  const topes: TopeImponibleClient[] = topesRaw.map((t) => ({ ...t, valor: Number(t.valor) }));
  return { conceptos, topes };
}

/** Resuelve el CCT para un contexto dado (corre el motor de conceptos). */
export async function resolverCCT(configCctId: string, ctx: ContextoCalculo, periodo: string): Promise<ResultadoMotor> {
  const { conceptos, topes } = await cargarConceptosCCT(configCctId);
  return ejecutarMotor(conceptos, ctx, topes, periodo);
}

function ctxDesdeAsignacion(
  categoriaCodigo: string,
  antiguedad: number,
  overrides: OverridesCalculo | null
): ContextoCalculo {
  const ov = overrides ?? {};
  return {
    categoria_codigo: categoriaCodigo,
    antiguedad_anios: antiguedad,
    dias_trabajados: ov.dias_trabajados ?? 30,
    hs_nocturnas: ov.hs_nocturnas ?? 0,
    hs_extras_50: ov.hs_extras_50 ?? 0,
    hs_extras_100: ov.hs_extras_100 ?? 0,
    dias_feriado: ov.dias_feriado ?? 0,
    dias_desarraigo: ov.dias_desarraigo ?? 0,
    overrides: ov as Record<string, number>,
  };
}

/**
 * Calcula el costo de mano de obra directa de un servicio para un período:
 * por cada asignación activa, corre el motor del CCT y suma los conceptos que
 * aplican al MOD del servicio, ajustado por afectación.
 */
export async function calcularMOD(servicioId: string, periodo: string): Promise<ResumenMOD> {
  const servicio = await prisma.servicio_contrato.findUnique({
    where: { id: servicioId },
    include: {
      asignaciones_mod: {
        where: { is_active: true },
        include: {
          employee: { select: { firstname: true, lastname: true } },
          categoria: { select: { codigo: true } },
        },
      },
    },
  });
  if (!servicio) throw new Error('Servicio no encontrado');

  // Cargar conceptos + topes una sola vez (mismo CCT para todos los choferes).
  const { conceptos, topes } = await cargarConceptosCCT(servicio.config_cct_id);

  const por_chofer: ResumenMODChofer[] = [];
  for (const a of servicio.asignaciones_mod) {
    const ctx = ctxDesdeAsignacion(a.categoria.codigo, a.antiguedad_anios, a.overrides_calculo as OverridesCalculo | null);
    const resultado = ejecutarMotor(conceptos, ctx, topes, periodo);

    // El bruto del MOD-servicio: conceptos cuyo ámbito incluye 'mod_servicio'.
    const lineasMOD = resultado.lineas.filter((l) => l.aplica_en.includes('mod_servicio'));
    const bruto = lineasMOD.reduce((acc, l) => acc.add(new Decimal(l.importe)), new Decimal(0));
    const afectacion = new Decimal(a.afectacion_pct.toString());
    const total = bruto.mul(afectacion);

    por_chofer.push({
      asignacion_id: a.id,
      employee_id: a.employee_id,
      employee_nombre: `${a.employee.lastname}, ${a.employee.firstname}`,
      categoria_codigo: a.categoria.codigo,
      antiguedad_anios: a.antiguedad_anios,
      afectacion_pct: Number(a.afectacion_pct),
      lineas: lineasMOD,
      bruto_chofer: bruto.toDecimalPlaces(2).toNumber(),
      total_chofer: total.toDecimalPlaces(2).toNumber(),
    });
  }

  const total_mod = por_chofer.reduce((acc, c) => acc.add(new Decimal(c.total_chofer)), new Decimal(0));

  return {
    servicio_id: servicioId,
    periodo,
    config_cct_id: servicio.config_cct_id,
    por_chofer,
    total_mod: total_mod.toDecimalPlaces(2).toNumber(),
  };
}
