'use client'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useLoggedUserStore } from '@/store/loggedUser'
import { useSidebarOpen } from '@/store/sidebar'
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
  const { expanded } = useSidebarOpen()
  return (
    <section
      className={cn(
        '',
        expanded ? 'md:max-w-[calc(100vw-198px)]' : 'md:max-w-[calc(100vw-70px)]',
      )}
    >
      <Card className="mt-6 px-8 md:mx-7">
        <header className="flex gap-4 mt-6 justify-between items-center flex-wrap">
          <div>
            <CardTitle className="text-4xl mb-3">Empleados</CardTitle>
            <CardDescription>
              Aquí puedes ver los empleados de tu empresa
            </CardDescription>
          </div>
          <Link
            href="/dashboard/employee/action?action=new"
            className={[
              'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
              buttonVariants({ variant: 'outline' }),
            ].join(' ')}
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
      </Card>
    </section>
  )
}

export default EmployeePage
