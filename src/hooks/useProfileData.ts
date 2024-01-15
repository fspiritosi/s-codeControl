import { supabase } from '@/supabase/supabase'
import { profile } from '@/types/types'

export const useProfileData = () => {
  return {
    insertProfile: async (credentials: profile) => {
      try {
        const { data } = await supabase
          .from('profile')
          .insert([credentials])
          .select()
        return data
      } catch (err) {
        return err
      }
    },
    filterByEmail: async (email: string | null) => {
      try {
        const { data, error } = await supabase
          .from('profile')
          .select('*')
          .eq('email', email)

        if (error) {
          console.log(error)
        }

        return data
      } catch (err) {
        return err
      }
    },
  }
}
