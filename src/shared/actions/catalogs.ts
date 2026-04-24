'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

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
  const { companyId } = await getActionContext();
  try {
    const data = await prisma.hierarchy.findMany({
      where: companyId
        ? { OR: [{ company_id: companyId }, { company_id: null }] }
        : undefined,
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    return [];
  }
};

export const fetchAllWorkDiagrams = async () => {
  const { companyId } = await getActionContext();
  try {
    const data = await prisma.work_diagram.findMany({
      where: companyId
        ? { OR: [{ company_id: companyId }, { company_id: null }] }
        : undefined,
    });
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

// --- Catálogos para condiciones de documentos ---

export const fetchAllGuilds = async () => {
  try {
    const data = await prisma.guild.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return data.map((g) => ({ id: g.id, name: g.name ?? '' }));
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return [];
  }
};

export const fetchAllCovenants = async () => {
  try {
    const data = await prisma.covenant.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return data.map((c) => ({ id: c.id, name: c.name ?? '' }));
  } catch (error) {
    console.error('Error fetching covenants:', error);
    return [];
  }
};

export const fetchAllBrandVehicles = async () => {
  try {
    const data = await prisma.brand_vehicles.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return data.map((b) => ({ id: String(b.id), name: b.name ?? '' }));
  } catch (error) {
    console.error('Error fetching brand vehicles:', error);
    return [];
  }
};

export const fetchAllHierarchies = async () => {
  const { companyId } = await getActionContext();
  try {
    const data = await prisma.hierarchy.findMany({
      where: {
        is_active: true,
        ...(companyId
          ? { OR: [{ company_id: companyId }, { company_id: null }] }
          : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return data.map((h) => ({ id: h.id, name: h.name }));
  } catch (error) {
    console.error('Error fetching hierarchies:', error);
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
