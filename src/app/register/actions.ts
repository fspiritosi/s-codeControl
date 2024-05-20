'use server'
import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const supabase = supabaseServer()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: user } = await supabase.auth.signUp(data)

  const firstname = formData.get('firstname') as string
  const lastname = formData.get('lastname') as string
  await supabase
    .from('profile')
    .insert({
      id: user.user?.id,
      credential_id: user.user?.id || '',
      email: formData.get('email') as string,
      role: 'CodeControlClient',
      fullname: `${firstname} ${lastname}`,
    })
    .select()

  if (error) {
    return error
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
