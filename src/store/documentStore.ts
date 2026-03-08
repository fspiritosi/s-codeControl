import { VehiclesAPI } from '@/types/types';
import moment from 'moment';
import { create } from 'zustand';
import {
  fetchAllDocumentsEmployeesByCompany,
  fetchAllDocumentsEquipmentByCompany,
  fetchCompanyDocuments,
} from '@/app/server/GET/actions';

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

const mapDocument = (doc: any) => {
  // Support both Supabase and Prisma relation names
  const docType = doc.document_types || doc.document_type;
  const emp = doc.employees || doc.employee;
  return {
    date: moment(doc.created_at).format('DD/MM/YYYY'),
    allocated_to: emp?.contractor_employee?.map((ce: any) => (ce.contractors || ce.contractor)?.name).join(', '),
    documentName: docType?.name,
    state: doc.state,
    multiresource: docType?.multiresource ? 'Si' : 'No',
    isItMonthly: docType?.is_it_montlhy,
    validity: doc.validity,
    mandatory: docType?.mandatory ? 'Si' : 'No',
    id: doc.id,
    resource: `${emp?.lastname?.charAt(0)?.toUpperCase()}${emp?.lastname.slice(1)} ${emp?.firstname?.charAt(0)?.toUpperCase()}${emp?.firstname.slice(1)}`,
    document_number: emp?.document_number,
    employee_id: emp?.id,
    document_url: doc.document_path,
    is_active: emp?.is_active,
    period: doc.period,
    applies: docType?.applies,
    id_document_types: docType?.id,
    intern_number: null,
  };
};

const mapVehicle = (doc: any) => {
  const docType = doc.document_types || doc.document_type;
  const veh = doc.applies || doc.vehicle;
  return {
    date: doc.created_at ? moment(doc.created_at).format('DD/MM/YYYY') : 'No vence',
    allocated_to: (veh?.type_of_vehicle?.name || veh?.type_of_vehicle_rel?.name),
    documentName: docType?.name,
    state: doc.state,
    multiresource: docType?.multiresource ? 'Si' : 'No',
    isItMonthly: docType?.is_it_montlhy,
    validity: doc.validity,
    mandatory: docType?.mandatory ? 'Si' : 'No',
    id: doc.id,
    resource: `${veh?.domain}`,
    vehicle_id: veh?.id,
    is_active: veh?.is_active,
    period: doc.period,
    applies: docType?.applies,
    resource_id: veh?.id,
    id_document_types: docType?.id,
    intern_number: `${veh?.intern_number}`,
    serie: veh?.serie,
  };
};

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

    // Fetch employee documents via server action
    let data = await fetchAllDocumentsEmployeesByCompany(companyId);

    // Map Prisma relation names to expected format
    data = data?.map((d: any) => ({
      ...d,
      employees: d.employee || d.employees,
      document_types: d.document_type || d.document_types,
    }));

    // Fetch company documents via server action
    let documents_company = await fetchCompanyDocuments();

    // Map Prisma relation names for company documents
    documents_company = documents_company?.map((d: any) => ({
      ...d,
      id_document_types: d.document_type || d.id_document_types,
      user_id: d.user || d.user_id,
    }));

    // Fetch equipment documents via server action
    let equipmentData = await fetchAllDocumentsEquipmentByCompany(companyId);

    // Map Prisma relation names to expected format
    equipmentData = equipmentData?.map((d: any) => ({
      ...d,
      document_types: d.document_type || d.document_types,
      applies: d.vehicle || d.applies,
    }));

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
      roleActualCompany === 'Invitado' ? data?.filter((e: any) => !e.document_types.private) : data;

    set({ companyDocuments: companyData as CompanyDocumentsType[] });

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
          ?.filter((e: any) => filterActiveDoc(e))
          ?.filter((doc: any) => {
            if (!doc.validity) return false;
            return doc.state !== 'pendiente' && (doc.validity !== 'No vence' || doc.validity !== null);
          })
          ?.map(mapDocument) || [],
      vehicles:
        filteredVehiclesData
          ?.filter((e: any) => filterActiveDoc(e, true))
          .filter((doc: any) => {
            if (!doc.validity || doc.validity === 'No vence') return false;
            return doc.state !== 'pendiente' && (doc.validity !== 'No vence' || doc.validity !== null);
          })
          ?.map(mapVehicle) || [],
    };

    const pendingDocuments: DocumentsCollection = {
      employees:
        employeesData
          ?.filter((e: any) => filterActiveDoc(e))
          .filter((doc: any) => doc.state === 'presentado')
          ?.map(mapDocument) || [],
      vehicles:
        equipmentData1
          ?.filter((e: any) => filterActiveDoc(e, true))
          .filter((doc: any) => doc.state === 'presentado')
          ?.map(mapVehicle) || [],
    };

    const Allvalues: DocumentsCollection = {
      employees:
        employeesData
          ?.filter((e: any) => filterActiveDoc(e))
          ?.filter((doc: any) => {
            if (!doc.validity || doc.validity === 'No vence') return false;
            return doc.state !== 'presentado' && (doc.validity !== 'No vence' || doc.validity !== null);
          })
          ?.map(mapDocument) || [],
      vehicles:
        equipmentData1
          ?.filter((e: any) => filterActiveDoc(e, true))
          ?.filter((doc: any) => {
            if (!doc.validity || doc.validity === 'No vence') return false;
            return doc.state !== 'presentado' && (doc.validity !== 'No vence' || doc.validity !== null);
          })
          ?.map(mapVehicle) || [],
    };

    const AllvaluesToShow: DocumentsCollection = {
      employees:
        employeesData
          ?.filter((e: any) => filterActiveDoc(e))
          .map(mapDocument) || [],
      vehicles:
        equipmentData1
          ?.filter((e: any) => filterActiveDoc(e, true))
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
