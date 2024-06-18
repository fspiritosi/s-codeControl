import { Equipo } from '@/zodSchemas/schemas'
import { create } from 'zustand'
import { supabase } from '../../supabase/supabase'
import { MandatoryDocuments } from './../zodSchemas/schemas'
import { useLoggedUserStore } from './loggedUser'

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
  customers: generic[]
  mandatoryDocuments: MandatoryDocuments
  documentTypes: (company_id?: string) => void
  companyDocumentTypes: Equipo
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
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')

    if (error) {
      console.error('Error al obtener los contratistas:', error)
    } else {
      set({ customers: customers || [] })
    }
  }

  const documentTypes = async (id: string | undefined) => {
    const company_id = id ?? useLoggedUserStore?.getState?.()?.actualCompany?.id

    let { data: document_types } = await supabase
      .from('document_types')
      .select('*')
      // ?.filter('mandatory', 'eq', true)
      .or(`company_id.eq.${company_id},company_id.is.null`)

    const groupedData = document_types
      ?.filter(item => item['mandatory'] === true)
      .reduce((acc: Record<string, any[]>, item) => {
        ;(acc[item['applies']] = acc[item['applies']] || []).push(item)
        return acc
      }, {}) as MandatoryDocuments

    set({ companyDocumentTypes: document_types as Equipo })
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
    customers: get()?.customers,
    mandatoryDocuments: get()?.mandatoryDocuments,
    documentTypes: (company_id?: string | undefined) =>
      documentTypes(company_id || ''),
    companyDocumentTypes: get()?.companyDocumentTypes,
  }
})
