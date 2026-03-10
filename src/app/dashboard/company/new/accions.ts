'use server';
import { prisma } from '@/lib/prisma';
// TODO: Phase 8 — migrate auth to NextAuth
import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function AddCompany(formData: FormData, url: string) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await prisma.profile.findMany({
    where: { email: user?.email || '' },
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
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await prisma.profile.findMany({
    where: { email: user?.email || '' },
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
