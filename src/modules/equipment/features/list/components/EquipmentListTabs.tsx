import { CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { EquipmentList } from './EquipmentList';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

async function EquipmentListTabs({
  searchParams = {},
}: {
  searchParams?: DataTableSearchParams;
}) {
  return (
    <Tabs defaultValue="all">
      <CardContent>
        <TabsList>
          <TabsTrigger value="all">Todos los equipos</TabsTrigger>
        </TabsList>
      </CardContent>
      <TabsContent value="all">
        <EquipmentList searchParams={searchParams} />
      </TabsContent>
    </Tabs>
  );
}

export default EquipmentListTabs;
