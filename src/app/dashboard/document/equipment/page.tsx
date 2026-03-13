'use client';
import { CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { ExpiredColums } from '@/modules/documents/shared/columns/ExpiredColumns';
import { ColumnsMonthly } from '@/modules/documents/shared/columns/ColumnsMonthly';
import { ExpiredDataTable } from '@/shared/components/documents/ExpiredDataTable';

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
