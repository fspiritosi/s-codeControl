import { Database } from '@/types/supabaseTypes'
import { Notifications, SharedUser } from '@/types/types'
import { Vehicle, VehicleSchema } from '@/zodSchemas/schemas'
import { User } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { create } from 'zustand'
import { supabase } from '../../supabase/supabase'
import { VehiclesFormattedElement } from './../zodSchemas/schemas'
import { useCountriesStore } from './countries'
interface EmployeeDocument {
  date: string
  allocated_to: string
  documentName: Database['public']['Tables']['document_types']['Row']['name']
  state: Database['public']['Tables']['documents_employees']['Row']['state']
  multiresource: string
  validity: string
  mandatory: string
  id: Database['public']['Tables']['documents_employees']['Row']['id']
  resource: string
  document_number: Database['public']['Tables']['employees']['Row']['document_number']
  document_url: Database['public']['Tables']['documents_employees']['Row']['document_path']
}
interface VehiclesDocument {
  date: string
  allocated_to: Database['public']['Tables']['types_of_vehicles']['Row']['name']
  documentName: Database['public']['Tables']['document_types']['Row']['name']
  state: Database['public']['Tables']['documents_equipment']['Row']['state']
  multiresource: string
  validity: string
  mandatory: string
  id: Database['public']['Tables']['documents_equipment']['Row']['id']
  resource: string
  vehicle_id: Database['public']['Tables']['vehicles']['Row']['id']
}

interface State {
  credentialUser: User | null
  profile: Database['public']['Tables']['profile']['Row'][] | null
  showNoCompanyAlert: boolean
  showMultiplesCompaniesAlert: boolean
  allCompanies: Database['public']['Tables']['company']['Row'][]
  actualCompany: Database['public']['Tables']['company']['Row'] | null
  setActualCompany: (
    company:
      | Database['public']['Tables']['company']['Row']
      | (null & {
          share_company_users: Database['public']['Tables']['share_company_users']['Row'][]
        }),
  ) => void
  employees: any
  setEmployees: (employees: any) => void
  isLoading: boolean
  employeesToShow: any
  setInactiveEmployees: () => void
  setActivesEmployees: () => void
  showDeletedEmployees: boolean
  setShowDeletedEmployees: (showDeletedEmployees: boolean) => void
  vehicles: Vehicle
  setNewDefectCompany: (
    company: Database['public']['Tables']['company']['Row'] & {
      owner_id: Database['public']['Tables']['profile']['Row']
    },
  ) => Promise<void>
  sharedCompanies:
    | Database['public']['Tables']['share_company_users']['Row'][]
    | null
  endorsedEmployees: () => void
  noEndorsedEmployees: () => void
  allDocumentsToShow: {
    employees: EmployeeDocument[]
    vehicles: VehiclesDocument[]
  }

  documentsToShow: {
    employees: EmployeeDocument[]
    vehicles: VehiclesDocument[]
  }
  Alldocuments: {
    employees: EmployeeDocument[]
    vehicles: VehiclesDocument[]
  }
  lastMonthDocuments: {
    employees: EmployeeDocument[]
    vehicles: VehiclesDocument[]
  }
  showLastMonthDocuments: boolean
  setShowLastMonthDocuments: () => void
  pendingDocuments: {
    employees: EmployeeDocument[]
    vehicles: VehiclesDocument[]
  }
  notifications: Notifications[]
  markAllAsRead: () => void
  resetDefectCompanies: (
    company: Database['public']['Tables']['company']['Row'] & {
      owner_id: Database['public']['Tables']['profile']['Row']
    },
  ) => Promise<void>
  sharedUsers: SharedUser[]
  vehiclesToShow: VehiclesFormattedElement
  setActivesVehicles: () => void
  endorsedVehicles: () => void
  noEndorsedVehicles: () => void
  setVehicleTypes: (type: string) => void
  fetchVehicles: () => void
  documetsFetch: () => void
  getEmployees: (active: boolean) => void
  loggedUser: () => void
}

