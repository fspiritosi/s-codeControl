'use client'
import { toast } from '@/components/ui/use-toast'
import { useLoggedUserStore } from '@/store/loggedUser'
import { UUID } from 'crypto'
import { supabase } from '../../supabase/supabase'
import { useEdgeFunctions } from './useEdgeFunctions'


type company = {
  company_name: string
  company_cuit: string
  description: string
  website: string
  contact_email: string
  contact_phone: string
  address: string
  city: number
  country: string
  industry: string
  company_logo: string
  province_id: number
  employees: UUID
}

/**
 * Custom hook for handling company data.
 * @returns An object containing the `insertCompany` function.
 */

export const useCompanyData = () => {
  const {errorTranslate} = useEdgeFunctions()

  const insertCompany = async (companyData: Omit<company, 'employees'>) => {
    try {
      const { data, error } = await supabase
        .from('company')
        .insert([companyData])
        .select()

      const id = data?.[0].id
      const profile = useLoggedUserStore.getState().profile
      const { data: data2, error: error2 } = await supabase
        .from('profile')
        .update({
          company_id: [id],
        })
        .eq('id', profile?.[0].id)

      if (error || error2) {
        const message = await errorTranslate(error?.message || error2?.message || '')
        throw new Error(String(message).replaceAll('"', ''))
      }

      toast({
        title: 'Datos cargados',
      })
      
      return data
    } catch (err) {
      return err
    }
  }

  return {
    insertCompany,
  }
}
