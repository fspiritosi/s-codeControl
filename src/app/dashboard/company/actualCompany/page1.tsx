'use client';
import { RegisterWithRole } from '@/components/RegisterWithRole';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoggedUserStore } from '@/store/loggedUser';
import cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Contact from './contact/Contact';
import Customers from './customers/Customers';
import { columns } from './components/columns';
import { columnsGuests } from './components/columnsGuests';
import { DataTable } from './components/data-table';
import { columnsDocuments } from './components/document-colums';
import { ItemCompany } from './components/itemCompany';
import Cct from './covenant/CctComponent';
export default function page() {
  const router = useRouter();
  const company = useLoggedUserStore((state) => state.actualCompany);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const sharedUsersAll = useLoggedUserStore((state) => state.sharedUsers);
  const [verify, setVerify] = useState(false);
  const ownerUser = useLoggedUserStore((state) => state.profile);

  const [tabValue, setTabValue] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedTab') || 'general';
    } else {
      return 'general';
    }
  });
  const AllCompanyDocuments = useLoggedUserStore((state) => state.companyDocuments);

  const userShared = cookies.get('guestRole');
  const owner = ownerUser?.map((user) => {
    return {
      email: user.email,
      fullname: user.fullname as string,
      role: 'Propietario',
      alta: user.created_at ? new Date(user.created_at) : new Date(),
      id: user.id || '',
      img: user.avatar || '',
    };
  });
  const sharedUsers =
    sharedUsersAll?.map((user) => {
      return {
        email: user.profile_id.email,
        fullname: user.profile_id.fullname,
        role: user?.role,
        alta: user.created_at,
        id: user.id,
        img: user.profile_id.avatar || '',
        customerName: user.customer_id?.name,
      };
    }) || [];
  const data = owner?.concat(
    sharedUsers
      ?.filter((user) => user.role !== 'Invitado') // Filtrar usuarios donde el rol no sea "Invitado"
      ?.map((user) => ({
        ...user,
        fullname: user.fullname || '',
      })) || []
  );
  const guestsData =
    sharedUsers
      ?.filter((user) => user.role === 'Invitado') // Filtrar usuarios donde el rol no sea "Invitado"
      ?.map((user) => ({
        ...user,
        fullname: user.fullname || '',
      })) || [];

  const documentCompany = AllCompanyDocuments?.map((document) => {
    const sharedUserRole = data?.find((e) => e.email === document.user_id?.email)?.role;
    return {
      email: document.user_id?.email ?? 'Documento pendiente',
      fullname: document.id_document_types.name,
      role: sharedUserRole ?? 'Documento pendiente',
      alta: (document.user_id?.email && document.created_at) ?? 'Documento pendiente',
      id: document.id_document_types.id,
      img: document.user_id?.avatar,
      vencimiento: document.validity
        ? document.validity
        : document.id_document_types.explired
          ? 'Documento pendiente'
          : 'No expira',
      documentId: document.id,
      private: document.id_document_types.private,
    };
  });

  function compare(text: string) {
    if (text === company?.company_name) {
      setVerify(true);
    } else {
      setVerify(false);
    }
  }

  const handleEditCompany = () => {
    router.push(`/dashboard/company/${actualCompany!.id}`);
  };

  const handleTabChange = (value: any) => {
    setTabValue(value);
    localStorage.setItem('selectedTab', value);
  };

  return (
    <div className="flex flex-col gap-6 py-4 px-6">
      <Tabs defaultValue={tabValue} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="documentacion">Documentacion</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
          <TabsTrigger value="covenant">CCT</TabsTrigger>
          <TabsTrigger value="modules" disabled>
            Modulos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="w-full flex bg-muted dark:bg-muted/50 border-b-2 flex-row justify-between">
              <div className="w-fit">
                <CardTitle className="text-2xl font-bold tracking-tight w-fit">Datos generales de la empresa</CardTitle>
                <CardDescription className="text-muted-foreground w-fit">Información de la empresa</CardDescription>
              </div>
              <Button className="w-fit" onClick={handleEditCompany}>
                Editar Compañía
              </Button>
            </CardHeader>
            <CardContent className="py-4 px-4 ">
              {company && (
                <div>
                  <ItemCompany name="Razón Social" info={company.company_name} />
                  <ItemCompany name="CUIT" info={company.company_cuit} />
                  <ItemCompany name="Dirección" info={company.address} />
                  <ItemCompany name="Pais" info={company.country} />
                  <ItemCompany name="Ciudad" info={company.city.name} />
                  <ItemCompany name="Industria" info={company.industry} />
                  <ItemCompany name="Teléfono de contacto" info={company.contact_phone} />
                  <ItemCompany name="Email de contacto" info={company.contact_email} />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
          </Card>
          {userShared !== 'Administrador' && (
            <Card className=" bg-red-300 border-red-800 border-spacing-2 border-2">
              <CardHeader>ZONA PELIGROSA</CardHeader>
              <CardContent>
                <p>Al eliminiar esta empresa se eliminarán todos los registros asociado a ella.</p>
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
                      <DialogTitle>Confirmar eliminación de la empresa</DialogTitle>
                      <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col">
                      <p>
                        Por favor escribe <strong>{company?.company_name}</strong> para confirmar.
                      </p>
                      <div className="grid flex-1 gap-2">
                        <Input
                          id="user_input"
                          type="text"
                          onChange={(e) => compare(e.target.value)}
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
          )}
        </TabsContent>
        <TabsContent value="users">
          <Card className="overflow-hidden">
            <div className=" h-full flex-1 flex-col space-y-8  md:flex">
              <RegisterWithRole />
              <Tabs defaultValue="employ" className="w-full">
                <TabsList className="ml-8">
                  <TabsTrigger value="employ">Empleados</TabsTrigger>
                  <TabsTrigger value="guests">Invitados</TabsTrigger>
                </TabsList>
                <TabsContent value="employ">
                  <div className="p-8">
                    <DataTable data={data || []} columns={columns} />
                  </div>
                </TabsContent>
                <TabsContent value="guests">
                  <div className="p-8">
                    <DataTable data={guestsData || []} columns={columnsGuests} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="customers">
          <Customers />
        </TabsContent>
        <TabsContent value="contacts">
          <Contact />
        </TabsContent>
        <TabsContent value="documentacion">
          <Card className="overflow-hidden">
            <div className=" h-full flex-1 flex-col space-y-8  md:flex">
              <CardHeader className="w-full flex flex-row justify-between items-start bg-muted dark:bg-muted/50 border-b-2">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">Documentos de la empresa</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Lista de documentos a nombre de la empresa
                  </CardDescription>
                </div>
                <Link href={'/dashboard/document'} className={buttonVariants({ variant: 'default' })}>
                  Nuevo Documento
                </Link>
              </CardHeader>
              <div className="px-8 pb-8">
                <DataTable isDocuments data={documentCompany || []} columns={columnsDocuments} />
              </div>
            </div>
            <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="covenant">
          <Cct />
        </TabsContent>
        <TabsContent value="modules">Change your password here.</TabsContent>
      </Tabs>
    </div>
  );
}
