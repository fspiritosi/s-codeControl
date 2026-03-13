'use server';

import { supabaseServer } from '@/shared/lib/supabase/server';
import { cookies } from 'next/headers';

export interface CompanyBrandingResult {
  name: string;
  logo: string | null;
}

/**
 * Obtiene el branding de la empresa actual para la exportacion a Excel.
 * Lee la cookie `actualComp` para determinar la empresa.
 * Retorna nombre y logo de la empresa.
 */
export async function getCompanyBrandingForExport(): Promise<CompanyBrandingResult | null> {
  try {
    const cookieStore = await cookies();
    const companyId = cookieStore.get('actualComp')?.value;
    if (!companyId) return null;

    const supabase = await supabaseServer();
    const { data: company, error } = await supabase
      .from('company')
      .select('company_name, company_logo')
      .eq('id', companyId)
      .single();

    if (error || !company) return null;

    return {
      name: company.company_name,
      logo: company.company_logo ?? null,
    };
  } catch (error) {
    console.error('Error al obtener branding de empresa para export:', error);
    return null;
  }
}
