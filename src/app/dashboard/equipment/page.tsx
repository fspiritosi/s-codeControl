'use client'

import { useLoggedUserStore } from '@/store/loggedUser'
import Link from 'next/link'
import { columns } from './columns'
import { DataEquipment } from './data-equipment'
import { supabase } from '../../../../supabase/supabase'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
export default function Equipment() {
  const [vehiclesData, setVehiclesData] = useState<unknown[]>([])
  const allCompany = useLoggedUserStore(state => state.allCompanies)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const useSearch = useSearchParams()
  const type = useSearch.get('type')

  useEffect(() => {
    // Aquí puedes realizar operaciones basadas en el valor de 'type'
    fetchVehicles()
    console.log('Tipo de filtrado:', type)
  }, [type])
  console.log('este es type: ', type)
  const fetchVehicles = async () => {
    try {
      if (!actualCompany?.id) {
        console.error('No se ha seleccionado una compañía')
        return
      }
      if (type) {
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
          .eq('type_of_vehicle', type)

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
      } else {
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
      }
    } catch (error) {
      console.error('Error al obtener los vehículos:', error)
    }
  }

  // useEffect(() => {
  //   fetchVehicles()
  // }, [])
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
      <header className="flex gap-4 mt-6 justify-between items-center">
        <div>
          <h2 className="text-4xl">Equipos</h2>
          <p>Aquí se muestran todos los Equipos:</p>
        </div>
        <div className="">
          <Link
            href="/dashboard/equipment/new"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Agregar nuevo equipo
          </Link>
        </div>
      </header>
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
