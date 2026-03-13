'use server';
import { prisma } from '@/shared/lib/prisma';

// --- From shared/queries.ts ---

export const fetchAllCompanies = async () => {
  try {
    const data = await prisma.company.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching all companies:', error);
    return [];
  }
};

export const fetchAllIndustryTypes = async () => {
  try {
    const data = await prisma.industry_type.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching industry types:', error);
    return [];
  }
};

export const fetchAllTypesOfVehicles = async () => {
  try {
    const data = await prisma.types_of_vehicles.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching types of vehicles:', error);
    return [];
  }
};

export const fetchActiveDocumentTypesGlobal = async () => {
  try {
    const data = await prisma.document_types.findMany({
      where: { is_active: true, company_id: null },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
};

export const fetchAllWorkDiagramsAdmin = async () => {
  try {
    const data = await prisma.work_diagram.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching work diagrams:', error);
    return [];
  }
};

export const fetchPresentedDocumentsForAuditor = async () => {
  try {
    const equipmentDocs = await prisma.documents_equipment.findMany({
      where: { state: 'presentado' },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
            company: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const employeeDocs = await prisma.documents_employees.findMany({
      where: { state: 'presentado' },
      include: {
        document_type: true,
        employee: {
          include: {
            contractor_employee: {
              include: { contractor: true },
            },
            company: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return { equipmentDocs, employeeDocs };
  } catch (error) {
    console.error('Error fetching presented documents:', error);
    return { equipmentDocs: [], employeeDocs: [] };
  }
};

export const fetchEmployeeByCuil = async (cuil: string) => {
  try {
    const data = await prisma.employees.findMany({
      where: { cuil },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employee by cuil:', error);
    return [];
  }
};

// --- From company/queries.ts ---

export const fetchIndustryTypes = async () => {
  try {
    const data = await prisma.industry_type.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching industry types:', error);
    return [];
  }
};

// --- From employees/queries.ts ---

export const fetchHierarchy = async () => {
  try {
    const data = await prisma.hierarchy.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    return [];
  }
};

export const fetchAllWorkDiagrams = async () => {
  try {
    const data = await prisma.work_diagram.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching work diagrams:', error);
    return [];
  }
};

export const fetchAllCategories = async () => {
  try {
    const data = await prisma.category.findMany({
      where: { is_active: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// --- From company/mutations.ts ---

export const logErrorMessage = async (message: string, path: string) => {
  try {
    await prisma.handle_errors.create({ data: { menssage: message, path } as any });
    return { error: null };
  } catch (error) {
    console.error('Error logging error message:', error);
    return { error: String(error) };
  }
};
