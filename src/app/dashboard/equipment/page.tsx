'use client'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useLoggedUserStore } from '@/store/loggedUser'
import cookie from 'js-cookie'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../supabase/supabase'
import { columns } from './columns'
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
      <Card className="mt-6 md:mx-7 overflow-hidden">
        <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {equipo}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Aquí podrás ver todos los {equipo} que tienes registrados en tu
              empresa
            </CardDescription>
          </div>
          <Link
            href="/dashboard/equipment/action?action=new"
            className={[
              'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
              buttonVariants({ variant: 'outline', size: 'lg' }),
            ].join(' ')}
          >
            Agregar nuevo equipo
          </Link>
        </CardHeader>
        <div className="w-full grid grid-cols-1 px-8">
          <DataEquipment
            columns={columns}
            data={vehiclesData || []}
            allCompany={allCompany}
            showInactive={showInactive}
            setShowInactive={setShowInactive}
          />
        </div>
        <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
      </Card>
    </section>
  )
}
