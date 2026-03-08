import { Equipo } from '@/zodSchemas/schemas';
import { create } from 'zustand';
import { supabase } from '../../supabase/supabase';
import { MandatoryDocuments } from './../zodSchemas/schemas';
import { useCompanyStore } from './companyStore';
import {
  fetchCountries as fetchCountriesAction,
  fetchProvinces as fetchProvincesAction,
  fetchHierarchy as fetchHierarchyAction,
  fetchAllWorkDiagrams,
  fetchAllCustomers,
  fetchContactsWithCustomers,
  fetchCitiesByProvince,
  fetchDocumentTypesByCompany,
} from '@/app/server/GET/actions';

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
  subscribeToCustomersChanges: () => () => void
  subscribeToContactsChanges: () => () => void
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

  // TODO: Phase 5 - replace with polling/SSE
  subscribeToCustomersChanges: () => {
    const channel = supabase.channel('realtime-customers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => {
          fetchContractors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // TODO: Phase 5 - replace with polling/SSE
  subscribeToContactsChanges: () => {
    const channel = supabase.channel('realtime-contacts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

// Initialize data fetches after store creation
if (typeof window !== 'undefined') {
  fetchContractors();
  fetchContacts();
  fetchworkDiagram();
  fetchHierarchyFn();
  fetchCountrys();
  fetchProvinces();
}
