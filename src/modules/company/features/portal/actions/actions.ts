'use server';
// TODO: Phase 8 — migrate .rpc() and .auth.admin to Prisma server actions and NextAuth
import { adminSupabaseServer, supabaseServer } from '@/shared/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Json } from '../../../../../../database.types';

export interface CompanyUserByCuil {
  company_id: string;
  confirmed_at: string;
  email: string;
  employee_created_at: string;
  employee_cuil: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  last_sign_in_at: string;
  phone: string;
  raw_user_meta_data: Json;
  user_created_at: string;
  user_cuil: string;
  user_id: string;
  user_updated_at: string;
}

export const getPendingRequests = async (): Promise<CompanyUserByCuil[]> => {
  const cookiesStore = await cookies();
  const company_id = cookiesStore.get('actualComp')?.value;
  const supabase = await supabaseServer();

  if (!company_id) return [];

  const { data, error } = await (supabase.rpc as any)('get_company_users_by_cuil', {
    p_company_id: company_id,
  });

  if (error) {
    console.error('Error fetching company users:', error);
    return [];
  }

  return (data ?? []) as CompanyUserByCuil[];
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
