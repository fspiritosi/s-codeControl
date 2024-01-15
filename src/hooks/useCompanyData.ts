import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/supabase/supabase'
import { company } from '@/types/types'

export const useCompanyData = () => {
  return {
    insertCompany: async (companyData: company) => {
      try {
        const { data } = await supabase
          .from('company')
          .insert([companyData])
          .select()
        toast({
          title: 'Datos cargados',
        })
        return data
      } catch (err) {
        return err
      }
    },
  }
}
