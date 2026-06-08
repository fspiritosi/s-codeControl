'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { toClientNumber } from '@/modules/costos/shared/utils/decimal';
import { calcularCostoCombustible } from '@/modules/costos/shared/utils/calcular-combustible';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type {
  RegistroCombustibleClient,
  RegistroCombustibleInput,
} from '@/modules/costos/shared/types/combustible.types';

const COMBUSTIBLE_PATH = '/dashboard/costos/combustible';

const schemaRegistro = z.object({
  id: z.string().uuid().optional(),
  servicio_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Período debe ser YYYY-MM'),
  litros_mensuales: z.number().nonnegative(),
  precio_gasoil_lt: z.number().nonnegative(),
  litros_urea: z.number().nonnegative().default(0),
  precio_urea_lt: z.number().nonnegative().default(0),
});

async function assertServicioPertenece(servicioId: string, companyId: string) {
  const s = await prisma.servicio_contrato.findFirst({
    where: { id: servicioId, company_id: companyId },
    select: { id: true },
  });
  if (!s) throw new Error('Servicio no encontrado o sin acceso');
}

// ─── Queries auxiliares para la UI ────────────────────────────────────────────

export async function listServiciosCombustible() {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const servicios = await prisma.servicio_contrato.findMany({
    where: { company_id: companyId, is_active: true },
    select: { id: true, nombre: true, customer: { select: { name: true } } },
    orderBy: { nombre: 'asc' },
  });
  return servicios.map((s) => ({ id: s.id, nombre: s.nombre, cliente: s.customer?.name ?? null }));
}

export async function listVehiculosEmpresa() {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const vehiculos = await prisma.vehicles.findMany({
    where: { company_id: companyId },
    select: { id: true, intern_number: true, domain: true },
    orderBy: { intern_number: 'asc' },
  });
  return vehiculos.map((v) => ({ id: v.id, interno: v.intern_number, dominio: v.domain }));
}

// ─── Queries principales ──────────────────────────────────────────────────────

export async function listRegistrosCombustible(
  servicioId: string
): Promise<RegistroCombustibleClient[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertServicioPertenece(servicioId, companyId);

  const registros = await prisma.registro_combustible.findMany({
    where: { servicio_id: servicioId },
    include: { vehicle: { select: { intern_number: true, domain: true } } },
    orderBy: [{ periodo: 'desc' }, { vehicle: { intern_number: 'asc' } }],
  });

  return registros.map((r) => {
    const costo_total = calcularCostoCombustible({
      litros_mensuales: r.litros_mensuales.toString(),
      precio_gasoil_lt: r.precio_gasoil_lt.toString(),
      litros_urea: r.litros_urea.toString(),
      precio_urea_lt: r.precio_urea_lt.toString(),
    });
    return {
      ...r,
      litros_mensuales: toClientNumber(r.litros_mensuales),
      precio_gasoil_lt: toClientNumber(r.precio_gasoil_lt),
      litros_urea: toClientNumber(r.litros_urea),
      precio_urea_lt: toClientNumber(r.precio_urea_lt),
      costo_total: costo_total.toDecimalPlaces(2).toNumber(),
      vehiculo: { interno: r.vehicle.intern_number, dominio: r.vehicle.domain },
    };
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function upsertRegistroCombustible(input: RegistroCombustibleInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const parsed = schemaRegistro.parse(input);
  await assertServicioPertenece(parsed.servicio_id, companyId);

  const vehiculo = await prisma.vehicles.findFirst({
    where: { id: parsed.vehicle_id, company_id: companyId },
    select: { id: true },
  });
  if (!vehiculo) throw new Error('Vehículo no encontrado o sin acceso');

  const data = {
    litros_mensuales: parsed.litros_mensuales,
    precio_gasoil_lt: parsed.precio_gasoil_lt,
    litros_urea: parsed.litros_urea,
    precio_urea_lt: parsed.precio_urea_lt,
  };

  const registro = await prisma.registro_combustible.upsert({
    where: {
      servicio_id_vehicle_id_periodo: {
        servicio_id: parsed.servicio_id,
        vehicle_id: parsed.vehicle_id,
        periodo: parsed.periodo,
      },
    },
    create: {
      servicio_id: parsed.servicio_id,
      vehicle_id: parsed.vehicle_id,
      periodo: parsed.periodo,
      ...data,
    },
    update: data,
  });

  revalidatePath(COMBUSTIBLE_PATH);
  return registro;
}

export async function deleteRegistroCombustible(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existing = await prisma.registro_combustible.findUnique({
    where: { id },
    select: { servicio_id: true },
  });
  if (!existing) throw new Error('Registro no encontrado');
  await assertServicioPertenece(existing.servicio_id, companyId);

  await prisma.registro_combustible.delete({ where: { id } });
  revalidatePath(COMBUSTIBLE_PATH);
}
