'use client';
import { useLoggedUserStore } from '@/store/loggedUser';
import { ExpiredColums } from '../colums';
import { ExpiredDataTable } from '../data-table';

function EPendingDocumentTable() {
  const employees = useLoggedUserStore((state) => state.pendingDocuments)?.employees;
  return (
    <ExpiredDataTable
      data={employees || []}
      columns={ExpiredColums}
      pending={true}
      localStorageName="dashboardPendingColumns"
    />
  );
}

export default EPendingDocumentTable;
