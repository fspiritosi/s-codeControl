'use client';
import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoggedUserStore } from '@/store/loggedUser';
import { ExpiredColums } from '../../colums';
import { ColumnsMonthly } from '../../columsMonthly';
import { ExpiredDataTable } from '../../data-table';

function page() {
  const { allDocumentsToShow } = useLoggedUserStore();

  return (
    <Tabs defaultValue="permanentes">
      <CardContent>
        <TabsList>
          <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
          <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
        </TabsList>
      </CardContent>
      <TabsContent value="permanentes">
        <ExpiredDataTable
          data={allDocumentsToShow?.vehicles.filter((e) => !e.isItMonthly) || []}
          columns={ExpiredColums}
          vehicles={true}
          pending={true}
          defaultVisibleColumnsCustom={['date', 'resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardVehiculosPermanentes'}
          permanent
        />
      </TabsContent>
      <TabsContent value="mensuales">
        <ExpiredDataTable
          data={allDocumentsToShow?.vehicles.filter((e) => e.isItMonthly) || []}
          columns={ColumnsMonthly}
          vehicles={true}
          pending={true}
          defaultVisibleColumnsCustom={['date', 'resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardVehiculosMensuales'}
          monthly
        />
      </TabsContent>
    </Tabs>
  );
}

export default page;
