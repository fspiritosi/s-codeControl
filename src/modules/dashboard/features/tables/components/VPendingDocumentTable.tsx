'use client';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { ExpiredColums } from '@/modules/documents/shared/columns/ExpiredColumns';
import { ExpiredDataTable } from '@/shared/components/documents/ExpiredDataTable';

function VPendingDocumentTable() {
  const vehicles = useLoggedUserStore((state) => state.pendingDocuments)?.vehicles;
  return (
    <ExpiredDataTable
      data={(vehicles as any) || []}
      columns={ExpiredColums}
      pending={true}
      localStorageName="dashboardVPendingColumns"
    />
  );
}

export default VPendingDocumentTable;
