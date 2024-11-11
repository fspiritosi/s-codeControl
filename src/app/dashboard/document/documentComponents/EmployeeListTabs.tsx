import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseServer } from '@/lib/supabase/server';
import { setEmployeesToShow } from '@/lib/utils/utils';
import { cookies } from 'next/headers';
import { EmployeesListColumns } from '../../employee/columns';
import { EmployeesTable } from '../../employee/data-table';

async function EmployeeListTabs({ inactives, actives }: { inactives?: boolean; actives?: boolean }) {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;

  const { employees } = await fetch(`${URL}/api/employees/table?actual=${company_id}&user=${user?.id}`).then((e) =>
    e.json()
  );
  console.log(JSON.stringify(employees[0]));
  const activeEmploees = setEmployeesToShow(employees?.filter((e: any) => e.is_active));
  const inactiveEmploees = setEmployeesToShow(employees?.filter((e: any) => !e.is_active));
  return (
    <Tabs defaultValue="Empleados activos">
      <CardContent>
        <TabsList>
          {actives && <TabsTrigger value="Empleados activos">Empleados activos</TabsTrigger>}{' '}
          {inactives && <TabsTrigger value="Empleados inactivos">Empleados inactivos</TabsTrigger>}{' '}
        </TabsList>
      </CardContent>
      <TabsContent value="Empleados activos">
        <EmployeesTable columns={EmployeesListColumns} data={activeEmploees || []} />
      </TabsContent>
      <TabsContent value="Empleados inactivos">
        <EmployeesTable columns={EmployeesListColumns} data={inactiveEmploees || []} />
      </TabsContent>
    </Tabs>
  );
}

export default EmployeeListTabs;
