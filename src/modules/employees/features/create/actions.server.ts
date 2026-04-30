'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { ensurePendingDocumentsForEmployee } from '@/shared/lib/documentAlerts';
import { revalidatePath } from 'next/cache';

export const createEmployee = async (employee: Record<string, unknown>) => {
  try {
    const data = await prisma.employees.create({ data: employee as any });
    await ensurePendingDocumentsForEmployee(data.id);
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error creating employee:', error);
    return { data: null, error: String(error) };
  }
};

export const updateEmployeeByDocNumber = async (documentNumber: string, updateData: Record<string, unknown>) => {
  try {
    const data = await prisma.employees.updateMany({
      where: { document_number: documentNumber },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating employee:', error);
    return { data: null, error: String(error) };
  }
};

export const updateEmployeeByDocNumberFull = async (documentNumber: string, employee: Record<string, unknown>) => {
  try {
    const data = await prisma.employees.updateMany({
      where: { document_number: documentNumber },
      data: employee as any,
    });
    // Reevaluar alertas obligatorias para este empleado tras la edición
    const updated = await prisma.employees.findFirst({
      where: { document_number: documentNumber },
      select: { id: true },
    });
    if (updated?.id) {
      await ensurePendingDocumentsForEmployee(updated.id);
    }
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error updating employee:', error);
    return { data: null, error: String(error) };
  }
};

export const deactivateEmployee = async (documentNumber: string, terminationDate: string, reason: string) => {
  try {
    const { companyId } = await getActionContext();
    if (!companyId) throw new Error('No company selected');

    const data = await prisma.employees.updateMany({
      where: { document_number: documentNumber, company_id: companyId },
      data: {
        is_active: false,
        termination_date: new Date(terminationDate),
        reason_for_termination: reason,
      } as any,
    });

    if (data.count === 0) {
      return { data, error: 'No se encontró el empleado para dar de baja' };
    }

    revalidatePath('/dashboard/employee');
    revalidatePath('/dashboard/document');
    return { data, error: null };
  } catch (error) {
    console.error('Error deactivating employee:', error);
    return { data: null, error: String(error) };
  }
};

/**
 * Reactiva un empleado dado de baja.
 *
 * @param documentNumber DNI del empleado.
 * @param newAdmissionDate Si se provee, se establece como nueva fecha de alta.
 *   Si se omite, se mantiene la fecha de alta original.
 */
export const reactivateEmployeeByDocNumber = async (
  documentNumber: string,
  newAdmissionDate?: string | null
) => {
  try {
    const { companyId } = await getActionContext();
    if (!companyId) throw new Error('No company selected');

    const updateData: Record<string, unknown> = {
      is_active: true,
      termination_date: null,
      reason_for_termination: null,
    };
    if (newAdmissionDate) {
      updateData.date_of_admission = new Date(newAdmissionDate);
    }

    const data = await prisma.employees.updateMany({
      where: { document_number: documentNumber, company_id: companyId },
      data: updateData as any,
    });

    if (data.count === 0) {
      return { data, error: 'No se encontró el empleado para reactivar' };
    }

    revalidatePath('/dashboard/employee');
    revalidatePath('/dashboard/document');
    return { data, error: null };
  } catch (error) {
    console.error('Error reactivating employee:', error);
    return { data: null, error: String(error) };
  }
};

export const deleteContractorEmployee = async (employeeId: string, contractorId: string) => {
  try {
    await prisma.contractor_employee.deleteMany({
      where: { employee_id: employeeId, contractor_id: contractorId },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deleting contractor employee:', error);
    return { error: String(error) };
  }
};

export const insertContractorEmployee = async (employeeId: string, contractorId: string) => {
  try {
    const data = await prisma.contractor_employee.create({
      data: { employee_id: employeeId, contractor_id: contractorId },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting contractor employee:', error);
    return { data: null, error: String(error) };
  }
};

export const resetDocumentEmployeesForReintegration = async (documentIds: string[]) => {
  try {
    const data = await prisma.documents_employees.updateMany({
      where: { id: { in: documentIds } },
      data: { document_path: null, state: 'pendiente' } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error resetting document employees:', error);
    return { data: null, error: String(error) };
  }
};

export const updateEmployeeAllocatedTo = async (employeeId: string, allocatedTo: string[]) => {
  try {
    const data = await prisma.employees.update({
      where: { id: employeeId },
      data: { allocated_to: allocatedTo } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating employee allocated_to:', error);
    return { data: null, error: String(error) };
  }
};

// From customers-mutations.ts
export const deactivateEmployeeByDocNumber = async (
  documentNumber: string,
  terminationDate: string,
  reason: string
) => {
  try {
    await prisma.employees.updateMany({
      where: { document_number: documentNumber },
      data: {
        is_active: false,
        termination_date: terminationDate,
        reason_for_termination: reason as any,
      },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deactivating employee:', error);
    return { error: String(error) };
  }
};
