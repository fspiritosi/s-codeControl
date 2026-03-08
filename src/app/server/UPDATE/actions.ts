'use server';
import { prisma } from '@/lib/prisma';
import { getActionContext } from '@/lib/server-action-context';

// Users-related actions

export const CreateNewFormAnswer = async (formId: string, formAnswer: any) => {
  // getActionContext not needed — no companyId guard in original
  const data = await prisma.form_answers.create({
    data: {
      form_id: formId,
      answer: formAnswer,
    },
  });

  return data;
};

export const UpdateVehicle = async (vehicleId: string, vehicleData: any) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];
  try {
    await prisma.vehicles.update({
      where: { id: vehicleId },
      data: vehicleData,
    });
  } catch (error) {
    console.log('error', error);
  }
};

export const updateModulesSharedUser = async ({ id, modules }: { id: string; modules: ModulosEnum[] }) => {
  try {
    const data = await prisma.share_company_users.update({
      where: { id },
      data: { modules } as any,
    });
    return [data];
  } catch (error) {
    console.error('Error fetching users:', error);
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
      console.log('error', error);
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
      console.log('error', error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results;
};
