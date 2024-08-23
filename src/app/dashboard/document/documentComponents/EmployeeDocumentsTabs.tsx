import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseServer } from '@/lib/supabase/server';
import { mapDocument } from '@/lib/utils/utils';
import { Document } from '@/types/types';
import { cookies } from 'next/headers';
import { ExpiredColums } from '../../colums';
import { ColumnsMonthly } from '../../columsMonthly';
import { ExpiredDataTable } from '../../data-table';

async function EmployeeDocumentsTabs() {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value; //Al momento de crear una company debemos setear esta cookie
  const { documents } = await fetch(`${URL}/api/employees/documents?actual=${company_id}`).then((e) => e.json());
  const data = documents?.map(mapDocument) as Document[];

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
          data={data?.filter((e) => !e.isItMonthly) || []}
          columns={ExpiredColums}
          pending={true}
          defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
          localStorageName={'dashboardEmployeesPermanentes'}
          permanent
        />
      </TabsContent>
      <TabsContent value="mensuales">
        <ExpiredDataTable
          data={data?.filter((e) => e.isItMonthly) || []}
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
