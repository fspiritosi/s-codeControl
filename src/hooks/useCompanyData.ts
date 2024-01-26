import { toast } from '@/components/ui/use-toast'
import { supabase } from '../../supabase/supabase'
import { UUID } from 'crypto'
import { useState } from 'react'
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

export const useCompanyData = () => {

  const insertCompany = async (companyData: Omit<company, 'employees'>) => {
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
  }

  return {
    insertCompany,
  }
}
