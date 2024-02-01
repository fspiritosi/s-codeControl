import { company, profileUser } from '@/types/types'
import { User } from '@supabase/supabase-js'
import create from 'zustand'
import { supabase } from '../../supabase/supabase'

interface State {
  credentialUser: User | null
  profile: profileUser[]
  showNoCompanyAlert: boolean
  showMultiplesCompaniesAlert: boolean
  allCompanies: company[]
  actualCompany: company | null
  setActualCompany: (company: company) => void
}

/**
 * Creates a custom store for managing the logged-in user's data.
 * @param set - A function used to update the store's state.
 * @param get - A function used to access the store's state.
 * @returns An object containing the store's state properties.
 */
export const useLoggedUserStore = create<State>((set, get) => {

  const selectedCompany = typeof window !== 'undefined' ? window.localStorage?.getItem('selectedCompany') : null;

  const setActualCompany = (company: company) => {
    set({ actualCompany: company })
  }
  
  const howManyCompanies = async (id: string) => {
    const { data, error } = await supabase
      .from('company')
      .select('*')
      .eq('owner_id', id)
      
      

    if (error) {
      console.error('Error al obtener el perfil:', error)
    } else {
      set({ allCompanies: data || [] })

      if (data.length > 1) {
        // hay mas de una empresa
        if (selectedCompany) {
          // hay una empresa seleccionada como principal
          set({ showMultiplesCompaniesAlert: false })
          const company = data.find(
            (company: company) => company.company_name === selectedCompany,
          )
          if (company) {
            setActualCompany(company)
          } else {
            // no hay una empresa seleccionada
            set({ showMultiplesCompaniesAlert: true })
          }
        } else {
          // no hay una empresa seleccionada
          set({ showMultiplesCompaniesAlert: true })
        }
      } 
      if(data.length === 1){
        // solo hay una empresa
        set({ showMultiplesCompaniesAlert: false })
        setActualCompany(data[0])
      }
      if (data.length === 0) {
        // no hay empresas
        set({ showNoCompanyAlert: true })
      }
    }
  }

  const profileUser = async (id: string) => {
    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .eq('credential_id', id)

      

    if (error) {
      console.error('Error al obtener el perfil:', error)
    } else {
      set({ profile: data || [] })
      howManyCompanies(data[0].id)
    }
  }


  const loggedUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      set({ credentialUser: user })
    }

   
    if (typeof window !== 'undefined') {
      profileUser(user?.id || '')
    }
  }
  if (typeof window !== 'undefined') {
    loggedUser()
  }

  return {
    credentialUser: get()?.credentialUser,
    profile: get()?.profile,
    showNoCompanyAlert: get()?.showNoCompanyAlert,
    showMultiplesCompaniesAlert: get()?.showMultiplesCompaniesAlert,
    allCompanies: get()?.allCompanies,
    actualCompany: get()?.actualCompany,
    setActualCompany,
  }
})
