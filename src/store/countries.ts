import { Equipo } from '@/zodSchemas/schemas';
import { create } from 'zustand';
import { supabase } from '../../supabase/supabase';
import { MandatoryDocuments } from './../zodSchemas/schemas';
import { useCompanyStore } from './companyStore';

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
  fetchContractors: () => void // Añadir esta función al estado
  fetchContacts: () => void
  subscribeToCustomersChanges: () => () => void
  subscribeToContactsChanges: () => () => void
}

const fetchCountrys = async () => {
  const { data: fetchCountries, error } = await supabase.from('countries').select('*');
  if (error) {
    console.error('Error al obtener los países:', error);
  } else {
    useCountriesStore.setState({ countries: fetchCountries || [] });
  }
};
const fetchProvinces = async () => {
  const { data: fetchedProvinces, error } = await supabase.from('provinces').select('*');

  if (error) {
    console.error('Error al obtener las provincias:', error);
  } else {
    useCountriesStore.setState({ provinces: fetchedProvinces || [] });
  }
};
const fetchHierarchy = async () => {
  const { data: hierarchy, error } = await supabase.from('hierarchy').select('*');

  if (error) {
    console.error('Error al obtener la jerarquia:', error);
  } else {
    useCountriesStore.setState({ hierarchy: hierarchy || [] });
  }
};
const fetchworkDiagram = async () => {
  const { data: workDiagram, error } = await supabase.from('work-diagram').select('*');

  if (error) {
    console.error('Error al obtener el diagrama de trabajo:', error);
  } else {
    useCountriesStore.setState({ workDiagram: workDiagram || [] });
  }
};
const fetchContractors = async () => {
  const { data: customers, error } = await supabase.from('customers').select('*');

  if (error) {
    console.error('Error al obtener los contratistas:', error);
  } else {
    useCountriesStore.setState({ customers: customers || [] });
  }
};

const fetchContacts = async () => {
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*, customers(id, name)');

  if (error) {
    console.error('Error fetching customers:', error);
  } else {
    useCountriesStore.setState({ contacts: contacts || [] });
  }
};

const documentTypes = async (id: string | undefined) => {
  const company_id = id ?? useCompanyStore?.getState?.()?.actualCompany?.id;

  let { data: document_types } = await supabase
    .from('document_types')
    .select('*')
    .eq('is_active', true)
    .or(`company_id.eq.${company_id},company_id.is.null`);

  const groupedData = document_types
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
    const { data: fetchCities, error } = await supabase.from('cities').select('*').eq('province_id', provinceId);

    if (error) {
      console.error('Error al obtener las ciudades:', error);
    } else {
      set({ cities: fetchCities || [] });
    }
  },

  documentTypes: (company_id?: string) => documentTypes(company_id || ''),

  fetchContractors,
  fetchContacts,

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
  fetchHierarchy();
  fetchCountrys();
  fetchProvinces();
}
