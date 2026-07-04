'use server';

import { prisma } from '@/shared/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { COSTOS_PDF_PATHS } from '@/modules/costos/shared/constants';
import { parsePeriodo } from '@/modules/costos/shared/utils/periodo';
import { calcularMOD } from '@/modules/costos/shared/utils/calcular-mod';
import { calcularOCP } from '@/modules/costos/shared/utils/calcular-ocp';
import { calcularEquiposServicio } from '@/modules/costos/shared/utils/calcular-equipos-servicio';
import { calcularCombustibleServicio } from '@/modules/costos/shared/utils/calcular-combustible-servicio';
import { componerCostos } from '@/modules/costos/shared/utils/calcular-composicion';
import { renderComposicionPDF } from '@/modules/costos/shared/pdf/composicion-generator';
import type { ComposicionPDFData } from '@/modules/costos/shared/pdf/composicion-template';
import { subirPDF, getSignedUrlPDF } from '@/modules/costos/shared/utils/storage';
import type {
  ComposicionDetalle,
  ComposicionListItem,
  FormulaOutput,
  TipoOutputInput,
  TipoOutputServicioClient,
} from '@/modules/costos/shared/types/composicion.types';

const COMPOSICION_PATH = '/dashboard/costos/composicion';
const SERVICIOS_PATH = '/dashboard/costos/servicios';

// ─── Validación de fórmulas de output ──────────────────────────────────────────

const baseComposicionSchema = z.enum([
  'precio_mensual',
  'total_directo',
  'total_con_margenes',
  'mod',
  'ocp',
  'equipos',
  'combustible',
]);

const formulaOutputSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('precio_div_kms_x_factor'), kms_base: z.number().positive(), factor: z.number() }),
  z.object({ tipo: z.literal('pct_sobre_precio'), porcentaje: z.number().min(0).max(1), modo: z.enum(['descuento', 'recargo']) }),
  z.object({
    tipo: z.literal('base_div_divisor'),
    base: baseComposicionSchema,
    divisor: z.number().positive(),
    factor_previo: z.number().positive().optional(),
  }),
  z.object({
    tipo: z.literal('precio_ponderado_div_divisor'),
    divisor: z.number().positive(),
    componentes: z.array(z.object({ base: baseComposicionSchema, factor: z.number() })).min(1),
  }),
]);

