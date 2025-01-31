import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { setEmployeesToShow } from '@/lib/utils/utils';
import { EmployeesListColumns } from '../../employee/columns';
import { EmployeesTable } from '../../employee/data-table';
import { fetchAllEmployees } from '@/app/server/GET/actions';
import { getRole } from '@/lib/utils/getRole';

async function EmployeeListTabs({ inactives, actives }: { inactives?: boolean; actives?: boolean }) {
 
  const role = await getRole()
  const employees = await fetchAllEmployees( role );

  const activeEmploees = setEmployeesToShow(employees?.filter((e) => e.is_active));
  const inactiveEmploees = setEmployeesToShow(employees?.filter((e: any) => !e.is_active));

  return (
    <Tabs defaultValue="Empleados activos">
      <CardContent>
        <TabsList>
          {actives && <TabsTrigger value="Empleados activos">Empleados activos</TabsTrigger>}{' '}
          {inactives && role !== 'Invitado' && (
            <TabsTrigger value="Empleados inactivos">Empleados inactivos</TabsTrigger>
          )}{' '}
        </TabsList>
      </CardContent>
      <TabsContent value="Empleados activos">
        <EmployeesTable role={role} columns={EmployeesListColumns} data={activeEmploees || []} />
      </TabsContent>
      <TabsContent value="Empleados inactivos">
        <EmployeesTable role={role} columns={EmployeesListColumns} data={inactiveEmploees || []} />
      </TabsContent>
    </Tabs>
  );
}

export default EmployeeListTabs;
