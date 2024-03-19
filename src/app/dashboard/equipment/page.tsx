'use client'

import { useLoggedUserStore } from '@/store/loggedUser'
import { VehiclesActualCompany } from '@/store/vehicles'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../supabase/supabase'
import { columns } from './columns'
import { DataEquipment } from './data-equipment'
export default function Equipment() {
  // const [vehiclesData, setVehiclesData] = useState<unknown[]>([])
  const allCompany = useLoggedUserStore(state => state.allCompanies)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const fetchVehicles = VehiclesActualCompany(state => state.fetchVehicles)
  const useSearch = useSearchParams()
  const type = useSearch.get('type')
  const [showInactive, setShowInactive] = useState(false)

  const vehiclesData = VehiclesActualCompany(state => state.vehiclesToShow)

  const setVehicleTypes = VehiclesActualCompany(state => state.setVehicleTypes)



  const handleToggleInactive = () => {
    setShowInactive(!showInactive)
  }
  const channels = supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vehicles' },
      payload => {
        if (actualCompany) {
          fetchVehicles(actualCompany)
        }
      },
    )
    .subscribe()

  useEffect(() => {
    if (type === '1') {
      setVehicleTypes('Vehículos')
    } else if (type === '2') {
      setVehicleTypes('Otros')
    } else if (type === 'Todos') {
      setVehicleTypes('Todos')
    }
  }, [type])

  let equipo = 'Equipos'
  if (type === '1') {
    equipo = 'Vehículos'
  }
  if (type === '2') {
    equipo = 'Otros'
  }

  return (
    <main>
      <header className="flex gap-4 mt-6 justify-between items-center">
        <div>
          <h2 className="text-4xl">{equipo}</h2>
        </div>
        <div>
          <Link
            href="/dashboard/equipment/action?action=new"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Agregar nuevo equipo
          </Link>
        </div>
      </header>
      <div className="flex flex-col min-h-screen py-3">
        <DataEquipment
          columns={columns}
          data={vehiclesData || []}
          allCompany={allCompany}
          showInactive={showInactive}
          setShowInactive={setShowInactive}
        />
      </div>
    </main>
  )
}
