'use client'
import { AlertComponent } from '@/components/AlertComponent'
import { useLoggedUserStore } from '@/store/loggedUser'
import Link from 'next/link'
import { columns } from './columns'
import { DataTable } from './data-table'

const EmployeePage = () => {
  const employees = useLoggedUserStore(state => state.employees)

  return (
    <main className="flex flex-col ">
      <AlertComponent />
      <header className="flex flex-col gap-4 mt-6">
        <h2 className="text-4xl">Empleados</h2>
        <p>Aquí se muestra una tabla con los empleados registrados:</p>
      </header>

      <DataTable columns={columns} data={employees || []} />
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
