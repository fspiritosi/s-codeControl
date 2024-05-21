'use server'
import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function AddCompany(formData: FormData, url: string) {
  const supabase = supabaseServer()
  console.log(url, 'url')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let { data: profile, error } = await supabase
    .from('profile')
    .select('*')
    .eq('email', user?.email)

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
  }

  const { data, error: companyError } = await supabase
    .from('company')
    .insert([formattedData])
    .select()
  console.log(companyError, 'companyError')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard')
  return { error: companyError, data }
  //redirijir al dashboard
}
