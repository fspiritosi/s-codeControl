'use client';

import DocumentNav from '@/components/DocumentNav';
import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoggedUserStore } from '@/store/loggedUser';
import { ExpiredColums } from '../colums';
import { ColumnsMonthly } from '../columsMonthly';
import { ExpiredDataTable } from '../data-table';

type Props = { document: string };

export default function DocumentTable({ document }: Props) {
  const { allDocumentsToShow } = useLoggedUserStore();

  // console.log(document);
  // console.log(allDocumentsToShow.employees.filter((e) => e.document_number === document));
  return (
    <Tabs defaultValue="permanentes">
      <CardContent className="flex justify-between">
        <TabsList>
          <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
          <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
        </TabsList>
        <DocumentNav id_user={document} onlyEmployees onlyNoMultiresource />
      </CardContent>
      <TabsContent value="permanentes">
        <ExpiredDataTable
          data={allDocumentsToShow?.employees.filter((e) => !e.isItMonthly && e.document_number === document) || []}
          columns={ExpiredColums}
          pending={true}
          defaultVisibleColumnsCustom={['date', 'resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardEmployeesPermanentes'}
          permanent
        />
      </TabsContent>
      <TabsContent value="mensuales">
        <ExpiredDataTable
          data={allDocumentsToShow?.employees.filter((e) => e.isItMonthly && e.document_number === document) || []}
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
