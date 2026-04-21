'use server';

import { supabaseServer } from '@/shared/lib/supabase/server';
import { cookies } from 'next/headers';

export interface CompanyBrandingResult {
  name: string;
  logo: string | null;
}

export interface CompanyPDFData {
  name: string;
  logo: string | null;
  cuit: string;
  address: string;
  phone: string;
  email: string;
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

/**
 * Obtiene datos completos de la empresa actual para el header de PDFs.
 * Lee la cookie `actualComp` para determinar la empresa.
 * Retorna nombre, logo, CUIT, direccion, telefono y email.
 */
export async function getCompanyDataForPDF(): Promise<CompanyPDFData | null> {
  try {
    const cookieStore = await cookies();
    const companyId = cookieStore.get('actualComp')?.value;
    if (!companyId) return null;

    const supabase = await supabaseServer();
    const { data: company, error } = await supabase
      .from('company')
      .select(
        'company_name, company_logo, company_cuit, address, contact_phone, contact_email'
      )
      .eq('id', companyId)
      .single();

    if (error || !company) return null;

    return {
      name: company.company_name,
      logo: company.company_logo ?? null,
      cuit: company.company_cuit ?? '',
      address: company.address ?? '',
      phone: company.contact_phone ?? '',
      email: company.contact_email ?? '',
    };
  } catch (error) {
    console.error('Error al obtener datos de empresa para PDF:', error);
    return null;
  }
}
