'use server';
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Users-related actions

export const updateModulesSharedUser = async ({ id, modules }: { id: string; modules: ModulosEnum[] }) => {
  const cookiesStore = cookies();
  const supabase = supabaseServer();
  const company_id = cookiesStore.get('actualComp')?.value;
  if (!company_id) return [];

  const { data, error } = await supabase.from('share_company_users').update({ modules: modules }).eq('id', id).select();

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data;
};
