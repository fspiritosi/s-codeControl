import { fetchMonthlyDocumentsEquipment, fetchPermanentDocumentsEquipment } from '@/modules/documents/features/list/actions.server';
import { CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { formatVehiculesDocuments } from '@/shared/lib/utils';
import { ExpiredColums } from '@/modules/documents/shared/columns/ExpiredColumns';
import { ColumnsMonthly } from '@/modules/documents/shared/columns/ColumnsMonthly';
import { ExpiredDataTable } from '@/shared/components/documents/ExpiredDataTable';
import { ColumnsMonthlyEquipment } from '@/modules/documents/shared/columns/ColumnsMonthlyEquipment';

async function EquipmentTabs() {
  const monthlyDocuments = (await fetchMonthlyDocumentsEquipment()).map((d) => formatVehiculesDocuments(d as unknown as EquipmentDocumentDetailed));
  const permanentDocuments = (await fetchPermanentDocumentsEquipment()).map((d) => formatVehiculesDocuments(d as unknown as EquipmentDocumentDetailed));
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
          tableId="permanentDocumentsTableEquipment"
          data={(permanentDocuments as any) || []}
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
          tableId="monthlyDocumentsTableEquipment"
          data={monthlyDocuments || []}
          columns={ColumnsMonthlyEquipment}
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
