'use server';
import { supabaseServer } from '@/lib/supabase/server';
import { getActualRole } from '@/lib/utils';
import moment from 'moment';
import { cookies } from 'next/headers';

// Company-related actions
export const fetchCurrentCompany = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase.from('company').select('*').eq('id', company_id);

  if (error) {
    console.error('Error fetching company:', error);
    return [];
  }
  return data || [];
};
export const fetchAllEquipmentWithRelations = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('vehicles')
    .select('*,brand(*),model(*),type(*),types_of_vehicles(*),contractor_equipment(*,contractor_id(*))')
    .eq('company_id', company_id || '')
    .order('domain')
    .returns<VehicleWithBrand[]>();

  if (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
  return data;
};
export const fetchVehicleBrands = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('brand_vehicles')
    .select('*')
    .eq('is_active', true)
    .eq('company_id', company_id || '');

  if (error) {
    console.error('Error fetching vehicle brands:', error);
    return [];
  }
  return data;
};
export const fetchVehicleModels = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase.from('model_vehicles').select('*').eq('is_active', true);

  if (error) {
    console.error('Error fetching vehicle models:', error);
    return [];
  }
  return data;
};
export const fetchTypeVehicles = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('type')
    .select('*')
    .eq('is_active', true)
    .eq('company_id', company_id || '')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching vehicle types:', error);
    return [];
  }
  return data;
};
export const fetchTypesOfVehicles = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase.from('types_of_vehicles').select('*').eq('is_active', true);

  if (error) {
    console.error('Error fetching types of vehicles:', error);
    return [];
  }
  return data;
};
export const setVehicleDataOptions = async () => {
  const brands = await fetchVehicleBrands();
  const models = await fetchVehicleModels();
  const types = await fetchTypeVehicles();
  const typesOfVehicles = await fetchTypesOfVehicles();
  const customers = await fetchCustomers();

  return {
    brand: brands.map((brand) => brand.name!),
    model: models.map((model) => model.name!),
    type: types.map((type) => type.name!),
    types_of_vehicles: typesOfVehicles.map((type) => type.name!),
    contractor_equipment: customers.map((customer) => customer.name!),
  };
};
export const fetchCustomers = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .eq('company_id', company_id || '');

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  return data;
};
export const fetchWorkDiagrams = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase.from('work-diagram').select('id,name').eq('is_active', true);

  if (error) {
    console.error('Error fetching work diagrams:', error);
    return [];
  }
  return data;
};
export const fetchGuilds = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('guild')
    .select('*')
    .eq('is_active', true)
    .eq('company_id', company_id || '');

  if (error) {
    console.error('Error fetching guilds:', error);
    return [];
  }
  return data;
};
export const fetchCovenants = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;

  const { data, error } = await supabase
    .from('covenant')
    .select('*')
    .eq('is_active', true)
    .eq('company_id', company_id || '');

  if (error) {
    console.error('Error fetching covenants:', error);
    return [];
  }
  return data;
};
export const fetchAllCategories = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;

  const { data, error } = await supabase.from('category').select('*').eq('is_active', true);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data;
};
export const fetchHierrarchicalPositions = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;

  const { data, error } = await supabase.from('hierarchy').select('*').eq('is_active', true);

  if (error) {
    console.error('Error fetching hierarchical positions:', error);
    return [];
  }
  return data;
};
export const fetchProvinces = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;

  const { data, error } = await supabase.from('provinces').select('id,name');

  if (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
  return data;
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
    workflow_diagram: workDiagrams.map((diagram) => diagram.name),
    guild: guilds.map((guild) => guild.name!) || [],
    covenant: covenants.map((covenant) => covenant.name!),
    category: categories.map((category) => category.name!),
    hierarchical_position: hierarchicalPositions.map((position) => position.name),
    contractor_employee: customers.map((customer) => customer.name),
    province: provinces.map((province) => province.name.trim()),
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
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  const user = await fetchCurrentUser();
  if (!company_id) return [];

  supabase.auth.admin.updateUserById(user?.id || '', {
    app_metadata: {
      company: company_id,
    },
  });

  let { data, error } = await supabase
    .from('employees')
    .select(
      `*,guild(*),covenant(*),category(*), city (
    *
  ),
  province(
    *
  ),
  workflow_diagram(
    *
  ),
  hierarchical_position(
    *
  ),
  birthplace(
    *
  ),
  contractor_employee(
    customers(
      *
    )
  )`
    )
    .eq('company_id', company_id || '')
    .order('lastname')
    .returns<EmployeeDetailed[]>();

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data ?? [];
};
export const fetchAllEmployeesWithRelationsById = async (id: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  const user = await fetchCurrentUser();
  if (!company_id) return [];

  let { data, error } = await supabase
    .from('employees')
    .select(
      `*,guild(*),covenant(*),category(*), city (
    *
  ),
  province(
    *
  ),
  workflow_diagram(
    *
  ),
  hierarchical_position(
    *
  ),
  birthplace(
    *
  ),
  contractor_employee(
    customers(
      *
    )
  )`
    )
    .eq('company_id', company_id || '')
    .eq('id', id)
    .returns<EmployeeDetailed[]>();

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data ?? [];
};
export const findEmployeeByFullName = async (fullName: string) => {
  try {
    const cookiesStore = cookies();
    const company_id = cookiesStore.get('actualComp')?.value;

    const supabase = supabaseServer();
    const { data: employees, error } = await supabase
      .rpc('find_employee_by_full_name_v2', {
        p_full_name: fullName,
        p_company_id: company_id || '',
      })
      .returns<Employee[]>();

    if (error) {
      console.log('Query params:', { fullName, company_id });
      console.error('Error al buscar empleado por nombre completo:', error);
      return null;
    }

    return employees?.[0] || null;
  } catch (error) {
    console.error('Error al buscar empleado por nombre completo:', error);
    return null;
  }
};
export const fetchSingEmployee = async (employeesId: string) => {
  //Traer el tipo de documento que se llame firma
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('document_types')
    .select('id')
    .eq('name', 'Firma')
    .eq('is_active', true)
    .single();

  const { data: employeeSingDocument, error: employeeSingDocumentError } = await supabase
    .from('documents_employees')
    .select('*')
    .eq('id_document_types', data?.id || '')
    .eq('applies', employeesId)
    .not('document_path', 'is', null)
    .eq('is_active', true);
  // .single();

  if (error) {
    console.error('Error fetching document type:', error);
    return null;
  }

  const data2 = supabase.storage.from('document_files').getPublicUrl(employeeSingDocument?.[0]?.document_path || '');

  console.log('data', data2);

  return data2.data.publicUrl || null;
};
export const fetchCompanyDocuments = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('documents_company')
    .select('*,id_document_types(*),user_id(*)')
    .eq('applies', company_id)
    .returns<CompanyDocumentDetailed[]>();

  if (error || !data) {
    console.error('Error fetching company documents:', error);
    return [];
  }
  return data;
};
// Employee-related actions
export const fetchAllEmployees = async (role?: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  const user = await fetchCurrentUser();
  if (!company_id) return [];

  if (role === 'Invitado') {
    const { data, error } = await supabase
      .from('share_company_users')
      .select(`*,customer_id(*,contractor_employee(*,employee_id(*)))`)
      .eq('profile_id', user?.id || '')
      .eq('company_id', company_id)
      .returns<ShareCompanyUsersWithRelations[]>();

    const employees = data?.[0].customer_id?.contractor_employee;
    const allEmployees = employees?.map((employee) => employee.employee_id);
    return allEmployees || [];
  }

  const { data, error } = await supabase.from('employees').select('*').eq('company_id', company_id);

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data;
};
export const fetchAllActivesEmployees = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', company_id)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data;
};
export const fetchAllEmployeesJUSTEXAMPLE = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase.from('employees').select('*');

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data;
};
export const fetchAllEquipmentJUSTEXAMPLE = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('vehicles')
    .select('*,type(*),brand(*),model(*)')
    .returns<VehicleWithBrand[]>();

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data;
};
export const fetchAllRepairsJUSTEXAMPLE = async () => {
  const supabase = supabaseServer();

  const { data, error } = await supabase.from('repair_solicitudes').select('*');

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data;
};
export const fetchEmployeeMonthlyDocuments = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;

  if (!company_id) return [];

  const { data, error } = await supabase
    .from('documents_employees')
    .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
    .eq('applies.company_id', company_id)
    .eq('id_document_types.is_it_montlhy', true)
    .eq('applies.is_active', true)
    .not('id_document_types', 'is', null)
    .not('applies', 'is', null)
    .returns<EmployeeDocumentWithContractors[]>();

  if (error) {
    console.error('Error fetching employee monthly documents:', error);
    return [];
  }
  return data;
};
export const fetchEmployeeMonthlyDocumentsByEmployeeId = async (employeeId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(company_id as string, user?.id as string);

  if (role === 'Invitado') {
    const { data, error } = await supabase
      .from('documents_employees')
      .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
      .eq('applies', employeeId)
      .eq('id_document_types.is_it_montlhy', true)
      .eq('id_document_types.private', false)
      .not('id_document_types', 'is', null)
      .returns<EmployeeDocumentWithContractors[]>();

    if (error) {
      console.error('Error fetching employee monthly documents:', error);
      return [];
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('documents_employees')
      .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
      .eq('applies', employeeId)
      .eq('id_document_types.is_it_montlhy', true)
      .not('id_document_types', 'is', null)
      .returns<EmployeeDocumentWithContractors[]>();

    if (error) {
      console.error('Error fetching employee monthly documents:', error);
      return [];
    }
    return data;
  }
};
export const fetchEmployeePermanentDocumentsByEmployeeId = async (employeeId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(company_id as string, user?.id as string);

  console.log(role);

  if (role === 'Invitado') {
    const { data, error } = await supabase
      .from('documents_employees')
      .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
      .eq('applies', employeeId)
      .eq('id_document_types.is_it_montlhy', false)
      .eq('id_document_types.private', false)
      .not('id_document_types', 'is', null)
      .returns<EmployeeDocumentWithContractors[]>();

    if (error) {
      console.error('Error fetching employee permanent documents:', error);
      return [];
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('documents_employees')
      .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
      .eq('applies', employeeId)
      .eq('id_document_types.is_it_montlhy', false)
      .not('id_document_types', 'is', null)
      .returns<EmployeeDocumentWithContractors[]>();

    if (error) {
      console.error('Error fetching employee permanent documents:', error);
      return [];
    }
    return data;
  }
};
export const fetchEmployeePermanentDocuments = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('documents_employees')
    .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
    .eq('applies.company_id', company_id)
    .eq('applies.is_active', true)
    .not('id_document_types.is_it_montlhy', 'is', true)
    .not('id_document_types', 'is', null)
    .not('applies', 'is', null)
    .returns<EmployeeDocumentWithContractors[]>();

  if (error) {
    console.error('Error fetching employee permanent documents:', error);
    return [];
  }
  return data;
};
export const getDiagramEmployee = async ({ employee_id }: { employee_id: string }) => {
  const supabase = supabaseServer();
  let { data: employees_diagram, error } = await supabase
    .from('employees_diagram')
    .select('*')
    .eq('employee_id', employee_id);
  if (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
  return employees_diagram || [];
};

// Document-related actions
export const fetchAllDocumentTypes = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('document_types')
    .select('*')
    .eq('is_active', true)
    .or(`company_id.eq.${company_id},company_id.is.null`);

  if (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
  return data || [];
};
export const fetchDocumentsByDocumentTypeId = async (documentTypeId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('documents_employees')
    .select('*')
    .eq('id_document_types', documentTypeId)
    .neq('document_path', null);

  if (error) {
    console.error('Error fetching documents by document type:', error);
    return [];
  }
  return data;
};
export const getNextMonthExpiringDocumentsEmployees = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const today = moment().startOf('day');
  const nextMonth = moment().add(1, 'month').endOf('day');

  const { data, error } = await supabase
    .from('documents_employees')
    .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
    .eq('applies.company_id', company_id)
    .eq('applies.is_active', true)
    // .not('id_document_types.is_it_montlhy', 'is', false)
    .neq('id_document_types.is_it_montlhy', true) // Solo traer documentos que no sean mensuales
    .or(`validity.lte.${today.toISOString()},validity.lte.${nextMonth.toISOString()}`)
    .not('applies', 'is', null)
    .not('validity', 'is', null)
    .order('validity', { ascending: true }) // Ordenar por fecha de validez en orden ascendente
    .returns<EmployeeDocumentWithContractors[]>();

  if (error) {
    console.error('Error fetching next month expiring documents:', error);
    return [];
  }
  return data;
};
export const getNextMonthExpiringDocumentsVehicles = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const today = moment().startOf('day');
  const nextMonth = moment().add(1, 'month').endOf('day');

  const { data, error } = await supabase
    .from('documents_equipment')
    .select('*,id_document_types(*),applies(*,type(*),brand(*),model(*))')
    .eq('applies.company_id', company_id)
    .not('id_document_types.is_it_montlhy', 'is', true)
    .not('id_document_types', 'is', null)
    .or(`validity.lte.${today.toISOString()},validity.lte.${nextMonth.toISOString()}`)
    .not('applies', 'is', null)
    .not('validity', 'is', null)
    .order('validity', { ascending: true }) // Ordenar por fecha de validez en orden ascendente
    .returns<EquipmentDocumentDetailed[]>();

  if (error) {
    console.error('Error fetching next month expiring documents:', error);
    return [];
  }
  return data;
};
export const getDocumentEmployeesById = async (id: string) => {
  const supabase = supabaseServer();
  let { data: documents_employee } = await supabase
    .from('documents_employees')
    .select(
      `
    *,
    document_types(*),
    applies(*,
      city(name),
      province(name),
      contractor_employee(
        customers(*)),
        company_id(*,province_id(name))
          )
          `
    )
    .eq('id', id);
  return documents_employee;
};
export const getDocumentEquipmentById = async (id: string) => {
  const supabase = supabaseServer();
  let { data: documents_vehicle } = await supabase
    .from('documents_equipment')
    .select(
      `
      *,
      document_types(*),
      applies(*,brand(name),model(name),type_of_vehicle(name), company_id(*,province_id(name)))`
    )
    .eq('id', id);
  return documents_vehicle;
};
// Equipment-related actions
export const fetchAllEquipment = async (company_equipment_id?: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id && !company_equipment_id) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(company_id as string, user?.id as string);

  if (role === 'Invitado') {
    const { data, error } = await supabase
      .from('share_company_users')
      .select(`*,customer_id(*,contractor_equipment(*,equipment_id(*,brand(*),model(*),type(*),types_of_vehicles(*))))`)
      .eq('profile_id', user?.id || '')
      .eq('company_id', (company_id ?? company_equipment_id) || '')
      .returns<ShareCompanyUsersWithEquipment[]>();

    const equipments = data?.[0].customer_id?.contractor_equipment;
    const allEquipments = equipments?.map((equipment) => equipment.equipment_id);
    return allEquipments || [];
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('*,brand(*),model(*),type(*),types_of_vehicles(*),contractor_equipment(*,contractor_id(*))')
    .eq('company_id', (company_id ?? company_equipment_id) || '')
    .returns<VehicleWithBrand[]>();

  if (error) {
    console.error('Error fetching equipment:', error);

    return [];
  }
  return data;
};
export const fetchMonthlyDocumentsByEquipmentId = async (equipmentId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(company_id as string, user?.id as string);

  if (role === 'Invitado') {
    const { data, error } = await supabase
      .from('documents_equipment')
      .select(`*,id_document_types(*),applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`)
      .eq('id_document_types.is_it_montlhy', true)
      .eq('id_document_types.private', false)
      .not('id_document_types', 'is', null)
      .eq('applies', equipmentId)
      .returns<EquipmentDocumentDetailed[]>();

    if (error) {
      console.error('Error fetching equipment monthly documents:', error);
      return [];
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('documents_equipment')
      .select(`*,id_document_types(*),applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`)
      .eq('id_document_types.is_it_montlhy', true)
      .not('id_document_types', 'is', null)
      .eq('applies', equipmentId)
      .returns<EquipmentDocumentDetailed[]>();

    if (error) {
      console.error('Error fetching equipment monthly documents:', error);
      return [];
    }
    return data;
  }
};
export const fetchMonthlyDocumentsEquipment = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('documents_equipment')
    .select(`*,id_document_types(*),applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`)
    .eq('id_document_types.is_it_montlhy', true)
    .eq('applies.is_active', true)
    .eq('applies.company_id', company_id)
    .not('id_document_types', 'is', null)
    .not('applies', 'is', null)
    .returns<EquipmentDocumentDetailed[]>();

  if (error) {
    console.error('Error fetching equipment monthly documents:', error);
    return [];
  }
  return data;
};
export const fetchPermanentDocumentsByEquipmentId = async (equipmentId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(company_id as string, user?.id as string);

  if (role === 'Invitado') {
    const { data, error } = await supabase
      .from('documents_equipment')
      .select(`*,id_document_types(*),applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`)
      .not('id_document_types.is_it_montlhy', 'is', true)
      .eq('id_document_types.private', false)
      .eq('applies', equipmentId)
      .not('id_document_types', 'is', null)
      .returns<EquipmentDocumentDetailed[]>();

    if (error) {
      console.error('Error fetching equipment permanent documents:', error);
      return [];
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('documents_equipment')
      .select(`*,id_document_types(*),applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`)
      .not('id_document_types.is_it_montlhy', 'is', true)
      .eq('applies', equipmentId)
      .not('id_document_types', 'is', null)
      .returns<EquipmentDocumentDetailed[]>();

    if (error) {
      console.error('Error fetching equipment permanent documents:', error);
      return [];
    }
    return data;
  }
};

export const fetchallResources = async (applies: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  if (applies === 'Persona') {
    const { data, error } = await supabase
      .from('employees')
      .select('firstname,lastname, cuil,id')
      .eq('company_id', company_id || '');

    if (error) {
      console.error('Error al obtener datos adicionales:', error);
    } else {
      return data;
    }
  } else if (applies === 'Equipos') {
    const { data, error } = await supabase
      .from('vehicles')
      .select('domain, serie, intern_number,id')
      .eq('company_id', company_id || '');

    if (error) {
      console.error('Error al obtener datos adicionales:', error);
    } else {
      return data;
    }
  }
};
export const updateDocumentType = async (id: string, data: any) => {
  const supabase = supabaseServer();
  const cookiesStore = cookies();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return;

  const { error } = await supabase.from('document_types').update(data).eq('id', id);

  if (error) {
    return error;
  }

  return null;
};

export const fettchExistingEntries = async (applies: string, id_document_types: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];
  const tableNames = {
    Equipos: 'documents_equipment',
    Persona: 'documents_employees',
  };
  const table = tableNames[applies as 'Equipos' | 'Persona'];

  const { data: existingEntries, error: existingEntriesError } = await supabase
    .from(table as 'documents_equipment' | 'documents_employees')
    .select('applies(*),id')
    .eq('id_document_types', id_document_types)
    .eq('applies.company_id', company_id || '')
    .not('applies', 'is', null);

  if (existingEntriesError) {
    console.error('Error al obtener los recursos con documentos:', existingEntriesError);
    return;
  }
  return existingEntries;
};

