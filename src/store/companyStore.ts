import { SharedUser } from '@/types/types';
import { Company, SharedCompanies } from '@/zodSchemas/schemas';
import cookies from 'js-cookie';
import { create } from 'zustand';
import { supabase } from '../../supabase/supabase';
import { useCountriesStore } from './countries';

interface CompanyState {
  allCompanies: Company;
  actualCompany: Company[0] | null;
  sharedCompanies: SharedCompanies;
  sharedUsers: SharedUser[];
  showNoCompanyAlert: boolean;
  showMultiplesCompaniesAlert: boolean;
  setActualCompany: (company: Company[0]) => void;
  howManyCompanies: (id: string) => void;
  FetchSharedUsers: () => void;
  setAllCompanies: (companies: Company) => void;
  setSharedCompanies: (companies: SharedCompanies) => void;
  setNewDefectCompany: (company: Company[0]) => void;
  resetDefectCompanies: (company: Company[0]) => void;
}

const COMPANY_EMPLOYEES_SELECT = `
  *,
  owner_id(*),
  share_company_users(*,
    profile(*)
  ),
  city (
    name,
    id
  ),
  province_id (
    name,
    id
  ),
  companies_employees (
    employees(
      *,
      city ( name ),
      province( name ),
      workflow_diagram( name ),
      hierarchical_position( name ),
      birthplace( name ),
      contractor_employee(
        customers( * )
      )
    )
  )
`;

export const useCompanyStore = create<CompanyState>((set, get) => ({
  allCompanies: [] as unknown as Company,
  actualCompany: null,
  sharedCompanies: [] as unknown as SharedCompanies,
  sharedUsers: [],
  showNoCompanyAlert: false,
  showMultiplesCompaniesAlert: false,

  setAllCompanies: (companies) => set({ allCompanies: companies }),
  setSharedCompanies: (companies) => set({ sharedCompanies: companies }),

  setActualCompany: (company: Company[0]) => {
    set({ actualCompany: company });
    cookies.set('actualComp', company.id);

    // Trigger side effects on other stores
    useCountriesStore.getState().documentTypes(company?.id);

    const { useEmployeeStore } = require('./employeeStore');
    const { useDocumentStore } = require('./documentStore');
    const { useVehicleStore } = require('./vehicleStore');
    const { useUiStore } = require('./uiStore');
    const { useAuthStore } = require('./authStore');

    useEmployeeStore.getState().setActivesEmployees();
    useVehicleStore.getState().fetchVehicles();
    useDocumentStore.getState().documetsFetch();
    useUiStore.getState().allNotifications();
    get().FetchSharedUsers();
    useAuthStore.getState().handleActualCompanyRole();
  },

  howManyCompanies: async (id: string) => {
    if (!id) return;
    const { data, error } = await supabase
      .from('company')
      .select(COMPANY_EMPLOYEES_SELECT)
      .eq('owner_id', id);

    let { data: share_company_users, error: sharedError } = await supabase
      .from('share_company_users')
      .select(`*,company_id(${COMPANY_EMPLOYEES_SELECT})`)
      .eq('profile_id', id);

    get().FetchSharedUsers();
    set({ sharedCompanies: share_company_users as SharedCompanies });

    if (error) {
      console.error('Error al obtener el perfil:', error);
    } else {
      const user = share_company_users?.find((e) => e.profile_id === id);

      const { useAuthStore } = require('./authStore');
      const { useDocumentStore } = require('./documentStore');

      if (user?.role) {
        useAuthStore.getState().setRoleActualCompany(user?.role);
        await useDocumentStore.getState().documetsFetch();
      } else {
        useAuthStore.getState().setRoleActualCompany(undefined);
      }

      set({ allCompanies: data });

      const savedCompany = localStorage.getItem('company_id') || '';

      if (savedCompany) {
        const company = share_company_users?.find(
          (company) => company.company_id.id === JSON.parse(savedCompany)
        )?.company_id;

        if (company) {
          get().setActualCompany(company);
          return;
        }
      }

      let selectedCompany = get().allCompanies.filter((company) => company.by_defect);

      if (data.length > 1) {
        if (selectedCompany) {
          get().setActualCompany(selectedCompany[0]);
        } else {
          set({ showMultiplesCompaniesAlert: true });
        }
      }

      if (data.length === 1) {
        set({ showMultiplesCompaniesAlert: false });
        get().setActualCompany(data[0]);
      }

      if (data.length === 0 && share_company_users?.length! > 0) {
        get().setActualCompany(share_company_users?.[0]?.company_id);
      }

      if (data.length === 0 && share_company_users?.length === 0) {
        const actualPath = window.location.pathname;
        if (actualPath !== '/dashboard/company/new') {
          return;
        }
        set({ showNoCompanyAlert: true });
      }
    }
  },

  FetchSharedUsers: async () => {
    const companyId = get().actualCompany?.id;
    const { data, error } = await supabase
      .from('share_company_users')
      .select(
        `*,customer_id(*),profile_id(*),company_id(${COMPANY_EMPLOYEES_SELECT})`
      )
      .eq('company_id', companyId);

    set({ sharedUsers: data as SharedUser[] });
    const { useAuthStore } = require('./authStore');
    useAuthStore.getState().handleActualCompanyRole();
  },

  resetDefectCompanies: async (company: Company[0]) => {
    const { useAuthStore } = require('./authStore');
    const { data, error } = await supabase
      .from('company')
      .update({ by_defect: false })
      .eq('owner_id', useAuthStore.getState().profile?.[0]?.id);

    if (error) {
      console.error('Error al actualizar la empresa por defecto:', error);
    }
    get().setActualCompany(company);
  },

  setNewDefectCompany: async (company: Company[0]) => {
    const { useAuthStore } = require('./authStore');
    const profileId = useAuthStore.getState().profile?.[0]?.id;

    if (company.owner_id.id !== profileId) {
      localStorage.setItem('company_id', JSON.stringify(company.id));
      return;
    }
    localStorage.removeItem('company_id');
    const { data, error } = await supabase
      .from('company')
      .update({ by_defect: false })
      .eq('owner_id', profileId);

    if (error) {
      console.error('Error al actualizar la empresa por defecto:', error);
    } else {
      const { data, error } = await supabase
        .from('company')
        .update({ by_defect: true })
        .eq('id', company.id);

      if (error) {
        console.error('Error al actualizar la empresa por defecto:', error);
      } else {
        get().setActualCompany(company);
      }
    }
  },
}));

// Real-time subscriptions
const setupCompanyRealtime = () => {
  supabase
    .channel('realtime-share-company-users')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'share_company_users' }, () => {
      const { useAuthStore } = require('./authStore');
      useCompanyStore.getState().howManyCompanies(useAuthStore.getState().profile?.[0]?.id || '');
    })
    .subscribe();

  supabase
    .channel('realtime-company')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'company' }, () => {
      const { useAuthStore } = require('./authStore');
      useCompanyStore.getState().howManyCompanies(useAuthStore.getState().profile?.[0]?.id || '');
    })
    .subscribe();
};

if (typeof window !== 'undefined') {
  setupCompanyRealtime();
}
