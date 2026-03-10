import { prisma } from '@/lib/prisma';
import { FormattedOutput, Guild } from '@/types/types';
import { cookies } from 'next/headers';
import { TreeNode, TreeNodeData } from './TreeFile';

export default async function CovenantTreeFile() {
  const coockiesStore = await cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const guild = await prisma.guild.findMany({
    where: { company_id: company_id || '' },
    include: { covenants: { include: { categories: true } } },
  });

  function formatData(input: Guild[] | null): FormattedOutput {
    return input?.map((guild) => ({
      name: guild.name,
      type: 'sindicato',
      id: guild.id,
      children: guild.covenant.map((covenant) => ({
        name: covenant.name,
        type: 'convenio',
        id: covenant.id,
        children: covenant.category.map((category) => ({
          name: category.name,
          type: 'categoria',
          id: category.id,
        })),
      })),
    }));
  }

  //   const treeData = ;
  const treeData: TreeNodeData = {
    name: 'Sindicatos',
    type: 'sindicatoPadre',
    id: '0',
    children: formatData(guild as unknown as Guild[]),
  };

  return (
    <div className="bg-background text-foreground">
      <TreeNode node={treeData} level={0} />
    </div>
  );
}
