import { CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { getRole } from '@/shared/lib/utils/getRole';
import { EquipmentList } from './EquipmentList';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

async function EquipmentListTabs({
  searchParams = {},
}: {
  searchParams?: DataTableSearchParams;
}) {
  const role = await getRole();

  return (
    <Tabs defaultValue="active">
      <CardContent>
        <TabsList>
          <TabsTrigger value="active">Equipos activos</TabsTrigger>
          {role !== 'Invitado' && (
            <TabsTrigger value="inactive">Equipos inactivos</TabsTrigger>
          )}
        </TabsList>
      </CardContent>
      <TabsContent value="active">
        <EquipmentList searchParams={searchParams} />
      </TabsContent>
      <TabsContent value="inactive">
        <EquipmentList searchParams={searchParams} showInactive />
      </TabsContent>
    </Tabs>
  );
}

export default EquipmentListTabs;
