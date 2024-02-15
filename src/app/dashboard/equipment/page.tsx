'use client'

import { useLoggedUserStore } from '@/store/loggedUser'
import Link from 'next/link'
import { columns } from './columns'
import { DataEquipment } from './data-equipment'

const pruebaArray = [
  {
    picture: 'imagen1.jpg',
    type_of_vehicle: 'tipo1',
    domain: 'dominio1',
    chassis: 'chasis1',
    engine: 'motor1',
    serie: 'serie1',
    intern_number: 'numero1',
    year: 'año1',
    brand: 'marca1',
    model: 'modelo1',
  },
  {
    picture: 'imagen2.jpg',
    type_of_vehicle: 'tipo2',
    domain: 'dominio2',
    chassis: 'chasis2',
    engine: 'motor2',
    serie: 'serie2',
    intern_number: 'numero2',
    year: 'año2',
    brand: 'marca2',
    model: 'modelo2',
  },
  {
    picture: 'imagen3.jpg',
    type_of_vehicle: 'tipo3',
    domain: 'dominio3',
    chassis: 'chasis3',
    engine: 'motor3',
    serie: 'serie3',
    intern_number: 'numero3',
    year: 'año3',
    brand: 'marca3',
    model: 'modelo3',
  },
  {
    picture: 'imagen4.jpg',
    type_of_vehicle: 'tipo4',
    domain: 'dominio4',
    chassis: 'chasis4',
    engine: 'motor4',
    serie: 'serie4',
    intern_number: 'numero4',
    year: 'año4',
    brand: 'marca4',
    model: 'modelo4',
  },
]

export default function Equipment() {
  //const employees = useLoggedUserStore(state => state.employees)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      Equipos
      <DataEquipment columns={columns} data={pruebaArray || []} />
    </div>
  )
}
