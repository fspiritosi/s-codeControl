import { supabase } from '@/supabase/supabase'
import { login, singUp } from '@/types/types'

export const useAuthData = () => {
  type email = string
  type updatePassword = {
    password: string
  }

  return {
    singUp: async (credentials: singUp) => {
      let { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      })
      if (error) {
        throw new Error(`${error?.message}`)
      }
      return data
    },
    login: async (credentials: login) => {
      let { data, error } = await supabase.auth.signInWithPassword(credentials)

      if (error) {
        throw new Error(`${error.message}`)
      }
      return data
    },
    recoveryPassword: async (email: email) => {
      let { data, error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {
        throw new Error(`${error?.message}`)
      }
      return data
    },
    updateUser: async (credentials: updatePassword) => {
      const { data, error } = await supabase.auth.updateUser(credentials)
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
      let { data, error } = await supabase.auth.signInWithOtp({ email })
      if (error) {
        throw new Error(`${error?.message}`)
      }
      return data
    },
  }
}
