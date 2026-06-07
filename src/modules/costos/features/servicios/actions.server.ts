'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { toClientNumber } from '@/modules/costos/shared/utils/decimal';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import type {
  CreateServicioInput,
  UpdateServicioInput,
  ServicioListItem,
  ServicioDetalle,
  ServicioClient,
  ConfigServicio,
} from '@/modules/costos/shared/types/servicio.types';

const SERVICIOS_PATH = '/dashboard/costos/servicios';

const schemaMargenes = {
  margen_iibb: z.number().min(0).max(1).optional(),
  margen_debcred: z.number().min(0).max(1).optional(),
  margen_estructura: z.number().min(0).max(1).optional(),
  margen_ganancia: z.number().min(0).max(1).optional(),
  licencia_ordenanza: z.number().min(0).max(1).optional(),
};

const schemaCreate = z.object({
  customer_id: z.string().uuid(),
  config_cct_id: z.string().uuid(),
  nombre: z.string().min(1).max(160),
  descripcion: z.string().optional(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  config_servicio: z.record(z.number()).optional(),
  ...schemaMargenes,
});

const schemaUpdate = schemaCreate.partial().extend({ is_active: z.boolean().optional() });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertRefsPertenecen(companyId: string, customerId?: string, configCctId?: string) {
  if (customerId) {
    const c = await prisma.customers.findFirst({
      where: { id: customerId, company_id: companyId },
      select: { id: true },
    });
    if (!c) throw new Error('Cliente no encontrado o sin acceso');
  }
  if (configCctId) {
    const cct = await prisma.config_cct.findFirst({
      where: { id: configCctId, company_id: companyId },
      select: { id: true },
    });
    if (!cct) throw new Error('CCT no encontrado o sin acceso');
  }
}

async function assertServicioPertenece(servicioId: string, companyId: string) {
  const s = await prisma.servicio_contrato.findFirst({
    where: { id: servicioId, company_id: companyId },
    select: { id: true },
  });
  if (!s) throw new Error('Servicio no encontrado o sin acceso');
}

function toServicioClient(s: any): ServicioClient {
  return {
    ...s,
    margen_iibb: toClientNumber(s.margen_iibb),
    margen_debcred: toClientNumber(s.margen_debcred),
    margen_estructura: toClientNumber(s.margen_estructura),
    margen_ganancia: toClientNumber(s.margen_ganancia),
    licencia_ordenanza: toClientNumber(s.licencia_ordenanza),
    config_servicio: (s.config_servicio as ConfigServicio | null) ?? null,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listServicios(): Promise<ServicioListItem[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const servicios = await prisma.servicio_contrato.findMany({
    where: { company_id: companyId },
    include: {
      customer: { select: { name: true } },
      config_cct: { select: { cct_codigo: true, cct_nombre: true } },
      _count: { select: { asignaciones_mod: true, items_ocp: true, asignaciones_equipo: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return servicios.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    customer_nombre: s.customer?.name ?? '—',
    cct_codigo: s.config_cct?.cct_codigo ?? '—',
    cct_nombre: s.config_cct?.cct_nombre ?? '—',
    fecha_inicio: s.fecha_inicio,
    fecha_fin: s.fecha_fin,
    is_active: s.is_active,
    asignaciones_mod_count: s._count.asignaciones_mod,
    items_ocp_count: s._count.items_ocp,
    equipos_count: s._count.asignaciones_equipo,
  }));
}

export async function getServicio(id: string): Promise<ServicioDetalle | null> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const s = await prisma.servicio_contrato.findFirst({
    where: { id, company_id: companyId },
    include: {
      customer: { select: { name: true } },
      config_cct: { select: { cct_codigo: true, cct_nombre: true } },
    },
  });
  if (!s) return null;

  return {
    servicio: toServicioClient(s),
    customer_nombre: s.customer?.name ?? '—',
    cct_codigo: s.config_cct?.cct_codigo ?? '—',
    cct_nombre: s.config_cct?.cct_nombre ?? '—',
  };
}

/** Datos para el form de creación: clientes y CCTs de la empresa. */
export async function getServicioFormData() {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const [customers, ccts] = await Promise.all([
    prisma.customers.findMany({
      where: { company_id: companyId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.config_cct.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, cct_codigo: true, cct_nombre: true },
      orderBy: [{ cct_codigo: 'asc' }, { vigencia_desde: 'desc' }],
    }),
  ]);
  return {
    customers: customers.map((c) => ({ id: c.id, nombre: c.name })),
    ccts: ccts.map((c) => ({ id: c.id, codigo: c.cct_codigo, nombre: c.cct_nombre })),
  };
}

/** Asignaciones de equipos del servicio, con costo mensual del vehículo. */
export async function listAsignacionesEquipo(servicioId: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertServicioPertenece(servicioId, companyId);

  const asignaciones = await prisma.asignacion_equipo_servicio.findMany({
    where: { servicio_id: servicioId },
    include: {
      vehicle: {
        select: {
          intern_number: true,
          domain: true,
          brand_rel: { select: { name: true } },
          model_rel: { select: { name: true } },
          costo_equipo: { select: { id: true } },
        },
      },
    },
    orderBy: { vehicle: { intern_number: 'asc' } },
  });

  return asignaciones.map((a) => ({
    id: a.id,
    vehicle_id: a.vehicle_id,
    interno: a.vehicle.intern_number,
    dominio: a.vehicle.domain,
    vehiculo: `${a.vehicle.brand_rel?.name ?? ''} ${a.vehicle.model_rel?.name ?? ''}`.trim() || '—',
    tiene_costo: !!a.vehicle.costo_equipo,
    afectacion_pct: toClientNumber(a.afectacion_pct),
    km_mensuales: a.km_mensuales,
  }));
}

export async function quitarEquipoServicio(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const a = await prisma.asignacion_equipo_servicio.findUnique({
    where: { id },
    select: { servicio_id: true },
  });
  if (!a) throw new Error('Asignación no encontrada');
  await assertServicioPertenece(a.servicio_id, companyId);

  await prisma.asignacion_equipo_servicio.delete({ where: { id } });
  revalidatePath(`${SERVICIOS_PATH}/${a.servicio_id}`);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createServicio(input: CreateServicioInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const parsed = schemaCreate.parse(input);
  await assertRefsPertenecen(companyId, parsed.customer_id, parsed.config_cct_id);

  const { config_servicio, ...rest } = parsed;
  const servicio = await prisma.servicio_contrato.create({
    data: {
      ...rest,
      company_id: companyId,
      config_servicio: (config_servicio ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });

  revalidatePath(SERVICIOS_PATH);
  return servicio;
}

export async function updateServicio(id: string, input: Partial<UpdateServicioInput>) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertServicioPertenece(id, companyId);
  const parsed = schemaUpdate.parse(input);
  await assertRefsPertenecen(companyId, parsed.customer_id, parsed.config_cct_id);

  const { config_servicio, ...rest } = parsed;
  const servicio = await prisma.servicio_contrato.update({
    where: { id },
    data: {
      ...rest,
      ...(config_servicio !== undefined
        ? { config_servicio: config_servicio as Prisma.InputJsonValue }
        : {}),
    },
  });

  revalidatePath(SERVICIOS_PATH);
  revalidatePath(`${SERVICIOS_PATH}/${id}`);
  return servicio;
}

export async function deleteServicio(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertServicioPertenece(id, companyId);

  await prisma.servicio_contrato.delete({ where: { id } });
  revalidatePath(SERVICIOS_PATH);
}

export async function asignarEquiposServicio(
  servicioId: string,
  asignaciones: { vehicle_id: string; afectacion_pct?: number; km_mensuales?: number }[]
) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertServicioPertenece(servicioId, companyId);

  const schema = z.array(
    z.object({
      vehicle_id: z.string().uuid(),
      afectacion_pct: z.number().min(0).max(1).default(1),
      km_mensuales: z.number().int().nonnegative().default(0),
    })
  );
  const parsed = schema.parse(asignaciones);

  // Validar que los vehículos sean de la empresa.
  const ids = parsed.map((a) => a.vehicle_id);
  const validos = await prisma.vehicles.count({ where: { id: { in: ids }, company_id: companyId } });
  if (validos !== ids.length) throw new Error('Algún vehículo no pertenece a la empresa');

  await prisma.$transaction(
    parsed.map((a) =>
      prisma.asignacion_equipo_servicio.upsert({
        where: { servicio_id_vehicle_id: { servicio_id: servicioId, vehicle_id: a.vehicle_id } },
        create: {
          servicio_id: servicioId,
          vehicle_id: a.vehicle_id,
          afectacion_pct: a.afectacion_pct,
          km_mensuales: a.km_mensuales,
        },
        update: { afectacion_pct: a.afectacion_pct, km_mensuales: a.km_mensuales },
      })
    )
  );

  revalidatePath(`${SERVICIOS_PATH}/${servicioId}`);
}
