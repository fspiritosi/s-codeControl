import { checkListAnswerColumns } from '@/modules/hse/features/checklist/components/tables/checkListAnswerColumns';
import { CheckListAnswerTable } from '@/modules/hse/features/checklist/components/tables/data-table-answer';

async function CheckListAnwersTable({ answers }: { answers: CheckListAnswerWithForm[] }) {
  return (
    <CheckListAnswerTable
      columns={checkListAnswerColumns}
      data={answers.map((e) => {
        return {
          chofer: (e.answer as { chofer: string })?.chofer,
          id: e.id,
          name: (e.answer as { dominio: string })?.dominio,
          kilometer: (e.answer as { kilometraje: string })?.kilometraje,
          created_at: e.created_at,
          domain: (e.answer as { dominio: string })?.dominio,
        };
      })}
    />
  );
}
export default CheckListAnwersTable;
