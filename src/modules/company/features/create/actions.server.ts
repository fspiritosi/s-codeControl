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

export async function EditCompany(formData: FormData, url: string) {
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

  const companyRecord = await prisma.company.findFirst({
    where: { company_cuit: formattedData.company_cuit },
    select: { id: true },
  });

  try {
    const data = await prisma.company.update({
      where: { id: companyRecord?.id || '' },
      data: formattedData as any,
    });

    revalidatePath('/dashboard', 'layout');

    return { error: null, data: [data] };
  } catch (companyError: any) {
    return { error: { message: companyError.message }, data: null };
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
