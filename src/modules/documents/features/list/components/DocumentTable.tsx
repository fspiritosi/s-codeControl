// 'use client';

import { fetchEmployeeMonthlyDocumentsByEmployeeId, fetchEmployeePermanentDocumentsByEmployeeId } from '@/modules/documents/features/list/actions.server';
import DocumentNav from '@/shared/components/common/DocumentNav';
import { CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { formatEmployeeDocuments } from '@/shared/lib/utils';
import { ExpiredColums } from '@/modules/dashboard/features/tables/components/columns';
import { ColumnsMonthly } from '@/modules/dashboard/features/tables/components/columnsMonthly';
import { ExpiredDataTable } from '@/modules/dashboard/features/tables/components/data-table';

type Props = { user: Employee[]; employee_id: string; role: string };

export default async function DocumentTable({ user, employee_id, role }: Props) {
  // const { allDocumentsToShow } = useLoggedUserStore();
  const monthlyDocuments = (await fetchEmployeeMonthlyDocumentsByEmployeeId(employee_id)).map((d) => formatEmployeeDocuments(d as unknown as EmployeeDocumentWithContractors));
  const permanentDocuments = (await fetchEmployeePermanentDocumentsByEmployeeId(employee_id)).map(
    (d) => formatEmployeeDocuments(d as unknown as EmployeeDocumentWithContractors)
  );

  return (
    <Tabs defaultValue="permanentes">
      <CardContent className="flex justify-between">
        <TabsList>
          <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
          <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
        </TabsList>
        {role !== 'Invitado' && (
          <DocumentNav id_user={employee_id} onlyEmployees onlyNoMultiresource />
        )}
      </CardContent>
      <TabsContent value="permanentes">
        <ExpiredDataTable
          data={permanentDocuments}
          columns={ExpiredColums}
          pending={true}
          defaultVisibleColumnsCustom={['date', 'resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardEmployeesPermanentes'}
          permanent
        />
      </TabsContent>
      <TabsContent value="mensuales">
        <ExpiredDataTable
          data={monthlyDocuments}
          columns={ColumnsMonthly}
          pending={true}
          defaultVisibleColumnsCustom={['date', 'resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardEmployeesMensuales'}
          monthly
        />
      </TabsContent>
    </Tabs>
  );
}
