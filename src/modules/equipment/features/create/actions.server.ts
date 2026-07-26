'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { ensurePendingDocumentsForEquipment } from '@/shared/lib/documentAlerts';
import { revalidatePath } from 'next/cache';

export const UpdateVehicle = async (vehicleId: string, vehicleData: any) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];
  try {
    await prisma.vehicles.update({
      where: { id: vehicleId },
      data: vehicleData,
    });
    await ensurePendingDocumentsForEquipment(vehicleId);
  } catch (error) {
    console.error(error);
  }
};

export const insertVehicle = async (vehicleData: any) => {
  try {
    const missing = ['type_of_vehicle', 'brand', 'model', 'type'].filter(
      (k) => vehicleData[k] === undefined || vehicleData[k] === null || vehicleData[k] === ''
    );
    if (missing.length) {
      return {
        data: null,
        error: 'No se pudieron resolver tipo de equipo, marca o modelo. Verificá la selección e intentá nuevamente.',
      };
    }
    const data = await prisma.vehicles.create({
      data: {
        ...vehicleData,
        type_of_vehicle: BigInt(vehicleData.type_of_vehicle),
        brand: BigInt(vehicleData.brand),
        model: BigInt(vehicleData.model),
      },
    });
    await ensurePendingDocumentsForEquipment(data.id);
    revalidatePath('/dashboard/equipment');
    revalidatePath('/dashboard/document');
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const updateVehicleById = async (vehicleId: string, updateData: Record<string, unknown>) => {
  try {
    const data = await prisma.vehicles.update({
      where: { id: vehicleId },
      data: updateData as any,
    });
    await ensurePendingDocumentsForEquipment(vehicleId);
    return { data, error: null };
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const updateVehicleByIdAndCompany = async (vehicleId: string, companyId: string, updateData: Record<string, unknown>) => {
  try {
    const data = await prisma.vehicles.updateMany({
      where: { id: vehicleId, company_id: companyId },
      data: updateData as any,
    });
    await ensurePendingDocumentsForEquipment(vehicleId);
    return { data, error: null };
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const checkVehicleDomainExists = async (domain: string) => {
  try {
    const data = await prisma.vehicles.findMany({
      where: { domain },
    });
    return data;
  } catch (error) {
    console.error('Error checking vehicle domain:', error);
    return [];
  }
};

export const deleteContractorEquipment = async (equipmentId: string, contractorId: string) => {
  try {
    await prisma.contractor_equipment.deleteMany({
      where: { equipment_id: equipmentId, contractor_id: contractorId },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deleting contractor equipment:', error);
    return { error: String(error) };
  }
};

export const insertContractorEquipment = async (equipmentId: string, contractorId: string) => {
  try {
    const data = await prisma.contractor_equipment.create({
      data: { equipment_id: equipmentId, contractor_id: contractorId },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting contractor equipment:', error);
    return { data: null, error: String(error) };
  }
};

export const insertBrandVehicle = async (name: string) => {
  try {
    const data = await prisma.brand_vehicles.create({ data: { name } });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting brand vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const insertModelVehicle = async (name: string, brandId: string) => {
  try {
    const data = await prisma.model_vehicles.create({ data: { name, brand: Number(brandId) || undefined } as any });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting model vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const insertTypeVehicle = async (name: string, companyId: string) => {
  try {
    const data = await prisma.type.create({ data: { name, company_id: companyId } });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting type vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const fetchVehicleModelsByBrand = async (brandId: string) => {
  try {
    const data = await prisma.model_vehicles.findMany({
      where: { brand: Number(brandId) || undefined },
    });
    return data;
  } catch (error) {
    console.error('Error fetching vehicle models by brand:', error);
    return [];
  }
};

export const reactivateVehicle = async (vehicleId: string, companyId: string) => {
  try {
    const data = await prisma.vehicles.updateMany({
      where: { id: vehicleId, company_id: companyId },
      data: {
        is_active: true,
        termination_date: null,
        reason_for_termination: null,
      } as any,
    });

    if (data.count === 0) {
      return { data, error: 'No se encontró el equipo para reactivar' };
    }

    revalidatePath('/dashboard/equipment');
    revalidatePath('/dashboard/document');
    return { data, error: null };
  } catch (error) {
    console.error('Error reactivating vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const deactivateVehicle = async (vehicleId: string, companyId: string, terminationDate: string, reason: string) => {
  try {
    const data = await prisma.vehicles.updateMany({
      where: { id: vehicleId, company_id: companyId },
      data: {
        is_active: false,
        termination_date: new Date(terminationDate),
        reason_for_termination: reason,
      } as any,
    });

    if (data.count === 0) {
      return { data, error: 'No se encontró el equipo para dar de baja' };
    }

    revalidatePath('/dashboard/equipment');
    revalidatePath('/dashboard/document');
    return { data, error: null };
  } catch (error) {
    console.error('Error deactivating vehicle:', error);
    return { data: null, error: String(error) };
  }
};

// ── Valor de compra del equipo (tsk-518) ─────────────────────────────────────
// El valor de compra vive en costo_equipo (compartido con el módulo de Costos).
// Se guarda el valor en ARS y en USD, la moneda que cargó el usuario y el tipo de
// cambio usado (snapshot). El tipo de cambio por defecto sale de exchange_rates.

export const getPurchaseValue = async (vehicleId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, latestRate: null, error: 'Sin empresa activa' };
  try {
    const costo = await prisma.costo_equipo.findFirst({
      where: { vehicle_id: vehicleId, company_id: companyId },
      select: {
        valor_compra: true,
        valor_compra_usd: true,
        moneda_compra: true,
        tipo_cambio_compra: true,
      },
    });
    // Última cotización USD -> ARS de la empresa
    const rate = await prisma.exchange_rates.findFirst({
      where: { company_id: companyId, moneda_origen: 'USD', moneda_destino: 'ARS' },
      orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }],
      select: { valor: true, fecha: true, fuente: true },
    });
    return {
      data: costo
        ? {
            valor_compra: costo.valor_compra != null ? Number(costo.valor_compra) : null,
            valor_compra_usd: costo.valor_compra_usd != null ? Number(costo.valor_compra_usd) : null,
            moneda_compra: costo.moneda_compra ?? 'ARS',
            tipo_cambio_compra: costo.tipo_cambio_compra != null ? Number(costo.tipo_cambio_compra) : null,
          }
        : null,
      latestRate: rate
        ? { valor: Number(rate.valor), fecha: rate.fecha, fuente: rate.fuente }
        : null,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching purchase value:', error);
    return { data: null, latestRate: null, error: String(error) };
  }
};

export const savePurchaseValue = async (
  vehicleId: string,
  input: { moneda_compra: 'ARS' | 'USD'; valor: number; tipo_cambio: number }
) => {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'Sin empresa activa' };
  try {
    const tc = Number(input.tipo_cambio);
    const valor = Number(input.valor);
    if (!Number.isFinite(valor) || valor < 0) return { data: null, error: 'Valor de compra inválido' };

    // Calcula ambos valores a partir de la moneda que cargó el usuario.
    let valorArs: number;
    let valorUsd: number | null;
    if (input.moneda_compra === 'USD') {
      valorUsd = valor;
      valorArs = tc > 0 ? valor * tc : 0;
    } else {
      valorArs = valor;
      valorUsd = tc > 0 ? valor / tc : null;
    }

    const purchaseData = {
      valor_compra: valorArs,
      valor_compra_usd: valorUsd,
      moneda_compra: input.moneda_compra,
      tipo_cambio_compra: tc > 0 ? tc : null,
    };

    const data = await prisma.costo_equipo.upsert({
      where: { vehicle_id: vehicleId },
      update: purchaseData,
      // Si el equipo aún no tenía datos de costo, se crea la fila con los datos de
      // amortización en 0 (los completa luego el módulo de Costos).
      create: {
        vehicle_id: vehicleId,
        company_id: companyId,
        ...purchaseData,
        valor_residual_pct: 0,
        anios_amortizacion: 0,
      },
    });
    revalidatePath('/dashboard/equipment');
    return {
      data: {
        valor_compra: Number(data.valor_compra),
        valor_compra_usd: data.valor_compra_usd != null ? Number(data.valor_compra_usd) : null,
        moneda_compra: data.moneda_compra,
        tipo_cambio_compra: data.tipo_cambio_compra != null ? Number(data.tipo_cambio_compra) : null,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error saving purchase value:', error);
    return { data: null, error: String(error) };
  }
};

export const updateVehicleAllocatedTo = async (vehicleId: string, allocatedTo: string[]) => {
  try {
    const data = await prisma.vehicles.update({
      where: { id: vehicleId },
      data: { allocated_to: allocatedTo } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating vehicle allocated_to:', error);
    return { data: null, error: String(error) };
  }
};
