'use server';
import { auth } from '@/auth';
import { prisma } from '@/shared/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function AddCompany(formData: FormData, url: string) {
  const session = await auth();
  if (!session?.user) return { error: { message: 'No autenticado' }, data: null };

  const profile = await prisma.profile.findMany({
    where: { email: session.user.email || '' },
  });

  const formattedData = {
    city: parseInt(formData.get('city') as string),
    province_id: parseInt(formData.get('province_id') as string),
    owner_id: profile?.[0]?.id,
    company_name: formData.get('company_name') as string,
    company_cuit: formData.get('company_cuit') as string,
    website: formData.get('website') as string,
    contact_email: formData.get('contact_email') as string,
    contact_phone: formData.get('contact_phone') as string,
    address: formData.get('address') as string,
    country: formData.get('country') as string,
    industry: formData.get('industry') as string,
    description: formData.get('description') as string,
    by_defect: true,
    company_logo: url ?? '',
  };

  try {
    const data = await prisma.company.create({ data: formattedData as any });
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard');
    return { error: null, data: [data] };
  } catch (companyError: any) {
    return { error: { message: companyError.message }, data: null };
  }
}

export async function EditCompany(formData: FormData, url: string, companyId?: string) {
  const session = await auth();
  if (!session?.user) return { error: { message: 'No autenticado' }, data: null };

  const profile = await prisma.profile.findMany({
    where: { email: session.user.email || '' },
  });

  const formattedData = {
    city: parseInt(formData.get('city') as string),
    province_id: parseInt(formData.get('province_id') as string),
    owner_id: profile?.[0]?.id,
    company_name: formData.get('company_name') as string,
    company_cuit: formData.get('company_cuit') as string,
    website: formData.get('website') as string,
    contact_email: formData.get('contact_email') as string,
    contact_phone: formData.get('contact_phone') as string,
    address: formData.get('address') as string,
    country: formData.get('country') as string,
    industry: formData.get('industry') as string,
    description: formData.get('description') as string,
    by_defect: formData.get('by_defect') === 'true',
    company_logo: url ?? '',
  };

  // Buscar por id si vino (modo edición desde la page); sino fallback a cuit
  // por compatibilidad con consumidores antiguos.
  const companyRecord = companyId
    ? await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } })
    : await prisma.company.findFirst({
        where: { company_cuit: formattedData.company_cuit },
        select: { id: true },
      });

  if (!companyRecord?.id) {
    return {
      error: {
        message: companyId
          ? 'No se encontró la compañía a editar'
          : `No se encontró la compañía con CUIT ${formattedData.company_cuit}`,
      },
      data: null,
    };
  }

  try {
    const data = await prisma.company.update({
      where: { id: companyRecord.id },
      data: formattedData as any,
    });

    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/company', 'layout');

    return { error: null, data: [data] };
  } catch (companyError: any) {
    console.error('[EditCompany] prisma error:', companyError);
    return { error: { message: companyError?.message ?? String(companyError) }, data: null };
  }
}

export const insertCompany = async (company: Record<string, unknown>) => {
  try {
    const data = await prisma.company.create({ data: company as any });
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error inserting company:', error);
    return { data: null, error: String(error) };
  }
};
