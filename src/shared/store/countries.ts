import { Equipo } from '@/shared/zodSchemas/schemas';
import { create } from 'zustand';
import { MandatoryDocuments } from './../zodSchemas/schemas';
import { useCompanyStore } from './companyStore';
import { fetchContactsWithCustomers } from '@/modules/company/features/contacts/actions.server';
import { fetchDocumentTypesByCompany } from '@/modules/documents/features/list/actions.server';
import { fetchAllCustomers } from '@/modules/employees/features/list/actions.server';
import { fetchHierarchy as fetchHierarchyAction, fetchAllWorkDiagrams } from '@/shared/actions/catalogs';
import { fetchCountries as fetchCountriesAction, fetchProvinces as fetchProvincesAction, fetchCitiesByProvince } from '@/shared/actions/geography';

type Province = {
  id: number;
  name: string;
};
export type generic = {
  id: number;
  name: string;
  created_at: string;
};
interface State {
  countries: generic[]
  provinces: Province[]
  cities: Province[]
  fetchCities: (provinceId: any) => void
  hierarchy: generic[]
  workDiagram: generic[]
  customers: generic[]
  contacts: generic[]
  mandatoryDocuments: MandatoryDocuments
  documentTypes: (company_id?: string) => void
  companyDocumentTypes: Equipo
  fetchContractors: () => void
  fetchContacts: () => void
  initCatalogs: () => void
  startCustomersPolling: () => void
  stopCustomersPolling: () => void
  startContactsPolling: () => void
  stopContactsPolling: () => void
}

const fetchCountrys = async () => {
  const data = await fetchCountriesAction();
  useCountriesStore.setState({ countries: (data as any) || [] });
};

const fetchProvinces = async () => {
  const data = await fetchProvincesAction();
  useCountriesStore.setState({ provinces: (data as any) || [] });
};

const fetchHierarchyFn = async () => {
  const data = await fetchHierarchyAction();
  useCountriesStore.setState({ hierarchy: (data as any) || [] });
};

const fetchworkDiagram = async () => {
  const data = await fetchAllWorkDiagrams();
  useCountriesStore.setState({ workDiagram: (data as any) || [] });
};

const fetchContractors = async () => {
  const data = await fetchAllCustomers();
  useCountriesStore.setState({ customers: (data as any) || [] });
};

const fetchContacts = async () => {
  const data = await fetchContactsWithCustomers();
  // Map Prisma relation name to expected format
  const mapped = (data as any)?.map((c: any) => ({
    ...c,
    customers: c.customer || c.customers,
  }));
  useCountriesStore.setState({ contacts: mapped || [] });
};

const documentTypes = async (id: string | undefined) => {
  const company_id = id ?? useCompanyStore?.getState?.()?.actualCompany?.id;
  if (!company_id) return;

  const document_types = await fetchDocumentTypesByCompany(company_id);

  const groupedData = (document_types as any[])
    ?.filter((item) => item['mandatory'] === true)
    .reduce((acc: Record<string, any[]>, item) => {
      (acc[item['applies']] = acc[item['applies']] || []).push(item);
      return acc;
    }, {}) as MandatoryDocuments;

  useCountriesStore.setState({ companyDocumentTypes: document_types as Equipo });
  useCountriesStore.setState({ mandatoryDocuments: groupedData });
};

let customersPollInterval: NodeJS.Timeout | null = null;
let contactsPollInterval: NodeJS.Timeout | null = null;

export const useCountriesStore = create<State>((set, get) => ({
  countries: [],
  provinces: [],
  cities: [],
  hierarchy: [],
  workDiagram: [],
  customers: [],
  contacts: [],
  mandatoryDocuments: {} as MandatoryDocuments,
  companyDocumentTypes: [] as unknown as Equipo,

  fetchCities: async (provinceId: any) => {
    const data = await fetchCitiesByProvince(provinceId);
    set({ cities: (data as any) || [] });
  },

  documentTypes: (company_id?: string) => documentTypes(company_id || ''),

  fetchContractors,
  fetchContacts,

  initCatalogs: async () => {
    const state = get();
    // Only fetch if not already loaded
    if (!state.countries.length) fetchCountrys();
    if (!state.provinces.length) fetchProvinces();
    if (!state.hierarchy.length) fetchHierarchyFn();
    if (!state.workDiagram.length) fetchworkDiagram();
    if (!state.customers.length) fetchContractors();
    if (!state.contacts.length) fetchContacts();
  },

  // Polling replacement for real-time subscriptions
  startCustomersPolling: () => {
    if (customersPollInterval) return;
    customersPollInterval = setInterval(() => {
      fetchContractors();
    }, 30000);
  },

  stopCustomersPolling: () => {
    if (customersPollInterval) {
      clearInterval(customersPollInterval);
      customersPollInterval = null;
    }
  },

  startContactsPolling: () => {
    if (contactsPollInterval) return;
    contactsPollInterval = setInterval(() => {
      fetchContacts();
    }, 30000);
  },

  stopContactsPolling: () => {
    if (contactsPollInterval) {
      clearInterval(contactsPollInterval);
      contactsPollInterval = null;
    }
  },
}));

// Catalog fetches disabled on module load — loaded on-demand by components that need them
// if (typeof window !== 'undefined') {
//   fetchContractors();
//   fetchContacts();
//   fetchworkDiagram();
//   fetchHierarchyFn();
//   fetchCountrys();
//   fetchProvinces();
// }
