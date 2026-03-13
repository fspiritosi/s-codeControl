'use client';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { ExpiredColums } from '@/modules/dashboard/features/tables/components/columns';
import { ExpiredDataTable } from '@/modules/dashboard/features/tables/components/data-table';

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
