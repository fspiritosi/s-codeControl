'use server';
import { prisma } from '@/lib/prisma';
import { supabaseServer } from '@/lib/supabase/server';
import { getActionContext } from '@/lib/server-action-context';
import { getActualRole } from '@/lib/utils';
import { startOfDay, endOfDay, addMonths } from 'date-fns';
import type { Prisma } from '@/generated/prisma/client';

// Document-related queries

export const fetchAllDocumentTypes = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.document_types.findMany({
      where: {
        is_active: true,
        OR: [{ company_id: companyId }, { company_id: null }],
      },
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
};

export const fetchDocumentsByDocumentTypeId = async (documentTypeId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        id_document_types: documentTypeId,
        document_path: { not: null },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching documents by document type:', error);
    return [];
  }
};

export const getNextMonthExpiringDocumentsEmployees = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const today = startOfDay(new Date());
  const nextMonth = endOfDay(addMonths(new Date(), 1));

  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        employee: {
          is: { company_id: companyId, is_active: true },
        },
        document_type: {
          is: { is_active: true, NOT: { is_it_montlhy: true } },
        },
        validity: {
          not: null,
          lte: nextMonth.toISOString(),
        },
      },
      include: {
        document_type: true,
        employee: {
          include: {
            contractor_employee: {
              include: { contractor: true },
            },
          },
        },
      },
      orderBy: { validity: 'asc' },
    });

    // Filter documents with active document types and valid names
    return (
      (data)?.filter(
        (doc) =>
          doc.document_type?.is_active === true &&
          doc.document_type?.name &&
          doc.document_type?.name.trim() !== '' &&
          !doc.document_type?.name.startsWith('...') &&
          doc.employee?.is_active === true
      ) || []
    );
  } catch (error) {
    console.error('Error fetching next month expiring documents:', error);
    return [];
  }
};

export const getNextMonthExpiringDocumentsVehicles = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const today = startOfDay(new Date());
  const nextMonth = endOfDay(addMonths(new Date(), 1));

  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        vehicle: {
          is: { company_id: companyId, is_active: true },
        },
        document_type: {
          is: { is_active: true, NOT: { is_it_montlhy: true } },
        },
        validity: {
          not: null,
          lte: nextMonth.toISOString(),
        },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            brand_rel: true,
            model_rel: true,
          },
        },
      },
      orderBy: { validity: 'asc' },
    });

    // Filter documents with active document types and valid names
    return (
      (data)?.filter(
        (doc) =>
          doc.document_type?.is_active === true &&
          doc.document_type?.name &&
          doc.document_type?.name.trim() !== '' &&
          !doc.document_type?.name.startsWith('...') &&
          doc.vehicle?.is_active === true
      ) || []
    );
  } catch (error) {
    console.error('Error fetching next month expiring documents:', error);
    return [];
  }
};

