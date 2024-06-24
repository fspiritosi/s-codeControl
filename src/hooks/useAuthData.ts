import { supabaseBrowser } from '@/lib/supabase/browser';
import { login, profileUser, singUp } from '@/types/types';
import { useEdgeFunctions } from './useEdgeFunctions';
import { useProfileData } from './useProfileData';

/**
 * Custom hook for handling authentication data.
 * Provides functions for signing up, logging in, password recovery, updating user password,
 * Google login, logging in with email only, and getting user session.
 *
 * @returns An object containing the authentication functions.
 */
export const useAuthData = () => {
  const { filterByEmail } = useProfileData();
  const { errorTranslate } = useEdgeFunctions();
  const supabase = supabaseBrowser();

  return {
    singUp: async (credentials: singUp) => {
      let { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: '/login',
        },
      });

      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    login: async (credentials: login) => {
      let { data, error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    recoveryPassword: async (email: string) => {
      localStorage.setItem('email', email);

      let { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL!}/reset_password/update-user`,
      });
      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    updateUser: async ({ password }: { password: string }) => {
      const email = localStorage.getItem('email');
      const user = (await filterByEmail(email)) as profileUser[];

      if (user.length === 0) throw new Error('Usuario no encontrado');
      localStorage.removeItem('email');

      const { data, error } = await supabase.auth.admin.updateUserById(user[0].credential_id, { password });
      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    googleLogin: async () => {
      let { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login/auth/callback',
        },
      });
      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return data;
    },
    loginOnlyEmail: async (email: string) => {
      let { data, error } = await supabase.auth.signInWithOtp({
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
    getSession: async (token: string) => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        const message = await errorTranslate(error.message);
        throw new Error(String(message).replaceAll('"', ''));
      }
      return user;
    },
  };
};
