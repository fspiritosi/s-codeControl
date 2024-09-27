'use server';
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
const supabase = supabaseServer();
const cookiesStore = cookies();
const company_id = cookiesStore.get('actualComp');

export const getAllEmployees = async (columns: string = '*') => {
  const { data, error } = await supabase.from('employees').select().eq('company_id', company_id?.value);

  if (error) {
    console.error('error', error);
    return [];
  }
  return data;
};
