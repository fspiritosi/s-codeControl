import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/supabase/supabase'
import { login, singUp } from '@/types/types'

export const useAuthData = () => {
  type email = string
  type updatePassword = {
    password: string
  }
  const { toast } = useToast()

  return {
    singUp: async (credentials: singUp) => {
      let { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      })
      if (error) {
        toast({
          title: 'Error',
          description: 'no hemos podido registrar tu cuenta',
          variant: 'destructive',
        })
        throw new Error(`${error?.message}`)
      }
      return data
    },
    login: async (credentials: login) => {
      let { data, error } = await supabase.auth.signInWithPassword(credentials)

      if (error) {
        toast({
          variant: 'destructive',
          title: `${error.message}`,
        })
        throw new Error(`${error.message}`)
      }
      return data
    },
    recoveryPassword: async (email: email) => {
      let { data, error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {
        toast({
          title: 'Error',
          description: `${error?.message}`,
          variant: 'destructive',
        })
        throw new Error(`${error?.message}`)
      }
      return data
    },
    updateUser: async (credentials: updatePassword) => {
      const { data, error } = await supabase.auth.updateUser(credentials)
      if (error) {
        toast({
          title: 'Error',
          description: `${error.message}`,
          variant: 'destructive',
        })
        throw new Error(`${error?.message}`)
      }
      toast({
        title: 'Contraseña actualizada',
        description:
          'Tu contraseña ha sido cambiada con éxito. Ya puedes iniciar sesión con tu nueva contraseña.',
      })
      return data
    },
    googleLogin: async () => {
      let { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })
      if (error) {
        toast({
          title: 'Error',
          description: `${error?.message}`,
          variant: 'destructive',
        })
        throw new Error(`${error?.message}`)
      }
      return data
    },
    loginOnlyEmail: async (email: email) => {
      let { data, error } = await supabase.auth.signInWithOtp({ email })
      if (error) {
        toast({
          title: 'Error',
          description: `${error?.message}`,
          variant: 'destructive',
        })
        throw new Error(`${error?.message}`)
      }
      return data
    },
  }
}
