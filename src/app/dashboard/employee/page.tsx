'use client'
import { AlertComponent } from '@/components/AlertComponent'
import Link from 'next/link'
import { columns } from './columns'
import { DataTable } from './data-table'
import { useLoggedUserStore } from '@/store/loggedUser'
import { useEffect, useState } from 'react'

const EmployeePage = () => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const employees = useLoggedUserStore(state => state.employees)

  useEffect(() => {
    const getData = async () => {
      setData(employees)
    }

    getData()
  }, [employees])

  return (
    <main className="flex flex-col ">
      <AlertComponent />
      <header className="flex flex-col gap-4 mt-6">
        <h2 className="text-4xl">Empleados</h2>
        <p>Aquí se muestra una tabla con los empleados registrados:</p>
      </header>

      <DataTable columns={columns} data={data || []} />
      <div className="mt-4">
        <Link
          href="/dashboard/employee/new"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Agregar nuevo empleado
        </Link>
      </div>
    </main>
  )
}

export default EmployeePage
