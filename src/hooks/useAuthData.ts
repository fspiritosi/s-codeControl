import { supabase } from '@/supabase/supabase'
import { login, singUp } from '@/types/types'

export const useAuthData = () => {
  return {
    singUp: async (credentials: singUp) => {
      try {
        let { data } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
        })
        console.log(data)

        return data
      } catch (err) {
        return err
      }
    },
    login: async (credentials: login) => {
      let { data } = await supabase.auth.signUp(credentials)

      if (!data.user) {
        throw new Error('Credenciales invalidas')
      }
      return data
    },
  }
}
