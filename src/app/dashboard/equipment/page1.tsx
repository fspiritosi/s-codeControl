// 'use client';
// import { buttonVariants } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useLoggedUserStore } from '@/store/loggedUser';
// import { default as Cookies, default as cookie } from 'js-cookie';
// import Link from 'next/link';
// import { Suspense, useEffect, useState } from 'react';
// import { supabase } from '../../../../supabase/supabase';
// import { columns } from './columns';
// import { DataEquipment } from './data-equipment';
// import TypesDocumentsView from '../document/documentComponents/TypesDocumentsView';
// import EquipmentDocumentsTable from '../document/documentComponents/EquipmentDocumentsTable';


// import { Resend } from 'resend';
// import { EmailTemplate } from '../../../components/EmailTemplate';
// import { EmailTemplateHelp } from '../../../components/EmailTemplateHelp';
// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function POST(request: Request) {
//   try {
//     const requestData = await request.json();
//     const userEmail = requestData.userEmail;

//     const template =
//       requestData.to === 'info@codecontrol.com.ar'
//         ? EmailTemplateHelp({ userEmail: userEmail, reason: requestData.react })
//         : EmailTemplate({
//             userEmail: userEmail,
//             reason: requestData.react,
//             emailInfo: requestData.body,
//           });
//     const data = await resend.emails.send({
//       //from: 'Codecontrol <onboarding@resend.dev>',
//       from: 'Codecontrol <team@codecontrol.com.ar>',
//       to: requestData.to,
//       subject: requestData.subject,
//       react: template,
//       text: '',
//     });

//     return Response.json(data);
//   } catch (error) {
//     return Response.json({ error });
//   }
// }

// const name = await fetch('/api/equipment')
// const res = name.json()
// //console.log(res)

// export default function Equipmenta() {
//   const allCompany = useLoggedUserStore((state) => state.allCompanies);
//   const actualCompany = useLoggedUserStore((state) => state.actualCompany);
//   const fetchVehicles = useLoggedUserStore((state) => state.fetchVehicles);
//   const [showInactive, setShowInactive] = useState(false);
//   const vehiclesData = useLoggedUserStore((state) => state.vehiclesToShow);
//   const onlyVehicles = vehiclesData?.filter((v) => v.type_of_vehicle === 1);
//   const onlyOthers = vehiclesData?.filter((v) => v.type_of_vehicle === 2);
//   const [clientData, setClientData] = useState<any>(null);
//   const share = useLoggedUserStore((state) => state.sharedCompanies);
//   const profile = useLoggedUserStore((state) => state.credentialUser?.id);
//   const owner = useLoggedUserStore((state) => state.actualCompany?.owner_id.id);
//   const users = useLoggedUserStore((state) => state);
//   const company = useLoggedUserStore((state) => state.actualCompany?.id);
//   const actualCompanyID = cookie.get('actualCompanyId');

//   // Es para que siempre vuelva a la ultima pestaña que visitó
//   const [tabValue, setTabValue] = useState<string>(() => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('selectedEquipmentTab') || 'all';
//     } else {
//       return 'all';
//     }
//   });



//   if (typeof window !== 'undefined') {
//     const company_id = localStorage.getItem('company_id');
//     if (company_id) {
//       Cookies.set('actualComp', company_id as string);
//     }
//   }
//   // let role: string = '';

//   // if (profile?.actualCompany?.owner_id.id === profile?.credentialUser?.id) {
//   //   role = (profile?.actualCompany?.owner_id?.role as string) || '';
//   // } else {
//   //   role = (profile?.actualCompany?.share_company_users?.[0]?.role as string) || '';
//   // }

//   // ver si esto no esta en el profile del state
  

//   let role = '';
//   if (owner === profile) {
//     role = users?.actualCompany?.owner_id?.role as string;
//   } else {
//     // const roleRaw = share?.filter((item: any) => Object.values(item).some((value) => typeof value === 'string' && value.includes(profile as string))).map((item: any) => item.role);
//     const roleRaw = share?.filter((item: any) =>
//         item.company_id.id === company &&
//         Object.values(item).some((value) => typeof value === 'string' && value.includes(profile as string))
//       )
//       .map((item: any) => item.role);
//     role = roleRaw?.join('');
//   }

