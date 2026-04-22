'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

export const fetchDiagrams = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.employees_diagram.findMany({
      where: {
        employee: { company_id: companyId },
      },
      include: {
        diagram_type_rel: true,
        employee: true,
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching diagrams:', error);
    return [];
  }
};

export const fetchDiagramsByEmployeeId = async (employeeId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.employees_diagram.findMany({
      where: {
        employee_id: employeeId,
      },
      include: {
        diagram_type_rel: true,
        employee: true,
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching diagrams:', error);
    return [];
  }
};

export const fetchDiagramsTypes = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.diagram_type.findMany({
      where: { company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching diagrams types:', error);
    return [];
  }
};

export const getDiagramEmployee = async ({ employee_id }: { employee_id: string }) => {
  try {
    const data = await prisma.employees_diagram.findMany({
      where: { employee_id },
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
};

export const fetchDiagramsHistoryByEmployeeId = async (employeeId: string) => {
  try {
    const data = await prisma.diagrams_logs.findMany({
      where: { employee_id: employeeId },
      include: { modified_by_profile: true },
      orderBy: { created_at: 'desc' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching diagrams history:', error);
    return [];
  }
};

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
