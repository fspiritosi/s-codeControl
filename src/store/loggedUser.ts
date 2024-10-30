import { Notifications, SharedUser, VehiclesAPI, profileUser } from '@/types/types';
import { Company, SharedCompanies, Vehicle } from '@/zodSchemas/schemas';
import { User } from '@supabase/supabase-js';
import cookies from 'js-cookie';
import moment from 'moment';
import { create } from 'zustand';
import { supabase } from '../../supabase/supabase';
import { useCountriesStore } from './countries';
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
  credentialUser: User | null;
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

const setEmployeesToShow = (employees: any) => {
  const employee = employees?.map((employees: any) => {
    return {
      full_name: `${employees?.lastname?.charAt(0)?.toUpperCase()}${employees?.lastname?.slice(1)} ${employees?.firstname
        ?.charAt(0)
        ?.toUpperCase()}${employees?.firstname?.slice(1)}`,
      id: employees?.id,
      email: employees?.email,
      cuil: employees?.cuil,
      document_number: employees?.document_number,
      hierarchical_position: employees?.hierarchical_position?.name,
      company_position: employees?.company_position,
      normal_hours: employees?.normal_hours,
      type_of_contract: employees?.type_of_contract,
      allocated_to: employees?.allocated_to,
      picture: employees?.picture,
      nationality: employees?.nationality,
      lastname: `${employees?.lastname?.charAt(0)?.toUpperCase()}${employees?.lastname.slice(1)}`,
      firstname: `${employees?.firstname?.charAt(0)?.toUpperCase()}${employees?.firstname.slice(1)}`,
      document_type: employees?.document_type,
      birthplace: employees?.birthplace?.name?.trim(),
      gender: employees?.gender,
      marital_status: employees?.marital_status,
      level_of_education: employees?.level_of_education,
      street: employees?.street,
      street_number: employees?.street_number,
      province: employees?.province?.name?.trim(),
      postal_code: employees?.postal_code,
      phone: employees?.phone,
      file: employees?.file,
      date_of_admission: employees?.date_of_admission,
      affiliate_status: employees?.affiliate_status,
      city: employees?.city?.name?.trim(),
      hierrl_position: employees?.hierarchical_position?.name,
      workflow_diagram: employees?.workflow_diagram?.name,
      contractor_employee: employees?.contractor_employee?.map(({ customers }: any) => customers?.id),
      contractor_name: employees?.contractor_employee?.map(({ customers }: any) => customers?.name),
      is_active: employees?.is_active,
      reason_for_termination: employees?.reason_for_termination,
      termination_date: employees?.termination_date,
      status: employees?.status,
      guild: employees?.guild,
      covenants: employees?.covenants,
      category: employees?.category,
      documents_employees: employees.documents_employees,
    };
  });

  return employee;
};

const setVehiclesToShow = (vehicles: Vehicle) => {
  return vehicles?.map((item) => ({
    ...item,
    types_of_vehicles: item.types_of_vehicles.name,
    brand: item.brand_vehicles.name,
    model: item.model_vehicles.name,
  }));
};

