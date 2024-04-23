'use client'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { useLoggedUserStore } from '@/store/loggedUser'
import { VehiclesActualCompany } from '@/store/vehicles'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../supabase/supabase'
import { columns } from './columns'
import cookie from 'js-cookie'
import { DataEquipment } from './data-equipment'
export default function Equipment() {
  const allCompany = useLoggedUserStore(state => state.allCompanies)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const fetchVehicles = useLoggedUserStore(state => state.fetchVehicles)
  const useSearch = useSearchParams()
  const type = useSearch.get('type')
  const [showInactive, setShowInactive] = useState(false)
  const vehiclesData = useLoggedUserStore(state => state.vehiclesToShow)
  const setVehicleTypes = useLoggedUserStore(state => state.setVehicleTypes)
  const actualCompanyID = cookie.get('actualCompanyId')

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
          fetchVehicles()
        }
      },
    )
    .subscribe()

  useEffect(() => {
    // if (vehiclesData.length === 0) {
      fetchVehicles()
    // }
  }, [actualCompanyID])

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
    <section>
      <Card className="mt-6 px-8  md:mx-7">
        <header className="flex gap-4 mt-6 justify-between items-center flex-wrap">
          <div>
            <CardTitle className="text-4xl mb-3">{equipo}</CardTitle>
            <CardDescription>
              Aquí podrás ver todos los {equipo} que tienes registrados en tu
              empresa
            </CardDescription>
          </div>
          <div>
            <Link
              href="/dashboard/equipment/action?action=new"
              className={[
                'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                buttonVariants({ variant: 'outline', size: 'lg' }),
              ].join(' ')}
            >
              Agregar nuevo equipo
            </Link>
          </div>
        </header>
        <div className="w-full grid grid-cols-1">
          <DataEquipment
            columns={columns}
            data={vehiclesData || []}
            allCompany={allCompany}
            showInactive={showInactive}
            setShowInactive={setShowInactive}
          />
        </div>
      </Card>
    </section>
  )
}
