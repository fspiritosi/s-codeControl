/**
 * FACADE STORE - Backward compatibility layer
 *
 * This file re-exports a composed store from the domain stores.
 * Only auth, company, and UI state remain global.
 * Employee, document, and vehicle data are fetched on-demand by server components.
 *
 * Domain stores:
 *   - useAuthStore     (src/store/authStore.ts)
 *   - useCompanyStore  (src/store/companyStore.ts)
 *   - useUiStore       (src/store/uiStore.ts)
 */

import { Notifications, SharedUser, profileUser } from '@/shared/types/types';
import { Company, SharedCompanies } from '@/shared/zodSchemas/schemas';

type AuthUser = { id: string; email?: string; [key: string]: any } | null;
import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { useCompanyStore } from './companyStore';
import { useUiStore } from './uiStore';

// Re-export CompanyDocumentsType for backward compatibility
export type { CompanyDocumentsType } from './documentStore';

// Re-export the domain stores for gradual migration
export { useAuthStore } from './authStore';
export { useCompanyStore } from './companyStore';
export { useDocumentStore } from './documentStore';
export { useEmployeeStore } from './employeeStore';
export { useUiStore } from './uiStore';
export { useVehicleStore } from './vehicleStore';

interface State {
  // Auth
  credentialUser: AuthUser;
  profile: profileUser[];
  codeControlRole: string;
  roleActualCompany: string;
  loggedUser: () => void;

  // Company
  allCompanies: Company;
  actualCompany: Company[0] | null;
  sharedCompanies: SharedCompanies;
  sharedUsers: SharedUser[];
  showNoCompanyAlert: boolean;
  showMultiplesCompaniesAlert: boolean;
  setActualCompany: (company: Company[0]) => void;
  setNewDefectCompany: (company: Company[0]) => void;
  resetDefectCompanies: (company: Company[0]) => void;
  FetchSharedUsers: () => void;

  // UI
  notifications: Notifications[];
  markAllAsRead: () => void;
  active_sidebar: boolean;
  toggleSidebar: () => void;

  // Legacy stubs — kept to avoid runtime errors in unmigrated consumers
  isLoading: boolean;
  employees: any;
  active_and_inactive_employees: any;
  employeesToShow: any;
  vehicles: any;
  vehiclesToShow: any;
  allDocumentsToShow: { employees: any[]; vehicles: any[] };
  documentsToShow: { employees: any[]; vehicles: any[] };
  Alldocuments: { employees: any[]; vehicles: any[] };
  lastMonthDocuments: { employees: any[]; vehicles: any[] };
  pendingDocuments: { employees: any[]; vehicles: any[] };
  companyDocuments: any[];
  DrawerEmployees: any[] | null;
  DrawerVehicles: any[] | null;
  showDeletedEmployees: boolean;
  showLastMonthDocuments: boolean;
  // Legacy no-op functions
  setEmployees: (employees: any) => void;
  setActivesEmployees: () => void;
  setInactiveEmployees: () => void;
  setShowDeletedEmployees: (v: boolean) => void;
  endorsedEmployees: () => void;
  noEndorsedEmployees: () => void;
  getEmployees: (active: boolean) => void;
  documentDrawerEmployees: (document: string) => void;
  fetchVehicles: () => void;
  setActivesVehicles: () => void;
  endorsedVehicles: () => void;
  noEndorsedVehicles: () => void;
  setVehicleTypes: (type: string) => void;
  documentDrawerVehicles: (id: string) => void;
  documetsFetch: () => void;
  setShowLastMonthDocuments: () => void;
  cleanup: () => void;
}

const emptyDocs = { employees: [], vehicles: [] };
const noop = () => {};

export const useLoggedUserStore = create<State>((set, get) => {
  const buildState = (): Partial<State> => {
    const auth = useAuthStore.getState();
    const company = useCompanyStore.getState();
    const ui = useUiStore.getState();

    return {
      // Auth
      credentialUser: auth.credentialUser,
      profile: auth.profile,
      codeControlRole: auth.codeControlRole,
      roleActualCompany: auth.roleActualCompany,
      loggedUser: auth.loggedUser,

      // Company
      allCompanies: company.allCompanies,
      actualCompany: company.actualCompany,
      sharedCompanies: company.sharedCompanies,
      sharedUsers: company.sharedUsers,
      showNoCompanyAlert: company.showNoCompanyAlert,
      showMultiplesCompaniesAlert: company.showMultiplesCompaniesAlert,
      setActualCompany: company.setActualCompany,
      FetchSharedUsers: company.FetchSharedUsers,
      setNewDefectCompany: company.setNewDefectCompany,
      resetDefectCompanies: company.resetDefectCompanies,

      // UI
      active_sidebar: ui.active_sidebar,
      notifications: ui.notifications,
      toggleSidebar: ui.toggleSidebar,
      markAllAsRead: ui.markAllAsRead,

      // Legacy stubs — return empty data, no-op functions
      isLoading: false,
      employees: [],
      active_and_inactive_employees: [],
      employeesToShow: [],
      vehicles: [],
      vehiclesToShow: [],
      allDocumentsToShow: emptyDocs,
      documentsToShow: emptyDocs,
      Alldocuments: emptyDocs,
      lastMonthDocuments: emptyDocs,
      pendingDocuments: emptyDocs,
      companyDocuments: [],
      DrawerEmployees: null,
      DrawerVehicles: null,
      showDeletedEmployees: false,
      showLastMonthDocuments: false,
      setEmployees: noop,
      setActivesEmployees: noop,
      setInactiveEmployees: noop,
      setShowDeletedEmployees: noop,
      endorsedEmployees: noop,
      noEndorsedEmployees: noop,
      getEmployees: noop,
      documentDrawerEmployees: noop,
      fetchVehicles: noop,
      setActivesVehicles: noop,
      endorsedVehicles: noop,
      noEndorsedVehicles: noop,
      setVehicleTypes: noop,
      documentDrawerVehicles: noop,
      documetsFetch: noop,
      setShowLastMonthDocuments: noop,
      cleanup: noop,
    };
  };

  const syncState = () => {
    set(buildState());
  };

  // Subscribe only to stores that still hold global state
  useAuthStore.subscribe(syncState);
  useCompanyStore.subscribe(syncState);
  useUiStore.subscribe(syncState);

  return buildState() as State;
});
