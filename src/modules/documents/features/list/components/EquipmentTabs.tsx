import { CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { EquipmentDocumentList } from './EquipmentDocumentList';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

async function EquipmentTabs({ searchParams = {} }: { searchParams?: DataTableSearchParams }) {
  return (
    <Tabs defaultValue="permanentes">
      <CardContent>
        <TabsList>
          <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
          <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
        </TabsList>
      </CardContent>
      <TabsContent value="permanentes">
        <EquipmentDocumentList searchParams={searchParams} />
      </TabsContent>
      <TabsContent value="mensuales">
        <EquipmentDocumentList searchParams={searchParams} monthly />
      </TabsContent>
    </Tabs>
  );
}

export default EquipmentTabs;
