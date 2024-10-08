'use strict';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabaseBrowser } from './supabase/browser';
import { supabaseServer } from './supabase/server';
import { formatDocumentTypeName } from './utils/utils';
// eslint-disable-next-line react-hooks/rules-of-hooks
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatCompanyName(companyName: string): string {
  // Transforma el nombre de la empresa eliminando los guiones bajos y convirtiendo a mayúsculas
  return companyName.replace(/_/g, ' ')?.toUpperCase();
}
export function validarCUIL(cuil: string) {
  // Elimina guiones y espacios
  cuil = cuil.replace(/[-\s]/g, '');

  // Verifica la longitud
  if (cuil.length !== 11) {
    return false;
  }

  // Calcula el dígito verificador
  const coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += parseInt(cuil[i]) * coeficientes[i];
  }
  let digitoVerificador = 11 - (suma % 11);
  if (digitoVerificador === 11) {
    digitoVerificador = 0;
  }

  // Compara con el último dígito
  return parseInt(cuil[10]) === digitoVerificador;
}

export const FetchSharedUsers = async (companyId: string) => {
  const supabase = supabaseServer();

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

  if (error) {
    // return error;
    console.log(error);
    return [];
  } else {
    return data;
  }
};

export async function getActualRole(companyId: string, profile: string) {
  const sharedUsers = (await FetchSharedUsers(companyId)) as any;
  const user = sharedUsers?.find((e:any) => e.profile_id.id === profile);

  if (user?.role) {
    return user?.role;
  } else {
    return 'Owner';
  }
}

export function calculateNameOFDocument(
  company_name: string,
  company_cuit: string,
  applies: string,
  document_name: string,
  version: string,
  file_extension: string,
  resource: string
) {
  const formatedCompanyName = company_name.toLowerCase().replace(/ /g, '-');
  const formatedAppliesName = applies.toLowerCase().replace(/ /g, '-');
  const formatedDocumentTypeName = formatDocumentTypeName(document_name).replace(/ /g, '-');
  const formatedVersion = version.replace(/\./g, '-');
  const formatedFileExtension = file_extension.replace(/\./g, '-');

  console.log('alokofe');
  return `${formatedCompanyName}(${company_cuit})/${resource}/${formatedAppliesName}/${formatedDocumentTypeName}-(${formatedVersion}).${formatedFileExtension}`;
}
export async function verifyDuplicatedDocument(
  company_name: string,
  company_cuit: any,
  formatedAppliesPath: string,
  resource: string
) {
  const formatedCompanyName = company_name.toLowerCase().replace(/ /g, '-');

  const supabase = supabaseBrowser();
  const path = `${formatedCompanyName}(${company_cuit})/${resource}/${formatedAppliesPath}`;

  console.log(path, 'Ruta completa');

  const { data, error } = await supabase.storage.from('document_files').list(path);
  //     transporte-sp-srl-(30714153974)/persona/franco-ivan-andres-paratore

  console.log(data, 'Archivos listados');

  if (error) {
    console.error('error', error);
    return true;
  }

  // Filtrar los resultados en el lado del cliente
  const fileExists = data?.some((file) => file.name.includes(formatedAppliesName));

  if (fileExists) {
    console.error('El documento ya existe');
    return true;
  }

  return false;
}
export const uploadDocumentFile = async (
  file: File,
  path: string,
) => {
  const supabase = supabaseBrowser();
  console.log('file', file);
  const { data, error } = await supabase.storage.from('document_files').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};
export const uploadDocument = async (
  dataToUpdate: {
    created_at: string;
    applies: string;
    document_path: string;
    id_document_types: string;
    state: 'presentado' | 'rechazado' | 'aprobado' | 'vencido' | 'pendiente';
    user_id: string;
    period?: string | undefined;
    validity?: string | undefined;
  },
  mandatory: boolean,
  tableName: 'documents_equipment' | 'documents_employees'
) => {
  const supabase = supabaseBrowser();
  if (mandatory) {
    const { data, error } = await supabase
      .from(tableName)
      .update(dataToUpdate)
      .eq('applies', dataToUpdate.applies)
      .eq('id_document_types', dataToUpdate.id_document_types);

    if (error) {
      console.error('error', error);
      return [];
    }
    // await uploadDocumentFile(file, dataToUpdate.document_path);
  } else {
    // Crear el documento
    const { data, error } = await supabase
      .from(tableName)
      .insert({
        ...dataToUpdate,
        state: 'presentado',
      })
      .select('*');
    if (error) {
      console.error('error', error);
      return [];
    }
    // await uploadDocumentFile(file, dataToUpdate.document_path);
  }
};
