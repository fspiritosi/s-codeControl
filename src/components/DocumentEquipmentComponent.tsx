// 'use client';
import { ExpiredColums } from '@/app/dashboard/colums';
import { ColumnsMonthly } from '@/app/dashboard/columsMonthly';
import { ExpiredDataTable } from '@/app/dashboard/data-table';
import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useLoggedUserStore } from '@/store/loggedUser';
import { fetchMonthlyDocumentsByEquipmentId, fetchPermanentDocumentsByEquipmentId } from '@/app/server/GET/actions';
import { formatVehiculesDocuments } from '@/lib/utils';
import DocumentNav from './DocumentNav';

export default async function DocumentEquipmentComponent({ id }: { id: string }) {
  const monthlyDocuments = (await fetchMonthlyDocumentsByEquipmentId(id)).map(formatVehiculesDocuments);
  const permanentDocuments = (await fetchPermanentDocumentsByEquipmentId(id)).map(formatVehiculesDocuments);

  return (
    <Tabs defaultValue="permanentes">
      <CardContent className="flex justify-between">
        <TabsList>
          <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
          <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
        </TabsList>
        <DocumentNav id_user={id} onlyEquipment onlyNoMultiresource />
      </CardContent>
      <TabsContent value="permanentes">
        <div className="grid ">
          <ExpiredDataTable
            data={permanentDocuments}
            columns={ExpiredColums}
            vehicles={true}
            pending={true}
            defaultVisibleColumnsCustom={['date', 'resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
            localStorageName={'dashboardVehiculosPermanentes'}
            permanent
          />
        </div>
      </TabsContent>
      <TabsContent value="mensuales">
        <div className="grid  ">
          <ExpiredDataTable
            data={monthlyDocuments}
            columns={ColumnsMonthly}
            vehicles={true}
            pending={true}
            defaultVisibleColumnsCustom={['date', 'resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
            localStorageName={'dashboardVehiculosMensuales'}
            monthly
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
