'use client'
import { toast } from '@/components/ui/use-toast'
import { useLoggedUserStore } from '@/store/loggedUser'
import { UUID } from 'crypto'
import { supabase } from '../../supabase/supabase'
import { useEdgeFunctions } from './useEdgeFunctions'
import {useState} from 'react'
import { company } from '@/types/types'

/**
 * Custom hook for handling company data.
 * @returns An object containing the `insertCompany` function.
 */

export const useCompanyData = () => {
  const {errorTranslate} = useEdgeFunctions()
  const [industry, setIndustry] = useState<any[]>([])
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

   const fetchIndustryType = async () => {
    try {
      const { data: fetchedIndustryType, error } = await supabase
        .from('industry_type')
        .select('*')
        
      if (error) {
        console.error('Error al obtener las industrias:', error)
      } else {
        setIndustry(fetchedIndustryType || [])
       
      }
    } catch (error) {
      console.error('Ocurrió un error al obtener las industrias:', error)
    }
  }
  return {
    insertCompany,
    fetchIndustryType,
    industry,
  }
}
