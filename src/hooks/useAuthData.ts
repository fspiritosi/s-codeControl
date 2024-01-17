import { login, profile, singUp } from '@/types/types'
import { supabase } from '../../supabase/supabase'
import { useEdgeFunctions } from './useEdgeFunctions'
import { useProfileData } from './useProfileData'

export const useAuthData = () => {
  type updatePassword = {
    password: string
  }
  const { filterByEmail } = useProfileData()

  const {errorTranslate} = useEdgeFunctions()
  return {
    singUp: async (credentials: singUp) => {
      let { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: '/login',
        },
      })

      if (error) {
        const message = ( await errorTranslate(error.message))
        throw new Error( String(message).replaceAll('"', ''))
      }
      return data
    },
    login: async (credentials: login) => {
      let { data, error } = await supabase.auth.signInWithPassword(credentials)
     

      if (error) {
       const message = ( await errorTranslate(error.message))
        throw new Error( String(message).replaceAll('"', ''))
      }
      return data
    },
    recoveryPassword: async (email: string) => {
      localStorage.setItem('email', email)

      let { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.href}/update-user`,
      })

      if (error) {
        const message = ( await errorTranslate(error.message))
        throw new Error( String(message).replaceAll('"', ''))
      }
      return data
    },
    updateUser: async ({ password }: updatePassword) => {
      const email = localStorage.getItem('email')
      const user = (await filterByEmail(email)) as profile[]
     
    if (user.length === 0) throw new Error('Usuario no encontrado')
      localStorage.removeItem('email')

      const { data, error } = await supabase.auth.admin.updateUserById(
        user[0].credentialId,
        { password },
      )
      if (error) {
        const message = ( await errorTranslate(error.message))
        throw new Error( String(message).replaceAll('"', ''))
      }
      return data
    },
    googleLogin: async () => {
      let { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })
      if (error) {
        const message = ( await errorTranslate(error.message))
        throw new Error( String(message).replaceAll('"', ''))
      }
      return data
    },
    loginOnlyEmail: async (email: string) => {
      let { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'http://localhost:3000/reset_password/update-user',
        },
      })

      if (error) {
        const message = ( await errorTranslate(error.message))
        throw new Error( String(message).replaceAll('"', ''))
      }
      return data
    },
    getSession: async (token: string) => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token)

      if (error) {
        const message = ( await errorTranslate(error.message))
        throw new Error( String(message).replaceAll('"', ''))
      }
      return user
    },
  }
}
