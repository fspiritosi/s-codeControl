import { cookies } from 'next/headers';
import {
  fetchAllDocumentsEmployeesByCompany,
  fetchAllDocumentsEquipmentByCompany,
} from '@/app/server/GET/actions';
import {
  fetchAllEmployeesWithRelations,
} from '@/app/server/GET/actions';

export async function getCompany() {
  // This function is largely unused now since company context comes from cookies.
  // Keeping for backward compatibility.
  const cookieStore = await cookies();
  return cookieStore.get('actualCompanyId')?.value;
}

export async function getDocumentsEmployees() {
  const cookieStore = await cookies();
  const actualCompany = cookieStore.get('actualCompanyId')?.value;
  if (!actualCompany) return [];
  const data = await fetchAllDocumentsEmployeesByCompany(actualCompany);
  return data;
}

export async function getDocumentsEquipment() {
  const cookieStore = await cookies();
  const actualCompany = cookieStore.get('actualCompanyId')?.value;
  if (!actualCompany) return [];
  const data = await fetchAllDocumentsEquipmentByCompany(actualCompany);
  return data;
}

export async function getEmployees() {
  const data = await fetchAllEmployeesWithRelations();
  return data;
}
