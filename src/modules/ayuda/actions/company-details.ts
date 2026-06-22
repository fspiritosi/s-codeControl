'use server';

import { Logger } from '@/shared/lib/logger';
import { supabaseServer } from '@/shared/lib/supabase/server';

const logger = new Logger('features/Ayuda/company-details');

export async function getCompanyDetails(companyId: string) {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('company')
    .select('id, company_name, website, contact_email, company_logo')
    .eq('id', companyId)
    .single();

  if (error) {
    logger.error('Error fetching company details', { data: { error } });
    return null;
  }

  return data;
}
