import { VehiclesAPI } from '@/types/types';
import moment from 'moment';
import { create } from 'zustand';
import { supabase } from '../../supabase/supabase';

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

export interface CompanyDocumentsType {
  created_at: string;
  id_document_types: Iddocumenttypes;
  validity: Date | string;
  state: string;
  is_active: boolean;
  id: string;
  user_id: UserId;
  applies: string;
  deny_reason: null;
  document_path: null;
  period: string;
  intern_number?: string;
}

interface UserId {
  id: string;
  role: string;
  email: string;
  avatar: string;
  fullname: string;
  created_at: string;
  credential_id: string;
}

interface Iddocumenttypes {
  id: string;
  name: string;
  applies: string;
  special: boolean;
  explired: boolean;
  is_active: boolean;
  mandatory: boolean;
  company_id: string;
  created_at: string;
  description: null;
  is_it_montlhy: boolean;
  multiresource: boolean;
  private: boolean;
}

interface DocumentsCollection {
  employees: Document[];
  vehicles: Document[];
}

interface DocumentState {
  allDocumentsToShow: DocumentsCollection;
  documentsToShow: DocumentsCollection;
  Alldocuments: DocumentsCollection;
  lastMonthDocuments: DocumentsCollection;
  showLastMonthDocuments: boolean;
  pendingDocuments: DocumentsCollection;
  companyDocuments: CompanyDocumentsType[];
  documetsFetch: () => void;
  setShowLastMonthDocuments: () => void;
}

const emptyDocs: DocumentsCollection = { employees: [], vehicles: [] };

const mapDocument = (doc: any) => ({
  date: moment(doc.created_at).format('DD/MM/YYYY'),
  allocated_to: doc.employees?.contractor_employee?.map((doc: any) => doc.contractors?.name).join(', '),
  documentName: doc.document_types?.name,
  state: doc.state,
  multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
  isItMonthly: doc.document_types?.is_it_montlhy,
  validity: doc.validity,
  mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
  id: doc.id,
  resource: `${doc.employees?.lastname?.charAt(0)?.toUpperCase()}${doc?.employees?.lastname.slice(1)} ${doc.employees?.firstname?.charAt(0)?.toUpperCase()}${doc?.employees?.firstname.slice(1)}`,
  document_number: doc.employees?.document_number,
  employee_id: doc.employees?.id,
  document_url: doc.document_path,
  is_active: doc.employees?.is_active,
  period: doc.period,
  applies: doc.document_types.applies,
  id_document_types: doc.document_types.id,
  intern_number: null,
});

const mapVehicle = (doc: any) => ({
  date: doc.created_at ? moment(doc.created_at).format('DD/MM/YYYY') : 'No vence',
  allocated_to: doc.applies?.type_of_vehicle?.name,
  documentName: doc.document_types?.name,
  state: doc.state,
  multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
  isItMonthly: doc.document_types?.is_it_montlhy,
  validity: doc.validity,
  mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
  id: doc.id,
  resource: `${doc.applies?.domain}`,
  vehicle_id: doc.applies?.id,
  is_active: doc.applies?.is_active,
  period: doc.period,
  applies: doc.document_types.applies,
  resource_id: doc.applies?.id,
  id_document_types: doc.document_types.id,
  intern_number: `${doc.applies?.intern_number}`,
  serie: doc.applies?.serie,
});

