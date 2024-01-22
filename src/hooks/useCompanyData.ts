import { toast } from '@/components/ui/use-toast'
import { company } from '@/types/types'
import { supabase } from '../../supabase/supabase'
import { useEdgeFunctions } from './useEdgeFunctions'
import { UUID } from 'crypto'
import { useState } from 'react'

export const useCompanyData = () => {
  const {errorTranslate} = useEdgeFunctions()
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])

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

     fetchProvinces : async () => {
    
      const { data: fetchedProvinces, error } = await supabase
        .from('provinces')
        .select('*')

        setProvinces(fetchedProvinces || [])
      
    if (error) {
          const message = ( await errorTranslate(error.message))
          throw new Error( String(message).replaceAll('"', ''))
        }
        return provinces
  },
   fetchCities : async (provinceId: any) => {
    
      const { data: fetchCities, error } = await supabase
        .from('cities')
        .select('*')
        .eq('province_id', provinceId)

      
        setCities(fetchCities || [])
      
    if (error) {
          const message = ( await errorTranslate(error.message))
          throw new Error( String(message).replaceAll('"', ''))
        }
        return cities
  },

  }
}
