'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { toClientNumber } from '@/modules/costos/shared/utils/decimal';
import { calcularMOD } from '@/modules/costos/shared/utils/calcular-mod';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import type {
  AsignacionMODInput,
  AsignacionMODConDetalle,
  OverridesCalculo,
  ResumenMOD,
} from '@/modules/costos/shared/types/mod.types';

function servicioPath(servicioId: string) {
  return `/dashboard/costos/servicios/${servicioId}`;
}

const schemaAsignacion = z.object({
  employee_id: z.string().uuid(),
  categoria_cct_id: z.string().uuid(),
  afectacion_pct: z.number().min(0).max(1),
  antiguedad_anios: z.number().int().nonnegative().default(0),
  overrides_calculo: z.record(z.number()).optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getServicioScoped(servicioId: string, companyId: string) {
  const s = await prisma.servicio_contrato.findFirst({
    where: { id: servicioId, company_id: companyId },
    select: { id: true, config_cct_id: true },
  });
  if (!s) throw new Error('Servicio no encontrado o sin acceso');
  return s;
}

/** La categoría debe pertenecer al CCT del servicio. */
async function assertCategoriaDelCCT(categoriaId: string, configCctId: string) {
  const cat = await prisma.categoria_cct.findFirst({
    where: { id: categoriaId, config_cct_id: configCctId },
    select: { id: true },
  });
  if (!cat) throw new Error('La categoría no pertenece al CCT del servicio');
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listAsignacionesMOD(servicioId: string): Promise<AsignacionMODConDetalle[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getServicioScoped(servicioId, companyId);

  const asignaciones = await prisma.asignacion_mod.findMany({
    where: { servicio_id: servicioId },
    include: {
      employee: { select: { firstname: true, lastname: true } },
      categoria: { select: { codigo: true, nombre: true } },
    },
    orderBy: { employee: { lastname: 'asc' } },
  });

  return asignaciones.map((a) => ({
    ...a,
    afectacion_pct: toClientNumber(a.afectacion_pct),
    overrides_calculo: (a.overrides_calculo as OverridesCalculo | null) ?? null,
    employee_nombre: `${a.employee.lastname}, ${a.employee.firstname}`,
    categoria_codigo: a.categoria.codigo,
    categoria_nombre: a.categoria.nombre,
  }));
}

/** Empleados de la empresa + categorías del CCT del servicio (para el form de asignación). */
export async function getMODFormData(servicioId: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const servicio = await getServicioScoped(servicioId, companyId);

  const [empleados, categorias] = await Promise.all([
    prisma.employees.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, firstname: true, lastname: true },
      orderBy: { lastname: 'asc' },
    }),
    prisma.categoria_cct.findMany({
      where: { config_cct_id: servicio.config_cct_id },
      select: { id: true, codigo: true, nombre: true },
      orderBy: { orden: 'asc' },
    }),
  ]);

  return {
    empleados: empleados.map((e) => ({ id: e.id, nombre: `${e.lastname}, ${e.firstname}` })),
    categorias,
  };
}

/** Todas las asignaciones MOD de la empresa (vista transversal mano-de-obra). */
export async function listAsignacionesMODEmpresa() {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const asignaciones = await prisma.asignacion_mod.findMany({
    where: { servicio: { company_id: companyId } },
    include: {
      servicio: { select: { id: true, nombre: true } },
      employee: { select: { firstname: true, lastname: true } },
      categoria: { select: { codigo: true } },
    },
    orderBy: [{ servicio: { nombre: 'asc' } }, { employee: { lastname: 'asc' } }],
  });

  return asignaciones.map((a) => ({
    id: a.id,
    servicio_id: a.servicio.id,
    servicio_nombre: a.servicio.nombre,
    employee_nombre: `${a.employee.lastname}, ${a.employee.firstname}`,
    categoria_codigo: a.categoria.codigo,
    antiguedad_anios: a.antiguedad_anios,
    afectacion_pct: toClientNumber(a.afectacion_pct),
    is_active: a.is_active,
  }));
}

export async function calcularResumenMOD(servicioId: string, periodo: string): Promise<ResumenMOD> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await getServicioScoped(servicioId, companyId);
  return calcularMOD(servicioId, periodo);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function addAsignacionMOD(servicioId: string, input: AsignacionMODInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const servicio = await getServicioScoped(servicioId, companyId);
  const parsed = schemaAsignacion.parse(input);
  await assertCategoriaDelCCT(parsed.categoria_cct_id, servicio.config_cct_id);

  // El empleado debe pertenecer a la empresa.
  const emp = await prisma.employees.findFirst({
    where: { id: parsed.employee_id, company_id: companyId },
    select: { id: true },
  });
  if (!emp) throw new Error('Empleado no encontrado o sin acceso');

  const { overrides_calculo, ...rest } = parsed;
  const asignacion = await prisma.asignacion_mod.create({
    data: {
      servicio_id: servicioId,
      ...rest,
      overrides_calculo: (overrides_calculo ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });

  revalidatePath(servicioPath(servicioId));
  return asignacion;
}

export async function updateAsignacionMOD(id: string, input: Partial<AsignacionMODInput>) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existing = await prisma.asignacion_mod.findUnique({
    where: { id },
    select: { servicio_id: true },
  });
  if (!existing) throw new Error('Asignación no encontrada');
  const servicio = await getServicioScoped(existing.servicio_id, companyId);

  const parsed = schemaAsignacion.partial().parse(input);
  if (parsed.categoria_cct_id) await assertCategoriaDelCCT(parsed.categoria_cct_id, servicio.config_cct_id);

  const { overrides_calculo, ...rest } = parsed;
  const asignacion = await prisma.asignacion_mod.update({
    where: { id },
    data: {
      ...rest,
      ...(overrides_calculo !== undefined
        ? { overrides_calculo: overrides_calculo as Prisma.InputJsonValue }
        : {}),
    },
  });

  revalidatePath(servicioPath(existing.servicio_id));
  return asignacion;
}

export async function deleteAsignacionMOD(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existing = await prisma.asignacion_mod.findUnique({
    where: { id },
    select: { servicio_id: true },
  });
  if (!existing) throw new Error('Asignación no encontrada');
  await getServicioScoped(existing.servicio_id, companyId);

  await prisma.asignacion_mod.delete({ where: { id } });
  revalidatePath(servicioPath(existing.servicio_id));
}
