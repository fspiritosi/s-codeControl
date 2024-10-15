'use server';
import { supabaseServer } from '@/lib/supabase/server';
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
export const fetchAllEmployees = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase.from('employees').select('*').eq('company_id', company_id);

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data;
};

export const fetchEmployeeMonthlyDocuments = async (employeeId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('documents_employees')
    .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
    .eq('applies', employeeId)
    .eq('id_document_types.is_it_montlhy', true)
    .returns<EmployeeDocumentWithContractors[]>();

  if (error) {
    console.error('Error fetching employee monthly documents:', error);
    return [];
  }
  return data;
};

export const fetchEmployeePermanentDocuments = async (employeeId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('documents_employees')
    .select('*,id_document_types(*),applies(*,contractor_employee(*, customers(*)))')
    .eq('id_document_types.is_it_montlhy', false)
    .eq('applies', employeeId)
    .returns<EmployeeDocumentWithContractors[]>();

  if (error) {
    console.error('Error fetching employee permanent documents:', error);
    return [];
  }
  return data;
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

// Equipment-related actions
export const fetchAllEquipment = async () => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase.from('vehicles').select('*,brand(*)').eq('company_id', company_id);

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
};

export const fetchPermanentDocumentsByEquipmentId = async (equipmentId: string) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase
    .from('documents_equipment')
    .select(`*,id_document_types(*),applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`)
    .not('id_document_types', 'is', null)
    .not('id_document_types.is_it_montlhy', 'is', true)
    .eq('applies', equipmentId)
    .returns<EquipmentDocumentDetailed[]>();

  if (error) {
    console.error('Error fetching equipment permanent documents:', error);
    return [];
  }
  return data;
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
    .select('*,  profile_id(*)')
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
