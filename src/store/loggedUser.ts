import { company, companyData, profileUser } from '@/types/types'
import { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '../../supabase/supabase'

interface State {
  credentialUser: User | null
  profile: profileUser[]
  showNoCompanyAlert: boolean
  showMultiplesCompaniesAlert: boolean
  allCompanies: companyData[]
  actualCompany: companyData | null
  setActualCompany: (company: companyData) => void
  employees : any
  setEmployees: (employees: any) => void
  isLoading: boolean
}

/**
 * Creates a custom store for managing the logged-in user's data.
 * @param set - A function used to update the store's state.
 * @param get - A function used to access the store's state.
 * @returns An object containing the store's state properties.
 */
export const useLoggedUserStore = create<State>((set, get) => {
  set({isLoading: true})
  
  const selectedCompany = typeof window !== 'undefined' ? window.localStorage?.getItem('selectedCompany') : null;

  const setActualCompany = (company: companyData) => {
    set({ actualCompany: company })

    const activeEmployees = company.companies_employees.filter(({ employees }) => employees.is_active)

    const employees = activeEmployees.map(({ employees }) => {
      // if(!employees.is_active) return
      return {
        full_name: employees.firstname + ' ' + employees.lastname,
        email: employees.email,
        cuil: employees.cuil,
        document_number: employees.document_number,
        hierarchical_position: employees.hierarchical_position.name,
        company_position: employees.company_position,
        normal_hours: employees.normal_hours,
        type_of_contract: employees.type_of_contract,
        allocated_to: employees.contractor_employee
          .map(({ contractors }) => contractors.name)
          .join(', '),
        picture: employees.picture,
        nationality: employees.nationality,
        lastname: employees.lastname,
        firstname: employees.firstname,
        document_type: employees.document_type,
        birthplace: employees.birthplace.name.trim(),
        gender: employees.gender,
        marital_status: employees.marital_status,
        level_of_education: employees.level_of_education,
        street: employees.street,
        street_number: employees.street_number,
        province: employees.province.name.trim(),
        postal_code: employees.postal_code,
        phone: employees.phone,
        file: employees.file,
        date_of_admission: employees.date_of_admission,
        affiliate_status: employees.affiliate_status,
        city: employees.city.name.trim(),
        hierrical_position: employees.hierarchical_position.name,
        workflow_diagram: employees.workflow_diagram.name,
        contractor_employee: employees.contractor_employee
          .map(({ contractors }) => contractors.id),
          is_active: employees.is_active
      }
    })

    set({ employees })
    set({isLoading: false})
  }

  const fetchCompanies = async () => {
        
    let { data: company, error } = await supabase
    .from('company')
    .select(`
    *,
    city (
      name
    ),
    province_id (
      name
    ),
    companies_employees (
     employees(
      *,
      city (
        name
      ),
      province(
        name
      ),
      workflow_diagram(
        name
      ),
      hierarchical_position(
        name
      ),
      birthplace(
        name
      ),
    contractor_employee(
      contractors(
        *
      )
    )
     )
    )
  `)
    .eq('id', get()?.actualCompany?.id)
    setActualCompany(company?.[0])
  }

  const channels = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'employees' },
    (payload) => {
    
      fetchCompanies()
    }
  )
  .subscribe()


  
  const howManyCompanies = async (id: string) => {
    const { data, error } = await supabase
    .from('company')
    .select(`
      *,
      city (
        name
      ),
      province_id (
        name
      ),
      companies_employees (
       employees(
        *,
        city (
          name
        ),
        province(
          name
        ),
        workflow_diagram(
          name
        ),
        hierarchical_position(
          name
        ),
        birthplace(
          name
        ),
      contractor_employee(
        contractors(
          *
        )
      )
       )
      )
    `)
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
    setActualCompany: (company: companyData) => setActualCompany(company),
    employees: get()?.employees,
    setEmployees: (employees: any) => set({ employees }),
    isLoading: get()?.isLoading
  }
})
