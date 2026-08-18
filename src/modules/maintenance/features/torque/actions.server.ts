'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import type { torque_bolt_condition, torque_sheet_format } from '@/generated/prisma/client';
import type { TorqueCheckKey } from './shared/torque-spec';

// ============================================================
// Tipos
// ============================================================

/** Equipo apto para elegir en el certificado de torqueo. */
export type TorqueVehicleOption = {
  id: string;
  domain: string | null;
  serie: string | null;
  intern_number: string;
  brand_id: string;
  brand_name: string | null;
};

/** Spec de torque (tabla de referencia impresa) para una marca dada. */
export type TorqueSpecOption = {
  configuration: string;
  nm_min: number;
  nm_max: number;
  ftlb_min: number | null;
  ftlb_max: number | null;
};

/** Fila de la lista de certificados emitidos. */
export type TorqueCertificateRow = {
  id: string;
  number: number;
  full_number: string;
  date: Date;
  sheet_format: torque_sheet_format;
  vehicle_id: string;
  vehicle_domain: string | null;
  vehicle_intern_number: string | null;
  vehicle_brand_name: string | null;
  driver_name: string;
  mechanic_name: string;
  meets_requirement: boolean;
  created_at: Date;
};

export type TorqueCertificateCheckInput = {
  key: TorqueCheckKey;
  value: boolean;
  observations?: string | null;
};

/** Input para crear un certificado de torqueo, con sus 15 checks. */
export type TorqueCertificateInput = {
  vehicleId: string;
  sheetFormat: torque_sheet_format;
  date: Date;
  driverName: string;
  mechanicName: string;
  place: string;
  toolType: string;
  calibrationDi?: string | null;
  calibrationDd?: string | null;
  calibrationTd?: string | null;
  calibrationTi?: string | null;
  requiredTorque: string;
  meetsRequirement: boolean;
  toleranceRangeNm?: string | null;
  boltCondition: torque_bolt_condition;
  checks: TorqueCertificateCheckInput[];
};

/** Cantidad esperada de ítems del checklist (ver torque-spec.ts). */
const EXPECTED_CHECK_COUNT = 15;

// ============================================================
// Lecturas
// ============================================================

/**
 * Equipos activos de la empresa, con la marca resuelta por relación, para
 * elegir el vehículo del certificado. brand_id se convierte a string porque
 * viaja a un componente cliente (BigInt no serializa).
 */
export async function getVehiclesForTorque(): Promise<TorqueVehicleOption[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const vehicles = await prisma.vehicles.findMany({
      where: { company_id: companyId, is_active: true },
      select: {
        id: true,
        domain: true,
        serie: true,
        intern_number: true,
        brand: true,
        brand_rel: { select: { name: true } },
      },
      orderBy: { intern_number: 'asc' },
    });

    return vehicles.map((v) => ({
      id: v.id,
      domain: v.domain,
      serie: v.serie,
      intern_number: v.intern_number,
      brand_id: v.brand.toString(),
      brand_name: v.brand_rel?.name ?? null,
    }));
  } catch (error) {
    console.error('Error fetching vehicles for torque:', error);
    return [];
  }
}

/**
 * Specs de torque activas de una marca, ordenadas por nm_min. brandId llega
 * como string desde el cliente y hay que convertirlo a BigInt antes de
 * filtrar: torque_specs.brand_id es BigInt en la base.
 */
export async function getTorqueSpecsByBrand(brandId: string): Promise<TorqueSpecOption[]> {
  const { companyId } = await getActionContext();
  if (!companyId || !brandId) return [];

  let brandIdBigInt: bigint;
  try {
    brandIdBigInt = BigInt(brandId);
  } catch {
    return [];
  }

  try {
    const specs = await prisma.torque_specs.findMany({
      where: { company_id: companyId, brand_id: brandIdBigInt, is_active: true },
      select: {
        configuration: true,
        nm_min: true,
        nm_max: true,
        ftlb_min: true,
        ftlb_max: true,
      },
      orderBy: { nm_min: 'asc' },
    });
    return specs;
  } catch (error) {
    console.error('Error fetching torque specs by brand:', error);
    return [];
  }
}

