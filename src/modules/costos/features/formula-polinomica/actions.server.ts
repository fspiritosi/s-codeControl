'use server';

import { prisma } from '@/shared/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { parsePeriodo } from '@/modules/costos/shared/utils/periodo';
import {
  calcularPeriodoFormula,
  validarPonderaciones,
  type FormulaCalc,
} from '@/modules/costos/shared/utils/calcular-formula-polinomica';
import { toClientNumber } from '@/modules/costos/shared/utils/decimal';
import type {
  ComponenteInput,
  CreateFormulaInput,
  UpdateFormulaInput,
  FormulaConDetalle,
  FormulaListItem,
  PeriodoConValores,
  TipoIndice,
  ValoresIndicesInput,
} from '@/modules/costos/shared/types/formula-polinomica.types';

const PATH = '/dashboard/costos/formula-polinomica';

// ─── Validación ────────────────────────────────────────────────────────────────

const tiposIndice: [TipoIndice, ...TipoIndice[]] = ['cct', 'ipim_34', 'gasoil_g3', 'ipim_ng', 'custom'];

const componenteSchema = z.object({
  codigo: z.string().min(1).max(20),
  nombre: z.string().min(1).max(120),
  tipo_indice: z.enum(tiposIndice),
  ponderacion: z.number().min(0).max(1),
  valor_indice_base: z.number().positive(),
  fuente_indice: z.string().max(160).optional(),
});

