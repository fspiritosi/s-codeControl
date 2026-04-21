'use client';

import { checkListAnswerColumns } from '@/modules/hse/features/checklist/components/tables/checkListAnswerColumns';
import { DataTable } from '@/shared/components/data-table';
import { useRouter } from 'next/navigation';

function CheckListAnwersTable({ answers }: { answers: CheckListAnswerWithForm[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={checkListAnswerColumns}
      data={answers.map((e) => ({
        chofer: (e.answer as { chofer: string })?.chofer,
        id: e.id,
        name: (e.answer as { dominio: string })?.dominio,
        kilometer: (e.answer as { kilometraje: string })?.kilometraje,
        created_at: e.created_at,
        domain: (e.answer as { dominio: string })?.dominio,
      }))}
      showColumnToggle={true}
      onRowClick={(row) => router.push(`/dashboard/forms/${(row as any).id}/view`)}
      rowClassName="hover:cursor-pointer"
      emptyMessage="Sin resultados"
      tableId="checklist-answers"
    />
  );
}
export default CheckListAnwersTable;
