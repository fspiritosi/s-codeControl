'use server';

import { prisma } from '@/shared/lib/prisma';
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

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { company_name: true, company_logo: true },
    });
    if (!company) return null;

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

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        company_name: true,
        company_logo: true,
        company_cuit: true,
        address: true,
        contact_phone: true,
        contact_email: true,
      },
    });
    if (!company) return null;

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
