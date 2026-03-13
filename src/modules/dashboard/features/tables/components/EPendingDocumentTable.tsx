'use client';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { ExpiredColums } from '@/modules/dashboard/features/tables/components/columns';
import { ExpiredDataTable } from '@/modules/dashboard/features/tables/components/data-table';

function EPendingDocumentTable() {
  const employees = useLoggedUserStore((state) => state.pendingDocuments)?.employees;
  return (
    <ExpiredDataTable
      data={employees as any}
      columns={ExpiredColums}
      pending={true}
      localStorageName="dashboardPendingColumns"
    />
  );
}

export default EPendingDocumentTable;