const tipoOutputInputSchema = z.object({
  codigo: z.string().min(1).max(40),
  nombre: z.string().min(1).max(120),
  formula: formulaOutputSchema,
  orden: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getServicioScoped(servicioId: string, companyId: string) {
  const servicio = await prisma.servicio_contrato.findFirst({
    where: { id: servicioId, company_id: companyId },
  });
  if (!servicio) throw new Error('Servicio no encontrado o sin acceso');
  return servicio;
}

async function getComposicionScoped(composicionId: string, companyId: string) {
  const composicion = await prisma.composicion_costo.findFirst({
    where: { id: composicionId, servicio: { company_id: companyId } },
    include: { servicio: { select: { id: true, company_id: true } } },
  });
  if (!composicion) throw new Error('Composición no encontrada o sin acceso');
  return composicion;
}

/** Arma los datos de encabezado del PDF (empresa + cliente + servicio). */
async function cargarDatosPDF(servicioId: string): Promise<Omit<ComposicionPDFData, 'detalle'>> {
  const servicio = await prisma.servicio_contrato.findUniqueOrThrow({
    where: { id: servicioId },
    include: {
      customer: { select: { name: true } },
      config_cct: { select: { cct_codigo: true, cct_nombre: true } },
      company: { select: { company_name: true, company_cuit: true } },
    },
  });
  return {
    company: { name: servicio.company.company_name, cuit: servicio.company.company_cuit },
    customer: { name: servicio.customer?.name ?? '—' },
    servicio: {
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      cct_codigo: servicio.config_cct?.cct_codigo ?? '—',
      cct_nombre: servicio.config_cct?.cct_nombre ?? '—',
    },
  };
}

/** Genera el PDF de una composición, lo sube al bucket y devuelve el path. */
async function generarYSubirPDF(
  companyId: string,
  servicioId: string,
  periodo: string,
  detalle: ComposicionDetalle
): Promise<string> {
  const encabezado = await cargarDatosPDF(servicioId);
  const buffer = await renderComposicionPDF({ ...encabezado, detalle });
  const path = COSTOS_PDF_PATHS(companyId).composicion(servicioId, periodo);
  return subirPDF(path, buffer);
}

// ─── Motor de composición (orquestación) ───────────────────────────────────────

/**
 * Calcula la composición completa de un servicio para un período, integrando los
 * cuatro sub-motores (MOD / OCP / Equipos / Combustible) y aplicando márgenes y
 * outputs. No persiste nada (preview).
 */
export async function calcularComposicion(servicioId: string, periodo: string): Promise<ComposicionDetalle> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  parsePeriodo(periodo); // valida formato YYYY-MM

  const servicio = await prisma.servicio_contrato.findFirst({
    where: { id: servicioId, company_id: companyId },
    include: { outputs_configurados: { where: { is_active: true }, orderBy: { orden: 'asc' } } },
  });
  if (!servicio) throw new Error('Servicio no encontrado o sin acceso');

  const [resumenMOD, resumenOCP, resumenEquipos, resumenCombustible] = await Promise.all([
    calcularMOD(servicioId, periodo),
    calcularOCP(servicioId),
    calcularEquiposServicio(servicioId),
    calcularCombustibleServicio(servicioId, periodo),
  ]);

  return componerCostos({
    servicio_id: servicioId,
    periodo,
    config_cct_id: servicio.config_cct_id,
    subtotales: {
      mod: resumenMOD.total_mod,
      ocp: resumenOCP.total_ocp,
      equipos: resumenEquipos.total_equipos,
      combustible: resumenCombustible.total_combustible,
    },
    margenes: {
      margen_iibb: Number(servicio.margen_iibb),
      margen_debcred: Number(servicio.margen_debcred),
      margen_estructura: Number(servicio.margen_estructura),
      margen_ganancia: Number(servicio.margen_ganancia),
      licencia_ordenanza: Number(servicio.licencia_ordenanza),
    },
    outputs: servicio.outputs_configurados.map((o) => ({
      id: o.id,
      codigo: o.codigo,
      nombre: o.nombre,
      formula: o.formula as FormulaOutput,
    })),
    resumenMOD,
    resumenOCP,
    resumenEquipos,
    resumenCombustible,
  });
}

/**
 * Recalcula y persiste la composición de un servicio/período (snapshot en DB +
 * PDF en Storage). Idempotente: upsert por (servicio_id, periodo).
 */
export async function persistirComposicion(servicioId: string, periodo: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getServicioScoped(servicioId, companyId);

  const detalle = await calcularComposicion(servicioId, periodo);
  const detalleJson = detalle as unknown as Prisma.InputJsonValue;

  const datos = {
    config_cct_id: detalle.config_cct_id,
    subtotal_mod: detalle.subtotales.mod,
    subtotal_ocp: detalle.subtotales.ocp,
    subtotal_equipos: detalle.subtotales.equipos,
    subtotal_combustible: detalle.subtotales.combustible,
    total_costo_directo: detalle.total_costo_directo,
    total_con_margenes: detalle.total_con_margenes,
    precio_mensual: detalle.precio_mensual,
    detalle_json: detalleJson,
  };

  const composicion = await prisma.composicion_costo.upsert({
    where: { servicio_id_periodo: { servicio_id: servicioId, periodo } },
    create: { servicio_id: servicioId, periodo, ...datos },
    update: datos,
  });

  // Reemplaza los outputs calculados.
  await prisma.output_composicion.deleteMany({ where: { composicion_id: composicion.id } });
  if (detalle.outputs.length > 0) {
    await prisma.output_composicion.createMany({
      data: detalle.outputs.map((o) => ({
        composicion_id: composicion.id,
        tipo_output_id: o.tipo_output_id,
        valor: o.valor,
        detalle_calculo: o.detalle_calculo as unknown as Prisma.InputJsonValue,
      })),
    });
  }

  // Genera y sube el PDF, guarda el path.
  const pdfPath = await generarYSubirPDF(companyId, servicioId, periodo, detalle);
  await prisma.composicion_costo.update({ where: { id: composicion.id }, data: { pdf_path: pdfPath } });

  revalidatePath(COMPOSICION_PATH);
  revalidatePath(`${SERVICIOS_PATH}/${servicioId}`);
  return { id: composicion.id, detalle, pdfPath };
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function listComposiciones(servicioId?: string): Promise<ComposicionListItem[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const composiciones = await prisma.composicion_costo.findMany({
    where: { servicio: { company_id: companyId }, ...(servicioId ? { servicio_id: servicioId } : {}) },
    include: { servicio: { select: { nombre: true, customer: { select: { name: true } } } } },
    orderBy: [{ periodo: 'desc' }, { created_at: 'desc' }],
  });

  return composiciones.map((c) => ({
    id: c.id,
    servicio_id: c.servicio_id,
    servicio_nombre: c.servicio?.nombre ?? '—',
    customer_nombre: c.servicio?.customer?.name ?? '—',
    periodo: c.periodo,
    precio_mensual: Number(c.precio_mensual),
    tiene_pdf: !!c.pdf_path,
    created_at: c.created_at.toISOString(),
  }));
}

export async function getComposicion(id: string): Promise<ComposicionDetalle | null> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const composicion = await prisma.composicion_costo.findFirst({
    where: { id, servicio: { company_id: companyId } },
  });
  if (!composicion) return null;
  return composicion.detalle_json as unknown as ComposicionDetalle;
}

// ─── PDF ────────────────────────────────────────────────────────────────────

/** Regenera el PDF de una composición desde su snapshot guardado. */
export async function regenerarPDF(composicionId: string): Promise<{ pdfPath: string; signedUrl: string }> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const composicion = await getComposicionScoped(composicionId, companyId);

  const detalle = composicion.detalle_json as unknown as ComposicionDetalle;
  const pdfPath = await generarYSubirPDF(companyId, composicion.servicio_id, composicion.periodo, detalle);
  await prisma.composicion_costo.update({ where: { id: composicionId }, data: { pdf_path: pdfPath } });
  const signedUrl = await getSignedUrlPDF(pdfPath);

  revalidatePath(`${COMPOSICION_PATH}/${composicionId}`);
  return { pdfPath, signedUrl };
}