export const fetchPermanentDocumentsEquipment = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('documents_equipment')
    .select(`*,id_document_types(*),applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`)
    .eq('applies.company_id', company_id)
    .eq('applies.is_active', true)
    .not('id_document_types.is_it_montlhy', 'is', true)
    .not('id_document_types', 'is', null)
    .not('applies', 'is', null)
    .returns<EquipmentDocumentDetailed[]>();

  if (error) {
    console.error('Error fetching equipment permanent documents:', error);
    return [];
  }
  return data;
};
export const fetchEquipmentById = async (id: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data: vehicleData, error } = await supabase
    .from('vehicles')
    .select('*, brand_vehicles(name), model_vehicles(name),types_of_vehicles(name),type(name)')
    .eq('id', id);

  if (error) console.log('eroor', error);

  const vehicle = vehicleData?.map((item: any) => ({
    ...item,
    type_of_vehicle: item.types_of_vehicles.name,
    brand: item.brand_vehicles.name,
    model: item.model_vehicles.name,
    type: item.type.name,
  }));
  return vehicle;
};
// Repair-related actions
export const fetchAllOpenRepairRequests = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('repair_solicitudes')
    .select(
      '*,user_id(*),employee_id(*),equipment_id(*,type(*),brand(*),model(*)),reparation_type(*),repairlogs(*,modified_by_employee(*),modified_by_user(*))'
    )
    .eq('equipment_id.company_id', company_id)
    .in('state', ['Pendiente', 'Esperando repuestos', 'En reparación'])
    .returns<RepairRequestDetailed[]>();

  if (error) {
    console.error('Error fetching open repair requests:', error);
    return [];
  }
  return data;
};
export const fetchRepairRequestsByEquipmentId = async (equipmentId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('repair_solicitudes')
    .select(
      '*,user_id(*),employee_id(*),equipment_id(*,type(*),brand(*),model(*)),reparation_type(*),repairlogs(*,modified_by_employee(*),modified_by_user(*))'
    )
    .eq('equipment_id', equipmentId)
    .in('state', ['Pendiente', 'Esperando repuestos', 'En reparación'])
    .returns<RepairRequestDetailed[]>();

  if (error) {
    console.error('Error fetching repair requests by equipment ID:', error);
    return [];
  }
  return data;
};
// Users-related actions

