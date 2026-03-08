import { create } from 'zustand';
import { supabase } from '../../supabase/supabase';

const EMPLOYEE_SELECT = `*, city (
    name
  ),
  province(
    name
  ),
  workflow_diagram(
    name
  ),
  hierarchical_position(
    name
  ),
  birthplace(
    name
  ),
  contractor_employee(
    customers(
      *
    )
  )`;

const EMPLOYEE_WITH_DOCS_SELECT = `*, city (
    name
  ),
  province(
    name
  ),
  workflow_diagram(
    name
  ),
  hierarchical_position(
    name
  ),
  birthplace(
    name
  ),
  documents_employees(
    *,id_document_types(*)
  ),
  guild(id,name),
  covenant(id,name),
  category(id,name),
  contractor_employee(
    customers(
      *
    )
  )`;

const setEmployeesToShow = (employees: any) => {
  return employees?.map((e: any) => ({
    full_name: `${e?.lastname?.charAt(0)?.toUpperCase()}${e?.lastname?.slice(1)} ${e?.firstname?.charAt(0)?.toUpperCase()}${e?.firstname?.slice(1)}`,
    id: e?.id,
    email: e?.email,
    cuil: e?.cuil,
    document_number: e?.document_number,
    hierarchical_position: e?.hierarchical_position?.name,
    company_position: e?.company_position,
    normal_hours: e?.normal_hours,
    type_of_contract: e?.type_of_contract,
    allocated_to: e?.allocated_to,
    picture: e?.picture,
    nationality: e?.nationality,
    lastname: `${e?.lastname?.charAt(0)?.toUpperCase()}${e?.lastname.slice(1)}`,
    firstname: `${e?.firstname?.charAt(0)?.toUpperCase()}${e?.firstname.slice(1)}`,
    document_type: e?.document_type,
    birthplace: e?.birthplace?.name?.trim(),
    gender: e?.gender,
    marital_status: e?.marital_status,
    level_of_education: e?.level_of_education,
    street: e?.street,
    street_number: e?.street_number,
    province: e?.province?.name?.trim(),
    postal_code: e?.postal_code,
    phone: e?.phone,
    file: e?.file,
    date_of_admission: e?.date_of_admission,
    affiliate_status: e?.affiliate_status,
    city: e?.city?.name?.trim(),
    hierrl_position: e?.hierarchical_position?.name,
    workflow_diagram: e?.workflow_diagram?.name,
    contractor_employee: e?.contractor_employee?.map(({ customers }: any) => customers?.id),
    contractor_name: e?.contractor_employee?.map(({ customers }: any) => customers?.name),
    is_active: e?.is_active,
    reason_for_termination: e?.reason_for_termination,
    termination_date: e?.termination_date,
    status: e?.status,
    guild: e?.guild,
    covenants: e?.covenants,
    category: e?.category,
    documents_employees: e.documents_employees,
  }));
};

interface EmployeeState {
  employees: any;
  employeesToShow: any;
  active_and_inactive_employees: any;
  showDeletedEmployees: boolean;
  DrawerEmployees: any[] | null;
  setEmployees: (employees: any) => void;
  setActivesEmployees: () => void;
  setInactiveEmployees: () => void;
  setShowDeletedEmployees: (show: boolean) => void;
  endorsedEmployees: () => void;
  noEndorsedEmployees: () => void;
  getEmployees: (active: boolean) => any;
  documentDrawerEmployees: (document: string) => void;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: undefined,
  employeesToShow: undefined,
  active_and_inactive_employees: undefined,
  showDeletedEmployees: false,
  DrawerEmployees: null,

  setEmployees: (employees) => set({ employees }),
  setShowDeletedEmployees: (show) => set({ showDeletedEmployees: show }),

  getEmployees: async (active: boolean) => {
    const { useCompanyStore } = require('./companyStore');
    const companyId = useCompanyStore.getState().actualCompany?.id;

    let { data: employees, error } = await supabase
      .from('employees')
      .select(EMPLOYEE_WITH_DOCS_SELECT)
      .eq('company_id', companyId);

    set({ active_and_inactive_employees: setEmployeesToShow(employees) });

    const activeEmployees = employees?.filter((e) => {
      if (e.is_active) return true;
      return e.documents_employees
        ?.filter((e: any) => e.id_document_types.down_document)
        ?.some((doc: any) => doc.state === 'pendiente');
    });

    const inactiveEmployees = employees?.filter((e) => {
      return (
        !e.is_active &&
        e.documents_employees
          .filter((e: any) => e.id_document_types.down_document)
          .every((doc: any) => doc.state === 'presentado')
      );
    });

    if (active) {
      return setEmployeesToShow(activeEmployees);
    } else {
      return setEmployeesToShow(inactiveEmployees);
    }
  },

  setActivesEmployees: async () => {
    const employeesToShow = await get().getEmployees(true);
    set({ employeesToShow, employees: employeesToShow });
  },

  setInactiveEmployees: async () => {
    const employeesToShow = await get().getEmployees(false);
    set({ employeesToShow });
  },

  endorsedEmployees: async () => {
    const { useCompanyStore } = require('./companyStore');
    const companyId = useCompanyStore.getState().actualCompany?.id;

    const { data, error } = await supabase
      .from('employees')
      .select(EMPLOYEE_SELECT)
      .eq('company_id', companyId)
      .eq('status', 'Avalado');

    if (error) {
      console.error('Error al obtener los empleados avalados:', error);
    } else {
      set({ employeesToShow: setEmployeesToShow(data) || [] });
    }
  },

  noEndorsedEmployees: async () => {
    const { useCompanyStore } = require('./companyStore');
    const companyId = useCompanyStore.getState().actualCompany?.id;

    const { data, error } = await supabase
      .from('employees')
      .select(EMPLOYEE_SELECT)
      .eq('company_id', companyId)
      .eq('status', 'Incompleto');

    if (error) {
      console.error('Error al obtener los empleados no avalados:', error);
    } else {
      set({ employeesToShow: setEmployeesToShow(data) || [] });
    }
  },

  documentDrawerEmployees: async (document: string) => {
    const { data } = await supabase
      .from('documents_employees')
      .select('*,applies(*),id_document_types(*)')
      .eq('applies.document_number', document)
      .not('applies', 'is', null);

    set({ DrawerEmployees: data });
  },
}));

// Real-time subscription for employee updates
if (typeof window !== 'undefined') {
  supabase
    .channel('realtime-employees-update')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'employees' }, () => {
      useEmployeeStore.getState().setActivesEmployees();
    })
    .subscribe();
}
