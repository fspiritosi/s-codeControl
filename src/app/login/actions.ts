'use server';

import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseServer } from '@/lib/supabase/server';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const supabase = await supabaseServer();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // Primary: Supabase auth (existing flow)
  const { error, data: user } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return handleSupabaseError(error.message);
  }

  // Secondary: Also create a NextAuth session for gradual migration
  try {
    await nextAuthSignIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });
  } catch {
    // NextAuth sign-in failure should not block the existing flow
    // during migration period
    console.warn('[Auth Migration] NextAuth credentials sign-in failed, continuing with Supabase session');
  }

  if (user.session) {
    redirect(`/dashboard`);
  } else {
    redirect('/login');
  }
}

export async function logout() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();

  // Also sign out from NextAuth
  try {
    await nextAuthSignOut({ redirect: false });
  } catch {
    // NextAuth sign-out failure should not block existing flow
    console.warn('[Auth Migration] NextAuth sign-out failed, continuing with Supabase sign-out');
  }

  const cookiesStore = await cookies();
  cookiesStore.delete('actualComp');
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function googleLogin(url: string) {
  const supabase = await supabaseServer();

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

/**
 * NextAuth-native Google sign-in (for future use once Supabase auth is fully removed)
 */
export async function googleLoginNextAuth() {
  await nextAuthSignIn('google', { redirectTo: '/dashboard' });
}
