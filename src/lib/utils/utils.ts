import { format } from 'date-fns';
import { supabaseServer } from '../supabase/server';

export const formatDate = (dateString: string) => {
  if (!dateString) return 'No vence';
  const [day, month, year] = dateString.split('/');
  const formattedDate = `${day}/${month}/${year}`;
  return formattedDate || 'No vence';
};
export const mapDocument = (doc: any) => {
  const formattedDate = formatDate(doc.validity);
  return {
    date: new Date(doc.created_at).toLocaleDateString(),
    allocated_to: doc.employees?.contractor_employee?.map((doc: any) => doc.contractors?.name).join(', '),
    documentName: doc.document_types?.name,
    state: doc.state,
    multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
    isItMonthly: doc.document_types?.is_it_montlhy,
    validity: formattedDate,
    mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
    id: doc.id,
    resource: `${doc.employees?.lastname?.charAt(0)?.toUpperCase()}${doc?.employees?.lastname.slice(
      1
    )} ${doc.employees?.firstname?.charAt(0)?.toUpperCase()}${doc?.employees?.firstname.slice(1)}`,
    document_number: doc.employees?.document_number,
    document_url: doc?.document_path,
    is_active: doc?.employees?.is_active,
    period: doc?.period,
    applies: doc?.document_types?.applies,
    id_document_types: doc?.document_types?.id,
    intern_number: '',
  };
};
export const mapVehicle = (doc: any) => {
  const formattedDate = formatDate(doc.validity);
  return {
    date: doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : 'No vence',
    allocated_to: doc.applies?.allocated_to,
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
export const setEmployeesToShow = (employees: any) => {
  const employee = employees?.map((employees: any) => {
    return {
      full_name: `${employees?.lastname?.charAt(0).toUpperCase()}${employees?.lastname?.slice(1)} ${employees?.firstname
        ?.charAt(0)
        .toUpperCase()}${employees?.firstname?.slice(1)}`,
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
      contractor_employee: employees?.contractor_employee?.map(({ contractors }: any) => contractors?.id),
      is_active: employees?.is_active,
      reason_for_termination: employees?.reason_for_termination,
      termination_date: employees?.termination_date,
      status: employees?.status,
      documents_employees: employees.documents_employees,
    };
  });

  return employee;
};
export const getUser = async () => {
  const supabase = supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    return user;
  }
  return error;
};
export const formatDocumentTypeName = (documentType: string) => {
  const formatedDocumentTypeName = documentType
    .toLowerCase()
    .replace(/[áäàâ]/g, 'a')
    .replace(/[éëèê]/g, 'e')
    .replace(/[íïìî]/g, 'i')
    .replace(/[óöòô]/g, 'o')
    .replace(/[úüùû]/g, 'u')
    .replace(/['"]/g, '') // Elimina apóstrofes y comillas
    .replace(/\s+/g, '-'); // Reemplaza espacios por guiones
  return formatedDocumentTypeName;
};