//   useEffect(() => {

//     if (company && profile && role === "Invitado") {
//       const fetchCustomers = async () => {
//         const { data, error } = await supabase
//           .from('share_company_users')
//           .select('*')
//           .eq('company_id', company)
//           .eq('profile_id', profile);

//         if (error) {
//           console.error('Error fetching customers:', error);
//         } else {
//           setClientData(data);

//         }
//       };

//       fetchCustomers();
//     }
//   }, [company, profile]);
  
//   const filteredCustomersEquipment = vehiclesData?.filter((customer: any) =>
//     customer.allocated_to?.includes(clientData?.[0]?.customer_id)
//   );
//   const filteredCustomersVehicles = onlyVehicles?.filter((customer: any) =>
//     customer.allocated_to?.includes(clientData?.[0]?.customer_id)
//   );
//   const filteredCustomersOthers = onlyOthers?.filter((customer: any) =>
//     customer.allocated_to?.includes(clientData?.[0]?.customer_id)
//   );
//   const channels = supabase
//     .channel('custom-all-channel')
//     .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload) => {
//       if (actualCompany) {
//         fetchVehicles();
//       }
//     })
//     .subscribe();

//   const handleTabChange = (value: any) => {
//     setTabValue(value);
//     localStorage.setItem('selectedEquipmentTab', value);
//   };


//   // todos - Vehiculos - otros equipos 
//   // si Es invitado - filtrar para el customerId

