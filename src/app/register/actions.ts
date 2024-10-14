'use server';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signup(formData: FormData, url: string) {
  const supabase = supabaseServer();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  const { error, data: user } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${url}`,
    },
  });

  if (error) {
    return error.message;
  }

  const firstname = formData.get('firstname') as string;
  const lastname = formData.get('lastname') as string;
  const { error: error2 } = await supabase
    .from('profile')
    .insert({
      id: user.user?.id,
      credential_id: user.user?.id || '',
      email: formData.get('email') as string,
      role: 'CodeControlClient',
      fullname: `${firstname} ${lastname}`,
    } as any)
    .select();

  if (error2) {
    return handleSupabaseError(error2.message);
  }

  revalidatePath('/', 'layout');
  redirect('/login');
}
