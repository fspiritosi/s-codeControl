// import DocumentsTable from '@/app/dashboard/componentDashboard/DocumentsTable';
// import EmployeesTable from '@/app/dashboard/componentDashboard/EmployeesTable';
// import { ResoursesChart } from '@/components/Graficos/ResousrsesChart';
// import { MissingDocumentList } from '@/components/MissingDocumentList';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// export default function DashboardContent() {
//   return {
//     resources: <ResoursesChart />,
//     missingDocuments: <MissingDocumentList />,
//     expiringDocuments: (

// <Card className="col-span-3 flex flex-col justify-between overflow-hidden">
// <div>
//   <CardHeader className="flex flex-row items-start bg-muted dark:bg-muted/50 border-b-2">
//     <div className="grid gap-1">
//       <CardTitle className="flex items-center text-lg ">Proximos vencimientos</CardTitle>
//       <CardDescription className="capitalize">Documentos que vencen en los proximos 30 dias</CardDescription>
//     </div>
//   </CardHeader>
//   <CardContent></CardContent>
//   <div className='flex-grow'>
//     <Tabs defaultValue="Empleados">
//       <CardContent>
//         <TabsList>
//           <TabsTrigger value="Empleados">Empleados</TabsTrigger>
//           <TabsTrigger value="Vehiculos">Vehiculos</TabsTrigger>
//         </TabsList>
//       </CardContent>
//       <TabsContent value="Empleados">
//         <EmployeesTable />
//       </TabsContent>
//       <TabsContent value="Vehiculos">
//         <DocumentsTable />
//       </TabsContent>
//     </Tabs>
//   </div>
// </div>
// <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
// </Card>

//     ),
//   };
// }
