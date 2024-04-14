'use client'
import { useLoggedUserStore } from '@/store/loggedUser'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card" 
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Copy } from 'lucide-react'
import { useState } from 'react'
import { set } from 'date-fns'
import { cn } from '@/lib/utils'
import  {ItemCompany}  from '@/app/dashboard/company/companyComponents/itemCompany'






export default function page() {
  const company = useLoggedUserStore(state => state.actualCompany)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const [verify, setVerify] = useState(false)
  
  function compare(text: string){
    if(text === company?.company_name){
      setVerify(true)
    }else{
      setVerify(false)
    }
  }

  return (
    <div className='flex flex-col gap-6 py-4'>
    <div className='w-full flex mb-6'>
      <Image src={company?.company_logo || ''} alt={company?.company_name || ''} width={200} height={200}/>
    </div>
   
    <Tabs defaultValue="general" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="users">Usuarios</TabsTrigger>
        <TabsTrigger value="modules">Modulos</TabsTrigger>
      </TabsList>
      <TabsContent value="general" >
        <Card className='py-4 px-4 md:w-[85vw]'>
        <CardHeader className='items-center'>Datos generales de la empresa</CardHeader>
        <CardContent>
        {company && (
          <div>
            <ItemCompany name='Razón Social' info={company.company_name} />
            <ItemCompany name='CUIT' info={company.company_cuit} />
            <ItemCompany name='Dirección' info={company.address} />
            <ItemCompany name='Pais' info={company.country} />
            <ItemCompany name='Ciudad' info={company.city.name} />
            <ItemCompany name='Industria' info={company.industry} />
            <ItemCompany name='Teléfono de contacto' info={company.contact_phone} />
            <ItemCompany name='Email de contacto' info={company.contact_email} />
          </div>
        )}

        </CardContent>
        </Card>
        
      </TabsContent>
      <TabsContent value="users">
        {/* <Table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {actualCompany?.users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </Table> */}
      </TabsContent>
      <TabsContent value="modules">Change your password here.</TabsContent>
    </Tabs>

    <Card className='md:w-[85vw] bg-red-300 border-red-800 border-spacing-2 border-2' >
        <CardHeader>ZONA PELIGROSA</CardHeader>
        <CardContent>
          <p>Al eliminiar esta empresa se eliminarán todos los registros asociado a ella.</p>
          <p>Esta acción no se puede deshacer.</p>
          
        </CardContent>
        <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='outline' className='bg-red-500 bg-opacity-80 border-red-700 border-2 text-red-700 hover:bg-red-700 hover:text-red-500'>Eliminar Empresa</Button>
          </DialogTrigger>
          <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar eliminación de la empresa</DialogTitle>
          <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          <p>Por favor escribe <strong>{company?.company_name}</strong> para confirmar.</p>
          <div className="grid flex-1 gap-2">
            
            <Input
              id="user_input"
              type='text'
              onChange={(e) => compare(e.target.value)}
              className={verify ? 'border-green-400 bg-green-300 text-green-700' : 'focus:border-red-400 focus:bg-red-300 text-red-700'}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
         
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cerrar
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant="destructive" >
              Eliminar
            </Button>
          </DialogClose>
        </DialogFooter>
       </DialogContent>
        </Dialog>
       
        </CardFooter>
    </Card>    

    </div>
  )
}

//export default page