export const getAllUsers = async () => {
  const supabase = supabaseServer();
  const cookiesStore = cookies();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('share_company_users')
    .select('*,  profile_id(*),customer_id(*)')
    .eq('company_id', company_id || '');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data;
};
export const getUsersbyId = async ({ id }: { id: string }) => {
  const supabase = supabaseServer();
  const cookiesStore = cookies();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('share_company_users')
    .select('*,  profile_id(*)')
    .eq('company_id', company_id || '')
    .eq('id', id || '');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data;
};
export const getOwnerUser = async () => {
  const supabase = supabaseServer();
  const curretUser = await fetchCurrentCompany();
  if (!curretUser) return [];

  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .eq('id', curretUser[0]?.owner_id || '');

  if (error) {
    console.error('Error fetching owner user:', error);
    return [];
  }
  return data;
};

// Miscellaneous actions
export const fetchCurrentUser = async () => {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};
export const fetchCustomForms = async (id_company?: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id && !id_company) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(company_id as string, user?.id as string);

  if (role === 'Invitado') {
    const { data: share_company_users, error: share_company_users_error } = await supabase
      .from('share_company_users')
      .select(`*,customer_id(*,contractor_equipment(*,equipment_id(*,brand(*),model(*),type(*),types_of_vehicles(*))))`)
      .eq('profile_id', user?.id || '')
      .eq('company_id', company_id || '')
      .returns<ShareCompanyUsersWithEquipment[]>();

    const equipments_id = share_company_users?.flatMap((uc) =>
      uc.customer_id?.contractor_equipment?.map((ce) => ce.equipment_id.id)
    );

    // return [];

    const { data, error } = await supabase
      .from('custom_form')
      .select('*,form_answers(*)')
      .eq('company_id', company_id || id_company || '')
      .in('form_answers.answer->>movil', equipments_id || [])
      .returns<CheckListWithAnswer[]>();

    if (error) {
      console.error('Error fetching custom forms:', error);
      return [];
    }
    return data;
  }
  const { data, error } = await supabase
    .from('custom_form')
    .select('*,form_answers(*)')
    .eq('company_id', company_id || id_company || '')
    .returns<CheckListWithAnswer[]>();
  if (error) {
    console.error('Error fetching custom forms:', error);
    return [];
  }
  return data;
};
export const fetchCustomFormById = async (formId: string) => {
  const supabase = supabaseServer();
  const { data, error } = await supabase.from('custom_form').select('*').eq('id', formId);

  if (error) {
    console.error('Error fetching custom form by ID:', error);
    return [];
  }
  return data;
};
export const fetchFormsAnswersByFormId = async (formId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(company_id as string, user?.id as string);

  if (role === 'Invitado') {
    const { data: share_company_users, error: share_company_users_error } = await supabase
      .from('share_company_users')
      .select(`*,customer_id(*,contractor_equipment(*,equipment_id(*,brand(*),model(*),type(*),types_of_vehicles(*))))`)
      .eq('profile_id', user?.id || '')
      .eq('company_id', company_id || '')
      .returns<ShareCompanyUsersWithEquipment[]>();

    const equipments_id =
      share_company_users?.flatMap((uc) => uc.customer_id?.contractor_equipment?.map((ce) => ce.equipment_id.id)) || [];

    const { data, error } = await supabase
      .from('form_answers')
      .select('*')
      .eq('form_id', formId)
      .in('answer->>movil', equipments_id || [])
      .returns<CheckListAnswerWithForm[]>();

    if (error) {
      console.error('Error fetching form answers:', error);
      return [];
    }
    return data;
  }

  // Si no es invitado, retorna todas las respuestas del formulario
  const { data, error } = await supabase
    .from('form_answers')
    .select('*')
    .eq('form_id', formId)
    .returns<CheckListAnswerWithForm[]>();

  if (error) {
    console.error('Error fetching form answers:', error);
    return [];
  }
  return data;
};
export const fetchAnswerById = async (answerId: string) => {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('form_answers')
    .select('*,form_id(*)')
    .eq('id', answerId)
    .returns<CheckListAnswerWithForm[]>()
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching form answers:', error);
    return [];
  }
  return data ?? [];
};
export const getCurrentProfile = async () => {
  const user = await fetchCurrentUser();

  if (!user) return [];
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .eq('id', user?.id || '');

  if (error) {
    console.error('Error fetching current profile:', error);
    return [];
  }
  return data;
};
export const verifyUserRoleInCompany = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return '';

  const user = await fetchCurrentUser();
  const { data, error } = await supabase
    .from('share_company_users')
    .select('*')
    .eq('profile_id', user?.id || '')
    .eq('company_id', company_id);

  if (error) {
    console.error('Error verifying user role:', error);
    return '';
  }

  return { rol: data[0]?.role || '', modulos: data[0]?.modules || [] };
};