const setEmployeesToShow = (employees: any) => {
  const employee = employees?.map((employees: any) => {
    return {
      full_name: employees?.lastname + ' ' + employees?.firstname,
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

const setVehiclesToShow = (vehicles: Vehicle) => {
  return vehicles?.map(item => ({
    ...item,
    types_of_vehicles: item.types_of_vehicles.name,
    brand: item.brand_vehicles.name,
    model: item.model_vehicles.name,
  }))
}

export const useLoggedUserStore = create<State>((set, get) => {
  // set({ isLoading: true })
  set({ showDeletedEmployees: false })

  const howManyCompanies = async (id: string) => {
    if (!id) return
    const { data, error } = await supabase
      .from('company')
      .select(
        `
        *,
        owner_id(*),
        share_company_users(*,
          profile(*)
        ),
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

    let { data: share_company_users, error: sharedError } = await supabase
      .from('share_company_users')
      .select(
        `*,
        company(
          *,owner_id(*),
        share_company_users(*,
          profile(*)
        ),
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
      )`,
      )
      .eq('profile_id', id)

    set({ sharedCompanies: share_company_users })
    if (error) {
      console.error('Error al obtener el perfil:', error)
    } else {
      set({ allCompanies: data })

      selectedCompany = get()?.allCompanies.filter(company => company.by_defect)
      const savedCompany = localStorage.getItem('company_id') || ''
      if (savedCompany) {
        const company = share_company_users?.find(
          company => company?.company?.id === JSON.parse(savedCompany),
        )?.company

        if (company) {
          setActualCompany(company)
          return
        }
      }

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
    if (!id) return
    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .eq('credential_id', id)

    if (error) {
      console.error('Error al obtener el perfil:', error)
    } else {
      set({ profile: data || [] })
      howManyCompanies(data[0]?.id)
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

  let selectedCompany: Database['public']['Tables']['company']['Row'][] | null

  const setActualCompany = (
    company: Database['public']['Tables']['company']['Row'] | null,
  ) => {
    set({ actualCompany: company })
    useCountriesStore.getState().documentTypes(company?.id || '')
    setActivesEmployees()
    fetchVehicles()
    documetsFetch()
    allNotifications()
  }

  const setInactiveEmployees = async () => {
    const employeesToShow = await getEmployees(false)
    set({ employeesToShow })
  }

  const noEndorsedEmployees = async () => {
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
      .eq('company_id', get()?.actualCompany?.id || '')
      .eq('status', 'No avalado')

    if (error) {
      console.error('Error al obtener los empleados no avalados:', error)
    } else {
      set({ employeesToShow: setEmployeesToShow(data) || [] })
    }
  }

  const allNotifications = async () => {
    let { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', get()?.actualCompany?.id || '')

    await documetsFetch()

    const document = notifications?.map((doc: any) => {
      const findDocument =
        get()?.allDocumentsToShow?.employees?.find(
          document => document.id === doc.document_id,
        ) ||
        get()?.allDocumentsToShow?.vehicles?.find(
          document => document.id === doc.document_id,
        )
      if (findDocument) {
        return { ...doc, document: findDocument }
      } else {
        return doc
      }
    })

    if (error) {
      console.error('Error al obtener las notificaciones:', error)
    }

    const tipedData = document?.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ) as Notifications[]

    set({ notifications: tipedData })
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('company_id', get()?.actualCompany?.id || '')

    if (error) {
      console.error(
        'Error al marcar todas las notificaciones como leídas:',
        error,
      )
    } else {
      allNotifications()
    }
  }

  const endorsedEmployees = async () => {
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
      .eq('company_id', get()?.actualCompany?.id || '')
      .eq('status', 'Avalado')

    if (error) {
      console.error('Error al obtener los empleados avalados:', error)
    } else {
      set({ employeesToShow: setEmployeesToShow(data) || [] })
    }
  }

  const fetchVehicles = async () => {
    if (!get()?.actualCompany?.id) return
    const { data, error } = await supabase
      .from('vehicles')
      .select(
        `*,
      types_of_vehicles(name),
      brand_vehicles(name),
      model_vehicles(name)`,
      )
      .eq('company_id', get()?.actualCompany?.id || '')
      .eq('is_active', true)

    const validatedData = VehicleSchema.safeParse(data ?? [])
    if (!validatedData.success) {
      return console.error(
        'Error al obtener los vehículos:',
        validatedData.error,
      )
    }

    if (error) {
      console.error('Error al obtener los vehículos:', error)
    } else {
      set({ vehicles: validatedData.data || [] })
      setActivesVehicles()
    }
  }

  const setActivesVehicles = () => {
    const activesVehicles = get()?.vehicles.filter(vehicle => vehicle.is_active)
    set({ vehiclesToShow: setVehiclesToShow(activesVehicles) })
  }
  const endorsedVehicles = () => {
    const endorsedVehicles = get()?.vehicles.filter(
      vehicle => vehicle.status === 'Avalado',
    )

    set({ vehiclesToShow: setVehiclesToShow(endorsedVehicles) })
  }
  const noEndorsedVehicles = () => {
    const noEndorsedVehicles = get()?.vehicles.filter(
      vehicle => vehicle.status === 'No avalado',
    )
    set({ vehiclesToShow: setVehiclesToShow(noEndorsedVehicles) })
  }

  const setVehicleTypes = (type: string) => {
    if (type === 'Todos') {
      set({ vehiclesToShow: setVehiclesToShow(get()?.vehicles) })
      return
    }
    const vehicles = get()?.vehicles
    const vehiclesToShow = vehicles.filter(
      vehicle => vehicle.types_of_vehicles?.name === type,
    )

    set({ vehiclesToShow: setVehiclesToShow(vehiclesToShow) })
  }

  const documetsFetch = async () => {
    // set({ isLoading: true })
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
      .eq('employees.company_id', get()?.actualCompany?.id || '')

    let { data: equipmentData, error: equipmentError } = await supabase
      .from('documents_equipment')
      .select(
        `
      *,
      document_types:document_types(*),
      applies:vehicles(*,type(*),type_of_vehicle:types_of_vehicles(*),model(*),brand(*))
      `,
      )
      .eq('applies.company_id', get()?.actualCompany?.id || '')
      .not('applies', 'is', null)

    if (error) {
      console.error('Error al obtener los documentos:', error)
    } else {
      const lastMonth = new Date()
      lastMonth.setMonth(new Date().getMonth() + 1)

      const filteredData = data?.filter(doc => {
        if (!doc.validity) return false

        const date = new Date(
          `${doc.validity.split('/')[1]}/${doc.validity.split('/')[0]}/${
            doc.validity.split('/')[2]
          }`,
        )
        const isExpired = date < lastMonth || doc.state === 'vencido'
        return isExpired
      })

      const filteredVehiclesData = equipmentData?.filter(doc => {
        if (!doc.validity) return false
        const date = new Date(
          `${doc.validity.split('/')[1]}/${doc.validity.split('/')[0]}/${
            doc.validity.split('/')[2]
          }`,
        )
        const isExpired = date < lastMonth || doc.state === 'vencido'
        return isExpired
      })

      const formatDate = (dateString: string) => {
        if (!dateString) return 'No vence'
        const [day, month, year] = dateString.split('/')
        const formattedDate = `${day}/${month}/${year}`
        return formattedDate || 'No vence'
      }

      const lastMonthValues = {
        employees:
          filteredData
            ?.filter((doc: any) => {
              if (!doc.validity || doc.validity === 'No vence') return false
              return (
                doc.state !== 'presentado' &&
                doc.state !== 'pendiente' &&
                (doc.validity !== 'No vence' || doc.validity !== null)
              )
            })
            ?.map(doc => {
              const formattedDate = formatDate(doc.validity || '')
              return {
                date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
                allocated_to:
                  doc.employees?.contractor_employee
                    ?.map((doc: any) => doc.contractors.name)
                    .join(', ') || '',
                documentName: doc.document_types?.name || '',
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity: formattedDate,
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource: `${doc.employees?.lastname} ${doc.employees?.firstname}`,
                document_number: doc.employees?.document_number || '',
                document_url: doc.document_path,
              }
            }) || [],
        vehicles:
          filteredVehiclesData
            ?.filter(doc => {
              if (!doc.validity || doc.validity === 'No vence') return false
              return (
                doc.state !== 'presentado' &&
                (doc.validity !== 'No vence' || doc.validity !== null)
              )
            })
            .map(doc => {
              const formattedDate = formatDate(doc.validity || '')
              return {
                date: doc.created_at
                  ? format(new Date(doc.created_at), 'dd/MM/yyyy')
                  : 'No vence',
                allocated_to: doc.applies?.type_of_vehicle?.name || '',
                documentName: doc.document_types?.name || '',
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity: formattedDate,
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource:
                  doc.applies?.domain || doc.applies?.intern_number || '',
                vehicle_id: doc.applies?.id || '',
              }
            }) || [],
      }

      const pendingDocuments = {
        employees:
          data
            ?.filter((doc: any) => doc.state === 'presentado')
            ?.map(doc => {
              const formattedDate = formatDate(doc.validity || '')
              return {
                date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
                allocated_to:
                  doc.employees?.contractor_employee
                    ?.map((doc: any) => doc.contractors.name)
                    .join(', ') || '',
                documentName: doc.document_types?.name || '',
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity: formattedDate,
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource: `${doc.employees?.lastname} ${doc.employees?.firstname}`,
                document_number: doc.employees?.document_number || '',
                document_url: doc.document_path,
              }
            }) || [],
        vehicles:
          equipmentData
            ?.filter(doc => doc.state === 'presentado')
            .map(doc => {
              const formattedDate = formatDate(doc.validity || '')
              return {
                date: doc.created_at
                  ? format(new Date(doc.created_at), 'dd/MM/yyyy')
                  : 'No vence',
                allocated_to: doc.applies?.type_of_vehicle?.name || '',
                documentName: doc.document_types?.name || '',
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity: formattedDate,
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource:
                  doc.applies?.domain || doc.applies?.intern_number || '',
                vehicle_id: doc.applies?.id || '',
              }
            }) || [],
      }

      const Allvalues = {
        employees:
          data
            ?.filter((doc: any) => {
              if (!doc.validity || doc.validity === 'No vence') return false
              return (
                doc.state !== 'presentado' &&
                (doc.validity !== 'No vence' || doc.validity !== null)
              )
            })
            ?.map(doc => {
              const formattedDate = formatDate(doc.validity || '')
              return {
                date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
                allocated_to:
                  doc.employees?.contractor_employee
                    ?.map((doc: any) => doc.contractors.name)
                    .join(', ') || '',
                documentName: doc.document_types?.name || '',
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity: formattedDate,
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource: `${doc.employees?.lastname} ${doc.employees?.firstname}`,
                document_number: doc.employees?.document_number || '',
                document_url: doc.document_path,
              }
            }) || [],
        vehicles:
          equipmentData
            ?.filter(doc => {
              if (!doc.validity || doc.validity === 'No vence') return false
              return (
                doc.state !== 'presentado' &&
                (doc.validity !== 'No vence' || doc.validity !== null)
              )
            })
            ?.map(doc => {
              const formattedDate = formatDate(doc.validity || '')
              return {
                date: doc.created_at
                  ? format(new Date(doc.created_at), 'dd/MM/yyyy')
                  : 'No vence',
                allocated_to: doc.applies?.type_of_vehicle?.name || '',
                documentName: doc.document_types?.name || '',
                state: doc.state,
                multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
                validity: formattedDate,
                mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
                id: doc.id,
                resource:
                  doc.applies?.domain || doc.applies?.intern_number || '',
                vehicle_id: doc.applies?.id || '',
              }
            }) || [],
      }

      const AllvaluesToShow = {
        employees:
          data?.map(doc => {
            const formattedDate = formatDate(doc.validity || '')
            return {
              date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
              allocated_to:
                doc.employees?.contractor_employee
                  ?.map((doc: any) => doc.contractors.name)
                  .join(', ') || '',
              documentName: doc.document_types?.name || '',
              state: doc.state,
              multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
              validity: formattedDate,
              mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
              id: doc.id,
              resource: `${doc.employees?.lastname} ${doc.employees?.firstname}`,
              document_number: doc.employees?.document_number || '',
              document_url: doc.document_path,
            }
          }) || [],
        vehicles:
          equipmentData?.map(doc => {
            const formattedDate = formatDate(doc.validity || '')
            return {
              date: doc.created_at
                ? format(new Date(doc.created_at), 'dd/MM/yyyy')
                : 'No vence',
              allocated_to: doc.applies?.type_of_vehicle?.name || '',
              documentName: doc.document_types?.name || '',
              state: doc.state,
              multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
              validity: formattedDate,
              mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
              id: doc.id,
              resource: doc.applies?.domain || doc.applies?.intern_number || '',
              vehicle_id: doc.applies?.id || '',
            }
          }) || [],
      }
      set({ allDocumentsToShow: AllvaluesToShow })
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
      .eq('company_id', get()?.actualCompany?.id || '')
      .eq('is_active', active)

    const employeesToShow = setEmployeesToShow(employees)
    return employeesToShow
  }

  const realTimeSharedUsers = supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'share_company_users' },
      payload => {
        howManyCompanies(get()?.profile?.[0]?.id || '')
      },
    )
    .subscribe()

  const realTimeNotification = supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications' },
      payload => {
        allNotifications()
      },
    )
    .subscribe()

  const realTimeEmployees = supabase
    .channel('custom-update-channel')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'employees' },
      payload => {
        setActivesEmployees()
      },
    )
    .subscribe()

  const realTimeCompany = supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'company' },
      () => {
        howManyCompanies(get()?.profile?.[0]?.id || '')
      },
    )
    .subscribe()

  const setActivesEmployees = async () => {
    const employeesToShow = await getEmployees(true)
    set({ employeesToShow })
    set({ employees: employeesToShow })
  }

  const resetDefectCompanies = async (
    company: Database['public']['Tables']['company']['Row'],
  ) => {
    const { data, error } = await supabase
      .from('company')
      .update({ by_defect: false })
      .eq('owner_id', get()?.profile?.[0]?.id || '')

    if (error) {
      console.error('Error al actualizar la empresa por defecto:', error)
    }

    setActualCompany(company)
  }

  const setNewDefectCompany = async (
    company: Database['public']['Tables']['company']['Row'] & {
      owner_id: Database['public']['Tables']['profile']['Row']
    },
  ) => {
    if (company.owner_id?.id !== get()?.profile?.[0]?.id) {
      localStorage.setItem('company_id', JSON.stringify(company.id))
      return
    }
    localStorage.removeItem('company_id')

    const { data, error } = await supabase
      .from('company')
      .update({ by_defect: false })
      .eq('owner_id', get()?.profile?.[0]?.id || '')

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

  return {
    credentialUser: get()?.credentialUser,
    profile: get()?.profile,
    showNoCompanyAlert: get()?.showNoCompanyAlert,
    showMultiplesCompaniesAlert: get()?.showMultiplesCompaniesAlert,
    allCompanies: get()?.allCompanies,
    actualCompany: get()?.actualCompany,
    setActualCompany: (
      company: Database['public']['Tables']['company']['Row'] | null,
    ) => setActualCompany(company),
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
    notifications: get()?.notifications,
    markAllAsRead,
    allDocumentsToShow: get()?.allDocumentsToShow,
    resetDefectCompanies,
    sharedUsers: get()?.sharedUsers,
    vehiclesToShow: get()?.vehiclesToShow,
    setActivesVehicles,
    endorsedVehicles,
    noEndorsedVehicles,
    setVehicleTypes,
    fetchVehicles,
    sharedCompanies: get()?.sharedCompanies,
    documetsFetch: () => documetsFetch(),
    getEmployees: (active: boolean) => getEmployees(active),
    loggedUser,
  }
})
