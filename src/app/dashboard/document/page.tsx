import { supabaseServer } from '@/lib/supabase/server';
import { CompanyDocumentsType } from '@/store/loggedUser';
import { VehiclesAPI } from '@/types/types';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import TabsDocuments from './documentComponents/TabsDocuments';

export default async function page() {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No vence';
    const [day, month, year] = dateString.split('/');
    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate || 'No vence';
  };
  const mapDocument = (doc: any) => {
    const formattedDate = formatDate(doc.validity);
    return {
      date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
      allocated_to: doc.employees?.contractor_employee?.map((doc: any) => doc.contractors?.name).join(', '),
      documentName: doc.document_types?.name,
      state: doc.state,
      multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
      isItMonthly: doc.document_types?.is_it_montlhy,
      validity: formattedDate,
      mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
      id: doc.id,
      resource: `${doc.employees?.lastname?.charAt(0)?.toUpperCase()}${doc?.employees.lastname.slice(
        1
      )} ${doc.employees?.firstname?.charAt(0)?.toUpperCase()}${doc?.employees.firstname.slice(1)}`,
      document_number: doc.employees.document_number,
      document_url: doc.document_path,
      is_active: doc.employees.is_active,
      period: doc.period,
      applies: doc.document_types.applies,
      id_document_types: doc.document_types.id,
      intern_number: null,
    };
  };
  const mapVehicle = (doc: any) => {
    const formattedDate = formatDate(doc.validity);
    return {
      date: doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : 'No vence',
      allocated_to: doc.applies?.type_of_vehicle?.name,
      documentName: doc.document_types?.name,
      state: doc.state,
      multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
      isItMonthly: doc.document_types?.is_it_montlhy,
      validity: formattedDate,
      mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
      id: doc.id,
      resource: `${doc.applies?.domain}`,
      vehicle_id: doc.applies?.id,
      is_active: doc.applies?.is_active,
      period: doc.period,
      applies: doc.document_types.applies,
      id_document_types: doc.document_types.id,
      intern_number: `${doc.applies?.intern_number}`,
    };
  };

  const supabase = supabaseServer();
  const user = await supabase.auth.getUser();
  const cookiesStore = cookies();
  const { data: userShared } = await supabase
    .from('share_company_users')
    .select('*')
    .eq('profile_id', user?.data?.user?.id);
  const role: string | null = userShared?.[0]?.role || null;
  const actualCompany = cookiesStore.get('actualComp')?.value;

  let { data: documents_company, error: documents_company_error } = await supabase
    .from('documents_company')
    .select('*,id_document_types(*),user_id(*)')
    .eq('applies', actualCompany);

  let { data: document_employees, error } = await supabase
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
    .eq('employees.company_id', actualCompany);

  let { data: equipmentData, error: equipmentError } = await supabase
    .from('documents_equipment')
    .select(
      `*,
    document_types:document_types(*),
    applies(*,type(*),type_of_vehicle(*),model(*),brand(*))
    `
    )
    .eq('applies.company_id', actualCompany)
    .not('applies', 'is', null);

  const typedData: VehiclesAPI[] | null = equipmentData as VehiclesAPI[];

  const equipmentData1 = role === 'Invitado' ? typedData?.filter((e) => !e.document_types.private) : typedData; //! falta agrelar las columnas

  const typedDataCompany: CompanyDocumentsType[] | null = documents_company as CompanyDocumentsType[];

  const companyData =
    role === 'Invitado' ? typedDataCompany?.filter((e) => !e.id_document_types.private) : typedDataCompany;
  const employeesData =
    role === 'Invitado' ? document_employees?.filter((e) => !e.document_types.private) : document_employees; //! falta agrelar las columnas

  const AllvaluesToShow = {
    employees: employeesData?.map(mapDocument) || [],
    vehicles: equipmentData1?.map(mapVehicle) || [],
  };

  let clientData: any[] | null = [];

  if (role === 'Invitado') {
    const { data, error: shared_error } = await supabase
      .from('share_company_users')
      .select('*')
      .eq('company_id', actualCompany)
      .eq('profile_id', user?.data?.user?.id);

    if (!error) {
      clientData = data;
    }
  }

  return (
    <>
      <TabsDocuments
        clientData={clientData || []}
        AllvaluesToShow={AllvaluesToShow}
        companyData={companyData}
        serverRole={role}
      />
    </>
  );
}
