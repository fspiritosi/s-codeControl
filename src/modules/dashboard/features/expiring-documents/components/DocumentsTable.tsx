// 'use client';
import { getNextMonthExpiringDocumentsVehicles } from '@/modules/documents/features/list/actions.server';
import { formatVehiculesDocuments } from '@/shared/lib/utils';
import { ExpiringDocumentTable } from '@/modules/dashboard/features/expiring-documents/components/data-table-expiring-document';
import { ExpiredDocumentColums } from '@/modules/dashboard/features/expiring-documents/components/expiringDocumentColumns';
import { ExpiredDocumentColumsEquipment } from '@/modules/dashboard/features/expiring-documents/components/ExpiredDocumentColumsEquipment';

async function DocumentsTable() {
  // const documentsToShow = useLoggedUserStore((state) => state.documentsToShow);
  // const setShowLastMonthDocuments = useLoggedUserStore((state) => state.setShowLastMonthDocuments);

  const data = await getNextMonthExpiringDocumentsVehicles();
  const formatedData = (data ?? []).map((d) => formatVehiculesDocuments(d)).filter((e) => e.validity !== '');

  return (
    <div className="px-4 pb-4">
      <ExpiringDocumentTable columns={ExpiredDocumentColumsEquipment} data={formatedData} />
    </div>
    // <ExpiredDataTable
    //   data={formatedData || []}
    //   // setShowLastMonthDocuments={setShowLastMonthDocuments}
    //   columns={ExpiredColums}
    //   vehicles={true}
    //   localStorageName="dashboardVehiclesColumns"
    // />
  );
}

export default DocumentsTable;
