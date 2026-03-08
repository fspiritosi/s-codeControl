'use server';
import { adminSupabaseServer, supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const getPendingRequests = async () => {
  const cookiesStore = await cookies();
  const company_id = cookiesStore.get('actualComp')?.value;
  const supabase = await supabaseServer();

  if (!company_id) return [];

  const { data, error } = await supabase.rpc('get_company_users_by_cuil', { p_company_id: company_id });

  if (error) {
    console.error('Error fetching company users:', error);
    return [];
  }

  return data;
};

export const approveUserRequest = async (userId: string) => {
  const supabase = await adminSupabaseServer();

  const { error, data } = await supabase.auth.admin.updateUserById(userId, { user_metadata: { verified: true } });

  if (error) {
    throw error;
  }

  return data;
};

export const removeUserAccess = async (userId: string) => {
  const supabase = await adminSupabaseServer();

  const { error, data } = await supabase.auth.admin.updateUserById(userId, { user_metadata: { verified: false } });
  if (error) {
    console.error(error);
    throw error;
  }

  return data;
};
