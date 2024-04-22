'use client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLoggedUserStore } from '@/store/loggedUser'
import Image from 'next/image'
import { useState } from 'react'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { ItemCompany } from './components/itemCompany'






export default function page() {
  const company = useLoggedUserStore(state => state.actualCompany)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const [verify, setVerify] = useState(false)

  const data = actualCompany?.share_company_users.map(( user ) => {
    return {
      email: user.profile.email,
      fullname: user.profile.fullname,
      role: user.role,
      alta: user.created_at,
      id:user.id,
      img: user.profile.avatar,
    }
  }) || []

  function compare(text: string) {
    if (text === company?.company_name) {
      setVerify(true)
    } else {
      setVerify(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 py-4 px-6">
      <div className="w-full flex mb-6">
        <Image
          src={company?.company_logo || ''}
          alt={company?.company_name || ''}
          width={200}
          height={200}
        />
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="modules">Modulos</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card className="py-4 px-4 ">
            <CardHeader>
              <CardTitle>Datos generales de la empresa</CardTitle>
            </CardHeader>
            <CardContent>
              {company && (
                <div>
                  <ItemCompany
                    name="Razón Social"
                    info={company.company_name}
                  />
                  <ItemCompany name="CUIT" info={company.company_cuit} />
                  <ItemCompany name="Dirección" info={company.address} />
                  <ItemCompany name="Pais" info={company.country} />
                  <ItemCompany name="Ciudad" info={company.city.name} />
                  <ItemCompany name="Industria" info={company.industry} />
                  <ItemCompany
                    name="Teléfono de contacto"
                    info={company.contact_phone}
                  />
                  <ItemCompany
                    name="Email de contacto"
                    info={company.contact_email}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          <Card className=" bg-red-300 border-red-800 border-spacing-2 border-2">
            <CardHeader>ZONA PELIGROSA</CardHeader>
            <CardContent>
              <p>
                Al eliminiar esta empresa se eliminarán todos los registros
                asociado a ella.
              </p>
              <p>Esta acción no se puede deshacer.</p>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-red-500 bg-opacity-80 border-red-700 border-2 text-red-700 hover:bg-red-700 hover:text-red-500"
                  >
                    Eliminar Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Confirmar eliminación de la empresa
                    </DialogTitle>
                    <DialogDescription>
                      Esta acción no se puede deshacer.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col">
                    <p>
                      Por favor escribe <strong>{company?.company_name}</strong>{' '}
                      para confirmar.
                    </p>
                    <div className="grid flex-1 gap-2">
                      <Input
                        id="user_input"
                        type="text"
                        onChange={e => compare(e.target.value)}
                        className={
                          verify
                            ? 'border-green-400 bg-green-300 text-green-700'
                            : 'focus:border-red-400 focus:bg-red-300 text-red-700'
                        }
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
                      <Button type="button" variant="destructive">
                        Eliminar
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <div className=" h-full flex-1 flex-col space-y-8 p-8 md:flex">
              <div className="flex items-center justify-between space-y-2">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Compartir acceso
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Comparte el acceso a tu empresa con otros usuarios.
                  </CardDescription>
                </div>
              </div>
              <DataTable data={data} columns={columns} />
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="modules">Change your password here.</TabsContent>
      </Tabs>
    </div>
  )
}

//export default page