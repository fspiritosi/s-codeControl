import {
  AuditorDocument,
  VehiclesAPI,
  companyData,
  profileUser,
} from '@/types/types'
import { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '../../supabase/supabase'
import { format } from 'date-fns'

type documentsData = {
  employees: {
    date: string
    allocated_to: string
    documentName: string
    multiresource: string
    validity: string
    id: string
    resource: string
    state: string
    document_number: string
  }[]
  vehicles: {
    date: string
    allocated_to: string
    documentName: string
    multiresource: string
    validity: string
    id: string
    resource: string
    state: string
  }[]
}

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
  vehicles: any
  setNewDefectCompany: (company: companyData) => void
  endorsedEmployees: () => void
  noEndorsedEmployees: () => void
  documentsToShow: {
    employees: {
      date: string
      allocated_to: string
      documentName: string
      multiresource: string
      validity: string
      mandatory: string
      id: string
      resource: string
      state: string
      document_number: string
    }[]
    vehicles: {
      date: string
      allocated_to: string
      documentName: string
      multiresource: string
      validity: string
      id: string
      resource: string
      state: string
    }[]
  }
  Alldocuments: {
    employees: {
      date: string
      allocated_to: string
      documentName: string
      multiresource: string
      validity: string
      mandatory: string
      id: string
      resource: string
      state: string
      document_number: string
    }[]
    vehicles: {
      date: string
      allocated_to: string
      documentName: string
      multiresource: string
      validity: string
      id: string
      resource: string
      state: string
    }[]
  }
  lastMonthDocuments: {
    employees: {
      date: string
      allocated_to: string
      documentName: string
      multiresource: string
      validity: string
      id: string
      mandatory: string
      resource: string
      state: string
      document_number: string
    }[]
    vehicles: {
      date: string
      allocated_to: string
      documentName: string
      multiresource: string
      validity: string
      id: string
      resource: string
      state: string
    }[]
  }
  showLastMonthDocuments: boolean
  setShowLastMonthDocuments: () => void
  pendingDocuments: {
    employees: {
      date: string
      allocated_to: string
      documentName: string
      multiresource: string
      validity: string
      id: string
      mandatory: string
      resource: string
      state: string
      document_number: string
    }[]
    vehicles: {
      date: string
      allocated_to: string
      documentName: string
      multiresource: string
      validity: string
      id: string
      resource: string
      state: string
    }[]
  }
}

const setEmployeesToShow = (employees: any) => {
  const employee = employees?.map((employees: any) => {
    return {
      full_name: employees?.firstname + ' ' + employees?.lastname,
      id: employees?.id,
      email: employees?.email,
      cuil: employees?.cuil,
      document_number: employees?.document_number,
      hierarchical_position: employees?.hierarchical_position?.name,
      company_position: employees?.company_position,
      normal_hours: employees?.normal_hours,
      type_of_contract: employees?.type_of_contract,
      allocated_to: employees?.contractor_employee
        ?.map(({ contractors }: any) => contractors?.name)
        ?.join(', '),
      picture: employees?.picture,
      nationality: employees?.nationality,
      lastname: employees?.lastname,
      firstname: employees?.firstname,
      document_type: employees?.document_type,
      birthplace: employees?.birthplace?.name?.trim(),
      gender: employees?.gender,
      marital_status: employees?.marital_status,
      level_of_education: employees?.level_of_education,
      street: employees?.street,
      street_number: employees?.street_number,
      province: employees?.province?.name?.trim(),
      postal_code: employees?.postal_code,
      phone: employees?.phone,
      file: employees?.file,
      date_of_admission: employees?.date_of_admission,
      affiliate_status: employees?.affiliate_status,
      city: employees?.city?.name?.trim(),
      hierrical_position: employees?.hierarchical_position?.name,
      workflow_diagram: employees?.workflow_diagram?.name,
      contractor_employee: employees?.contractor_employee?.map(
        ({ contractors }: any) => contractors?.id,
      ),
      is_active: employees?.is_active,
      reason_for_termination: employees?.reason_for_termination,
      termination_date: employees?.termination_date,
      status: employees?.status,
    }
  })

  return employee
}

