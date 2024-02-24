'use client'

import { useLoggedUserStore } from '@/store/loggedUser'
import Link from 'next/link'
import { columns } from './columns'
import { DataEquipment } from './data-equipment'
import { supabase } from '../../../../supabase/supabase'
import { useEffect, useState } from 'react'

export default function Equipment() {
  const [vehiclesData, setVehiclesData] = useState<unknown[]>([])
  const allCompany = useLoggedUserStore(state => state.allCompanies)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const fetchVehicles = async () => {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(
          `*,
        types_of_vehicles(name),
        brand_vehicles(name),
        model_vehicles(name)`,
        )
        .eq('is_active', true)
        .eq('company_id', actualCompany?.id)

      if (error) {
        console.error('Error al obtener los vehículos:', error)
      } else {
        const transformedData = vehicles.map(item => ({
          ...item,
          types_of_vehicles: item.types_of_vehicles.name,
          brand: item.brand_vehicles.name,
          model: item.model_vehicles.name,
        }))
        setVehiclesData(transformedData)
      }
    } catch (error) {
      console.error('Error al obtener los vehículos:', error)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])
  useEffect(() => {
    const channels = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        payload => {
          fetchVehicles()
        },
      )
      .subscribe()
  }, [])

  return (
    <main className="bg-white">
      <h2 className="text-3xl pb-5 pl-10">Todos los Equipos</h2>
      <p className="pl-10 max-w-1/2">Aquí se verán todos los Equipos</p>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <DataEquipment
          columns={columns}
          data={vehiclesData || []}
          allCompany={allCompany}
        />
      </div>
    </main>
  )
}
