'use client'
import { useState } from 'react'
import { supabase } from '../../supabase/supabase'

export const useMultiFuncion = () => {
    const [provinces, setProvinces] = useState<any[]>([])
    const [cities, setCities] = useState<any[]>([])
    const [countries, setCountries] = useState<any[]>([])
    
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
  const fetchCountries = async () => {
    try {
      const { data: fetchCountries, error } = await supabase
        .from('countries')
        .select('*')
      if (error) {
        console.error('Error al obtener los paises:', error)
      } else {
        setCountries(fetchCountries || [])
      }
    } catch (error) {
      console.error('Ocurrió un error al obtener los paises:', error)
    }

  }
  return {
    fetchProvinces,
    fetchCities,
    provinces,
    cities,
    fetchCountries,
    countries
  }
  
}
