import { ResoursesChart } from '@/components/Graficos/ResousrsesChart';
import { MissingDocumentList } from '@/components/MissingDocumentList';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTotalResourses } from '@/lib/utils/geters';
import CardsGrid from './componentDashboard/CardsGrid';
import DocumentsTable from './componentDashboard/DocumentsTable';
import EmployeesTable from './componentDashboard/EmployeesTable';

export default async function Home() {
  const employees = await getTotalResourses();
  return (
    <div className="">
      <section className="grid sm:grid-cols-2 grid-cols-1 gap-6 mx-7">
        {false && <CardsGrid />}
        {/* <CardTitle className="text-[2vw]">Bienvenido a tu dashboard</CardTitle> */}
      </section>
      <section className="md:mx-7 grid grid-cols-1 mt-6 xl:grid-cols-4 gap-3 mb-4">
        <section className="flex flex-col gap-4">
          <ResoursesChart data={employees} />
          <MissingDocumentList />
        </section>
        <Card className="col-span-3 flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="flex flex-row items-start bg-muted dark:bg-muted/50 border-b-2">
              <div className="grid gap-1">
                <CardTitle className="flex items-center text-lg ">Proximos vencimientos</CardTitle>
                <CardDescription className="capitalize">Documentos que vencen en los proximos 30 dias</CardDescription>
              </div>
            </CardHeader>

            <CardContent></CardContent>
            <div>
              <Tabs defaultValue="Empleados">
                <CardContent>
                  <TabsList>
                    <TabsTrigger value="Empleados">Empleados</TabsTrigger>
                    <TabsTrigger value="Vehiculos">Vehiculos</TabsTrigger>
                  </TabsList>
                </CardContent>
                <TabsContent value="Empleados">
                  <EmployeesTable />
                </TabsContent>
                <TabsContent value="Vehiculos">
                  <DocumentsTable />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
        </Card>
      </section>
    </div>
  );
}
