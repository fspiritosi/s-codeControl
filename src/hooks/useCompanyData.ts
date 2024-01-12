import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/supabase/supabase'

type company = {
  company_name: string
  company_cuit: string
  description: string
  website: string
  contact_email: string
  contact_phone: string
  address: string
  city: string
  country: string
  industry: string
  company_logo: string
}

export const useCompanyData = () => {
  return {
    insertCompany: async (companyData: company) => {
      try {
        const { data, error } = await supabase
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
