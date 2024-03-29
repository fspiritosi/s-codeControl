'use client'
import { useLoggedUserStore } from '@/store/loggedUser'
import Link from 'next/link'
import { supabase } from '../../../../supabase/supabase'
import { columns } from './columns'
import { DataTable } from './data-table'

const EmployeePage = () => {
  const employees = useLoggedUserStore(state => state.employeesToShow)
  const setActivesEmployees = useLoggedUserStore(
    state => state.setActivesEmployees,
  )
  const setInactiveEmployees = useLoggedUserStore(
    state => state.setInactiveEmployees,
  )
  const showDeletedEmployees = useLoggedUserStore(
    state => state.showDeletedEmployees,
  )
  const setShowDeletedEmployees = useLoggedUserStore(
    state => state.setShowDeletedEmployees,
  )
  supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'employees' },
      () => {
        if (showDeletedEmployees) {
          setInactiveEmployees()
        } else {
          setActivesEmployees()
        }
      },
    )
    .subscribe()

  return (
    <section className="flex flex-col ">
      <header className="flex gap-4 mt-6 justify-between items-center flex-wrap">
        <div>
          <h2 className="text-4xl mb-3">Empleados</h2>
          <p>Aquí se muestra una tabla con los empleados registrados:</p>
        </div>
        <Link
          href="/dashboard/employee/action?action=new"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Agregar nuevo empleado
        </Link>
      </header>

      <DataTable
        columns={columns}
        data={employees || []}
        setActivesEmployees={setActivesEmployees}
        setInactiveEmployees={setInactiveEmployees}
        showDeletedEmployees={showDeletedEmployees}
        setShowDeletedEmployees={setShowDeletedEmployees}
      />
    </section>
  )
}

export default EmployeePage
