import { supabaseServer } from '@/lib/supabase/server';
import { FormattedOutput, Guild } from '@/types/types';
import { cookies } from 'next/headers';
import { TreeNode, TreeNodeData } from './TreeFile';

export default async function CovenantTreeFile() {
  const supabase = supabaseServer();
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const { data: guild, error } = await supabase
    .from('guild')
    .select('*,covenant(*,category(*))')
    .eq('company_id', company_id || '');

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
    children: formatData(guild as Guild[]),
  };

  return (
    <div className="bg-background text-foreground">
      <TreeNode node={treeData} level={0} />
    </div>
  );
}
