'use server';
import { prisma } from '@/lib/prisma';
import { storageServer } from '@/lib/storage-server';
import { supabaseServer } from '@/lib/supabase/server';
import { getActionContext } from '@/lib/server-action-context';
import { getActualRole } from '@/lib/utils';
import moment from 'moment';

// Company-related actions
export const fetchCurrentCompany = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.company.findMany({
      where: { id: companyId },
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching company:', error);
    return [];
  }
};
export const fetchAllEquipmentWithRelations = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.vehicles.findMany({
      where: { company_id: companyId },
      include: {
        brand_rel: true,
        model_rel: true,
        type_rel: true,
        type_of_vehicle_rel: true,
        contractor_equipment: {
          include: { contractor: true },
        },
      },
      orderBy: { domain: 'asc' },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
};
export const fetchVehicleBrands = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.brand_vehicles.findMany({
      where: { is_active: true, company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching vehicle brands:', error);
    return [];
  }
};
export const fetchVehicleModels = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.model_vehicles.findMany({
      where: { is_active: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching vehicle models:', error);
    return [];
  }
};
export const fetchTypeVehicles = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.type.findMany({
      where: { is_active: true, company_id: companyId },
      orderBy: { name: 'asc' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    return [];
  }
};
export const fetchTypesOfVehicles = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.types_of_vehicles.findMany({
      where: { is_active: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching types of vehicles:', error);
    return [];
  }
};
export const setVehicleDataOptions = async () => {
  const brands = await fetchVehicleBrands();
  const models = await fetchVehicleModels();
  const types = await fetchTypeVehicles();
  const typesOfVehicles = await fetchTypesOfVehicles();
  const customers = await fetchCustomers();

  return {
    brand: brands.map((brand: any) => brand.name!),
    model: models.map((model: any) => model.name!),
    type: types.map((type: any) => type.name!),
    types_of_vehicles: typesOfVehicles.map((type: any) => type.name!),
    contractor_equipment: customers.map((customer: any) => customer.name!),
  };
};
export const fetchCustomers = async () => {
  const { companyId } = await getActionContext();

  try {
    const data = await prisma.customers.findMany({
      where: { is_active: true, company_id: companyId || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};
export const fetchWorkDiagrams = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.work_diagram.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching work diagrams:', error);
    return [];
  }
};
export const fetchGuilds = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.guild.findMany({
      where: { is_active: true, company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return [];
  }
};
export const fetchCovenants = async () => {
  const { companyId } = await getActionContext();

  try {
    const data = await prisma.covenant.findMany({
      where: { is_active: true, company_id: companyId || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching covenants:', error);
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
export const fetchHierrarchicalPositions = async () => {
  try {
    const data = await prisma.hierarchy.findMany({
      where: { is_active: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching hierarchical positions:', error);
    return [];
  }
};
export const fetchProvinces = async () => {
  try {
    const data = await prisma.provinces.findMany({
      select: { id: true, name: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
};

export const setEmployeeDataOptions = async () => {
  const workDiagrams = await fetchWorkDiagrams();
  const guilds = await fetchGuilds();
  const covenants = await fetchCovenants();
  const categories = await fetchAllCategories();
  const hierarchicalPositions = await fetchHierrarchicalPositions();
  const customers = await fetchCustomers();
  const provinces = await fetchProvinces();
  // const companyPositions = await fetchCompanyPositions();

  return {
    workflow_diagram: workDiagrams.map((diagram: any) => diagram.name),
    guild: guilds.map((guild: any) => guild.name!) || [],
    covenant: covenants.map((covenant: any) => covenant.name!),
    category: categories.map((category: any) => category.name!),
    hierarchical_position: hierarchicalPositions.map((position: any) => position.name),
    contractor_employee: customers.map((customer: any) => customer.name),
    province: provinces.map((province: any) => province.name.trim()),
    gender: ['Masculino', 'Femenino', 'No Declarado'],
    marital_status: ['Soltero', 'Casado', 'Viudo', 'Divorciado', 'Separado'],
    nationality: ['Argentina', 'Extranjero'],
    document_type: ['DNI', 'LE', 'LC', 'PASAPORTE'],
    level_of_education: ['Primario', 'Secundario', 'Terciario', 'Posgrado', 'Universitario'],
    status: ['Avalado', 'Completo', 'Incompleto', 'No avalado', 'Completo con doc vencida'],
    type_of_contract: ['Período de prueba', 'A tiempo indeterminado', 'Plazo fijo'],
  };
};
export const fetchAllEmployeesWithRelations = async () => {
  const { companyId } = await getActionContext();
  const user = await fetchCurrentUser();
  if (!companyId) return [];

  // Update user metadata via supabase auth admin
  const supabase = await supabaseServer();
  supabase.auth.admin.updateUserById(user?.id || '', {
    app_metadata: {
      company: companyId,
    },
  });

  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId },
      include: {
        guild_rel: true,
        covenants_rel: true,
        category_rel: true,
        city_rel: true,
        province_rel: true,
        workflow_diagram_rel: true,
        hierarchy_rel: true,
        birthplace_rel: true,
        contractor_employee: {
          include: { contractor: true },
        },
      },
      orderBy: { lastname: 'asc' },
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};
export const fetchAllEmployeesWithRelationsById = async (id: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId, id },
      include: {
        guild_rel: true,
        covenants_rel: true,
        category_rel: true,
        city_rel: true,
        province_rel: true,
        workflow_diagram_rel: true,
        hierarchy_rel: true,
        birthplace_rel: true,
        contractor_employee: {
          include: { contractor: true },
        },
      },
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};
export const findEmployeeByFullName = async (fullName: string) => {
  try {
    const { companyId } = await getActionContext();

    const employees = await prisma.$queryRaw<any[]>`
      SELECT * FROM find_employee_by_full_name_v2(${fullName}, ${companyId || ''})
    `;

    return employees?.[0] || null;
  } catch (error) {
    console.error('Error al buscar empleado por nombre completo:', error);
    return null;
  }
};
export const fetchSingEmployee = async (employeesId: string) => {
  //Traer el tipo de documento que se llame firma
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const docType = await prisma.document_types.findFirst({
      where: { name: 'Firma', is_active: true },
      select: { id: true },
    });

    const employeeSingDocument = await prisma.documents_employees.findMany({
      where: {
        id_document_types: docType?.id || '',
        applies: employeesId,
        document_path: { not: null },
        is_active: true,
      },
    });

    const publicUrl = await storageServer.getPublicUrl('document_files', employeeSingDocument?.[0]?.document_path || '');


    return publicUrl || null;
  } catch (error) {
    console.error('Error fetching document type:', error);
    return null;
  }
};
export const fetchCompanyDocuments = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.documents_company.findMany({
      where: { applies: companyId },
      include: {
        document_type: true,
        user: true,
      },
    });
    return (data || []) as any[];
  } catch (error) {
    console.error('Error fetching company documents:', error);
    return [];
  }
};
// Employee-related actions
export const fetchAllEmployees = async (role?: string) => {
  const { companyId } = await getActionContext();
  const user = await fetchCurrentUser();
  if (!companyId) return [];

  if (role === 'Invitado') {
    try {
      const data = await prisma.share_company_users.findMany({
        where: { profile_id: user?.id || '', company_id: companyId },
        include: {
          customer: {
            include: {
              contractor_equipment: {
                include: { vehicle: true },
              },
            },
          },
        },
      });

      const employees_raw = (data as any)?.[0]?.customer?.contractor_equipment;
      const allEmployees = employees_raw?.map((item: any) => item.vehicle);
      return allEmployees || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};
export const fetchAllActivesEmployees = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId, is_active: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};
export const fetchAllEmployeesJUSTEXAMPLE = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.employees.findMany();
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};
export const fetchAllEquipmentJUSTEXAMPLE = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.vehicles.findMany({
      include: {
        type_rel: true,
        brand_rel: true,
        model_rel: true,
      },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};
export const fetchAllRepairsJUSTEXAMPLE = async () => {
  try {
    const data = await prisma.repair_solicitudes.findMany();
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
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
    return data as any[];
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
      return data as any[];
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
      return data as any[];
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
      return data as any[];
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
      return data as any[];
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
    return data as any[];
  } catch (error) {
    console.error('Error fetching employee permanent documents:', error);
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

// Document-related actions
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

  const today = moment().startOf('day');
  const nextMonth = moment().add(1, 'month').endOf('day');

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
      (data as any[])?.filter(
        (doc: any) =>
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

  const today = moment().startOf('day');
  const nextMonth = moment().add(1, 'month').endOf('day');

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
      (data as any[])?.filter(
        (doc: any) =>
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
    return data as any[];
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
    return data as any[];
  } catch (error) {
    console.error('Error fetching document equipment by id:', error);
    return [];
  }
};
// Equipment-related actions
export const fetchAllEquipment = async (company_equipment_id?: string) => {
  const { companyId } = await getActionContext();
  if (!companyId && !company_equipment_id) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  if (role === 'Invitado') {
    try {
      const data = await prisma.share_company_users.findMany({
        where: {
          profile_id: user?.id || '',
          company_id: (companyId ?? company_equipment_id) || '',
        },
        include: {
          customer: {
            include: {
              contractor_equipment: {
                include: {
                  vehicle: {
                    include: {
                      brand_rel: true,
                      model_rel: true,
                      type_rel: true,
                      type_of_vehicle_rel: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const equipments = (data as any)?.[0]?.customer?.contractor_equipment;
      const allEquipments = equipments?.map((equipment: any) => equipment.vehicle);
      return allEquipments || [];
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  }

  try {
    const data = await prisma.vehicles.findMany({
      where: { company_id: (companyId ?? company_equipment_id) || '' },
      include: {
        brand_rel: true,
        model_rel: true,
        type_rel: true,
        type_of_vehicle_rel: true,
        contractor_equipment: {
          include: { contractor: true },
        },
      },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching equipment:', error);
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
      return data as any[];
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
      return data as any[];
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
    return data as any[];
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
      return data as any[];
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
      return data as any[];
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
export const updateDocumentType = async (id: string, data: any): Promise<{ message: string } | null> => {
  const { companyId } = await getActionContext();
  if (!companyId) return { message: 'No company context' };

  try {
    await prisma.document_types.update({
      where: { id },
      data,
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
      return data.map((d: any) => ({ id: d.id, applies: d.vehicle })) as any[];
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
      return data.map((d: any) => ({ id: d.id, applies: d.employee })) as any[];
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
    return data as any[];
  } catch (error) {
    console.error('Error fetching equipment permanent documents:', error);
    return [];
  }
};
export const fetchEquipmentById = async (id: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const vehicleData = await prisma.vehicles.findMany({
      where: { id },
      include: {
        brand_rel: { select: { name: true } },
        model_rel: { select: { name: true } },
        type_of_vehicle_rel: { select: { name: true } },
        type_rel: { select: { name: true } },
      },
    });

    const vehicle = vehicleData?.map((item: any) => ({
      ...item,
      type_of_vehicle: item.type_of_vehicle_rel.name,
      brand: item.brand_rel.name,
      model: item.model_rel.name,
      type: item.type_rel.name,
    }));
    return vehicle;
  } catch (error) {
    console.error('Error fetching equipment by id:', error);
    return [];
  }
};
// Repair-related actions
export const fetchAllOpenRepairRequests = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment: { company_id: companyId },
        state: { in: ['Pendiente', 'Esperando_repuestos', 'En_reparacion'] },
      },
      include: {
        user: true,
        employee: true,
        equipment: {
          include: {
            type_rel: true,
            brand_rel: true,
            model_rel: true,
          },
        },
        reparation_type_rel: true,
        repairlogs: {
          include: {
            employee: true,
            user: true,
          },
        },
      },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching open repair requests:', error);
    return [];
  }
};
export const fetchRepairRequestsByEquipmentId = async (equipmentId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment_id: equipmentId,
        state: { in: ['Pendiente', 'Esperando_repuestos', 'En_reparacion'] },
      },
      include: {
        user: true,
        employee: true,
        equipment: {
          include: {
            type_rel: true,
            brand_rel: true,
            model_rel: true,
          },
        },
        reparation_type_rel: true,
        repairlogs: {
          include: {
            employee: true,
            user: true,
          },
        },
      },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching repair requests by equipment ID:', error);
    return [];
  }
};
// Users-related actions

export const getAllUsers = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.share_company_users.findMany({
      where: { company_id: companyId },
      include: {
        profile: true,
        customer: true,
      },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};
export const getUsersbyId = async ({ id }: { id: string }) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.share_company_users.findMany({
      where: { company_id: companyId, id: id || '' },
      include: { profile: true },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};
export const getOwnerUser = async () => {
  const curretUser = await fetchCurrentCompany();
  if (!curretUser) return [];

  try {
    const data = await prisma.profile.findMany({
      where: { id: (curretUser as any)[0]?.owner_id || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching owner user:', error);
    return [];
  }
};

// Miscellaneous actions
export const fetchCurrentUser = async () => {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};
export const fetchCustomForms = async (id_company?: string) => {
  const { companyId } = await getActionContext();
  if (!companyId && !id_company) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  if (role === 'Invitado') {
    try {
      const share_company_users = await prisma.share_company_users.findMany({
        where: {
          profile_id: user?.id || '',
          company_id: companyId || '',
        },
        include: {
          customer: {
            include: {
              contractor_equipment: {
                include: {
                  vehicle: {
                    include: {
                      brand_rel: true,
                      model_rel: true,
                      type_rel: true,
                      type_of_vehicle_rel: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const equipments_id = (share_company_users as any[])?.flatMap((uc) =>
        uc.customer?.contractor_equipment?.map((ce: any) => ce.vehicle.id)
      );

      // For filtering form_answers by JSON field, we need to fetch all and filter in JS
      const data = await prisma.custom_form.findMany({
        where: { company_id: companyId || id_company || '' },
        include: { form_answers: true },
      });

      // Filter form_answers where answer.movil is in equipments_id
      const filtered = data.map((form: any) => ({
        ...form,
        form_answers: form.form_answers.filter((answer: any) =>
          equipments_id?.includes((answer.answer as any)?.movil)
        ),
      }));

      return filtered as any[];
    } catch (error) {
      console.error('Error fetching custom forms:', error);
      return [];
    }
  }

  try {
    const data = await prisma.custom_form.findMany({
      where: { company_id: companyId || id_company || '' },
      include: { form_answers: true },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching custom forms:', error);
    return [];
  }
};
export const fetchCustomFormById = async (formId: string) => {
  try {
    const data = await prisma.custom_form.findMany({
      where: { id: formId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching custom form by ID:', error);
    return [];
  }
};
export const fetchFormsAnswersByFormId = async (formId: string) => {
  const { companyId } = await getActionContext();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  if (role === 'Invitado') {
    try {
      const share_company_users = await prisma.share_company_users.findMany({
        where: {
          profile_id: user?.id || '',
          company_id: companyId || '',
        },
        include: {
          customer: {
            include: {
              contractor_equipment: {
                include: {
                  vehicle: {
                    include: {
                      brand_rel: true,
                      model_rel: true,
                      type_rel: true,
                      type_of_vehicle_rel: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const equipments_id =
        (share_company_users as any[])?.flatMap((uc) =>
          uc.customer?.contractor_equipment?.map((ce: any) => ce.vehicle.id)
        ) || [];

      // Fetch all form answers and filter by JSON field in JS
      const allAnswers = await prisma.form_answers.findMany({
        where: { form_id: formId },
      });

      const data = allAnswers.filter((answer: any) =>
        equipments_id.includes((answer.answer as any)?.movil)
      );

      return data as any[];
    } catch (error) {
      console.error('Error fetching form answers:', error);
      return [];
    }
  }

  // If not invitado, return all form answers
  try {
    const data = await prisma.form_answers.findMany({
      where: { form_id: formId },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching form answers:', error);
    return [];
  }
};
export const fetchAnswerById = async (answerId: string) => {
  try {
    const data = await prisma.form_answers.findMany({
      where: { id: answerId },
      include: { form: true },
      orderBy: { created_at: 'desc' },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching form answers:', error);
    return [];
  }
};
export const getCurrentProfile = async () => {
  const user = await fetchCurrentUser();

  if (!user) return [];

  try {
    const data = await prisma.profile.findMany({
      where: { id: user?.id || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching current profile:', error);
    return [];
  }
};
export const verifyUserRoleInCompany = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return '';

  const user = await fetchCurrentUser();

  try {
    const data = await prisma.share_company_users.findMany({
      where: { profile_id: user?.id || '', company_id: companyId },
    });

    return { rol: data[0]?.role || '', modulos: data[0]?.modules || [] };
  } catch (error) {
    console.error('Error verifying user role:', error);
    return '';
  }
};

export const fetchDiagramsHistoryByEmployeeId = async (employeeId: string) => {
  try {
    const data = await prisma.diagrams_logs.findMany({
      where: { employee_id: employeeId },
      include: { modified_by_profile: true },
      orderBy: { created_at: 'desc' },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching diagrams history:', error);
    return [];
  }
};
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
    return data as any[];
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
    return data as any[];
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

export async function getCompanyDetails(companyId: string) {
  try {
    const data = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, company_name: true, website: true, contact_email: true, company_logo: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching company details:', error);
    return null;
  }
}

// ── Phase 3.6: Server actions for store migration ──

export const fetchCompaniesByOwner = async (ownerId: string) => {
  if (!ownerId) return [];
  try {
    const data = await prisma.company.findMany({
      where: { owner_id: ownerId },
      include: {
        owner: true,
        share_company_users: { include: { profile: true } },
        city_rel: { select: { name: true, id: true } },
        province_rel: { select: { name: true, id: true } },
        employees: {
          include: {
            city_rel: { select: { name: true } },
            province_rel: { select: { name: true } },
            workflow_diagram_rel: { select: { name: true } },
            hierarchy_rel: { select: { name: true } },
            birthplace_rel: { select: { name: true } },
            contractor_employee: { include: { contractor: true } },
          },
        },
      },
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching companies by owner:', error);
    return [];
  }
};

export const fetchSharedCompaniesByProfile = async (profileId: string) => {
  if (!profileId) return [];
  try {
    const data = await prisma.share_company_users.findMany({
      where: { profile_id: profileId },
      include: {
        company: {
          include: {
            owner: true,
            share_company_users: { include: { profile: true } },
            city_rel: { select: { name: true, id: true } },
            province_rel: { select: { name: true, id: true } },
            employees: {
              include: {
                city_rel: { select: { name: true } },
                province_rel: { select: { name: true } },
                workflow_diagram_rel: { select: { name: true } },
                hierarchy_rel: { select: { name: true } },
                birthplace_rel: { select: { name: true } },
                contractor_employee: { include: { contractor: true } },
              },
            },
          },
        },
      },
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching shared companies:', error);
    return [];
  }
};

export const fetchSharedUsersByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.share_company_users.findMany({
      where: { company_id: companyId },
      include: {
        customer: true,
        profile: true,
        company: {
          include: {
            owner: true,
            share_company_users: { include: { profile: true } },
            city_rel: { select: { name: true, id: true } },
            province_rel: { select: { name: true, id: true } },
            employees: {
              include: {
                city_rel: { select: { name: true } },
                province_rel: { select: { name: true } },
                workflow_diagram_rel: { select: { name: true } },
                hierarchy_rel: { select: { name: true } },
                birthplace_rel: { select: { name: true } },
                contractor_employee: { include: { contractor: true } },
              },
            },
          },
        },
      },
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching shared users:', error);
    return [];
  }
};

export const fetchProfileByCredentialId = async (credentialId: string) => {
  if (!credentialId) return [];
  try {
    const data = await prisma.profile.findMany({
      where: { credential_id: credentialId },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching profile:', error);
    return [];
  }
};

export const fetchEmployeesWithDocs = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId },
      include: {
        city_rel: { select: { name: true } },
        province_rel: { select: { name: true } },
        workflow_diagram_rel: { select: { name: true } },
        hierarchy_rel: { select: { name: true } },
        birthplace_rel: { select: { name: true } },
        documents_employees: { include: { document_type: true } },
        guild_rel: true,
        covenants_rel: true,
        category_rel: true,
        contractor_employee: { include: { contractor: true } },
      },
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching employees with docs:', error);
    return [];
  }
};

export const fetchEmployeesByCompanyAndStatus = async (companyId: string, status: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId, status: status as any },
      include: {
        city_rel: { select: { name: true } },
        province_rel: { select: { name: true } },
        workflow_diagram_rel: { select: { name: true } },
        hierarchy_rel: { select: { name: true } },
        birthplace_rel: { select: { name: true } },
        contractor_employee: { include: { contractor: true } },
      },
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching employees by status:', error);
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
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching document employees:', error);
    return [];
  }
};

export const fetchVehiclesByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.vehicles.findMany({
      where: { company_id: companyId },
      include: {
        type_of_vehicle_rel: { select: { name: true } },
        brand_rel: { select: { name: true } },
        model_rel: { select: { name: true } },
      },
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
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
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching equipment docs:', error);
    return [];
  }
};

export const fetchNotificationsByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.notifications.findMany({
      where: { company_id: companyId },
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const deleteNotificationsByCompany = async (companyId: string) => {
  if (!companyId) return { error: 'No company ID' };
  try {
    await prisma.notifications.deleteMany({
      where: { company_id: companyId },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return { error: String(error) };
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
    return (data ?? []) as any[];
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
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching equipment documents:', error);
    return [];
  }
};

export const fetchCountries = async () => {
  try {
    const data = await prisma.countries.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
};

export const fetchCitiesByProvince = async (provinceId: number) => {
  try {
    const data = await prisma.cities.findMany({
      where: { province_id: provinceId },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

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

export const fetchAllCustomers = async () => {
  try {
    const data = await prisma.customers.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

export const fetchContactsWithCustomers = async () => {
  try {
    const data = await prisma.contacts.findMany({
      include: { customer: { select: { id: true, name: true } } },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching contacts:', error);
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

export const resetCompanyDefect = async (ownerId: string) => {
  if (!ownerId) return { error: 'No owner ID' };
  try {
    await prisma.company.updateMany({
      where: { owner_id: ownerId },
      data: { by_defect: false },
    });
    return { error: null };
  } catch (error) {
    console.error('Error resetting default company:', error);
    return { error: String(error) };
  }
};

export const setCompanyAsDefect = async (companyId: string) => {
  if (!companyId) return { error: 'No company ID' };
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { by_defect: true },
    });
    return { error: null };
  } catch (error) {
    console.error('Error setting default company:', error);
    return { error: String(error) };
  }
};
