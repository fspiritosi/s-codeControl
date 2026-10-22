import { login, singUp } from '@/shared/types/types';
import { requestPasswordReset, resetPassword } from '@/shared/actions/auth-recovery';
import { useSession } from 'next-auth/react';

/**
 * Custom hook for handling authentication data.
 * Login con NextAuth; recuperación de contraseña con tokens propios (auth_tokens).
 *
 * @returns An object containing the authentication functions.
 */
export const useAuthData = () => {
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
    recoveryPassword: async (email: string) => {
      await requestPasswordReset(email);
      return { ok: true };
    },
    updateUser: async ({ password, token }: { password: string; token: string }) => {
      const result = await resetPassword(token, password);
      if (!result.ok) throw new Error(result.error ?? 'No se pudo cambiar la contraseña');
      return result;
    },
    googleLogin: async () => {
      const { signIn } = await import('next-auth/react');
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
      });
      return result;
    },
    getSession: async () => {
      return session?.user ?? null;
    },
  };
};
