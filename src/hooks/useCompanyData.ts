import { company, industry_type } from './../types/types';
'use client'
import { toast } from '@/components/ui/use-toast'
import { useLoggedUserStore } from '@/store/loggedUser'
import { UUID } from 'crypto'
import { supabase } from '../../supabase/supabase'
import { useEdgeFunctions } from './useEdgeFunctions'
import {useState} from 'react'
//import { industry } from './../types/types';




export const useCompanyData = () => {
  const {errorTranslate} = useEdgeFunctions()
  const [industry, setIndustry] = useState<any[]>([])
  
  return{
    insertCompany : async (company: company) => {
      const { data, error } = await supabase
         .from('company')
         .insert([company])
         .select()

      if (error ) {
        const message = await errorTranslate(error?.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      return data
  },

  updateCompany: async (companyId: string,company: company) => {
      const { data, error } = await supabase
        .from('company')
        .update(company)
        .eq('id', companyId)
        .select()
        
      if (error) {
        const message = await errorTranslate(error.message)
        throw new Error(String(message).replaceAll('"', ''))
      }
      return data
    },

     fetchIndustryType : async () => {
      
      const { data , error } = await supabase
        .from('industry_type')
        .select('*')
        
      if (error) {
        console.error('Error al obtener las industrias:', error)
      } 
        
        return data
      
    },
  
  }
}