export const useDocumentStore = create<DocumentState>((set, get) => ({
  allDocumentsToShow: emptyDocs,
  documentsToShow: emptyDocs,
  Alldocuments: emptyDocs,
  lastMonthDocuments: emptyDocs,
  showLastMonthDocuments: false,
  pendingDocuments: emptyDocs,
  companyDocuments: [],

  setShowLastMonthDocuments: () => {
    set({ showLastMonthDocuments: !get().showLastMonthDocuments });
    set({
      documentsToShow: !get().showLastMonthDocuments ? get().Alldocuments : get().lastMonthDocuments,
    });
  },

  documetsFetch: async () => {
    const { useCompanyStore } = require('./companyStore');
    const { useAuthStore } = require('./authStore');
    const companyId = useCompanyStore.getState().actualCompany?.id;
    if (!companyId) return;

    let data;

    let { data: dataEmployes, error } = await supabase
      .from('documents_employees')
      .select(
        `*,
        employees:employees(*,contractor_employee(customers(*))),
        document_types:document_types(*)`
      )
      .not('employees', 'is', null)
      .eq('employees.company_id', companyId)
      .eq('employees.is_active', true)
      .eq('document_types.is_active', true);

    data = dataEmployes;

    if (error) {
      console.error('Error al obtener los empleados:', error);
    }

    if (dataEmployes?.length === 1000) {
      const { data: data2, error: error2 } = await supabase
        .from('documents_employees')
        .select(
          `*,
          employees:employees(*,contractor_employee(customers(*))),
          document_types:document_types(*)`
        )
        .not('employees', 'is', null)
        .eq('employees.company_id', companyId)
        .eq('employees.is_active', true)
        .eq('document_types.is_active', true)
        .range(1000, 2000);

      if (error2) console.error('Error al obtener los empleados:', error2);
      if (data2) data = data ? [...data, ...data2] : data2;
    }

    let { data: documents_company, error: documents_company_error } = await supabase
      .from('documents_company')
      .select('*,id_document_types(*),user_id(*)')
      .eq('applies', companyId);

    if (documents_company_error) {
      console.error('Error al obtener los documentos de la empresa:', documents_company_error);
    }

    let { data: equipmentData, error: equipmentError } = await supabase
      .from('documents_equipment')
      .select(
        `*,
        document_types:document_types(*),
        applies(*,type(*),type_of_vehicle(*),model(*),brand(*))`
      )
      .eq('applies.company_id', companyId)
      .eq('applies.is_active', true)
      .eq('document_types.is_active', true)
      .not('applies', 'is', null);

    if (equipmentError) console.error('Error al obtener los equipos:', equipmentError);

    useAuthStore.getState().handleActualCompanyRole();

    const typedData: VehiclesAPI[] | null = equipmentData as VehiclesAPI[];
    const typedDataCompany: CompanyDocumentsType[] | null = documents_company as CompanyDocumentsType[];

    const roleActualCompany = useAuthStore.getState().roleActualCompany;

    const equipmentData1 =
      roleActualCompany === 'Invitado' ? typedData?.filter((e) => !e.document_types.private) : typedData;
    const companyData =
      roleActualCompany === 'Invitado'
        ? typedDataCompany?.filter((e) => !e.id_document_types.private)
        : typedDataCompany;
    const employeesData =
      roleActualCompany === 'Invitado' ? data?.filter((e) => !e.document_types.private) : data;

    set({ companyDocuments: companyData as CompanyDocumentsType[] });

    if (error) return;

    const today = moment().startOf('day');
    const nextMonth = moment().add(1, 'month').endOf('day');

    const filteredData = employeesData?.filter((doc: any) => {
      if (!doc.validity) return false;
      const date = moment(doc.validity, 'DD/MM/YYYY');
      return date.isBefore(today) || date.isBefore(nextMonth) || doc.state === 'Vencido';
    });

    const filteredVehiclesData = equipmentData1?.filter((doc: any) => {
      if (!doc.validity) return false;
      const date = moment(doc.validity, 'DD/MM/YYYY');
      return date.isBefore(today) || date.isBefore(nextMonth) || doc.state === 'Vencido';
    });

    const filterActiveDoc = (e: any, isVehicle = false) => {
      const resource = isVehicle ? e.applies : e.employees;
      return (
        (!resource?.termination_date && !e.document_types.down_document) ||
        (resource?.termination_date && e.document_types.down_document)
      );
    };

    const lastMonthValues: DocumentsCollection = {
      employees:
        filteredData
          ?.filter((e) => filterActiveDoc(e))
          ?.filter((doc: any) => {
            if (!doc.validity) return false;
            return doc.state !== 'pendiente' && (doc.validity !== 'No vence' || doc.validity !== null);
          })
          ?.map(mapDocument) || [],
      vehicles:
        filteredVehiclesData
          ?.filter((e) => filterActiveDoc(e, true))
          .filter((doc: any) => {
            if (!doc.validity || doc.validity === 'No vence') return false;
            return doc.state !== 'pendiente' && (doc.validity !== 'No vence' || doc.validity !== null);
          })
          ?.map(mapVehicle) || [],
    };

    const pendingDocuments: DocumentsCollection = {
      employees:
        employeesData
          ?.filter((e) => filterActiveDoc(e))
          .filter((doc: any) => doc.state === 'presentado')
          ?.map(mapDocument) || [],
      vehicles:
        equipmentData1
          ?.filter((e) => filterActiveDoc(e, true))
          .filter((doc: any) => doc.state === 'presentado')
          ?.map(mapVehicle) || [],
    };

    const Allvalues: DocumentsCollection = {
      employees:
        employeesData
          ?.filter((e) => filterActiveDoc(e))
          ?.filter((doc: any) => {
            if (!doc.validity || doc.validity === 'No vence') return false;
            return doc.state !== 'presentado' && (doc.validity !== 'No vence' || doc.validity !== null);
          })
          ?.map(mapDocument) || [],
      vehicles:
        equipmentData1
          ?.filter((e) => filterActiveDoc(e, true))
          ?.filter((doc: any) => {
            if (!doc.validity || doc.validity === 'No vence') return false;
            return doc.state !== 'presentado' && (doc.validity !== 'No vence' || doc.validity !== null);
          })
          ?.map(mapVehicle) || [],
    };

    const AllvaluesToShow: DocumentsCollection = {
      employees:
        employeesData
          ?.filter((e) => filterActiveDoc(e))
          .map(mapDocument) || [],
      vehicles:
        equipmentData1
          ?.filter((e) => filterActiveDoc(e, true))
          .map(mapVehicle) || [],
    };

    set({ allDocumentsToShow: AllvaluesToShow });
    set({ showLastMonthDocuments: true });
    set({ Alldocuments: Allvalues });
    set({ lastMonthDocuments: lastMonthValues });
    set({ documentsToShow: lastMonthValues });
    set({ pendingDocuments });
  },
}));