export const useLoggedUserStore = create<State>((set, get) => {
  // set({ isLoading: true })
  set({ showDeletedEmployees: false });

  const toggleSidebar = () => {
    set({ active_sidebar: !get().active_sidebar });
  };

  const howManyCompanies = async (id: string) => {
    if (!id) return;
    const { data, error } = await supabase
      .from('company')
      .select(
        `
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
            city (
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
            )
          )
        )
      `
      )
      .eq('owner_id', id);

    let { data: share_company_users, error: sharedError } = await supabase
      .from('share_company_users')
      .select(
        `*,company_id(*,
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
            city (
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
            )
          )
        )
      )`
      )
      .eq('profile_id', id);
    FetchSharedUsers();

    set({ sharedCompanies: share_company_users as SharedCompanies });
    // const router = useRouter()
    //console.log('manyCompanies user si');
    if (error) {
      console.error('Error al obtener el perfil:', error);
    } else {
      const user = share_company_users?.find((e) => e.profile_id === id);

      if (user?.role) {
        set({ roleActualCompany: user?.role });
        await documetsFetch();
      } else {
        set({ roleActualCompany: undefined });
      }

      set({ allCompanies: data });

      const savedCompany = localStorage.getItem('company_id') || ''; //! una empresa te comparte

      //console.log('savedCompany', savedCompany);

      if (savedCompany) {
        const company = share_company_users?.find(
          (company) => company.company_id.id === JSON.parse(savedCompany)
        )?.company_id;

        //console.log('savedCompany', company);

        if (company) {
          //console.log('setSavedCompany', company);
          setActualCompany(company);
          return;
        }
      }

      selectedCompany = get()?.allCompanies.filter((company) => company.by_defect);
      //console.log('selectedCompany', selectedCompany);

      if (data.length > 1) {
        if (selectedCompany) {
          //
          setActualCompany(selectedCompany[0]);
        } else {
          set({ showMultiplesCompaniesAlert: true });
        }
      }

      if (data.length === 1) {
        set({ showMultiplesCompaniesAlert: false });
        setActualCompany(data[0]);
      }

      if (data.length === 0 && share_company_users?.length! > 0) {
        setActualCompany(share_company_users?.[0]?.company_id);
      }

      if (data.length === 0 && share_company_users?.length === 0) {
        const actualPath = window.location.pathname;

        if (actualPath !== '/dashboard/company/new') {
          // router.push('/dashboard/company/new')
          // redirect('/dashboard/company/new')
          return;
        }

        set({ showNoCompanyAlert: true });
      }
    }
  };

  const profileUser = async (id: string) => {
    if (!id) return;
    const { data, error } = await supabase.from('profile').select('*').eq('credential_id', id);

    if (error) {
      console.error('Error al obtener el perfil:', error);
    } else {
      set({ profile: data || [] });
      set({ codeControlRole: data?.[0].role });

      //console.log('profile user si');

      howManyCompanies(data[0]?.id);
    }
  };

  const loggedUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      set({ credentialUser: user });
    }

    if (typeof window !== 'undefined') {
      profileUser(user?.id || '');
    }
  };

  if (typeof window !== 'undefined') {
    // loggedUser();
    //console.log('loggedUser user si');
  }

  let selectedCompany: Company;

  const setActualCompany = (company: Company[0]) => {
    set({ actualCompany: company });

    cookies.set('actualComp', company.id);
    useCountriesStore.getState().documentTypes(company?.id);
    setActivesEmployees();
    fetchVehicles();
    documetsFetch();
    allNotifications();
    FetchSharedUsers();
    handleActualCompanyRole();
  };

  const handleActualCompanyRole = async () => {
    const user = get()?.sharedUsers?.find((e) => e.profile_id.id === get()?.profile[0].id);
    if (user) {
      set({ roleActualCompany: user.role });
    } else {
      set({ roleActualCompany: undefined });
    }
  };

  const setInactiveEmployees = async () => {
    const employeesToShow = await getEmployees(false);
    set({ employeesToShow });
  };

  const noEndorsedEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select(
        `*, city (
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
          )`
      )
      .eq('company_id', get()?.actualCompany?.id)
      .eq('status', 'Incompleto');

    if (error) {
      console.error('Error al obtener los empleados no avalados:', error);
    } else {
      set({ employeesToShow: setEmployeesToShow(data) || [] });
    }
  };

  const allNotifications = async () => {
    let { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', get()?.actualCompany?.id);

    await documetsFetch();

    const document = notifications?.map((doc: any) => {
      const findDocument =
        get()?.allDocumentsToShow?.employees?.find((document) => document.id === doc.document_id) ||
        get()?.allDocumentsToShow?.vehicles?.find((document) => document.id === doc.document_id);
      if (findDocument) {
        return { ...doc, document: findDocument };
      } else {
        return doc;
      }
    });

    if (error) {
      console.error('Error al obtener las notificaciones:', error);
    }

    const tipedData = document?.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ) as Notifications[];

    set({ notifications: tipedData });
  };

  const markAllAsRead = async () => {
    const { error } = await supabase.from('notifications').delete().eq('company_id', get()?.actualCompany?.id);

    if (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    } else {
      allNotifications();
    }
  };

  const endorsedEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select(
        `*, city (
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
          )`
      )
      .eq('company_id', get()?.actualCompany?.id)
      .eq('status', 'Avalado');

    if (error) {
      console.error('Error al obtener los empleados avalados:', error);
    } else {
      set({ employeesToShow: setEmployeesToShow(data) || [] });
    }
  };

  const fetchVehicles = async () => {
    if (!get()?.actualCompany?.id) return;
    const { data, error } = await supabase
      .from('vehicles')
      .select(
        `*,
      types_of_vehicles(name),
      brand_vehicles(name),
      model_vehicles(name)`
      )
      .eq('company_id', get()?.actualCompany?.id);
    //.eq('is_active', true)

    // const validatedData = VehicleSchema.safeParse(data ?? [])
    // if (!validatedData.success) {
    //   return console.error(
    //     'Error al obtener los vehículos:',
    //     validatedData.error,
    //   )
    // }

    if (error) {
      console.error('Error al obtener los vehículos:', error);
    } else {
      set({ vehicles: data || [] });
      setActivesVehicles();
    }
  };

  const setActivesVehicles = () => {
    //const activesVehicles = get()?.vehicles.filter(vehicle => vehicle.is_active)
    const activesVehicles = get()?.vehicles;
    set({ vehiclesToShow: setVehiclesToShow(activesVehicles) });
  };
  const endorsedVehicles = () => {
    const endorsedVehicles = get()?.vehicles.filter((vehicle) => vehicle.status === 'Completo');

    set({ vehiclesToShow: setVehiclesToShow(endorsedVehicles) });
  };
  const noEndorsedVehicles = () => {
    const noEndorsedVehicles = get()?.vehicles.filter((vehicle) => vehicle.status !== 'Completo');
    set({ vehiclesToShow: setVehiclesToShow(noEndorsedVehicles) });
  };
  const documentDrawerEmployees = async (document: string) => {
    const { data } = await supabase

      .from('documents_employees')
      .select('*,applies(*),id_document_types(*)')
      .eq('applies.document_number', document)
      .not('applies', 'is', null);

    set({ DrawerEmployees: data });
  };
  const documentDrawerVehicles = async (id: string) => {
    let { data: equipmentData, error: equipmentError } = await supabase
      .from('documents_equipment')
      .select(
        `*,
    document_types:document_types(*),
    applies(*,type(*),type_of_vehicle(*),model(*),brand(*))
    `
      )
      .eq('applies.id', id)
      .not('applies', 'is', null);

    set({ DrawerVehicles: equipmentData });
  };
  const setVehicleTypes = (type: string) => {
    if (type === 'Todos') {
      set({ vehiclesToShow: setVehiclesToShow(get()?.vehicles) });
      return;
    }
    const vehicles = get()?.vehicles;
    const vehiclesToShow = vehicles?.filter((vehicle) => vehicle?.types_of_vehicles?.name === type);

    set({ vehiclesToShow: setVehiclesToShow(vehiclesToShow) });
  };
  const documetsFetch = async () => {
    // set({ isLoading: true })
    if (!get()?.actualCompany?.id) return;

    let data;

    let { data: dataEmployes, error } = await supabase
      .from('documents_employees')
      .select(
        `
      *,
      employees:employees(*,contractor_employee(
        customers(
          *
        )
      )),
      document_types:document_types(*)
  `
      )
      .not('employees', 'is', null)
      .eq('employees.company_id', get()?.actualCompany?.id);

    data = dataEmployes;

    if (error) {
      console.error('Error al obtener los empleados:', error);
    }

    if (dataEmployes?.length === 1000) {
      const { data: data2, error: error2 } = await supabase
        .from('documents_employees')
        .select(
          `
      *,
      employees:employees(*,contractor_employee(
        customers(
          *
        )
      )),
      document_types:document_types(*)
  `
        )
        .not('employees', 'is', null)
        .eq('employees.company_id', get()?.actualCompany?.id)
        .range(1000, 2000);

      if (error2) {
        console.error('Error al obtener los empleados:', error2);
      }

      if (data2) data = data ? [...data, ...data2] : data2;
    }
    let { data: documents_company, error: documents_company_error } = await supabase
      .from('documents_company')
      .select('*,id_document_types(*),user_id(*)')
      .eq('applies', get()?.actualCompany?.id);

    if (documents_company_error) {
      console.error('Error al obtener los documentos de la empresa:', documents_company_error);
    }

    let { data: equipmentData, error: equipmentError } = await supabase
      .from('documents_equipment')
      .select(
        `*,
        document_types:document_types(*),
        applies(*,type(*),type_of_vehicle(*),model(*),brand(*))
        `
      )
      .eq('applies.company_id', get()?.actualCompany?.id)
      .not('applies', 'is', null);

    if (equipmentError) {
      console.error('Error al obtener los equipos:', equipmentError);
    }

    handleActualCompanyRole();

    const typedData: VehiclesAPI[] | null = equipmentData as VehiclesAPI[];
    const typedDataCompany: CompanyDocumentsType[] | null = documents_company as CompanyDocumentsType[];

    const equipmentData1 =
      get()?.roleActualCompany === 'Invitado' ? typedData?.filter((e) => !e.document_types.private) : typedData;

    const companyData =
      get()?.roleActualCompany === 'Invitado'
        ? typedDataCompany?.filter((e) => !e.id_document_types.private)
        : typedDataCompany;

    const employeesData =
      get()?.roleActualCompany === 'Invitado' ? data?.filter((e) => !e.document_types.private) : data;

    set({ companyDocuments: companyData as CompanyDocumentsType[] });

    if (error) {
      return;
    } else {
      const today = moment().startOf('day');
      const nextMonth = moment().add(1, 'month').endOf('day');

      const filteredData = employeesData?.filter((doc: any) => {
        if (!doc.validity) return false;

        const date = moment(doc.validity, 'DD/MM/YYYY');
        const isExpired = date.isBefore(today) || date.isBefore(nextMonth) || doc.state === 'Vencido';
        return isExpired;
      });

      const filteredVehiclesData = equipmentData1?.filter((doc: any) => {
        if (!doc.validity) return false;
        const date = moment(doc.validity, 'DD/MM/YYYY');
        const isExpired = date.isBefore(today) || date.isBefore(nextMonth) || doc.state === 'Vencido';
        return isExpired;
      });

      const mapDocument = (doc: any) => {
        return {
          date: moment(doc.created_at).format('DD/MM/YYYY'),
          allocated_to: doc.employees?.contractor_employee?.map((doc: any) => doc.contractors?.name).join(', '),
          documentName: doc.document_types?.name,
          state: doc.state,
          multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
          isItMonthly: doc.document_types?.is_it_montlhy,
          validity: doc.validity,
          mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
          id: doc.id,
          resource: `${doc.employees?.lastname?.charAt(0)?.toUpperCase()}${doc?.employees?.lastname.slice(
            1
          )} ${doc.employees?.firstname?.charAt(0)?.toUpperCase()}${doc?.employees?.firstname.slice(1)}`,
          document_number: doc.employees?.document_number,
          employee_id: doc.employees?.id,
          document_url: doc.document_path,
          is_active: doc.employees?.is_active,
          period: doc.period,
          applies: doc.document_types.applies,
          id_document_types: doc.document_types.id,
          intern_number: null,
        };
      };
      const mapVehicle = (doc: any) => {
        return {
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
        };
      };

      const lastMonthValues = {
        employees:
          filteredData
            ?.filter(
              (e) =>
                (!e.employees?.termination_date && !e.document_types.down_document) ||
                (e.employees?.termination_date && e.document_types.down_document)
            )
            ?.filter((doc: any) => {
              if (!doc.validity) return false;
              return doc.state !== 'pendiente' && (doc.validity !== 'No vence' || doc.validity !== null);
            })
            ?.map(mapDocument) || [],
        vehicles:
          filteredVehiclesData
            ?.filter(
              (e) =>
                (!e.applies.termination_date && !e.document_types.down_document) ||
                (e.applies.termination_date && e.document_types.down_document)
            )
            .filter((doc: any) => {
              if (!doc.validity || doc.validity === 'No vence') return false;
              return doc.state !== 'pendiente' && (doc.validity !== 'No vence' || doc.validity !== null);
            })
            ?.map(mapVehicle) || [],
      };

      const pendingDocuments = {
        employees:
          employeesData
            ?.filter(
              (e) =>
                (!e.employees?.termination_date && !e.document_types.down_document) ||
                (e.employees.termination_date && e.document_types.down_document)
            )
            .filter((doc: any) => doc.state === 'presentado')
            ?.map(mapDocument) || [],
        vehicles:
          equipmentData1
            ?.filter(
              (e) =>
                (!e.applies.termination_date && !e.document_types.down_document) ||
                (e.applies.termination_date && e.document_types.down_document)
            )
            .filter((doc: any) => doc.state === 'presentado')
            ?.map(mapVehicle) || [],
      };

      const Allvalues = {
        employees:
          employeesData
            ?.filter(
              (e) =>
                (!e.employees?.termination_date && !e.document_types.down_document) ||
                (e.employees?.termination_date && e.document_types.down_document)
            )
            ?.filter((doc: any) => {
              if (!doc.validity || doc.validity === 'No vence') return false;
              return doc.state !== 'presentado' && (doc.validity !== 'No vence' || doc.validity !== null);
            })
            ?.map(mapDocument) || [],
        vehicles:
          equipmentData1
            ?.filter(
              (e) =>
                (!e.applies.termination_date && !e.document_types.down_document) ||
                (e.applies.termination_date && e.document_types.down_document)
            )
            ?.filter((doc: any) => {
              if (!doc.validity || doc.validity === 'No vence') return false;
              return doc.state !== 'presentado' && (doc.validity !== 'No vence' || doc.validity !== null);
            })
            ?.map(mapVehicle) || [],
      };

      const AllvaluesToShow = {
        employees:
          employeesData
            ?.filter(
              (e) =>
                (!e.employees?.termination_date && !e.document_types.down_document) ||
                (e.employees?.termination_date && e.document_types.down_document)
            )
            .map(mapDocument) || [],
        vehicles:
          equipmentData1
            ?.filter(
              (e) =>
                (!e.applies.termination_date && !e.document_types.down_document) ||
                (e.applies.termination_date && e.document_types.down_document)
            )
            .map(mapVehicle) || [],
      };
      set({ allDocumentsToShow: AllvaluesToShow });
      set({ showLastMonthDocuments: true });
      set({ Alldocuments: Allvalues });
      set({ lastMonthDocuments: lastMonthValues });
      set({ documentsToShow: lastMonthValues });
      set({ pendingDocuments });
    }
  };
  const setShowLastMonthDocuments = () => {
    set({ showLastMonthDocuments: !get()?.showLastMonthDocuments });
    set({
      documentsToShow: !get()?.showLastMonthDocuments ? get()?.Alldocuments : get()?.lastMonthDocuments,
    });
  };
  const FetchSharedUsers = async () => {
    const companyId = get()?.actualCompany?.id;

    const { data, error } = await supabase
      .from('share_company_users')
      .select(
        `*,customer_id(*),profile_id(*),company_id(*,
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
            city (
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
            )
          )
        )
      )`
      )
      .eq('company_id', companyId);

    set({ sharedUsers: data as SharedUser[] });
    handleActualCompanyRole();
  };
  const getEmployees = async (active: boolean) => {
    let { data: employees, error } = await supabase
      .from('employees')
      .select(
        `*, city (
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
          )`
      )
      .eq('company_id', get()?.actualCompany?.id);
    // .eq('is_active', active);
    set({ active_and_inactive_employees: setEmployeesToShow(employees) });

    // Filtrar empleados activos
    const activeEmployees = employees?.filter((e) => {
      if (e.is_active) {
        return true;
      } else {
        // Verificar si todos los documentos de baja están en estado "pendiente"
        return e.documents_employees
          ?.filter((e: any) => e.id_document_types.down_document)
          ?.some((doc: any) => doc.state === 'pendiente');
      }
    });

    // Filtrar empleados inactivos con todos los documentos de baja presentados
    const inactiveEmployees = employees?.filter((e) => {
      return (
        !e.is_active &&
        e.documents_employees
          .filter((e: any) => e.id_document_types.down_document)
          .every((doc: any) => doc.state === 'presentado')
      );
    });

    if (active) {
      const employeesToShow = setEmployeesToShow(activeEmployees);
      return employeesToShow;
    } else {
      const employeesToShow = setEmployeesToShow(inactiveEmployees);
      return employeesToShow;
    }
  };
  const realTimeSharedUsers = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'share_company_users' }, (payload) => {
      howManyCompanies(get()?.profile?.[0]?.id || '');
    })
    .subscribe();

  const realTimeNotification = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
      allNotifications();
    })
    .subscribe();

  const realTimeEmployees = supabase
    .channel('custom-update-channel')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'employees' }, (payload) => {
      setActivesEmployees();
    })
    .subscribe();

  const realTimeCompany = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'company' }, () => {
      howManyCompanies(get()?.profile?.[0]?.id || '');
    })
    .subscribe();

  const setActivesEmployees = async () => {
    const employeesToShow = await getEmployees(true);
    set({ employeesToShow });
    set({ employees: employeesToShow });
  };

  const resetDefectCompanies = async (company: Company[0]) => {
    const { data, error } = await supabase
      .from('company')
      .update({ by_defect: false })
      .eq('owner_id', get()?.profile?.[0]?.id);

    if (error) {
      console.error('Error al actualizar la empresa por defecto:', error);
    }

    setActualCompany(company);
  };
  const setNewDefectCompany = async (company: Company[0]) => {
    if (company.owner_id.id !== get()?.profile?.[0]?.id) {
      localStorage.setItem('company_id', JSON.stringify(company.id));
      return;
    }
    localStorage.removeItem('company_id');
    const { data, error } = await supabase
      .from('company')
      .update({ by_defect: false })
      .eq('owner_id', get()?.profile?.[0]?.id);

    if (error) {
      console.error('Error al actualizar la empresa por defecto:', error);
    } else {
      const { data, error } = await supabase.from('company').update({ by_defect: true }).eq('id', company.id);

      if (error) {
        console.error('Error al actualizar la empresa por defecto:', error);
      } else {
        setActualCompany(company);
      }
    }
  };

  return {
    credentialUser: get()?.credentialUser,
    profile: get()?.profile,
    FetchSharedUsers,
    showNoCompanyAlert: get()?.showNoCompanyAlert,
    showMultiplesCompaniesAlert: get()?.showMultiplesCompaniesAlert,
    allCompanies: get()?.allCompanies,
    actualCompany: get()?.actualCompany,
    setActualCompany: (company: Company[0]) => setActualCompany(company),
    employees: get()?.employees,
    setEmployees: (employees: any) => set({ employees }),
    isLoading: get()?.isLoading,
    employeesToShow: get()?.employeesToShow,
    setInactiveEmployees: () => setInactiveEmployees(),
    setActivesEmployees: () => setActivesEmployees(),
    showDeletedEmployees: get()?.showDeletedEmployees,
    setShowDeletedEmployees: (showDeletedEmployees: boolean) => set({ showDeletedEmployees }),
    vehicles: get()?.vehicles,
    setNewDefectCompany,
    endorsedEmployees,
    noEndorsedEmployees,
    Alldocuments: get()?.Alldocuments,
    documentsToShow: get()?.documentsToShow,
    showLastMonthDocuments: get()?.showLastMonthDocuments,
    setShowLastMonthDocuments,
    lastMonthDocuments: get()?.lastMonthDocuments,
    pendingDocuments: get()?.pendingDocuments,
    notifications: get()?.notifications,
    markAllAsRead,
    allDocumentsToShow: get()?.allDocumentsToShow,
    resetDefectCompanies,
    sharedUsers: get()?.sharedUsers,
    vehiclesToShow: get()?.vehiclesToShow,
    setActivesVehicles,
    endorsedVehicles,
    noEndorsedVehicles,
    setVehicleTypes,
    fetchVehicles,
    sharedCompanies: get()?.sharedCompanies,
    documetsFetch: () => documetsFetch(),
    getEmployees: (active: boolean) => getEmployees(active),
    loggedUser,
    documentDrawerEmployees,
    DrawerEmployees: get()?.DrawerEmployees,
    documentDrawerVehicles,
    DrawerVehicles: get()?.DrawerVehicles,
    companyDocuments: get()?.companyDocuments,
    codeControlRole: get()?.codeControlRole,
    roleActualCompany: get()?.roleActualCompany,
    active_and_inactive_employees: get()?.active_and_inactive_employees,
    toggleSidebar,
    active_sidebar: get()?.active_sidebar,
  };
});
