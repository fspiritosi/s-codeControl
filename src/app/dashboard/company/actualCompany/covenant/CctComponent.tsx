import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { columnsCategory } from './columnsCategory';
import { columns } from './columnsCct';
import { columnsGuild } from './columnsGuild';
import { DataCategory } from './data-table-category';
import { DataCct } from './data-table-cct';
import { DataGuild } from './data-table-guild';

export default async function Cct() {
  const coockiesStore = await cookies();
  const company_id = coockiesStore.get('actualComp')?.value;

  const guild = await prisma.guild.findMany({
    where: { company_id: company_id || '' },
  });

  const guildData = {
    ...guild,
    guild: (guild || [])?.map((e) => {
      return { name: e.name as string, id: e.id as string, is_active: e.is_active };
    }),
  };

  const covenants = await prisma.covenant.findMany({
    where: { company_id: company_id || '' },
    include: { guild: { select: { name: true } } },
  });
  const covenantsId = covenants?.map((e) => e.id);

  const convenantsData = {
    ...covenants,
    covenants: (covenants || [])?.map((e: any) => {
      return {
        name: e.name as string,
        id: e.id as string,
        number: e.number as string,
        guild_id: e.guild?.name ?? '',
        is_active: e.is_active,
      };
    }),
  };

  const category = await prisma.category.findMany({
    where: { covenant_id: { in: covenantsId } },
    include: { covenant: { select: { name: true, guild: { select: { name: true } } } } },
  });

  const categoryData = {
    ...category,
    category: (category || [])?.map((e: any) => {
      return {
        name: e.name as string,
        id: e.id as string,
        number: e.number as string,
        covenant_id: e.covenant?.name as string,
        guild_id: e.covenant?.guild?.name as string,
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
