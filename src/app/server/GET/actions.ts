'use server';
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
const supabase = supabaseServer();
const cookiesStore = cookies();
const company_id = cookiesStore.get('actualComp')?.value;

export const getActualCompany = async () => {
  if (!company_id) return [];

  let { data, error } = await supabase.from('company').select('*').eq('id', company_id);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data || [];
};

export const getAllDocumentTypes = async (columns: string = '*') => {
  if (!company_id) return [];

  let { data, error } = await supabase
    .from('document_types')
    .select('*')
    .eq('is_active', true)
    .or(`company_id.eq.${company_id},company_id.is.null`);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data || [];
};

export const getAllEmployees = async (columns: string = '*') => {
  if (!company_id) return [];
  const { data, error } = await supabase.from('employees').select('*').eq('company_id', company_id);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getAllDocumentsByIdDocumentType = async (selectedValue: string) => {
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('documents_employees')
    .select('*')
    .eq('id_document_types', selectedValue)
    .neq('document_path', null);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getAllEquipment = async (columns: string = '*') => {
  if (!company_id) return [];
  const { data, error } = await supabase.from('vehicles').select('*,brand(*)').eq('company_id', company_id);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getCurrentUser = async (columns: string = '*') => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

export const getMonthyDocumentsByIdEmployees = async (id: string) => {
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('documents_employees')
    .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
    .eq('applies', id)
    .eq('id_document_types.is_it_montlhy', true)
    .not('id_document_types', 'is', null)
    .returns<DocumentEmployeesWithRelations[]>();

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};
export const getPermanentDocumentsByIdEmployees = async (id: string) => {
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('documents_employees')
    .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
    .eq('id_document_types.is_it_montlhy', false)
    .eq('applies', id)
    .returns<DocumentEmployeesWithRelations[]>();

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getPermanentDocumentsByIdEquipment = async (id: string) => {
  if (!company_id) return [];
  let { data, error } = await supabase
    .from('documents_equipment')
    .select(`*,id_document_types(*),applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`)
    .not('id_document_types', 'is', null)
    .not('id_document_types.is_it_montlhy', 'is', true)
    .eq('applies', id)
    .returns<DocumentEquipmentWithRelations[]>();

  if (error || !data) {
    console.error('error', error);
    return [];
  }
  return data;
};
export const getMonthyDocumentsByIdEquipment = async (id: string) => {
  if (!company_id) return [];
  let { data, error } = await supabase
    .from('documents_equipment')
    .select(`*,id_document_types(*),applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`)
    .eq('id_document_types.is_it_montlhy', true)
    .not('id_document_types', 'is', null)
    .eq('applies', id)
    .returns<DocumentEquipmentWithRelations[]>();

  if (error || !data) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getCompanyDocuments = async () => {
  if (!company_id) return [];
  let { data, error } = await supabase
    .from('documents_company')
    .select('*,id_document_types(*),user_id(*)')
    .eq('applies', company_id)
    .returns<CompanyDocumentTypesWithRelations[]>();

  if (error || !data) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getOpenRepairSolicitudesWithRelations = async (id: string) => {
  if (!company_id) return [];
  let { data, error } = await supabase
    .from('repair_solicitudes')
    .select(
      '*,user_id(*),employee_id(*),equipment_id(*,type(*),brand(*),model(*)),reparation_type(*),repairlogs(*,modified_by_employee(*),modified_by_user(*))'
    )
    .eq('equipment_id', id)
    .in('state', ['Pendiente', 'Esperando repuestos', 'En reparación'])
    .returns<RepairSolicitudesWithRelations[]>();

  if (error || !data) {
    console.error('error', error);
    return [];
  }
  return data;
};
export const getAllOpenRepairSolicitudesWithRelations = async () => {
  if (!company_id) return [];
  let { data, error } = await supabase
    .from('repair_solicitudes')
    .select(
      '*,user_id(*),employee_id(*),equipment_id(*,type(*),brand(*),model(*)),reparation_type(*),repairlogs(*,modified_by_employee(*),modified_by_user(*))'
    )
    .eq('equipment_id.company_id', company_id)
    .in('state', ['Pendiente', 'Esperando repuestos', 'En reparación'])
    .returns<RepairSolicitudesWithRelations[]>();

  if (error || !data) {
    console.error('error', error);
    return [];
  }
  return data;
};
export const getTypeOfRepairs = async () => {
  if (!company_id) return [];
  let { data, error } = await supabase
    .from('types_of_repairs')
    .select('*')
    .eq('company_id', company_id || '');

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};
export const getOpenRepairsSolicitudesByArray = async (vehiclesIds: string[], repairTypeId: string) => {
  if (!company_id) return [];
  let { data, error } = await supabase
    .from('repair_solicitudes')
    .select('*,equipment_id(*)')
    .in('equipment_id', vehiclesIds)
    .eq('reparation_type', repairTypeId)
    .in('state', ['Pendiente', 'Esperando repuestos', 'En reparación'])
    .returns<RepairSoliciudesWithOnlyVechicleRelations[]>();

  if (error || !data) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getVehicleById = async (id: string) => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, brand(*), model(*),type_of_vehicle(*),type(name)')
    .eq('id', id)
    .returns<VehiclestWithRelations[]>();

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};
export const getAllVehiclesWithRelations = async () => {
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, brand(*), model(*),type_of_vehicle(*),type(name)')
    .eq('company_id', company_id)
    .returns<VehiclestWithRelations[]>();

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getTypeVehicles = async () => {
  if (!company_id) return [];
  const { data, error } = await supabase.from('type').select('*').or(`company_id.eq.${company_id},company_id.is.null`);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getBrandVehicles = async () => {
  if (!company_id) return [];
  let { data, error } = await supabase
    .from('brand_vehicles')
    .select('*')
    .or(`company_id.eq.${company_id},company_id.is.null`);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const sharedUserVerificationRole = async () => {
  if (!company_id) return [];

  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('share_company_users')
    .select('*')
    .eq('profile_id', user?.id || '')
    .eq('company_id', company_id);

  if (error) {
    console.error('error', error);
    return '';
  }

  return data[0].role;
};

export const getEmployeeDiagramById = async (employee_id: string) => {
  let { data, error } = await supabase
    .from('employees_diagram')
    .select(`*, diagram_type(*)`)
    .eq('employee_id', employee_id)
    .returns<DiagramEmployeeWithDiagramType[]>();

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};
export const getAllEmployeeDiagram = async () => {
  let { data, error } = await supabase
    .from('employees_diagram')
    .select(
      `*,
    employee_id,
    employees (*),
    diagram_type(*)
  `
    )
    .returns<EmployeesDiagramWithRelations[]>();

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};

export const getEmployeeById = async (employee_id: string) => {
  if (!company_id) return [];
  let { data, error } = await supabase
    .from('employees')
    .select(
      `*,
      city(*),
      province(*),
      workflow_diagram(*),
      hierarchical_position(*),
      birthplace(*),
      contractor_employee(customers(*))`
    )
    .eq('company_id', company_id)
    .eq('id', employee_id)
    .returns<EmployeeWithRelations[]>();

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};
export const getAllEmployeesWithRelations = async () => {
  if (!company_id) return [];
  let { data, error } = await supabase
    .from('employees')
    .select(
      `*,
      city(*),
      province(*),
      workflow_diagram(*),
      hierarchical_position(*),
      birthplace(*),
      contractor_employee(customers(*))`
    )
    .eq('company_id', company_id)
    .returns<EmployeeWithRelations[]>();

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};

export const getActivesGuilds = async () => {
  if (!company_id) return [];
  let { data, error } = await supabase.from('guild').select('*').eq('company_id', company_id).eq('is_active', true);

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};

export const getCovenantsByGuilds = async (guildIds: string[]) => {
  if (!company_id) return [];
  let { data, error } = await supabase.from('covenant').select('*').in('guild_id', guildIds);

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};

export const getCategoriesByCovenants = async (covenantsIds: string[]) => {
  if (!company_id) return [];
  let { data, error } = await supabase.from('category').select('*').in('covenant_id', covenantsIds);

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};

export const getMeasureUnits = async () => {
  if (!company_id) return [];
  let { data, error } = await supabase.from('measure_units').select('*');

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};

export const getItemServicesWithRelations = async () => {
  if (!company_id) return [];

  let { data, error } = await supabase
    .from('service_items')
    .select('*,item_measure_units(*),customer_service_id(customer_id(id,name))')
    // Filters
    // .eq('customer_service_id', customer_service_id)
    .eq('company_id', company_id)
    .returns<ServiceItemsWithRelations[]>();

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};

export const getCustomerServices = async () => {
  if (!company_id) return [];

  let { data, error } = await supabase.from('customer_services').select('*').eq('company_id', company_id);

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};

export const getCustomers = async () => {
  if (!company_id) return [];

  let { data, error } = await supabase.from('customers').select('*').eq('company_id', company_id);

  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};

export const getCurrentCompany = async () => {
  if (!company_id) return [];

  let { data, error } = await supabase
    .from('company')
    .select('*,city(*)')
    .eq('id', company_id)
    .returns<CompanyWithCity[]>();

  if (error) {
    console.error('error', error);
    return [];
  }
  return data || [];
};

export const getCompanyId = async () => {
  return company_id ?? '';
};

export const getDiagramTypes = async () => {
  if (!company_id) return [];

  let { data, error } = await supabase.from('diagram_type').select('*').eq('company_id', company_id);
  if (error) {
    console.error('error', error);
    return [];
  }

  return data ?? [];
};

export const getEmployeeDocumentById = async (documentId: string) => {
  if (!company_id) return [];
  let { data: documents_employee, error } = await supabase
    .from('documents_employees')
    .select(
      `*,
    id_document_types(*),
    applies(*,
      city(name),
      province(name),
      contractor_employee(customers(*)),
      company_id(*,province_id(name)))
          `
    )
    .eq('id', documentId)
    .returns<DocumentEmployeeWithRelations[]>();

  if (error) {
    console.error('error', error);
    return [];
  }

  return documents_employee ?? [];
};

export const getEquipmentDocumentById = async (documentId: string) => {
  if (!company_id) return [];
  let { data: documents_vehicle, error } = await supabase
    .from('documents_equipment')
    .select(
      `
  *,
  id_document_types(*),
  applies(*,brand(*),model(*),type_of_vehicle(*), company_id(*,province_id(*)))`
    )
    .eq('id', documentId)
    .returns<DocumentEquipmentWithRelationsIncludesCompany[]>();

  if (error) {
    console.error('error', error);
    return [];
  }
  return documents_vehicle ?? [];
};

export const getCompanyDocumentById = async (documentId: string) => {
  if (!company_id) return [];

  let { data: documents_company, error } = await supabase
    .from('documents_company')
    .select(`*,id_document_types(*),company_id(*,province_id(*))`)
    .eq('id', documentId)
    .returns<CompanyDocumentsWithDocumentTypes[]>();

  if (error) {
    console.error('error', error);
    return [];
  }
  return documents_company ?? [];
};
