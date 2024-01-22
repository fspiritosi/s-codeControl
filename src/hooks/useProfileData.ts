import { toast } from '@/components/ui/use-toast'
import { supabase } from '../../supabase/supabase'

type profile = {
  firstName: string
  lastName: string
  credentialId: string | undefined
  document: string
  birthdate: string
  email: string
}

export const useProfileData = () => {
  return {
    insertProfile: async (credentials: profile) => {
      try {
        const { data, error } = await supabase
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
