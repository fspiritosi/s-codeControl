import { fetchCustomForms } from '@/app/server/GET/actions';
import { checkListColumns } from './tables/checkListColumns';
import { TypesOfCheckListTable } from './tables/data-table';

export default async function ChecklistTable() {
  const checklists = await fetchCustomForms();

  // console.log(checklists);

  return (
    <TypesOfCheckListTable
      columns={checkListColumns}
      data={checklists.map((e) => {
        return {
          title: (e.form as { title: string })?.title,
          id: e.id,
          description: (e.form as { description: string })?.description,
          frequency: (e.form as { frequency: string })?.frequency,
          created_at: e.created_at,
          total_responses: e.form_answers?.length,
        };
      })}
    />
  );
}
