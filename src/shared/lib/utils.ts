'use strict';
import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';
// TODO: Phase 8 — migrate FetchSharedUsers .from() query to Prisma server action
import { supabaseServer } from './supabase/server';
import { storage } from './storage';
import { formatDocumentTypeName } from './utils/utils';
import { updateDocumentByAppliesAndType, updateDocumentsByAppliesArrayAndType } from '@/modules/documents/features/manage/actions.server';
import { insertMultipleDocuments, insertSingleDocumentEmployee, fetchRepairSolicitudesByArrayAndType } from '@/modules/documents/features/upload/actions.server';
import { fetchDocumentsByDocumentTypeId } from '@/modules/documents/features/list/actions.server';
// eslint-disable-next-line react-hooks/rules-of-hooks
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function serializeBigInt(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));
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
  const supabase = await supabaseServer();

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
    return [];
  } else {
    return data;
  }
};

export async function getActualRole(companyId: string, profile: string) {
  const sharedUsers = (await FetchSharedUsers(companyId)) as any;
  const user = sharedUsers?.find((e: any) => e.profile_id.id === profile);

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
  const formatedCompanyName = formatDocumentTypeName(company_name);
  const formatedAppliesName = formatDocumentTypeName(applies);
  const formatedDocumentTypeName = formatDocumentTypeName(document_name);
  const formatedVersion = version.replace(/\./g, '-');
  const formatedFileExtension = file_extension.replace(/\./g, '-');

  return `${formatedCompanyName}-(${company_cuit})/${resource}/${formatedAppliesName}/${formatedDocumentTypeName}-(${formatedVersion}).${formatedFileExtension}`;
}
export async function verifyDuplicatedDocument(
  company_name: string,
  company_cuit: any,
  formatedAppliesPath: string,
  resource: string,
  formatedAppliesNames: string
) {
  const formatedCompanyName = formatDocumentTypeName(company_name);
  const formatedAppliesName = formatDocumentTypeName(formatedAppliesNames);
  const path = `${formatedCompanyName}-(${company_cuit})/${resource}/${formatedAppliesPath}`;


  let data;
  try {
    data = await storage.list('document_files', path);
  } catch (error) {
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
export const uploadDocumentFile = async (file: File, path: string) => {
  try {
    const data = await storage.upload('document_files', path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
    return data;
  } catch (error) {
    console.error('error', error);
    return [];
  }
};
export const uploadDocument = async (
  dataToUpdate: {
    created_at: string;
    applies: any;
    document_path: string;
    id_document_types: string;
    state: 'presentado' | 'rechazado' | 'aprobado' | 'vencido' | 'pendiente';
    user_id: string;
    period?: string | undefined;
    validity?: string | undefined;
  },
  mandatory: boolean,
  tableName: 'documents_equipment' | 'documents_employees',
  multipleResources: boolean
) => {
  if (mandatory) {
    if (multipleResources) {
      const { applies, ...rest } = dataToUpdate;
      const { error } = await updateDocumentsByAppliesArrayAndType(
        tableName,
        applies,
        dataToUpdate.id_document_types,
        rest
      );
      if (error) {
        return [];
      }
    } else {
      const { applies, ...rest } = dataToUpdate;
      const { error } = await updateDocumentByAppliesAndType(
        tableName,
        applies,
        dataToUpdate.id_document_types,
        rest
      );
      if (error) {
        return [];
      }
    }
  } else {
    if (multipleResources) {
      const { applies, ...rest } = dataToUpdate;
      const dataToInsert = applies.map((apply: any) => ({
        ...rest,
        applies: apply,
      }));
      const { error } = await insertMultipleDocuments(tableName, dataToInsert);
      if (error) {
        return [];
      }
    } else {
      const { error } = await insertSingleDocumentEmployee({
        ...dataToUpdate,
        state: 'presentado',
      });
      if (error) {
        return [];
      }
    }
  }
};

export const getAllDocumentsByIdDocumentTypeCientSide = async (selectedValue: string, company_id: string) => {
  if (!company_id) return [];
  const data = await fetchDocumentsByDocumentTypeId(selectedValue);
  return data ?? [];
};

export const getOpenRepairsSolicitudesByArrayClientSide = async (
  vehiclesIds: string[],
  repairTypeId: string,
  company_id: string
) => {
  if (!company_id) return [];
  const data = await fetchRepairSolicitudesByArrayAndType(
    vehiclesIds,
    repairTypeId,
    ['Pendiente', 'Esperando repuestos', 'En reparación']
  );
  return (data ?? []) as unknown as RepairRequestWithVehicle[];
};

export const formatEmployeeDocuments = (doc: any) => {
  // Support both Prisma relation names and legacy Supabase names
  const emp = doc.employee ?? doc.applies;
  const docType = doc.document_type ?? doc.id_document_types;
  return {
    date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
    allocated_to: emp?.contractor_employee?.map((ce: any) => ce.contractor?.name ?? ce.contractors?.name).join(', '),
    documentName: docType?.name,
    state: doc.state,
    multiresource: docType?.multiresource ? 'Si' : 'No',
    isItMonthly: docType?.is_it_montlhy,
    validity: doc.validity,
    mandatory: docType?.mandatory ? 'Si' : 'No',
    id: doc.id,
    resource: `${emp?.lastname?.charAt(0)?.toUpperCase()}${emp?.lastname?.slice(1) ?? ''} ${emp?.firstname?.charAt(0)?.toUpperCase()}${emp?.firstname?.slice(1) ?? ''}`,
    document_number: emp?.document_number,
    employee_id: emp?.id,
    document_url: doc.document_path,
    is_active: emp?.is_active,
    period: doc.period,
    applies: docType?.applies,
    id_document_types: docType?.id,
    intern_number: null,
    termination_date: emp?.termination_date,
  };
};

export const formatVehiculesDocuments = (doc: any) => {
  // Support both Prisma relation names and legacy Supabase names
  const veh = doc.vehicle ?? doc.applies;
  const docType = doc.document_type ?? doc.id_document_types;
  return {
    date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
    allocated_to: veh?.type_of_vehicle_rel?.name ?? veh?.type_of_vehicle?.name,
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