/** Devuelve una URL firmada del PDF; lo genera si aún no existe. */
export async function getSignedUrlComposicion(composicionId: string): Promise<string> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const composicion = await getComposicionScoped(composicionId, companyId);

  if (composicion.pdf_path) return getSignedUrlPDF(composicion.pdf_path);
  const { signedUrl } = await regenerarPDF(composicionId);
  return signedUrl;
}

// ─── CRUD de tipos de output configurables por servicio ────────────────────────

function toTipoOutputClient(o: { formula: unknown } & Record<string, unknown>): TipoOutputServicioClient {
  return { ...(o as object), formula: o.formula as FormulaOutput } as TipoOutputServicioClient;
}

export async function listOutputsServicio(servicioId: string): Promise<TipoOutputServicioClient[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getServicioScoped(servicioId, companyId);

  const outputs = await prisma.tipo_output_servicio.findMany({
    where: { servicio_id: servicioId },
    orderBy: [{ orden: 'asc' }, { codigo: 'asc' }],
  });
  return outputs.map(toTipoOutputClient);
}

export async function addOutputServicio(servicioId: string, input: TipoOutputInput): Promise<TipoOutputServicioClient> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getServicioScoped(servicioId, companyId);
  const parsed = tipoOutputInputSchema.parse(input);

  const output = await prisma.tipo_output_servicio.create({
    data: {
      servicio_id: servicioId,
      codigo: parsed.codigo,
      nombre: parsed.nombre,
      formula: parsed.formula as unknown as Prisma.InputJsonValue,
      orden: parsed.orden ?? 0,
      is_active: parsed.is_active ?? true,
    },
  });
  revalidatePath(`${SERVICIOS_PATH}/${servicioId}`);
  return toTipoOutputClient(output);
}

export async function updateOutputServicio(id: string, input: Partial<TipoOutputInput>): Promise<TipoOutputServicioClient> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existente = await prisma.tipo_output_servicio.findFirst({
    where: { id, servicio: { company_id: companyId } },
    select: { id: true, servicio_id: true },
  });
  if (!existente) throw new Error('Output no encontrado o sin acceso');

  const parsed = tipoOutputInputSchema.partial().parse(input);
  const output = await prisma.tipo_output_servicio.update({
    where: { id },
    data: {
      ...(parsed.codigo !== undefined ? { codigo: parsed.codigo } : {}),
      ...(parsed.nombre !== undefined ? { nombre: parsed.nombre } : {}),
      ...(parsed.formula !== undefined ? { formula: parsed.formula as unknown as Prisma.InputJsonValue } : {}),
      ...(parsed.orden !== undefined ? { orden: parsed.orden } : {}),
      ...(parsed.is_active !== undefined ? { is_active: parsed.is_active } : {}),
    },
  });
  revalidatePath(`${SERVICIOS_PATH}/${existente.servicio_id}`);
  return toTipoOutputClient(output);
}

export async function deleteOutputServicio(id: string): Promise<void> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existente = await prisma.tipo_output_servicio.findFirst({
    where: { id, servicio: { company_id: companyId } },
    select: { id: true, servicio_id: true },
  });
  if (!existente) throw new Error('Output no encontrado o sin acceso');

  await prisma.tipo_output_servicio.delete({ where: { id } });
  revalidatePath(`${SERVICIOS_PATH}/${existente.servicio_id}`);
}
