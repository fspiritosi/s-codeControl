import { companyData, profileUser } from '@/types/types'
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
  employees: any
  setEmployees: (employees: any) => void
  isLoading: boolean
  employeesToShow: any
  setInactiveEmployees: () => void
  setActivesEmployees: () => void
  showDeletedEmployees: boolean
  setShowDeletedEmployees: (showDeletedEmployees: boolean) => void
}

const setEmployeesToShow = (employees: any) => {
  return employees?.map(({ employees }: any) => {
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
        .map(({ contractors }: any) => contractors.name)
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
        .map(({ contractors }: any) => contractors.id),
      is_active: employees.is_active,
      reason_for_termination: employees.reason_for_termination,
      termination_date: employees.termination_date,
    }
  })
}

export const useLoggedUserStore = create<State>((set, get) => {
  set({ isLoading: true })
  set({ showDeletedEmployees: false })

  let selectedCompany:companyData[] 
  const setInactiveEmployees = () => {
    const company = get()?.actualCompany
    const inactiveEmployees = company?.companies_employees.filter(({ employees }: any) => !employees.is_active)
    const employeesToShow = setEmployeesToShow(inactiveEmployees)
    set({ employeesToShow })
  }

  // const [showDeletedEmployees, setShowDeletedEmployees] = useState(false)

  const setActivesEmployees = () => {
    const employees = get()?.employees
    const employeesToShow = employees.filter((employee: any) => employee.is_active === true)
    set({ employeesToShow })
  }

  const setActualCompany = (company: companyData) => {
    set({ actualCompany: company })

    const activeEmployees = company?.companies_employees.filter(({ employees }: any) => employees.is_active)
    const employees = setEmployeesToShow(activeEmployees)

    set({ employees })
    set({ employeesToShow: employees})
    set({ isLoading: false })
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

  supabase.channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'employees' },
      () => {
        fetchCompanies()
      }
    )
    .subscribe()

    
 supabase.channel('custom-all-channel')
.on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'company' },
  () => {
    howManyCompanies(get()?.profile?.[0]?.id || '')
  }
)
.subscribe()

  const howManyCompanies = async (id: string) => {
    const { data, error } = await supabase
      .from('company')
      .select(`
        *,
        city (
          name,
          id
        ),
        province_id (
          name,
          id
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
      selectedCompany = get()?.allCompanies?.filter(company => company.by_defect)
      

      if (data.length > 1) {
        if (selectedCompany) {
          //
         setActualCompany(selectedCompany[0])
        } else {
          set({ showMultiplesCompaniesAlert: true })
        }
      }
      if (data.length === 1) {
        set({ showMultiplesCompaniesAlert: false })
        setActualCompany(data[0])
      }
      if (data.length === 0) {
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
    isLoading: get()?.isLoading,
    employeesToShow: get()?.employeesToShow,
    setInactiveEmployees: () => setInactiveEmployees(),
    setActivesEmployees: () => setActivesEmployees(),
    showDeletedEmployees: get()?.showDeletedEmployees,
    setShowDeletedEmployees: (showDeletedEmployees: boolean) => set({ showDeletedEmployees }),
  }
})
