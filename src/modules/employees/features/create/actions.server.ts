'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

export const createEmployee = async (employee: Record<string, unknown>) => {
  try {
    const data = await prisma.employees.create({ data: employee as any });
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
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error updating employee:', error);
    return { data: null, error: String(error) };
  }
};

export const deactivateEmployee = async (documentNumber: string, terminationDate: string, reason: string) => {
  try {
    const data = await prisma.employees.updateMany({
      where: { document_number: documentNumber },
      data: {
        is_active: false,
        termination_date: terminationDate,
        reason_for_termination: reason,
      } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error deactivating employee:', error);
    return { data: null, error: String(error) };
  }
};

export const reactivateEmployeeByDocNumber = async (documentNumber: string) => {
  try {
    const data = await prisma.employees.updateMany({
      where: { document_number: documentNumber },
      data: {
        is_active: true,
        termination_date: null,
        reason_for_termination: null,
      } as any,
    });
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
