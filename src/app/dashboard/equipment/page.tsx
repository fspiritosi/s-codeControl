'use client';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoggedUserStore } from '@/store/loggedUser';
import { default as Cookies, default as cookie } from 'js-cookie';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { supabase } from '../../../../supabase/supabase';
import { columns } from './columns';
import { DataEquipment } from './data-equipment';

export default function Equipment() {
  const allCompany = useLoggedUserStore((state) => state.allCompanies);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const fetchVehicles = useLoggedUserStore((state) => state.fetchVehicles);
  const [showInactive, setShowInactive] = useState(false);
  const vehiclesData = useLoggedUserStore((state) => state.vehiclesToShow);
  const onlyVehicles = vehiclesData?.filter((v) => v.type_of_vehicle === 1);
  const onlyOthers = vehiclesData?.filter((v) => v.type_of_vehicle === 2);
  const actualCompanyID = cookie.get('actualCompanyId');

  const [tabValue, setTabValue] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedEquipmentTab') || 'all';
    } else {
      return 'all';
    }
  });

  const profile = useLoggedUserStore((state) => state);

  if (typeof window !== 'undefined') {
    const company_id = localStorage.getItem('company_id');
    if (company_id) {
      Cookies.set('actualComp', company_id as string);
    }
  }
  let role: string = '';

  if (profile?.actualCompany?.owner_id.id === profile?.credentialUser?.id) {
    role = (profile?.actualCompany?.owner_id?.role as string) || '';
  } else {
    role = (profile?.actualCompany?.share_company_users?.[0]?.role as string) || '';
  }

  const channels = supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload) => {
      if (actualCompany) {
        fetchVehicles();
      }
    })
    .subscribe();

  const handleTabChange = (value: any) => {
    setTabValue(value);
    localStorage.setItem('selectedEquipmentTab', value);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <section className="flex flex-col gap-6 py-4 px-6">
        <Tabs defaultValue={tabValue} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">Equipos</TabsTrigger>
            <TabsTrigger value="vehicles">Vehículos</TabsTrigger>
            <TabsTrigger value="others">Otros</TabsTrigger>
            {/* {
            role !== 'Invitado' && (
              <TabsTrigger value="forms">Check List</TabsTrigger>
            )
          } */}
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card className="mt-6  overflow-hidden">
              <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">Equipos</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Aquí podrás ver todos los Equipos que tienes registrados en tu empresa
                  </CardDescription>
                </div>
                {role !== 'Invitado' && (
                  <Link
                    href="/dashboard/equipment/action?action=new"
                    className={[
                      'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                      buttonVariants({ variant: 'default', size: 'lg' }),
                    ].join(' ')}
                  >
                    Agregar nuevo equipo
                  </Link>
                )}
              </CardHeader>
              <div className="w-full grid grid-cols-1 px-8">
                <DataEquipment
                  columns={columns}
                  data={vehiclesData || []}
                  allCompany={allCompany}
                  showInactive={showInactive}
                  setShowInactive={setShowInactive}
                />
              </div>
              <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="vehicles" className="space-y-4">
            <Card className="mt-6 overflow-hidden">
              <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">Vehículos</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Aquí podrás ver todos los Vehículos que tienes registrados en tu empresa
                  </CardDescription>
                </div>
                {role !== 'Invitado' && (
                  <Link
                    href="/dashboard/equipment/action?action=new"
                    className={[
                      'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                      buttonVariants({ variant: 'default', size: 'lg' }),
                    ].join(' ')}
                  >
                    Agregar nuevo vehículo
                  </Link>
                )}
              </CardHeader>
              <div className="w-full grid grid-cols-1 px-8">
                <DataEquipment
                  columns={columns}
                  data={onlyVehicles || []}
                  allCompany={allCompany}
                  showInactive={showInactive}
                  setShowInactive={setShowInactive}
                />
              </div>
              <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="others" className="space-y-4">
            <Card className="mt-6 overflow-hidden">
              <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">Otro Equipamiento</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Aquí podrás ver todos los Otros Equipos que tienes registrados en tu empresa
                  </CardDescription>
                </div>
                {role !== 'Invitado' && (
                  <Link
                    href="/dashboard/equipment/action?action=new"
                    className={[
                      'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                      buttonVariants({ variant: 'default', size: 'lg' }),
                    ].join(' ')}
                  >
                    Agregar nuevo equipo
                  </Link>
                )}
              </CardHeader>
              <div className="w-full grid grid-cols-1 px-8">
                <DataEquipment
                  columns={columns}
                  data={onlyOthers || []}
                  allCompany={allCompany}
                  showInactive={showInactive}
                  setShowInactive={setShowInactive}
                />
              </div>
              <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
            </Card>
          </TabsContent>
          {/* <TabsContent value="forms" className="space-y-4">
            <Card className="mt-6 overflow-hidden">
            <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Check List de Equipos</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Listado de todos los check List realizados a tus equipos
                </CardDescription>
              </div>
              {role !== 'Invitado' && (
                <Link
                  href="/dashboard/equipment/action?action=new"
                  className={[
                    'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                  ].join(' ')}
                >
                  Crear nuevo Check List
                </Link>
              )}
            </CardHeader>
              <div className="w-full grid grid-cols-1 px-8">
                <DataEquipment
                  columns={columns}
                  data={onlyOthers || []}
                  allCompany={allCompany}
                  showInactive={showInactive}
                  setShowInactive={setShowInactive}
                />
              </div>
            <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
            </Card>
          </TabsContent> */}
        </Tabs>
      </section>
    </Suspense>
  );
}
