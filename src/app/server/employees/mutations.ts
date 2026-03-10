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
