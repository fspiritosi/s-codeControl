'use client'

import { AlertComponent } from '@/components/AlertComponent'
import { columns } from './columns'
import { DataTable } from './data-table'
// import { useLoggedUserStore } from '@/store/loggedUser'

// async function getData(): Promise<Employee[]> {
//   // Fetch data from your API here.
//   return
// }

export default function Home() {
  //! La pagina se teien que recargar cada vez que pasa un cambio en estado global de la compañia seleccionada  (Probablemente tenga que ser reenderizada en el cliente)


  //Crear un arreglo de empleados
  const data = [
    {
      full_name: 'Juan Perez',
      email: 'empleado1@hotmail.com',
      cuil: '20-12345678-9',
      document_number: '12345678',
      hierarchical_position: 'Empleado',
      company_position: 'Empleado',
      normal_hours: '8',
      type_of_contract: 'Full Time',
      allocated_to: 'Empresa 1',
    },


  ]

  return (
    <main className="flex flex-col ">
      <AlertComponent />
      <h2 className="text-3xl">Empleados</h2>
      <div className="container mx-auto pt-10">
        <DataTable columns={columns} data={data} />
      </div>
    </main>
  )
}
