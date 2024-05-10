import { EquipoSchema } from '@/zodSchemas/schemas'
import { create } from 'zustand'
import { supabase } from '../supabase'
import { MandatoryDocuments } from './../zodSchemas/schemas'

type Province = {
  id: number
  name: string
}
export type generic = {
  id: number
  name: string
  created_at: string
}
interface State {
  countries: generic[]
  provinces: Province[]
  cities: Province[]
  fetchCities: (provinceId: any) => void
  hierarchy: generic[]
  workDiagram: generic[]
  contractors: generic[]
  mandatoryDocuments: MandatoryDocuments
  documentTypes: (company_id: string) => void
}
export const useCountriesStore = create<State>((set, get) => {
  const fetchCountrys = async () => {
    const { data: fetchCountries, error } = await supabase
      .from('countries')
      .select('*')
    if (error) {
      console.error('Error al obtener los países:', error)
    } else {
      set({ countries: fetchCountries || [] })
    }
  }
  const fetchProvinces = async () => {
    const { data: fetchedProvinces, error } = await supabase
      .from('provinces')
      .select('*')

    if (error) {
      console.error('Error al obtener las provincias:', error)
    } else {
      set({ provinces: fetchedProvinces || [] })
    }
  }
  const fetchCities = async (provinceId: any) => {
    const { data: fetchCities, error } = await supabase
      .from('cities')
      .select('*')
      .eq('province_id', provinceId)

    if (error) {
      console.error('Error al obtener las ciudades:', error)
    } else {
      set({ cities: fetchCities || [] })
    }
  }
  const fetchHierarchy = async () => {
    const { data: hierarchy, error } = await supabase
      .from('hierarchy')
      .select('*')

    if (error) {
      console.error('Error al obtener la jerarquia:', error)
    } else {
      set({ hierarchy: hierarchy || [] })
    }
  }
  const fetchworkDiagram = async () => {
    const { data: workDiagram, error } = await supabase
      .from('work-diagram')
      .select('*')

    if (error) {
      console.error('Error al obtener el diagrama de trabajo:', error)
    } else {
      set({ workDiagram: workDiagram || [] })
    }
  }
  const fetchContractors = async () => {
    const { data: contractors, error } = await supabase
      .from('contractors')
      .select('*')

    if (error) {
      console.error('Error al obtener los contratistas:', error)
    } else {
      set({ contractors: contractors || [] })
    }
  }

  const documentTypes = async (company_id: string) => {
    if (!company_id) return
    // const applies = 'empleado' ? 'Persona' : 'Equipos'

    let { data: document_types } = await supabase
      .from('document_types')
      .select('*')
      .filter('mandatory', 'eq', true)
      .or(`company_id.eq.${company_id},company_id.is.null`)

    const validatedData = EquipoSchema.safeParse(document_types)

    if (!validatedData.success) {
      console.error(validatedData.error.errors)
      return
    }

    const groupedData = validatedData.data.reduce(
      (acc: Record<string, any[]>, item) => {
        ;(acc[item['applies']] = acc[item['applies']] || []).push(item)
        return acc
      },
      {},
    ) as MandatoryDocuments

    set({ mandatoryDocuments: groupedData })
  }

  fetchContractors()
  fetchworkDiagram()
  fetchHierarchy()
  fetchCountrys()
  fetchProvinces()
  return {
    countries: get()?.countries,
    provinces: get()?.provinces,
    cities: get()?.cities,
    fetchCities,
    hierarchy: get()?.hierarchy,
    workDiagram: get()?.workDiagram,
    contractors: get()?.contractors,
    mandatoryDocuments: get()?.mandatoryDocuments,
    documentTypes,
  }
})
