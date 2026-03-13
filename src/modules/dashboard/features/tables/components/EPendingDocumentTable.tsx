'use client';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { ExpiredColums } from '@/modules/documents/shared/columns/ExpiredColumns';
import { ExpiredDataTable } from '@/shared/components/documents/ExpiredDataTable';

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
