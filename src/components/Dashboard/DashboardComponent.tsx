import CardsGrid from '@/app/dashboard/componentDashboard/CardsGrid';
import DocumentsTable from '@/app/dashboard/componentDashboard/DocumentsTable';
import EmployeesTable from '@/app/dashboard/componentDashboard/EmployeesTable';
import {
  fetchAllEmployeesJUSTEXAMPLE,
  fetchAllEquipmentJUSTEXAMPLE,
  fetchAllRepairsJUSTEXAMPLE,
} from '@/app/server/GET/actions';
import { ResoursesChart } from '@/components/Graficos/ResousrsesChart';
import { MissingDocumentList } from '@/components/MissingDocumentList';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TotalDeVisitores } from './EmployeesDashboard';
import { Employeesnoq } from './EmployeesDashboard2';
import { ComponentContract } from './EmployeesDashboard2 copy';
import { ComponentStatus } from './EmployeesDashboard2copy2';
import { ComponentStatusEquipment } from './EquipmentStatusChart';
import { EquipemtTypesChart } from './TyposDeEquipos';
import { EquipmentSolicitudes } from './EquipmentSolicitudes';
import { EquipmentSolicitudesDates } from './EquipmentsSolicitudesDates';

export default async function DashboardComponent() {
  // const data = await fetchAllEmployeesJUSTEXAMPLE();
  // const data2 = await fetchAllEquipmentJUSTEXAMPLE();
  // const data3 = await fetchAllRepairsJUSTEXAMPLE();
  return (
    <div className="">
      <section className="grid sm:grid-cols-2 grid-cols-1 gap-6 mx-7">
        {false && <CardsGrid />}
        {/* <CardTitle className="text-[2vw]">Bienvenido a tu dashboard</CardTitle> */}
      </section>
      <Tabs defaultValue="Principal" className="w-full">
        <TabsList className="ml-6">
          <TabsTrigger value="Principal">Principal</TabsTrigger>
          {/* <TabsTrigger value="Empleados">Empleados</TabsTrigger> */}
          {/* <TabsTrigger value="Mantenimiento">Mantenimiento</TabsTrigger> */}
        </TabsList>
        <TabsContent className="w-full" value="Principal">
          <section className="md:mx-7 grid grid-cols-1 mt-6 xl:grid-cols-4 gap-3 mb-4 ">
            <section className="flex flex-col gap-4 w-full">
              <ResoursesChart />
              <MissingDocumentList />
            </section>
            <Card className="col-span-3 flex flex-col justify-between overflow-hidden">
              <div>
                <CardHeader className="flex flex-row items-start bg-muted dark:bg-muted/50 border-b-2">
                  <div className="grid gap-1">
                    <CardTitle className="flex items-center text-lg ">Proximos vencimientos</CardTitle>
                    <CardDescription className="capitalize">
                      Documentos que vencen en los proximos 30 dias
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent></CardContent>
                <div>
                  <Tabs defaultValue="Empleados">
                    <CardContent className="pb-0 pl-4">
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
        </TabsContent>
        {/* <TabsContent value="Empleados">
          <div className="grid grid-cols-2 gap-4 p-7">
            <TotalDeVisitores employees={data} />
            <Employeesnoq employees={data} />
            <ComponentContract employees={data} />
            <ComponentStatus employees={data} />
          </div>
        </TabsContent>
        <TabsContent value="Mantenimiento">
          <div className="grid grid-cols-2 gap-4 p-7">
            <EquipmentSolicitudesDates solicitudes={data3} />
            <EquipemtTypesChart equipments={data2} />
            <EquipmentSolicitudes solicitudes={data3}/>
            <ComponentStatusEquipment equipments={data2} />
          </div>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