export const useLoggedUserStore = create<State>((set, get) => {
  set({ isLoading: true })
  set({ showDeletedEmployees: false })

  let selectedCompany: companyData[]

  const setInactiveEmployees = async () => {
    const employeesToShow = await getEmployees(false)
    set({ employeesToShow })
  }

  const noEndorsedEmployees = async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('employees')
      .select(
        `*, city (
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
          )`,
      )
      .eq('company_id', get()?.actualCompany?.id)
      .eq('status', 'No avalado')

    if (error) {
      console.error('Error al obtener los empleados no avalados:', error)
    } else {
      set({ employeesToShow: setEmployeesToShow(data) || [] })
      set({ isLoading: false })
    }
  }

  const endorsedEmployees = async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('employees')
      .select(
        `*, city (
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
          )`,
      )
      .eq('company_id', get()?.actualCompany?.id)
      .eq('status', 'Avalado')

    if (error) {
      console.error('Error al obtener los empleados avalados:', error)
    } else {
      set({ employeesToShow: setEmployeesToShow(data) || [] })
      set({ isLoading: false })
    }
  }

  const vehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('company_id', get()?.actualCompany?.id)
      .eq('is_active', true)
    if (error) {
      console.error('Error al obtener los vehículos:', error)
    } else {
      set({ vehicles: data || [] })
    }
  }

  const documetsFetch = async () => {
    let { data, error } = await supabase
      .from('documents_employees')
      .select(
        `
    *,
    employees:employees(*,contractor_employee(
      contractors(
        *
      )
    )),
    document_types:document_types(*)
`,
      )
      .not('employees', 'is', null)
      .not('document_types', 'is', null)
      .not('validity', 'is', null)
      .eq('employees.company_id', get()?.actualCompany?.id)

    let { data: equipmentData, error: equipmentError } = await supabase
      .from('documents_equipment')
      .select(
        `
      *,
      document_types:document_types(*),
      applies(*,type(*),type_of_vehicle(*),model(*),brand(*))
      `,
      )
      .not('document_types', 'is', null)
      .not('validity', 'is', null)
      .eq('applies.company_id', get()?.actualCompany?.id)

    const typedData: VehiclesAPI[] | null = equipmentData as VehiclesAPI[]
    console.log(typedData, 'filteredData')

    if (error) {
      console.error('Error al obtener los documentos:', error)
    } else {
      const lastMonth = new Date()
      lastMonth.setMonth(new Date().getMonth() + 1)

      const filteredData = data?.filter((doc: any) => {
        const date = new Date(doc.validity)
        const isExpired = date < lastMonth || doc.state === 'Vencido'
        return isExpired
      })

      const filteredVehiclesData = typedData?.filter((doc: any) => {
        const date = new Date(doc.validity)
        const isExpired = date < lastMonth || doc.state === 'Vencido'
        return isExpired
      })

      const lastMonthValues = {
        employees:
          filteredData
            ?.filter((doc: any) => doc.state !== 'presentado')
            ?.map((doc: any) => {
              return {
                date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
                allocated_to: doc.employees?.contractor_employee
                  ?.map((doc: any) => doc.contractors.name)
                  .join(', '),
                documentName: doc.document_types?.name,
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity:
                  format(new Date(doc.validity), 'dd/MM/yyyy') || 'No vence',
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource: `${doc.employees?.firstname} ${doc.employees?.lastname}`,
                document_number: doc.employees.document_number,
              }
            }) || [],
        vehicles:
          filteredVehiclesData
            .filter(doc => doc.state !== 'presentado')
            .map(doc => {
              return {
                date: doc.created_at
                  ? format(new Date(doc.created_at), 'dd/MM/yyyy')
                  : 'No vence',
                allocated_to: doc.applies?.type_of_vehicle?.name,
                documentName: doc.document_types?.name,
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity: doc.validity
                  ? format(new Date(doc.validity), 'dd/MM/yyyy')
                  : 'No vence',
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource: doc.applies?.domain || doc.applies?.serie,
              }
            }) || [],
      }

      const pendingDocuments = {
        employees:
          data
            ?.filter((doc: any) => doc.state === 'presentado')
            ?.map((doc: any) => {
              return {
                date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
                allocated_to: doc.employees?.contractor_employee
                  ?.map((doc: any) => doc.contractors.name)
                  .join(', '),
                documentName: doc.document_types?.name,
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity:
                  format(new Date(doc.validity), 'dd/MM/yyyy') || 'No vence',
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource: `${doc.employees?.firstname} ${doc.employees?.lastname}`,
                document_number: doc.employees.document_number,
              }
            }) || [],
        vehicles:
          filteredVehiclesData
            .filter(doc => doc.state === 'presentado')
            .map(doc => {
              return {
                date: doc.created_at
                  ? format(new Date(doc.created_at), 'dd/MM/yyyy')
                  : 'No vence',
                allocated_to: doc.applies?.type_of_vehicle?.name,
                documentName: doc.document_types?.name,
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity: doc.validity
                  ? format(new Date(doc.validity), 'dd/MM/yyyy')
                  : 'No vence',
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource: doc.applies?.domain || doc.applies?.intern_number,
              }
            }) || [],
      }

      const Allvalues = {
        employees:
          data
            ?.filter((doc: any) => doc.state !== 'presentado')
            ?.map((doc: any) => {
              return {
                date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
                allocated_to: doc.employees?.contractor_employee
                  ?.map((doc: any) => doc.contractors.name)
                  .join(', '),
                documentName: doc.document_types?.name,
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity:
                  format(new Date(doc.validity), 'dd/MM/yyyy') || 'No vence',
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource: `${doc.employees?.firstname} ${doc.employees?.lastname}`,
                document_number: doc.employees.document_number,
              }
            }) || [],
        vehicles:
          filteredVehiclesData
            .filter(doc => doc.state !== 'presentado')
            .map(doc => {
              return {
                date: doc.created_at
                  ? format(new Date(doc.created_at), 'dd/MM/yyyy')
                  : 'No vence',
                allocated_to: doc.applies?.type_of_vehicle?.name,
                documentName: doc.document_types?.name,
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity: doc.validity
                  ? format(new Date(doc.validity), 'dd/MM/yyyy')
                  : 'No vence',
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource: doc.applies?.domain || doc.applies?.intern_number,
              }
            }) || [],
      }

      set({ showLastMonthDocuments: true })
      set({ Alldocuments: Allvalues })
      set({ lastMonthDocuments: lastMonthValues })
      set({ documentsToShow: lastMonthValues })
      set({ pendingDocuments })
    }
  }

  const setShowLastMonthDocuments = () => {
    set({ showLastMonthDocuments: !get()?.showLastMonthDocuments })
    set({
      documentsToShow: !get()?.showLastMonthDocuments
        ? get()?.Alldocuments
        : get()?.lastMonthDocuments,
    })
  }

  const getEmployees = async (active: boolean) => {
    let { data: employees, error } = await supabase
      .from('employees')
      .select(
        `*, city (
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
          )`,
      )
      .eq('company_id', get()?.actualCompany?.id)
      .eq('is_active', active)

    const employeesToShow = setEmployeesToShow(employees)
    return employeesToShow
  }

  const channels = supabase
    .channel('custom-update-channel')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'employees' },
      payload => {
        setActivesEmployees()
      },
    )
    .subscribe()

  const setActivesEmployees = async () => {
    const employeesToShow = await getEmployees(true)
    set({ employeesToShow })
    set({ employees: employeesToShow })
  }

  const setActualCompany = (company: companyData) => {
    set({ actualCompany: company })
    setActivesEmployees()
    set({ isLoading: false })
    vehicles()
    documetsFetch()
  }

  const setNewDefectCompany = async (company: companyData) => {
    const { data, error } = await supabase
      .from('company')
      .update({ by_defect: false })
      .eq('owner_id', get()?.profile?.[0]?.id)

    if (error) {
      console.error('Error al actualizar la empresa por defecto:', error)
    } else {
      const { data, error } = await supabase
        .from('company')
        .update({ by_defect: true })
        .eq('id', company.id)

      if (error) {
        console.error('Error al actualizar la empresa por defecto:', error)
      } else {
        setActualCompany(company)
      }
    }
  }

  supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'company' },
      () => {
        howManyCompanies(get()?.profile?.[0]?.id || '')
      },
    )
    .subscribe()

  const howManyCompanies = async (id: string) => {
    const { data, error } = await supabase
      .from('company')
      .select(
        `
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
      `,
      )
      .eq('owner_id', id)

    if (error) {
      console.error('Error al obtener el perfil:', error)
    } else {
      set({ allCompanies: data || [] })

      selectedCompany = get()?.allCompanies?.filter(
        company => company.by_defect,
      )

      if (data.length > 1) {
        if (selectedCompany) {
          // console.log(selectedCompany, 'selectedCompany primer if');
          //
          setActualCompany(selectedCompany[0])
        } else {
          set({ showMultiplesCompaniesAlert: true })
        }
      }
      if (data.length === 1) {
        set({ showMultiplesCompaniesAlert: false })
        setActualCompany(data[0])
        // console.log(data[0], 'actual company segundo if');
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
    setShowDeletedEmployees: (showDeletedEmployees: boolean) =>
      set({ showDeletedEmployees }),
    vehicles: get()?.vehicles,
    setNewDefectCompany,
    endorsedEmployees,
    noEndorsedEmployees,
    Alldocuments: get()?.Alldocuments,
    documentsToShow: get()?.documentsToShow,
    showLastMonthDocuments: get()?.showLastMonthDocuments,
    setShowLastMonthDocuments,
    lastMonthDocuments: get()?.lastMonthDocuments,
    pendingDocuments: get()?.pendingDocuments,
  }
})