const createFormulaSchema = z.object({
  descripcion: z.string().optional(),
  fecha_base: z.string().regex(/^\d{4}-\d{2}$/),
  precio_base: z.number().positive(),
  componentes: z.array(componenteSchema).optional(),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getServicioScoped(servicioId: string, companyId: string) {
  const servicio = await prisma.servicio_contrato.findFirst({
    where: { id: servicioId, company_id: companyId },
    include: { customer: { select: { name: true } } },
  });
  if (!servicio) throw new Error('Servicio no encontrado o sin acceso');
  return servicio;
}

async function getFormulaScoped(formulaId: string, companyId: string) {
  const formula = await prisma.formula_polinomica.findFirst({
    where: { id: formulaId, servicio: { company_id: companyId } },
    include: { componentes: true },
  });
  if (!formula) throw new Error('Fórmula no encontrada o sin acceso');
  return formula;
}

// ─── Fórmula ────────────────────────────────────────────────────────────────

export async function listFormulas(): Promise<FormulaListItem[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const servicios = await prisma.servicio_contrato.findMany({
    where: { company_id: companyId },
    include: {
      customer: { select: { name: true } },
      formula_polinomica: {
        include: {
          componentes: { select: { ponderacion: true } },
          _count: { select: { periodos: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return servicios.map((s) => {
    const f = s.formula_polinomica;
    const ponderacionValida = f
      ? validarPonderaciones(f.componentes.map((c) => ({ ponderacion: c.ponderacion.toString() }))).valid
      : false;
    return {
      servicio_id: s.id,
      servicio_nombre: s.nombre,
      customer_nombre: s.customer?.name ?? '—',
      formula_id: f?.id ?? null,
      tiene_formula: !!f,
      componentes_count: f?.componentes.length ?? 0,
      periodos_count: f?._count.periodos ?? 0,
      ponderacion_valida: ponderacionValida,
    };
  });
}

export async function getFormula(servicioId: string): Promise<FormulaConDetalle | null> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const servicio = await getServicioScoped(servicioId, companyId);

  const formula = await prisma.formula_polinomica.findUnique({
    where: { servicio_id: servicioId },
    include: { componentes: { orderBy: { codigo: 'asc' } } },
  });
  if (!formula) return null;

  return {
    formula: { ...formula, precio_base: toClientNumber(formula.precio_base) },
    componentes: formula.componentes.map((c) => ({
      ...c,
      ponderacion: toClientNumber(c.ponderacion),
      valor_indice_base: toClientNumber(c.valor_indice_base),
    })),
    servicio_nombre: servicio.nombre,
    customer_nombre: servicio.customer?.name ?? '—',
  };
}

export async function createFormula(servicioId: string, input: CreateFormulaInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getServicioScoped(servicioId, companyId);
  const parsed = createFormulaSchema.parse(input);

  const formula = await prisma.formula_polinomica.create({
    data: {
      servicio_id: servicioId,
      descripcion: parsed.descripcion,
      fecha_base: parsed.fecha_base,
      precio_base: parsed.precio_base,
      ...(parsed.componentes && parsed.componentes.length > 0
        ? { componentes: { create: parsed.componentes } }
        : {}),
    },
  });
  revalidatePath(`${PATH}/${servicioId}`);
  revalidatePath(PATH);
  return formula;
}

/**
 * Inicializa la fórmula a partir de la composición más reciente del servicio:
 * precio_base = costo directo; 4 componentes I001-I004 con ponderación =
 * subtotal / costo_directo.
 */
export async function inicializarPonderacionesDesdeComposicion(servicioId: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getServicioScoped(servicioId, companyId);

  const comp = await prisma.composicion_costo.findFirst({
    where: { servicio_id: servicioId },
    orderBy: { periodo: 'desc' },
  });
  if (!comp) throw new Error('No hay composición previa para este servicio. Generá una composición primero.');

  const existente = await prisma.formula_polinomica.findUnique({ where: { servicio_id: servicioId } });
  if (existente) throw new Error('Ya existe una fórmula para este servicio.');

  const total = new Prisma.Decimal(comp.total_costo_directo);
  const pond = (v: Prisma.Decimal) => new Prisma.Decimal(v).div(total).toDecimalPlaces(4);

  const componentes = [
    { codigo: 'I001', nombre: 'Mano de Obra Directa', tipo_indice: 'cct' as TipoIndice, ponderacion: pond(comp.subtotal_mod), valor_indice_base: comp.subtotal_mod, fuente_indice: 'CCT 545/08 UOCRA Petroleros' },
    { codigo: 'I002', nombre: 'Equipos', tipo_indice: 'ipim_34' as TipoIndice, ponderacion: pond(comp.subtotal_equipos), valor_indice_base: comp.subtotal_equipos, fuente_indice: 'IPIM 34 (Vehículos automotores)' },
    { codigo: 'I003', nombre: 'Combustible', tipo_indice: 'gasoil_g3' as TipoIndice, ponderacion: pond(comp.subtotal_combustible), valor_indice_base: comp.subtotal_combustible, fuente_indice: 'Gas Oil Grado 3' },
    { codigo: 'I004', nombre: 'Otros Costos', tipo_indice: 'ipim_ng' as TipoIndice, ponderacion: pond(comp.subtotal_ocp), valor_indice_base: comp.subtotal_ocp, fuente_indice: 'IPIM Nivel General' },
  ];

  const formula = await prisma.formula_polinomica.create({
    data: {
      servicio_id: servicioId,
      descripcion: `Inicializada desde composición ${comp.periodo}`,
      fecha_base: comp.periodo,
      precio_base: comp.total_costo_directo,
      componentes: { create: componentes },
    },
  });
  revalidatePath(`${PATH}/${servicioId}`);
  revalidatePath(PATH);
  return formula;
}

export async function updateFormula(id: string, input: UpdateFormulaInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const formula = await getFormulaScoped(id, companyId);
  const parsed = createFormulaSchema.partial().parse(input);

  const updated = await prisma.formula_polinomica.update({
    where: { id },
    data: {
      ...(parsed.descripcion !== undefined ? { descripcion: parsed.descripcion } : {}),
      ...(parsed.fecha_base !== undefined ? { fecha_base: parsed.fecha_base } : {}),
      ...(parsed.precio_base !== undefined ? { precio_base: parsed.precio_base } : {}),
    },
  });
  revalidatePath(`${PATH}/${formula.servicio_id}`);
  return updated;
}

// ─── Componentes ──────────────────────────────────────────────────────────────

export async function addComponente(formulaId: string, input: ComponenteInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const formula = await getFormulaScoped(formulaId, companyId);
  const parsed = componenteSchema.parse(input);

  const componente = await prisma.componente_formula.create({ data: { formula_id: formulaId, ...parsed } });
  revalidatePath(`${PATH}/${formula.servicio_id}`);
  return componente;
}

export async function updateComponente(id: string, input: Partial<ComponenteInput>) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const existente = await prisma.componente_formula.findFirst({
    where: { id, formula: { servicio: { company_id: companyId } } },
    include: { formula: { select: { servicio_id: true } } },
  });
  if (!existente) throw new Error('Componente no encontrado o sin acceso');
  const parsed = componenteSchema.partial().parse(input);

  const componente = await prisma.componente_formula.update({ where: { id }, data: parsed });
  revalidatePath(`${PATH}/${existente.formula.servicio_id}`);
  return componente;
}

export async function deleteComponente(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const existente = await prisma.componente_formula.findFirst({
    where: { id, formula: { servicio: { company_id: companyId } } },
    include: { formula: { select: { servicio_id: true } } },
  });
  if (!existente) throw new Error('Componente no encontrado o sin acceso');

  await prisma.componente_formula.delete({ where: { id } });
  revalidatePath(`${PATH}/${existente.formula.servicio_id}`);
}

// ─── Períodos ─────────────────────────────────────────────────────────────────

export async function listPeriodos(formulaId: string): Promise<PeriodoConValores[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getFormulaScoped(formulaId, companyId);

  const periodos = await prisma.periodo_formula_polinomica.findMany({
    where: { formula_id: formulaId },
    include: { valores: { include: { componente: { select: { codigo: true } } } } },
    orderBy: { periodo: 'asc' },
  });

  return periodos.map((p) => ({
    id: p.id,
    periodo: p.periodo,
    ajuste_porcentual_acumulado: toClientNumber(p.ajuste_porcentual_acumulado),
    ajuste_monto: toClientNumber(p.ajuste_monto),
    valor_ajustado: toClientNumber(p.valor_ajustado),
    importe_certificado: p.importe_certificado != null ? toClientNumber(p.importe_certificado) : null,
    retroactivo_acumulado: p.retroactivo_acumulado != null ? toClientNumber(p.retroactivo_acumulado) : null,
    valores: p.valores.map((v) => ({
      componente_id: v.componente_id,
      codigo: v.componente?.codigo ?? '—',
      valor_indice: toClientNumber(v.valor_indice),
      variacion_pct: toClientNumber(v.variacion_pct),
      contribucion_pct: toClientNumber(v.contribucion_pct),
    })),
  }));
}

/** Recalcula el retroactivo acumulado (cronológico) de todos los períodos. */
async function recomputarRetroactivos(formulaId: string) {
  const periodos = await prisma.periodo_formula_polinomica.findMany({
    where: { formula_id: formulaId },
    orderBy: { periodo: 'asc' },
  });
  let acum = new Prisma.Decimal(0);
  for (const p of periodos) {
    if (p.importe_certificado != null) {
      acum = acum.add(new Prisma.Decimal(p.valor_ajustado).sub(p.importe_certificado));
      await prisma.periodo_formula_polinomica.update({
        where: { id: p.id },
        data: { retroactivo_acumulado: acum },
      });
    }
  }
}

export async function upsertPeriodo(
  formulaId: string,
  periodo: string,
  valoresIndices: ValoresIndicesInput,
  importe_certificado?: number
): Promise<PeriodoConValores> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const formula = await getFormulaScoped(formulaId, companyId);
  parsePeriodo(periodo);

  const formulaCalc: FormulaCalc = {
    precio_base: formula.precio_base.toString(),
    componentes: formula.componentes.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      nombre: c.nombre,
      ponderacion: c.ponderacion.toString(),
      valor_indice_base: c.valor_indice_base.toString(),
    })),
  };

  const mapaIndices = new Map<string, number>(Object.entries(valoresIndices));
  const calc = calcularPeriodoFormula(formulaCalc, periodo, mapaIndices, importe_certificado);

  const periodoRow = await prisma.periodo_formula_polinomica.upsert({
    where: { formula_id_periodo: { formula_id: formulaId, periodo } },
    create: {
      formula_id: formulaId,
      servicio_id: formula.servicio_id,
      periodo,
      ajuste_porcentual_acumulado: calc.ajuste_porcentual_acumulado,
      ajuste_monto: calc.ajuste_monto,
      valor_ajustado: calc.valor_ajustado,
      importe_certificado: calc.importe_certificado ?? null,
    },
    update: {
      ajuste_porcentual_acumulado: calc.ajuste_porcentual_acumulado,
      ajuste_monto: calc.ajuste_monto,
      valor_ajustado: calc.valor_ajustado,
      importe_certificado: calc.importe_certificado ?? null,
    },
  });

  // Reemplaza los valores por componente.
  await prisma.valor_componente_periodo.deleteMany({ where: { periodo_id: periodoRow.id } });
  await prisma.valor_componente_periodo.createMany({
    data: calc.variaciones.map((v) => ({
      periodo_id: periodoRow.id,
      componente_id: v.componente_id,
      valor_indice: v.valor_indice,
      variacion_pct: v.variacion_pct,
      contribucion_pct: v.contribucion_pct,
    })),
  });

  await recomputarRetroactivos(formulaId);

  revalidatePath(`${PATH}/${formula.servicio_id}`);
  const [actualizado] = (await listPeriodos(formulaId)).filter((p) => p.periodo === periodo);
  return actualizado;
}

export async function deletePeriodo(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const existente = await prisma.periodo_formula_polinomica.findFirst({
    where: { id, formula: { servicio: { company_id: companyId } } },
    include: { formula: { select: { id: true, servicio_id: true } } },
  });
  if (!existente) throw new Error('Período no encontrado o sin acceso');

  await prisma.periodo_formula_polinomica.delete({ where: { id } });
  await recomputarRetroactivos(existente.formula.id);
  revalidatePath(`${PATH}/${existente.formula.servicio_id}`);
}
