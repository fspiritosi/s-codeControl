// 'use client';
import { getNextMonthExpiringDocumentsVehicles } from '@/app/server/GET/actions';
import { formatVehiculesDocuments } from '@/lib/utils';
import { ExpiringDocumentTable } from './table/data-table-expiring-document';
import { ExpiredDocumentColums } from './table/expiringDocumentColumns';
import { ExpiredDocumentColumsEquipment } from './table/ExpiredDocumentColumsEquipment';

async function DocumentsTable() {
  // const documentsToShow = useLoggedUserStore((state) => state.documentsToShow);
  // const setShowLastMonthDocuments = useLoggedUserStore((state) => state.setShowLastMonthDocuments);

  const data = await getNextMonthExpiringDocumentsVehicles();
  const formatedData = (data ?? []).map(formatVehiculesDocuments).filter((e) => e.validity !== '');

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