/** Lista de certificados emitidos por la empresa, más recientes primero. */
export async function getTorqueCertificates(): Promise<TorqueCertificateRow[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const certificates = await prisma.torque_certificates.findMany({
      where: { company_id: companyId },
      select: {
        id: true,
        number: true,
        full_number: true,
        date: true,
        sheet_format: true,
        vehicle_id: true,
        vehicle_domain: true,
        vehicle_intern_number: true,
        vehicle_brand_name: true,
        driver_name: true,
        mechanic_name: true,
        meets_requirement: true,
        created_at: true,
      },
      orderBy: { number: 'desc' },
    });
    return certificates;
  } catch (error) {
    console.error('Error fetching torque certificates:', error);
    return [];
  }
}

/**
 * Certificado completo con sus checks. No resuelve patente/interno/marca por
 * relación: usa el snapshot guardado al crear, para que un certificado ya
 * emitido no cambie si después se corrige el equipo. Sí incluye
 * `vehicle.brand` (no snapshot) porque la reimpresión necesita el brand_id
 * para volver a traer la tabla de specs de torque de esa marca (tsk-575 task 6).
 */
export async function getTorqueCertificateById(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  try {
    const certificate = await prisma.torque_certificates.findFirst({
      where: { id, company_id: companyId },
      include: {
        checks: { orderBy: { item_key: 'asc' } },
        created_by_rel: { select: { fullname: true } },
        vehicle: { select: { brand: true } },
      },
    });
    return certificate;
  } catch (error) {
    console.error('Error fetching torque certificate by id:', error);
    return null;
  }
}

// ============================================================
// Mutaciones
// ============================================================

/**
 * Crea un certificado de torqueo con sus 15 checks en una sola transacción.
 * El correlativo (number/full_number) se toma por empresa dentro de la misma
 * transacción, y el snapshot de patente/interno/marca se lee del vehículo en
 * ese momento (no se resuelve por relación al leer después).
 */
export async function createTorqueCertificate(
  input: TorqueCertificateInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { success: false, error: 'No hay empresa seleccionada' };

  if (input.checks.length !== EXPECTED_CHECK_COUNT) {
    return {
      success: false,
      error: `El certificado debe tener ${EXPECTED_CHECK_COUNT} checks (se recibieron ${input.checks.length})`,
    };
  }

  const user = await fetchCurrentUser();
  if (!user?.id) return { success: false, error: 'No se pudo autenticar al usuario' };

  try {
    const certificate = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicles.findFirst({
        where: { id: input.vehicleId, company_id: companyId },
        select: {
          domain: true,
          intern_number: true,
          brand_rel: { select: { name: true } },
        },
      });
      if (!vehicle) throw new Error('El vehículo no pertenece a la empresa actual');

      const last = await tx.torque_certificates.findFirst({
        where: { company_id: companyId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      const nextNumber = (last?.number ?? 0) + 1;
      const fullNumber = `TQ-${String(nextNumber).padStart(5, '0')}`;

      return tx.torque_certificates.create({
        data: {
          company_id: companyId,
          number: nextNumber,
          full_number: fullNumber,
          vehicle_id: input.vehicleId,
          sheet_format: input.sheetFormat,
          date: input.date,
          driver_name: input.driverName,
          mechanic_name: input.mechanicName,
          place: input.place,
          tool_type: input.toolType,
          calibration_di: input.calibrationDi ?? null,
          calibration_dd: input.calibrationDd ?? null,
          calibration_td: input.calibrationTd ?? null,
          calibration_ti: input.calibrationTi ?? null,
          required_torque: input.requiredTorque,
          meets_requirement: input.meetsRequirement,
          tolerance_range_nm: input.toleranceRangeNm ?? null,
          bolt_condition: input.boltCondition,
          // Snapshot: se lee del vehículo ahora, no se resuelve por relación después.
          vehicle_domain: vehicle.domain,
          vehicle_intern_number: vehicle.intern_number,
          vehicle_brand_name: vehicle.brand_rel?.name ?? null,
          created_by: user.id,
          checks: {
            create: input.checks.map((c) => ({
              item_key: c.key,
              value: c.value,
              observations: c.observations ?? null,
            })),
          },
        },
        select: { id: true },
      });
    });

    return { success: true, id: certificate.id };
  } catch (error) {
    console.error('Error creating torque certificate:', error);
    return { success: false, error: 'No se pudo crear el certificado de torqueo' };
  }
}
