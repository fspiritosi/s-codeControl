import { AlertComponent } from '@/components/AlertComponent'
import Link from 'next/link'
import { columns } from './columns'
import { DataTable } from './data-table'

const EmployeePage = () => {
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
      type_of_contract: 'A tiempo indeterminado',
      allocated_to: 'Empresa 1',
      picture: 'picture.com',
      nationality: 'Argentina',
      lastname: 'Perez',
      firstname: 'Juan',
      document_type: 'DNI',
      birthplace: 'Buenos Aires',
      gender: 'Masculino',
      marital_status: 'Soltero',
      level_of_education: 'Universitario',
      street: 'Calle 123',
      street_number: '123',
      province: 'Buenos Aires',
      postal_code: '1234',
      phone: '12345678',
      file: '123',
      date_of_admission: '01/01/2021',
      affiliate_status: 'Fuera de convenio',
      city: 'Buenos Aires',
      hierrical_position: 'Empleado',
      workflow_diagram: '123',
    },
  ]

  return (
    <main className="flex flex-col ">
      <AlertComponent />
      <header className="flex flex-col gap-4 mt-6">
        <h2 className="text-4xl">Empleados</h2>
        <p>Aquí se muestra una tabla con los empleados registrados:</p>
      </header>

      <DataTable columns={columns} data={data} />
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
