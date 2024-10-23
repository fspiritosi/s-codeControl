import { checkListAnswerColumns } from '@/components/CheckList/tables/checkListAnswerColumns';
import { CheckListAnswerTable } from '@/components/CheckList/tables/data-table-answer';

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
