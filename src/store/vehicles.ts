import { companyData } from '@/types/types'
import { create } from 'zustand'
import { supabase } from '../../supabase/supabase'

interface State {
  allVehicles: any[]
  fetchVehicles: (actualCompany: companyData) => Promise<void>
  setActivesVehicles: () => void
  vehiclesToShow: any[]
  endorsedVehicles: () => void
  noEndorsedVehicles: () => void
  actualCompanyVehicles: companyData | null
  setVehicleTypes: (type:string) => void
}

const setVehiclesToShow = (vehicles: any[]) => {
  return vehicles.map(item => ({
    ...item,
    types_of_vehicles: item.types_of_vehicles.name,
    brand: item.brand_vehicles.name,
    model: item.model_vehicles.name,
  }))
}

export const VehiclesActualCompany = create<State>((set, get) => {
  const setActualCompany = async () => {

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
    .eq('by_defect', true)
    set({actualCompanyVehicles: data?.[0]})
    fetchVehicles()
  }
  setActualCompany()

  const fetchVehicles = async () => {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(
        `*,
      types_of_vehicles(name),
      brand_vehicles(name),
      model_vehicles(name)`,
      )
      //.eq('is_active', true)
      .eq('company_id', get()?.actualCompanyVehicles?.id)

    if (error) {
      console.error('Error al obtener los vehículos:', error)
    } else {
      set({ allVehicles: vehicles })
      setActivesVehicles()
    }
  }

  const setActivesVehicles = () => {
    const activesVehicles = get().allVehicles.filter(vehicle => vehicle.is_active)
    set({ vehiclesToShow: setVehiclesToShow(activesVehicles) })
  }
  const endorsedVehicles = () => {
    const endorsedVehicles = get().allVehicles.filter(vehicle => 
    vehicle.status === 'Avalado'
   )
  
    set({ vehiclesToShow: setVehiclesToShow(endorsedVehicles) })
  }
  const noEndorsedVehicles = () => {
    const noEndorsedVehicles = get().allVehicles.filter(
      vehicle => vehicle.status === 'No avalado',
    )
    set({ vehiclesToShow: setVehiclesToShow(noEndorsedVehicles) })
  }
  const setVehicleTypes = (type:string) => {
    if (type === 'Todos') {
      set({ vehiclesToShow: setVehiclesToShow(get().allVehicles) })
      return
    }
    const vehicles = get().allVehicles
    const vehiclesToShow = vehicles.filter(vehicle => vehicle.types_of_vehicles?.name === type)

    set({ vehiclesToShow: setVehiclesToShow(vehiclesToShow) })

  }

  return {
    allVehicles: [],
    fetchVehicles,
    setActivesVehicles,
    vehiclesToShow: [],
    endorsedVehicles,
    noEndorsedVehicles,
    actualCompanyVehicles: get()?.actualCompanyVehicles,
    setVehicleTypes
  }
})
