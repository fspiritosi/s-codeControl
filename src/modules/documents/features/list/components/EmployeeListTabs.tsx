import { CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { getRole } from '@/shared/lib/utils/getRole';
import { EmployeeList } from '@/modules/employees/features/list/components/EmployeeList';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

async function EmployeeListTabs({
  inactives,
  actives,
  searchParams = {},
}: {
  inactives?: boolean;
  actives?: boolean;
  searchParams?: DataTableSearchParams;
}) {
  const role = await getRole();

  return (
    <Tabs defaultValue="Empleados activos">
      <CardContent>
        <TabsList>
          {actives && <TabsTrigger value="Empleados activos">Empleados activos</TabsTrigger>}
          {inactives && role !== 'Invitado' && (
            <TabsTrigger value="Empleados inactivos">Empleados inactivos</TabsTrigger>
          )}
        </TabsList>
      </CardContent>
      <TabsContent value="Empleados activos">
        <EmployeeList searchParams={searchParams} />
      </TabsContent>
      <TabsContent value="Empleados inactivos">
        <EmployeeList searchParams={searchParams} showInactive />
      </TabsContent>
    </Tabs>
  );
}

export default EmployeeListTabs;
