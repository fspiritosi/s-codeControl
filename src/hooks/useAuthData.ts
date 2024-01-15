import { supabase } from '@/supabase/supabase'
import { login, profile, singUp } from '@/types/types'
import { useProfileData } from './useProfileData'

export const useAuthData = () => {
  type email = string
  type updatePassword = {
    password: string
  }
  const { filterByEmail } = useProfileData()
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
        throw new Error(`${error?.message}`)
      }
      return data
    },
    login: async (credentials: login) => {
      let { data, error } = await supabase.auth.signInWithPassword(credentials)
      console.log(data)

      if (error) {
        throw new Error(`${error.message}`)
      }
      return data
    },
    recoveryPassword: async (email: email) => {
      localStorage.setItem('email', email)

      let { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.href}/update-user`,
      })

      if (error) {
        throw new Error(`${error?.message}`)
      }
      return data
    },
    updateUser: async ({ password }: updatePassword) => {
      const email = localStorage.getItem('email')
      const user = (await filterByEmail(email)) as profile[]
      console.log(user)
    if (user.length === 0) throw new Error('Usuario no encontrado')
      localStorage.removeItem('email')

      const { data, error } = await supabase.auth.admin.updateUserById(
        user[0].credentialId,
        { password },
      )
      if (error) {
        throw new Error(`${error?.message}`)
      }
      return data
    },
    googleLogin: async () => {
      let { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })
      if (error) {
        throw new Error(`${error?.message}`)
      }
      return data
    },
    loginOnlyEmail: async (email: email) => {
      let { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'http://localhost:3000/reset_password/update-user',
        },
      })

      console.log(data)
      if (error) {
        throw new Error(`${error?.message}`)
      }
      return data
    },
    getSession: async (token: string) => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token)

      if (error) {
        throw new Error(error?.message)
      }
      return user
    },
  }
}
