import { toast } from '@/components/ui/use-toast'
import { company } from '@/types/types'
import { supabase } from '../../supabase/supabase'
import { useEdgeFunctions } from './useEdgeFunctions'

export const useCompanyData = () => {
  const {errorTranslate} = useEdgeFunctions()
  return {
    insertCompany: async (companyData: company) => {
      
        const { data, error } = await supabase
          .from('company')
          .insert([companyData])
          .select()
        toast({
          title: 'Datos cargados',
        })

        if (error) {
          const message = ( await errorTranslate(error.message))
          throw new Error( String(message).replaceAll('"', ''))
        }

        return data
     
    },
  }
}
