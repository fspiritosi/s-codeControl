'use server';
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
const supabase = supabaseServer();
const cookiesStore = cookies();
const company_id = cookiesStore.get('actualComp')?.value;

export const getActualCompany = async () => {
  if (!company_id) return [];

  let { data, error } = await supabase.from('company').select('*').eq('id', company_id);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data || [];
};

export const getAllDocumentTypes = async (columns: string = '*') => {
  if (!company_id) return [];

  let { data, error } = await supabase
    .from('document_types')
    .select('*')
    .eq('is_active', true)
    .or(`company_id.eq.${company_id},company_id.is.null`);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data || [];
};

export const getAllEmployees = async (columns: string = '*') => {
  if (!company_id) return [];
  const { data, error } = await supabase.from('employees').select('*').eq('company_id', company_id);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getAllDocumentsByIdDocumentType = async (selectedValue: string) => {
  if (!company_id) return [];
  const { data, error } = await supabase
    .from('documents_employees')
    .select('*')
    .eq('id_document_types', selectedValue)
    .neq('document_path', null);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getAllEquipment = async (columns: string = '*') => {
  if (!company_id) return [];
  const { data, error } = await supabase.from('vehicles').select('*,brand(*)').eq('company_id', company_id);

  console.log('data', data?.[0], 'data');

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};

export const getCurrentUser = async (columns: string = '*') => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};
