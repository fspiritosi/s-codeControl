import { fetchEmployeeMonthlyDocuments, fetchEmployeePermanentDocuments } from '@/modules/documents/features/list/actions.server';
import { CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { formatEmployeeDocuments } from '@/shared/lib/utils';
import { ExpiredColums } from '@/modules/dashboard/features/tables/components/columns';
import { ColumnsMonthly } from '@/modules/dashboard/features/tables/components/columnsMonthly';
import { ExpiredDataTable } from '@/modules/dashboard/features/tables/components/data-table';

async function EmployeeDocumentsTabs() {
  const monthlyDocuments = (await fetchEmployeeMonthlyDocuments()).map((d) => formatEmployeeDocuments(d as unknown as EmployeeDocumentWithContractors));
  const permanentDocuments = (await fetchEmployeePermanentDocuments()).map((d) => formatEmployeeDocuments(d as unknown as EmployeeDocumentWithContractors));

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
          tableId="permanentDocumentsTable"
          data={permanentDocuments || []}
          columns={ExpiredColums}
          pending={true}

          defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardEmployeesPermanentes'}
          permanent
        />
      </TabsContent>
      <TabsContent value="mensuales">
        <ExpiredDataTable
          tableId="monthlyDocumentsTable"
          data={monthlyDocuments || []}
          columns={ColumnsMonthly}
          pending={true}
          defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardEmployeesMensuales'}
          monthly
        />
      </TabsContent>
    </Tabs>
  );
}

export default EmployeeDocumentsTabs;
