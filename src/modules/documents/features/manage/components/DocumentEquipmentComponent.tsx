// 'use client';
import { ExpiredColums } from '@/modules/documents/shared/columns/ExpiredColumns';
import { ColumnsMonthlyEquipment } from '@/modules/documents/shared/columns/ColumnsMonthlyEquipment';
import { ExpiredDataTable } from '@/shared/components/documents/ExpiredDataTable';
import { CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
// import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { fetchMonthlyDocumentsByEquipmentId, fetchPermanentDocumentsByEquipmentId } from '@/modules/documents/features/list/actions.server';
import { formatVehiculesDocuments, getActualRole } from '@/shared/lib/utils';
import { cookies } from 'next/headers';
import DocumentNav from '@/shared/components/common/DocumentNav';

export default async function DocumentEquipmentComponent({ id, role }: { id: string,role: string }) {
  const monthlyDocuments = (await fetchMonthlyDocumentsByEquipmentId(id)).map((d) => formatVehiculesDocuments(d as unknown as EquipmentDocumentDetailed));
  const permanentDocuments = (await fetchPermanentDocumentsByEquipmentId(id)).map((d) => formatVehiculesDocuments(d as unknown as EquipmentDocumentDetailed));
  const cookiesStore = await cookies();
  const company_id = cookiesStore.get('actualComp')?.value;

  return (
    <Tabs defaultValue="permanentes">
      <CardContent className="flex justify-between">
        <TabsList>
          <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
          <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
        </TabsList>
        {role !== 'Invitado' && <DocumentNav id_user={id} onlyEquipment onlyNoMultiresource />}
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
            columns={ColumnsMonthlyEquipment}
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
