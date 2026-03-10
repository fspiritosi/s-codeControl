'use server';
import { prisma } from '@/lib/prisma';
import { getActionContext } from '@/lib/server-action-context';

export const UpdateDiagramsById = async (diagramData: { diagram_type: string; diagramId: string }[]) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const promises = diagramData.map(async ({ diagram_type, diagramId }) => {
    try {
      const data = await prisma.employees_diagram.update({
        where: { id: diagramId },
        data: { diagram_type },
      });
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results;
};

export const CreateDiagrams = async (diagramData: EmployeeDiagramInsert[]) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const promises = diagramData.map(async (diagram) => {
    try {
      const data = await prisma.employees_diagram.create({
        data: {
          employee_id: diagram.employee_id,
          diagram_type: diagram.diagram_type,
          day: diagram.day,
          month: diagram.month,
          year: diagram.year,
        } as any,
      });
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results;
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
