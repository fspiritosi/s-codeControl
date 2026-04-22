import { CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { EmployeeDocumentList } from './EmployeeDocumentList';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

async function EmployeeDocumentsTabs({ searchParams = {} }: { searchParams?: DataTableSearchParams }) {
  return (
    <Tabs defaultValue="permanentes">
      <CardContent>
        <TabsList>
          <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
          <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
        </TabsList>
      </CardContent>
      <TabsContent value="permanentes">
        <EmployeeDocumentList searchParams={searchParams} />
      </TabsContent>
      <TabsContent value="mensuales">
        <EmployeeDocumentList searchParams={searchParams} monthly />
      </TabsContent>
    </Tabs>
  );
}

export default EmployeeDocumentsTabs;
