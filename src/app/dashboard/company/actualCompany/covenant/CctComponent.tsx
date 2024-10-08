import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { columnsCategory } from './columnsCategory';
import { columns } from './columnsCct';
import { columnsGuild } from './columnsGuild';
import { DataCategory } from './data-table-category';
import { DataCct } from './data-table-cct';
import { DataGuild } from './data-table-guild';

export default async function Cct() {
  const supabase = supabaseServer();
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;

  let { data: guild } = await supabase
    .from('guild')
    .select('*')
    .eq('company_id', company_id || '')
    .select();

  const guildData = {
    ...guild,
    guild: (guild || [])?.map((e) => {
      return { name: e.name as string, id: e.id as string, is_active: e.is_active };
    }),
  };

  let { data: covenants } = await supabase
    .from('covenant')
    .select('*, guild_id(name)')
    .eq('company_id', company_id || '');
  const covenantsId = covenants?.map((e) => e.id);

  const convenantsData = {
    ...covenants,
    covenants: (covenants || [])?.map((e: any) => {
      return {
        name: e.name as string,
        id: e.id as string,
        number: e.number as string,
        guild_id: e.guild_id?.name ?? '',
        is_active: e.is_active,
      };
    }),
  };

  let { data: category, error } = await supabase
    .from('category')
    .select('*, covenant_id(name,guild_id(name))')
    .in('covenant_id', covenantsId as string[]);

  const categoryData = {
    ...category,
    category: (category || [])?.map((e: any) => {
      return {
        name: e.name as string,
        id: e.id as string,
        number: e.number as string,
        covenant_id: e.covenant_id.name as string,
        guild_id: e.covenant_id.guild_id.name as string,
        is_active: e.is_active,
      };
    }),
  };

  return (
    <div>
      <Tabs defaultValue="guild" className="w-full">
        <TabsList className="ml-4 mt-4">
          <TabsTrigger value="guild">Sindicatos</TabsTrigger>
          <TabsTrigger value="covenant">Convenios</TabsTrigger>
          <TabsTrigger value="category">Categorias</TabsTrigger>
        </TabsList>
        <TabsContent value="covenant">
          <div className="p-8">
            <DataCct columns={columns} data={convenantsData.covenants || []} localStorageName="covenantColums" />
          </div>
        </TabsContent>
        <TabsContent value="guild">
          <div className="p-8">
            <DataGuild columns={columnsGuild} data={guildData.guild || []} localStorageName="guildColums" />
          </div>
        </TabsContent>
        <TabsContent value="category">
          <DataCategory
            columns={columnsCategory}
            data={categoryData.category || []}
            localStorageName="categoryColums"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
