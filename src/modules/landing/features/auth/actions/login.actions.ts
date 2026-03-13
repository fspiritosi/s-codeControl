'use server';

import { signIn, signOut } from '@/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Credenciales invalidas';
        default:
          return 'Error al iniciar sesion';
      }
    }
    // NextAuth throws a NEXT_REDIRECT on success, re-throw it
    if (error?.digest?.includes('NEXT_REDIRECT')) throw error;
    return 'Error al iniciar sesion';
  }

  redirect('/dashboard');
}

export async function logout() {
  await signOut({ redirect: false });
  const cookiesStore = await cookies();
  cookiesStore.delete('actualComp');
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function googleLogin() {
  await signIn('google', { redirectTo: '/dashboard' });
}
