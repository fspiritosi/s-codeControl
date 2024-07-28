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
  console.log(user_id); //AQUI ME QUEDE (Me falta pasar por query params del tipo de documento)
  const documentId = params.id;
  console.log(documentId);

  let response: response = {
    document: null,
    resourceType: null,
    resource: null,
  };

  
  try {
    const employeeDocument = await getEmployeeDocument(documentId);
    if (Array.isArray(employeeDocument) && employeeDocument.length > 0) {
      response = {
        document: employeeDocument[0],
        resourceType: 'documentos-empleados',
        resource: 'employee',
      };
    }
    if (employeeDocument instanceof Error) {
      response = {
        document: employeeDocument,
        resourceType: 'error',
        resource: 'error',
      };
    }
    const equipmentDocument = await getEquipmentDocument(documentId);
    if (Array.isArray(equipmentDocument) && equipmentDocument.length > 0) {
      response = {
        document: equipmentDocument[0],
        resourceType: 'documentos-equipos',
        resource: 'vehicle',
      };
    }
    if (equipmentDocument instanceof Error) {
      response = {
        document: equipmentDocument,
        resourceType: 'error',
        resource: 'error',
      };
    }
    const companyDocument = await getCompanyDocument(documentId);
    if (Array.isArray(companyDocument) && companyDocument.length > 0) {
      response = {
        document: companyDocument[0],
        resourceType: 'documentos-company',
        resource: 'company',
      };
    }
    if (companyDocument instanceof Error) {
      response = {
        document: companyDocument,
        resourceType: 'error',
        resource: 'error',
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

  return documents_employee;
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

  return documents_vehicle;
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

  return documents_company;
};