export const getDocumentEmployeesById = async (id: string) => {
  try {
    const data = await prisma.documents_employees.findMany({
      where: { id },
      include: {
        document_type: true,
        employee: {
          include: {
            city_rel: { select: { name: true } },
            province_rel: { select: { name: true } },
            contractor_employee: {
              include: { contractor: true },
            },
            company: {
              include: { province_rel: { select: { name: true } } },
            },
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching document employees by id:', error);
    return [];
  }
};

export const getDocumentEquipmentById = async (id: string) => {
  try {
    const data = await prisma.documents_equipment.findMany({
      where: { id },
      include: {
        document_type: true,
        vehicle: {
          include: {
            brand_rel: { select: { name: true } },
            model_rel: { select: { name: true } },
            type_of_vehicle_rel: { select: { name: true } },
            company: {
              include: { province_rel: { select: { name: true } } },
            },
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching document equipment by id:', error);
    return [];
  }
};

export const fetchEmployeeMonthlyDocuments = async () => {
  const { companyId } = await getActionContext();

  if (!companyId) return [];

  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        document_type: {
          is: { is_it_montlhy: true, is_active: true },
        },
        employee: {
          is: { company_id: companyId, is_active: true },
        },
      },
      include: {
        document_type: true,
        employee: {
          include: {
            contractor_employee: {
              include: { contractor: true },
            },
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employee monthly documents:', error);
    return [];
  }
};

export const fetchEmployeeMonthlyDocumentsByEmployeeId = async (employeeId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  try {
    if (role === 'Invitado') {
      const data = await prisma.documents_employees.findMany({
        where: {
          applies: employeeId,
          document_type: {
            is: { is_it_montlhy: true, private: false, is_active: true },
          },
        },
        include: {
          document_type: true,
          employee: {
            include: {
              contractor_employee: {
                include: { contractor: true },
              },
            },
          },
        },
      });
      return data;
    } else {
      const data = await prisma.documents_employees.findMany({
        where: {
          applies: employeeId,
          document_type: {
            is: { is_it_montlhy: true, is_active: true },
          },
        },
        include: {
          document_type: true,
          employee: {
            include: {
              contractor_employee: {
                include: { contractor: true },
              },
            },
          },
        },
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching employee monthly documents:', error);
    return [];
  }
};

export const fetchEmployeePermanentDocumentsByEmployeeId = async (employeeId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);


  try {
    if (role === 'Invitado') {
      const data = await prisma.documents_employees.findMany({
        where: {
          applies: employeeId,
          document_type: {
            is: { is_it_montlhy: false, private: false, is_active: true },
          },
        },
        include: {
          document_type: true,
          employee: {
            include: {
              contractor_employee: {
                include: { contractor: true },
              },
            },
          },
        },
      });
      return data;
    } else {
      const data = await prisma.documents_employees.findMany({
        where: {
          applies: employeeId,
          document_type: {
            is: { is_it_montlhy: false, is_active: true },
          },
        },
        include: {
          document_type: true,
          employee: {
            include: {
              contractor_employee: {
                include: { contractor: true },
              },
            },
          },
        },
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching employee permanent documents:', error);
    return [];
  }
};

export const fetchEmployeePermanentDocuments = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        document_type: {
          is: { is_active: true, NOT: { is_it_montlhy: true } },
        },
        employee: {
          is: { company_id: companyId, is_active: true },
        },
      },
      include: {
        document_type: true,
        employee: {
          include: {
            contractor_employee: {
              include: { contractor: true },
            },
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employee permanent documents:', error);
    return [];
  }
};

export const fetchMonthlyDocumentsByEquipmentId = async (equipmentId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  try {
    if (role === 'Invitado') {
      const data = await prisma.documents_equipment.findMany({
        where: {
          applies: equipmentId,
          document_type: {
            is: { is_it_montlhy: true, private: false, is_active: true },
          },
        },
        include: {
          document_type: true,
          vehicle: {
            include: {
              type_rel: true,
              type_of_vehicle_rel: true,
              model_rel: true,
              brand_rel: true,
            },
          },
        },
      });
      return data;
    } else {
      const data = await prisma.documents_equipment.findMany({
        where: {
          applies: equipmentId,
          document_type: {
            is: { is_it_montlhy: true, is_active: true },
          },
        },
        include: {
          document_type: true,
          vehicle: {
            include: {
              type_rel: true,
              type_of_vehicle_rel: true,
              model_rel: true,
              brand_rel: true,
            },
          },
        },
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching equipment monthly documents:', error);
    return [];
  }
};

export const fetchMonthlyDocumentsEquipment = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        document_type: {
          is: { is_it_montlhy: true, is_active: true },
        },
        vehicle: {
          is: { is_active: true, company_id: companyId },
        },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching equipment monthly documents:', error);
    return [];
  }
};

export const fetchPermanentDocumentsByEquipmentId = async (equipmentId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  try {
    if (role === 'Invitado') {
      const data = await prisma.documents_equipment.findMany({
        where: {
          applies: equipmentId,
          document_type: {
            is: { is_active: true, private: false, NOT: { is_it_montlhy: true } },
          },
        },
        include: {
          document_type: true,
          vehicle: {
            include: {
              type_rel: true,
              type_of_vehicle_rel: true,
              model_rel: true,
              brand_rel: true,
            },
          },
        },
      });
      return data;
    } else {
      const data = await prisma.documents_equipment.findMany({
        where: {
          applies: equipmentId,
          document_type: {
            is: { is_active: true, NOT: { is_it_montlhy: true } },
          },
        },
        include: {
          document_type: true,
          vehicle: {
            include: {
              type_rel: true,
              type_of_vehicle_rel: true,
              model_rel: true,
              brand_rel: true,
            },
          },
        },
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching equipment permanent documents:', error);
    return [];
  }
};

export const fetchallResources = async (applies: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    if (applies === 'Persona') {
      const data = await prisma.employees.findMany({
        where: { company_id: companyId },
        select: { firstname: true, lastname: true, cuil: true, id: true },
      });
      return data;
    } else if (applies === 'Equipos') {
      const data = await prisma.vehicles.findMany({
        where: { company_id: companyId },
        select: { domain: true, serie: true, intern_number: true, id: true },
      });
      return data;
    }
  } catch (error) {
    console.error('Error al obtener datos adicionales:', error);
  }
};

export const updateDocumentType = async (id: string, data: Prisma.document_typesUpdateInput | Record<string, unknown>): Promise<{ message: string } | null> => {
  const { companyId } = await getActionContext();
  if (!companyId) return { message: 'No company context' };

  try {
    await prisma.document_types.update({
      where: { id },
      data: data as Prisma.document_typesUpdateInput,
    });
    return null;
  } catch (error) {
    return { message: error instanceof Error ? error.message : String(error) };
  }
};

export const fettchExistingEntries = async (applies: string, id_document_types: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    if (applies === 'Equipos') {
      const data = await prisma.documents_equipment.findMany({
        where: {
          id_document_types,
          vehicle: {
            is: { company_id: companyId, is_active: true },
          },
        },
        include: { vehicle: true },
        // Return id and applies (vehicle)
      });
      return data.map((d) => ({ id: d.id, applies: d.vehicle }));
    } else if (applies === 'Persona') {
      const data = await prisma.documents_employees.findMany({
        where: {
          id_document_types,
          employee: {
            is: { company_id: companyId, is_active: true },
          },
        },
        include: { employee: true },
      });
      return data.map((d) => ({ id: d.id, applies: d.employee }));
    }
    return [];
  } catch (error) {
    console.error('Error al obtener los recursos con documentos:', error);
    return;
  }
};

export const fetchPermanentDocumentsEquipment = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        vehicle: {
          is: { company_id: companyId, is_active: true },
        },
        document_type: {
          is: { is_active: true, NOT: { is_it_montlhy: true } },
        },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching equipment permanent documents:', error);
    return [];
  }
};

export const fetchDocumentEmployeesByDocNumber = async (documentNumber: string) => {
  if (!documentNumber) return [];
  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        employee: { document_number: documentNumber },
      },
      include: {
        employee: true,
        document_type: true,
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching document employees:', error);
    return [];
  }
};

export const fetchEquipmentDocsByVehicleId = async (vehicleId: string) => {
  if (!vehicleId) return [];
  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        vehicle: { id: vehicleId },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
          },
        },
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching equipment docs:', error);
    return [];
  }
};

export const fetchAllDocumentsEmployeesByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        employee: { company_id: companyId, is_active: true },
        document_type: { is_active: true },
      },
      include: {
        employee: {
          include: {
            contractor_employee: { include: { contractor: true } },
          },
        },
        document_type: true,
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    return [];
  }
};

export const fetchAllDocumentsEquipmentByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        vehicle: { company_id: companyId, is_active: true },
        document_type: { is_active: true },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
          },
        },
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching equipment documents:', error);
    return [];
  }
};

export const fetchDocumentsByApplies = async (
  tableName: 'documents_employees' | 'documents_equipment',
  appliesId: string
) => {
  try {
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.findMany({
        where: { applies: appliesId, document_path: { not: null } },
      });
      return data;
    } else {
      const data = await prisma.documents_equipment.findMany({
        where: { applies: appliesId, document_path: { not: null } },
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching documents by applies:', error);
    return [];
  }
};

export const fetchDocumentTypesByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.document_types.findMany({
      where: {
        is_active: true,
        OR: [{ company_id: companyId }, { company_id: null }],
      },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
};

export const fetchDocumentTypesByCompanyIncludingInactive = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.document_types.findMany({
      where: {
        OR: [{ company_id: companyId }, { company_id: null }],
      },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
};

export const fetchDocumentEmployeesLogs = async (documentId: string) => {
  if (!documentId) return [];
  try {
    const data = await prisma.documents_employees_logs.findMany({
      where: { documents_employees_id: documentId },
      include: {
        documents_employees: {
          include: { user: { select: { email: true } } },
        },
      },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching document employees logs:', error);
    return [];
  }
};

export const fetchDocumentEquipmentLogs = async (documentId: string) => {
  if (!documentId) return [];
  try {
    const data = await prisma.documents_equipment_logs.findMany({
      where: { documents_equipment_id: documentId },
      include: {
        documents_equipment: {
          include: { user: { select: { email: true } } },
        },
      },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching document equipment logs:', error);
    return [];
  }
};
