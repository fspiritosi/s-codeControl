import { fetchEmployeeMonthlyDocuments, fetchEmployeePermanentDocuments } from '@/app/server/GET/actions';
import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatEmployeeDocuments } from '@/lib/utils';
import { ExpiredColums } from '../../colums';
import { ColumnsMonthly } from '../../columsMonthly';
import { ExpiredDataTable } from '../../data-table';

async function EmployeeDocumentsTabs() {
  const monthlyDocuments = (await fetchEmployeeMonthlyDocuments()).map(formatEmployeeDocuments);
  const permanentDocuments = (await fetchEmployeePermanentDocuments()).map(formatEmployeeDocuments);

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
          defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardEmployeesPermanentes'}
          permanent
        />
      </TabsContent>
      <TabsContent value="mensuales">
        <ExpiredDataTable
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
