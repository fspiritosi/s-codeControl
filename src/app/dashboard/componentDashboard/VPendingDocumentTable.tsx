'use client';
import { useLoggedUserStore } from '@/store/loggedUser';
import { ExpiredColums } from '../colums';
import { ExpiredDataTable } from '../data-table';

function VPendingDocumentTable() {
  const vehicles = useLoggedUserStore((state) => state.pendingDocuments)?.vehicles;
  return (
    <ExpiredDataTable
      data={vehicles || []}
      columns={ExpiredColums}
      pending={true}
      localStorageName="dashboardVPendingColumns"
    />
  );
}

export default VPendingDocumentTable;