//   return (
//     <Suspense fallback={<div>Loading...</div>}>
//       <section className="flex flex-col gap-6 py-4 px-6">
//         <Tabs defaultValue={tabValue} onValueChange={handleTabChange}>
//           <TabsList>
//             <TabsTrigger value="all">Equipos</TabsTrigger>
//             <TabsTrigger value="vehicles">Vehículos</TabsTrigger>
//             <TabsTrigger value="others">Otros</TabsTrigger>
//             <TabsTrigger value="documents_type">Documentación</TabsTrigger>
//             {/* {
//             role !== 'Invitado' && (
//               <TabsTrigger value="forms">Check List</TabsTrigger>
//             )
//           } */}
//           </TabsList>
//           <TabsContent value="all" className="space-y-4">
//             <Card className="mt-6  overflow-hidden">
//               <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
//                 <div>
//                   <CardTitle className="text-2xl font-bold tracking-tight">Equipos</CardTitle>
//                   <CardDescription className="text-muted-foreground">
//                     Aquí podrás ver todos los Equipos que tienes registrados en tu empresa
//                   </CardDescription>
//                 </div>
//                 {role !== 'Invitado' && (
//                   <Link
//                     href="/dashboard/equipment/action?action=new"
//                     className={[
//                       'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
//                       buttonVariants({ variant: 'default', size: 'lg' }),
//                     ].join(' ')}
//                   >
//                     Agregar nuevo equipo
//                   </Link>
//                 )}
//               </CardHeader>
//               <div className="w-full grid grid-cols-1 px-8">
//                 <DataEquipment
//                   columns={columns}
//                   data={role === "Invitado" ? filteredCustomersEquipment :vehiclesData || []}
//                   allCompany={allCompany}
//                   showInactive={showInactive}
//                   setShowInactive={setShowInactive}
//                 />
//               </div>
//               <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
//             </Card>
//           </TabsContent>
//           <TabsContent value="vehicles" className="space-y-4">
//             <Card className="mt-6 overflow-hidden">
//               <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
//                 <div>
//                   <CardTitle className="text-2xl font-bold tracking-tight">Vehículos</CardTitle>
//                   <CardDescription className="text-muted-foreground">
//                     Aquí podrás ver todos los Vehículos que tienes registrados en tu empresa
//                   </CardDescription>
//                 </div>
//                 {role !== 'Invitado' && (
//                   <Link
//                     href="/dashboard/equipment/action?action=new"
//                     className={[
//                       'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
//                       buttonVariants({ variant: 'default', size: 'lg' }),
//                     ].join(' ')}
//                   >
//                     Agregar nuevo vehículo
//                   </Link>
//                 )}
//               </CardHeader>
//               <div className="w-full grid grid-cols-1 px-8">
//                 <DataEquipment
//                   columns={columns}
//                   data={role === "Invitado" ? filteredCustomersVehicles :onlyVehicles || []}
//                   allCompany={allCompany}
//                   showInactive={showInactive}
//                   setShowInactive={setShowInactive}
//                 />
//               </div>
//               <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
//             </Card>
//           </TabsContent>
//           <TabsContent value="others" className="space-y-4">
//             <Card className="mt-6 overflow-hidden">
//               <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
//                 <div>
//                   <CardTitle className="text-2xl font-bold tracking-tight">Otro Equipamiento</CardTitle>
//                   <CardDescription className="text-muted-foreground">
//                     Aquí podrás ver todos los Otros Equipos que tienes registrados en tu empresa
//                   </CardDescription>
//                 </div>
//                 {role !== 'Invitado' && (
//                   <Link
//                     href="/dashboard/equipment/action?action=new"
//                     className={[
//                       'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
//                       buttonVariants({ variant: 'default', size: 'lg' }),
//                     ].join(' ')}
//                   >
//                     Agregar nuevo equipo
//                   </Link>
//                 )}
//               </CardHeader>
//               <div className="w-full grid grid-cols-1 px-8">
//                 <DataEquipment
//                   columns={columns}
//                   data={role === "Invitado"? filteredCustomersOthers :onlyOthers || []}
//                   allCompany={allCompany}
//                   showInactive={showInactive}
//                   setShowInactive={setShowInactive}
//                 />
//               </div>
//               <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
//             </Card>
//           </TabsContent>
//           <TabsContent value='documents_type'>
//             <Card>
//               <CardHeader>
//                 <CardTitle>Documentación Equipos</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Tabs>
//                   <TabsList>
//                     <TabsTrigger value='equipment_doc'>Documentos de Equipos</TabsTrigger>
//                     <TabsTrigger value='types'>
//                       Tipos de Documentos
//                     </TabsTrigger>
//                   </TabsList>
//                   <TabsContent value='equipment_doc'>
//                     {/* <EquipmentDocumentsTable /> */}
//                     Tabla de documentos de equipos
//                   </TabsContent>
//                   <TabsContent value='types'>
//                   <TypesDocumentsView equipos/>
//                   </TabsContent>
//                 </Tabs>
//               </CardContent>
//             </Card>
            
//           </TabsContent>
//           {/* <TabsContent value="forms" className="space-y-4">
//             <Card className="mt-6 overflow-hidden">
//             <CardHeader className=" flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
//               <div>
//                 <CardTitle className="text-2xl font-bold tracking-tight">Check List de Equipos</CardTitle>
//                 <CardDescription className="text-muted-foreground">
//                   Listado de todos los check List realizados a tus equipos
//                 </CardDescription>
//               </div>
//               {role !== 'Invitado' && (
//                 <Link
//                   href="/dashboard/equipment/action?action=new"
//                   className={[
//                     'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
//                     buttonVariants({ variant: 'outline', size: 'lg' }),
//                   ].join(' ')}
//                 >
//                   Crear nuevo Check List
//                 </Link>
//               )}
//             </CardHeader>
//               <div className="w-full grid grid-cols-1 px-8">
//                 <DataEquipment
//                   columns={columns}
//                   data={onlyOthers || []}
//                   allCompany={allCompany}
//                   showInactive={showInactive}
//                   setShowInactive={setShowInactive}
//                 />
//               </div>
//             <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
//             </Card>
//           </TabsContent> */}
//         </Tabs>
//       </section>
//     </Suspense>
//   );
// }