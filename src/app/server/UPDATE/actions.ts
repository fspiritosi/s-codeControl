'use server';
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Users-related actions

export const CreateNewFormAnswer = async (formId: string, formAnswer: any) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];
  const { data, error } = await supabase.from('form_answers').insert({
    form_id: formId,
    answer: formAnswer,
  });
  if (error) {
    console.log(error, 'error');
  }

  return data;
};

export const UpdateVehicle = async (vehicleId: string, vehicleData: any) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];
  const { data, error } = await supabase.from('vehicles').update(vehicleData).eq('id', vehicleId);
  if (error) {
    console.log('error', error);
    // throw error;
  }
  console.log('data', data);
};
export const updateModulesSharedUser = async ({ id, modules }: { id: string; modules: ModulosEnum[] }) => {
  const supabase = supabaseServer();
  const { data, error } = await supabase.from('share_company_users').update({ modules: modules }).eq('id', id).select();

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data;
};