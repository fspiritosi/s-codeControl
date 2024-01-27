'use client'
import { toast } from '@/components/ui/use-toast'
import { useLoggedUserStore } from '@/store/loggedUser'
import { UUID } from 'crypto'
import { supabase } from '../../supabase/supabase'
import { useEdgeFunctions } from './useEdgeFunctions'
import { company } from '@/types/types'

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

      if (error ) {
        const message = await errorTranslate(error?.message)
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