export const fetchDiagramsHistoryByEmployeeId = async (employeeId: string) => {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('diagrams_logs')
    .select('*,modified_by(*)')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .returns<diagrams_logsWithUser[]>();

  if (error) {
    console.error('Error fetching diagrams history:', error);
    return [];
  }
  return data;
};
export const fetchDiagrams = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('employees_diagram')
    .select('*,diagram_type(*),employee_id(*)')
    .eq('employee_id.company_id', company_id)
    .returns<EmployeeDiagramWithDiagramType[]>();

  if (error) {
    console.error('Error fetching diagrams:', error);
    return [];
  }
  return data;
};
export const fetchDiagramsByEmployeeId = async (employeeId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('employees_diagram')
    .select('*,diagram_type(*),employee_id(*)')
    .eq('employee_id.id', employeeId)
    .not('employee_id', 'is', null)
    .returns<EmployeeDiagramWithDiagramType[]>();

  if (error) {
    console.error('Error fetching diagrams:', error);
    return [];
  }
  return data;
};

export const fetchDiagramsTypes = async () => {
  const supabase = supabaseServer();
  const cookiesStore = cookies();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('diagram_type')
    .select('*')
    .eq('company_id', company_id || '');

  if (error) {
    console.error('Error fetching diagrams types:', error);
    return [];
  }
  return data;
};

export async function getCompanyDetails(companyId: string) {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from('company')
    .select('id, company_name, website, contact_email, company_logo')
    .eq('id', companyId)
    .single();

  if (error) {
    console.error('Error fetching company details:', error);
    return null;
  }

  return data;
}
