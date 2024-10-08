import { supabaseServer } from '@/lib/supabase/server';
import { PostgrestError } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
type response = {
  document: any[] | null | PostgrestError;
  resourceType: string | null;
  resource: string | null;
};
export async function GET(request: NextRequest, context: any) {
  const { params } = context;
  const searchParams = request.nextUrl.searchParams;
  const user_id = searchParams.get('user');
  const resource = searchParams.get('resource');

  const documentId = params.id;

  let response: response = {
    document: null,
    resourceType: null,
    resource: null,
  };

  try {
    if (resource === 'Persona') {
      const employeeDocument = await getEmployeeDocument(documentId);
      response = {
        document: employeeDocument as any,
        resourceType: 'documentos-empleados',
        resource: 'employee',
      };
    }

    if (resource === 'Equipos') {
      const equipmentDocument = await getEquipmentDocument(documentId);
      response = {
        document: equipmentDocument as any,
        resourceType: 'documentos-equipos',
        resource: 'vehicle',
      };
    }

    if (resource === 'Empresa') {
      const companyDocument = await getCompanyDocument(documentId);
      response = {
        document: companyDocument as any,
        resourceType: 'documentos-company',
        resource: 'company',
      };
    }

    return Response.json({ response });
  } catch (error) {
    console.log(error);
  }
}

const getEmployeeDocument = async (documentId: string) => {
  const supabase = supabaseServer();
  let { data: documents_employee, error } = await supabase
    .from('documents_employees')
    .select(
      `
    *,
    document_types(*),
    applies(*,
      city(name),
      province(name),
      contractor_employee(
        customers(
          *
          )
          ),
          company_id(*,province_id(name))
          )
          `
    )
    .eq('id', documentId);

  if (error) {
    return error;
  }

  return documents_employee?.[0];
};

const getEquipmentDocument = async (documentId: string) => {
  const supabase = supabaseServer();

  let { data: documents_vehicle, error } = await supabase
    .from('documents_equipment')
    .select(
      `
    *,
    document_types(*),
    applies(*,brand(name),model(name),type_of_vehicle(name), company_id(*,province_id(name)))`
    )
    .eq('id', documentId);

  if (error) {
    return error;
  }

  return documents_vehicle?.[0];
};

const getCompanyDocument = async (documentId: string) => {
  const supabase = supabaseServer();
  let { data: documents_company, error } = await supabase
    .from('documents_company')
    .select(`*,document_types:id_document_types(*)`)
    .eq('id', documentId);

  if (error) {
    return error;
  }

  return documents_company?.[0];
};
