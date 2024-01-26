// 'use client'

import { Employee } from '@/types/types'
import { columns } from './columns'
import { DataTable } from './data-table'
import { AlertComponent } from '@/components/AlertComponent'

async function getData(): Promise<Employee[]> {
  // Fetch data from your API here.
  return [
    {
      id: '728ed52f',
      nombre: 'Juan Perez',
      email: 'Juan@hotmail.com',
      cuil: '20-12345678-9',
      document: '12345678',
      foto: 'Photo',
    },
    {
      id: '2376763',
      nombre: 'Maria Lujan',
      email: 'maria@gmail.com',
      cuil: '20-12345674-9',
      document: '1122334455',
      foto: 'Photo',
    },
    {
      id: '3a4b5c6d',
      nombre: 'Pedro Sanchez',
      email: 'pedro@gmail.com',
      cuil: '20-98765432-1',
      document: '98765432',
      foto: 'Photo',
    },
    {
      id: 'e1f2g3h4',
      nombre: 'Laura Rodriguez',
      email: 'laura@hotmail.com',
      cuil: '20-56789012-3',
      document: '56789012',
      foto: 'Photo',
    },
    {
      id: '5i6j7k8l',
      nombre: 'Carlos Gomez',
      email: 'carlos@gmail.com',
      cuil: '20-34567890-1',
      document: '34567890',
      foto: 'Photo',
    },
    {
      id: 'm9n0o1p2',
      nombre: 'Ana Martinez',
      email: 'ana@hotmail.com',
      cuil: '20-09876543-2',
      document: '09876543',
      foto: 'Photo',
    },
    {
      id: '3q4r5s6t',
      nombre: 'Luisa Fernandez',
      email: 'luisa@gmail.com',
      cuil: '20-65432109-8',
      document: '65432109',
      foto: 'Photo',
    },
    {
      id: 'u7v8w9x0',
      nombre: 'Diego Ramirez',
      email: 'diego@hotmail.com',
      cuil: '20-43210987-6',
      document: '43210987',
      foto: 'Photo',
    },
    {
      id: '1y2z3a4b',
      nombre: 'Sofia Torres',
      email: 'sofia@gmail.com',
      cuil: '20-21098765-4',
      document: '21098765',
      foto: 'Photo',
    },
    {
      id: 'c5d6e7f8',
      nombre: 'Julia Castro',
      email: 'julia@hotmail.com',
      cuil: '20-87654321-0',
      document: '87654321',
      foto: 'Photo',
    },
    {
      id: '9g0h1i2j',
      nombre: 'Fernando Lopez',
      email: 'fernando@gmail.com',
      cuil: '20-54321098-7',
      document: '54321098',
      foto: 'Photo',
    },
    {
      id: 'k3l4m5n6',
      nombre: 'Carolina Silva',
      email: 'carolina@hotmail.com',
      cuil: '20-32109876-5',
      document: '32109876',
      foto: 'Photo',
    },
    {
      id: '7o8p9q0r',
      nombre: 'Gabriel Herrera',
      email: 'gabriel@gmail.com',
      cuil: '20-10987654-3',
      document: '10987654',
      foto: 'Photo',
    },
    {
      id: 's1t2u3v4',
      nombre: 'Valentina Rios',
      email: 'valentina@hotmail.com',
      cuil: '20-98765432-1',
      document: '98765432',
      foto: 'Photo',
    },
    {
      id: '5w6x7y8z',
      nombre: 'Lucas Mendoza',
      email: 'lucas@gmail.com',
      cuil: '20-76543210-9',
      document: '76543210',
      foto: 'Photo',
    }

  ]
}

export default async function Home() {

  const data = await getData()

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
