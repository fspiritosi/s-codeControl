import { toast } from '@/components/ui/use-toast'
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
        toast({
          title: 'Datos extra del perfil',
        })
        return data
      } catch (err) {
        return err
      }
    },
  }
}
