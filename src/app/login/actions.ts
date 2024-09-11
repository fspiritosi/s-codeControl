'use server';

import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const supabase = supabaseServer();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error, data: user } = await supabase.auth.signInWithPassword(data);
  // const { error, data: user } = await supabase.auth.signInWithOtp({
  //   email: data.email,
  //   options: {
  //     emailRedirectTo: 'http://localhost:3000/login/auth/callback',
  //   },
  // })

  if (error) {
    return handleSupabaseError(error.message);
  }
  if (user.session) {
    redirect(`/dashboard`);
  } else {
    redirect('/login');
  }
}

export async function logout() {
  const supabase = supabaseServer();
  await supabase.auth.signOut();
  const cookiesStore = cookies();
  cookiesStore.delete('actualComp');
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function googleLogin(url: string) {
  const supabase = supabaseServer();

  let { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: url + '/login/auth/callback',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return error;
  }
  if (data.url) {
    redirect(data.url); // use the redirect API for your server framework
  }
}
