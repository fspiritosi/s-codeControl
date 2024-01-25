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
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])

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

  const fetchProvinces = async () => {
    try {
      const { data: fetchedProvinces, error } = await supabase
        .from('provinces')
        .select('*')

      if (error) {
        console.error('Error al obtener las provincias:', error)
      } else {
        //console.log(fetchedProvinces)
        setProvinces(fetchedProvinces || [])
      }
    } catch (error) {
      console.error('Ocurrió un error al obtener las provincias:', error)
    }
  }

  const fetchCities = async (provinceId: any) => {
    try {
      const { data: fetchCities, error } = await supabase
        .from('cities')
        .select('*')
        .eq('province_id', provinceId)

      if (error) {
        console.error('Error al obtener las ciudades:', error)
      } else {
        setCities(fetchCities || [])
      }
    } catch (error) {
      console.error('Ocurrió un error al obtener las ciudades:', error)
    }
  }

  return {
    insertCompany,
    fetchProvinces,
    fetchCities,
    provinces,
    cities,
  }
}
