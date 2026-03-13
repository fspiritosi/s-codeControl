/**
 * FACADE STORE - Backward compatibility layer
 *
 * This file re-exports a composed store from the new domain stores.
 * All 91 files that import `useLoggedUserStore` continue working unchanged.
 *
 * New code should import directly from the domain stores:
 *   - useAuthStore     (src/store/authStore.ts)
 *   - useCompanyStore  (src/store/companyStore.ts)
 *   - useEmployeeStore (src/store/employeeStore.ts)
 *   - useDocumentStore (src/store/documentStore.ts)
 *   - useVehicleStore  (src/store/vehicleStore.ts)
 *   - useUiStore       (src/store/uiStore.ts)
 */

import { Notifications, SharedUser, profileUser } from '@/shared/types/types';
import { Company, SharedCompanies, Vehicle } from '@/shared/zodSchemas/schemas';

type AuthUser = { id: string; email?: string; [key: string]: any } | null;
import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { useCompanyStore } from './companyStore';
import { CompanyDocumentsType } from './documentStore';
import { useDocumentStore } from './documentStore';
import { useEmployeeStore } from './employeeStore';
import { useUiStore } from './uiStore';
import { useVehicleStore } from './vehicleStore';

// Re-export CompanyDocumentsType for backward compatibility
export type { CompanyDocumentsType } from './documentStore';

// Re-export the domain stores for gradual migration
export { useAuthStore } from './authStore';
export { useCompanyStore } from './companyStore';
export { useDocumentStore } from './documentStore';
export { useEmployeeStore } from './employeeStore';
export { useUiStore } from './uiStore';
export { useVehicleStore } from './vehicleStore';

interface Document {
  date: string;
  allocated_to: string;
  documentName: string;
  multiresource: string;
  validity: string;
  id: string;
  resource: string;
  state: string;
  document_path?: string;
  is_active: boolean;
  document_number?: string;
  isItMonthly: boolean;
  applies: string;
  mandatory: string;
  serie?: string | null;
}

interface State {
  credentialUser: AuthUser;
  profile: profileUser[];
  showNoCompanyAlert: boolean;
  showMultiplesCompaniesAlert: boolean;
  allCompanies: Company;
  actualCompany: Company[0] | null;
  setActualCompany: (company: Company[0]) => void;
  employees: any;
  active_and_inactive_employees: any;
  setEmployees: (employees: any) => void;
  isLoading: boolean;
  employeesToShow: any;
  setInactiveEmployees: () => void;
  setActivesEmployees: () => void;
  showDeletedEmployees: boolean;
  setShowDeletedEmployees: (showDeletedEmployees: boolean) => void;
  vehicles: Vehicle;
  setNewDefectCompany: (company: Company[0]) => void;
  sharedCompanies: SharedCompanies;
  endorsedEmployees: () => void;
  noEndorsedEmployees: () => void;
  allDocumentsToShow: {
    employees: Document[];
    vehicles: Document[];
  };
  documentsToShow: {
    employees: Document[];
    vehicles: Document[];
  };
  Alldocuments: {
    employees: Document[];
    vehicles: Document[];
  };
  lastMonthDocuments: {
    employees: Document[];
    vehicles: Document[];
  };
  showLastMonthDocuments: boolean;
  setShowLastMonthDocuments: () => void;
  pendingDocuments: {
    employees: Document[];
    vehicles: Document[];
  };
  notifications: Notifications[];
  markAllAsRead: () => void;
  resetDefectCompanies: (company: Company[0]) => void;
  sharedUsers: SharedUser[];
  vehiclesToShow: any;
  setActivesVehicles: () => void;
  endorsedVehicles: () => void;
  noEndorsedVehicles: () => void;
  setVehicleTypes: (type: string) => void;
  fetchVehicles: () => void;
  documetsFetch: () => void;
  getEmployees: (active: boolean) => void;
  loggedUser: () => void;
  documentDrawerEmployees: (document: string) => void;
  DrawerEmployees: any[] | null;
  FetchSharedUsers: () => void;
  DrawerVehicles: any[] | null;
  documentDrawerVehicles: (id: string) => void;
  companyDocuments: CompanyDocumentsType[];
  codeControlRole: string;
  roleActualCompany: string;
  active_sidebar: boolean;
  toggleSidebar: () => void;
  cleanup: () => void;
}

/**
 * Legacy facade store that composes all domain stores.
 * Components using `useLoggedUserStore(state => state.someField)` will
 * continue to work because this store subscribes to all sub-stores and
 * merges their state.
 */
export const useLoggedUserStore = create<State>((set, get) => {
  const buildState = (): Partial<State> => {
    const auth = useAuthStore.getState();
    const company = useCompanyStore.getState();
    const employee = useEmployeeStore.getState();
    const doc = useDocumentStore.getState();
    const vehicle = useVehicleStore.getState();
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

      // Employee
      employees: employee.employees,
      employeesToShow: employee.employeesToShow,
      active_and_inactive_employees: employee.active_and_inactive_employees,
      showDeletedEmployees: employee.showDeletedEmployees,
      DrawerEmployees: employee.DrawerEmployees,
      setEmployees: employee.setEmployees,
      setActivesEmployees: employee.setActivesEmployees,
      setInactiveEmployees: employee.setInactiveEmployees,
      setShowDeletedEmployees: employee.setShowDeletedEmployees,
      endorsedEmployees: employee.endorsedEmployees,
      noEndorsedEmployees: employee.noEndorsedEmployees,
      getEmployees: employee.getEmployees,
      documentDrawerEmployees: employee.documentDrawerEmployees,

      // Document
      allDocumentsToShow: doc.allDocumentsToShow,
      documentsToShow: doc.documentsToShow,
      Alldocuments: doc.Alldocuments,
      lastMonthDocuments: doc.lastMonthDocuments,
      showLastMonthDocuments: doc.showLastMonthDocuments,
      pendingDocuments: doc.pendingDocuments,
      companyDocuments: doc.companyDocuments,
      documetsFetch: doc.documetsFetch,
      setShowLastMonthDocuments: doc.setShowLastMonthDocuments,

      // Vehicle
      vehicles: vehicle.vehicles,
      vehiclesToShow: vehicle.vehiclesToShow,
      DrawerVehicles: vehicle.DrawerVehicles,
      fetchVehicles: vehicle.fetchVehicles,
      setActivesVehicles: vehicle.setActivesVehicles,
      endorsedVehicles: vehicle.endorsedVehicles,
      noEndorsedVehicles: vehicle.noEndorsedVehicles,
      setVehicleTypes: vehicle.setVehicleTypes,
      documentDrawerVehicles: vehicle.documentDrawerVehicles,

      // UI
      active_sidebar: ui.active_sidebar,
      notifications: ui.notifications,
      toggleSidebar: ui.toggleSidebar,
      markAllAsRead: ui.markAllAsRead,

      // Legacy
      isLoading: false,
      cleanup: () => {},
    };
  };

  const syncState = () => {
    set(buildState());
  };

  // Subscribe to changes in all domain stores
  useAuthStore.subscribe(syncState);
  useCompanyStore.subscribe(syncState);
  useEmployeeStore.subscribe(syncState);
  useDocumentStore.subscribe(syncState);
  useVehicleStore.subscribe(syncState);
  useUiStore.subscribe(syncState);

  // Return initial state directly (not via get() which is undefined during init in Zustand 5)
  return buildState() as State;
});
