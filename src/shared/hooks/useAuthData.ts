// TODO: Phase 8+ — Remove supabase browser import once all .auth.* calls are migrated
import { supabaseBrowser } from '@/shared/lib/supabase/browser';
import { login, singUp } from '@/shared/types/types';
import { useEdgeFunctions } from './useEdgeFunctions';
import { useSession } from 'next-auth/react';

/**
 * Custom hook for handling authentication data.
 * Uses NextAuth as primary auth with Supabase fallback for password recovery flows.
 *
 * @returns An object containing the authentication functions.
 */
export const useAuthData = () => {
  const { errorTranslate } = useEdgeFunctions();
  const supabase = supabaseBrowser();
  const { data: session } = useSession();

  return {
    singUp: async (credentials: singUp) => {
      // Registration is now handled by server action (src/app/register/actions.ts)
      // This is kept for backward compatibility with RegisterForm
      const formData = new FormData();
      formData.append('email', credentials.email);
      formData.append('password', credentials.password);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Error al registrar usuario');
      }

      return { user: { id: '' } };
    },
    login: async (credentials: login) => {
      // Login is now handled by server action (src/app/login/actions.ts)
      // This is kept for backward compatibility with LoginForm
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Credenciales invalidas');
      }

      return result;
    },
    // TODO: Phase 8+ — Replace Supabase password recovery with custom token-based flow
    recoveryPassword: async (email: string) => {
      localStorage.setItem('email', email);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL!}/reset_password/update-user`,
      });
      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    // TODO: Phase 8+ — Replace Supabase password update with bcrypt hash update via server action
    updateUser: async ({ password }: { password: string }) => {
      const email = localStorage.getItem('email');
      if (!email) throw new Error('Email no encontrado');

      // Use Supabase admin API for now (password reset flow)
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      localStorage.removeItem('email');
      return data;
    },
    googleLogin: async () => {
      const { signIn } = await import('next-auth/react');
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
      });
      return result;
    },
    loginOnlyEmail: async (email: string) => {
      // TODO: Phase 8+ — Implement magic link via NextAuth Email provider
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/login/auth/callback',
        },
      });

      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    getSession: async () => {
      return session?.user ?? null;
    },
  };
};
