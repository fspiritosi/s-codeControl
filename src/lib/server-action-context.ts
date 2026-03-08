'use server';

import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase/server';

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

/**
 * Returns the common server-action context: supabase client, companyId (may be undefined), and cookies.
 */
export async function getActionContext() {
  const cookiesStore = await cookies();
  const supabase = await supabaseServer();
  const companyId = cookiesStore.get('actualComp')?.value;

  return { supabase, companyId, cookies: cookiesStore };
}

/**
 * Same as getActionContext but throws if companyId is missing.
 * Use this when the action MUST have a company selected.
 */
export async function getRequiredActionContext() {
  const ctx = await getActionContext();
  if (!ctx.companyId) {
    throw new ActionError('No company selected');
  }
  return { ...ctx, companyId: ctx.companyId }; // companyId is now non-nullable
}
