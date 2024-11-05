import { fetchMonthlyDocumentsEquipment, fetchPermanentDocumentsEquipment } from '@/app/server/GET/actions';
import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatVehiculesDocuments } from '@/lib/utils';
import { ExpiredColums } from '../../colums';
import { ColumnsMonthly } from '../../columsMonthly';
import { ExpiredDataTable } from '../../data-table';

async function EquipmentTabs() {
  const monthlyDocuments = (await fetchMonthlyDocumentsEquipment()).map(formatVehiculesDocuments);
  const permanentDocuments = (await fetchPermanentDocumentsEquipment()).map(formatVehiculesDocuments);
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
          data={permanentDocuments || []}
          columns={ExpiredColums}
          pending={true}
          vehicles
          defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardVehiculosPermanentes'}
          permanent
        />
      </TabsContent>
      <TabsContent value="mensuales">
        <ExpiredDataTable
          data={monthlyDocuments || []}
          columns={ColumnsMonthly}
          pending={true}
          vehicles
          defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardVehiculosMensuales'}
          monthly
        />
      </TabsContent>
    </Tabs>
  );
}

export default EquipmentTabs;
