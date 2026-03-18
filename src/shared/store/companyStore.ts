import { SharedUser } from '@/shared/types/types';
import { Company, SharedCompanies } from '@/shared/zodSchemas/schemas';
import cookies from 'js-cookie';
import { create } from 'zustand';
import { useCountriesStore } from './countries';
import { resetCompanyDefect, setCompanyAsDefect } from '@/modules/company/features/detail/actions.server';
import { fetchCompaniesByOwner, fetchSharedCompaniesByProfile } from '@/modules/company/features/list/actions.server';
import { fetchSharedUsersByCompany } from '@/modules/company/features/users/actions.server';

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
    cookies.set('actualComp', company.id, { path: '/' });

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
    const data = await fetchCompaniesByOwner(id);
    const share_company_users = await fetchSharedCompaniesByProfile(id);

    get().FetchSharedUsers();
    set({ sharedCompanies: share_company_users as unknown as SharedCompanies });

    if (!data) {
      console.error('Error al obtener el perfil');
    } else {
      const user = share_company_users?.find((e: any) => e.profile_id === id);

      const { useAuthStore } = require('./authStore');
      const { useDocumentStore } = require('./documentStore');

      if (user?.role) {
        useAuthStore.getState().setRoleActualCompany(user?.role);
        await useDocumentStore.getState().documetsFetch();
      } else {
        useAuthStore.getState().setRoleActualCompany(undefined);
      }

      set({ allCompanies: data as unknown as Company });

      const savedCompany = localStorage.getItem('company_id') || '';

      if (savedCompany) {
        const company = (share_company_users as unknown as Array<Record<string, any>>)?.find(
          (company) => company.company_id?.id === JSON.parse(savedCompany)
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
        get().setActualCompany(data[0] as unknown as Company[0]);
      }

      if (data.length === 0 && share_company_users?.length! > 0) {
        get().setActualCompany(share_company_users?.[0]?.company_id as unknown as Company[0]);
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
    if (!companyId) return;
    const data = await fetchSharedUsersByCompany(companyId);

    set({ sharedUsers: data as unknown as SharedUser[] });
    const { useAuthStore } = require('./authStore');
    useAuthStore.getState().handleActualCompanyRole();
  },

  resetDefectCompanies: async (company: Company[0]) => {
    const { useAuthStore } = require('./authStore');
    const result = await resetCompanyDefect(useAuthStore.getState().profile?.[0]?.id);

    if (result.error) {
      console.error('Error al actualizar la empresa por defecto:', result.error);
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
    const result = await resetCompanyDefect(profileId);

    if (result.error) {
      console.error('Error al actualizar la empresa por defecto:', result.error);
    } else {
      const result2 = await setCompanyAsDefect(company.id);

      if (result2.error) {
        console.error('Error al actualizar la empresa por defecto:', result2.error);
      } else {
        get().setActualCompany(company);
      }
    }
  },
}));

// Polling replacement for real-time subscriptions
let companyPollInterval: NodeJS.Timeout | null = null;

function startCompanyPolling() {
  if (companyPollInterval) return;
  companyPollInterval = setInterval(() => {
    const { useAuthStore } = require('./authStore');
    const profileId = useAuthStore.getState().profile?.[0]?.id;
    if (profileId) {
      useCompanyStore.getState().howManyCompanies(profileId);
    }
  }, 30000);
}

function stopCompanyPolling() {
  if (companyPollInterval) {
    clearInterval(companyPollInterval);
    companyPollInterval = null;
  }
}

if (typeof window !== 'undefined') {
  startCompanyPolling();
}

export { startCompanyPolling, stopCompanyPolling };
