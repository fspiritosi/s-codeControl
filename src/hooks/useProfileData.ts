import { profile } from '@/types/types'
import { supabase } from '../../supabase/supabase'
import { useEdgeFunctions } from './useEdgeFunctions'
import { toast } from '@/components/ui/use-toast'


type profile = {
  firstName: string
  lastName: string
  credentialId: string | undefined
  document: string
  birthdate: string
  email: string
}

export const useProfileData = () => {
  const {errorTranslate} = useEdgeFunctions()
  return {
    insertProfile: async (credentials: profile) => {
      
        const { data,error } = await supabase
          .from('profile')
          .insert([credentials])
          .select()

          if (error) {
            const message = ( await errorTranslate(error.message))
            throw new Error( String(message).replaceAll('"', ''))
          }
        return data
    
    },
    filterByEmail: async (email: string | null) => {
    
        const { data, error } = await supabase
          .from('profile')
          .select('*')
          .eq('email', email)

          if (error) {
            const message = ( await errorTranslate(error.message))
            throw new Error( String(message).replaceAll('"', ''))
          }

        return data
   
    },
  }
}
