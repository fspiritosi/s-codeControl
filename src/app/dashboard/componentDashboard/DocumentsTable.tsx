// 'use client';
import { getNextMonthExpiringDocumentsVehicles } from '@/app/server/GET/actions';
import { formatVehiculesDocuments } from '@/lib/utils';
import { ExpiredColums } from '../colums';
import { ExpiredDataTable } from '../data-table';

async function DocumentsTable() {
  // const documentsToShow = useLoggedUserStore((state) => state.documentsToShow);
  // const setShowLastMonthDocuments = useLoggedUserStore((state) => state.setShowLastMonthDocuments);

  const data = await getNextMonthExpiringDocumentsVehicles();
  const formatedData = (data ?? []).map(formatVehiculesDocuments).filter((e) => e.validity !== '');

  return (
    <ExpiredDataTable
      data={formatedData || []}
      // setShowLastMonthDocuments={setShowLastMonthDocuments}
      columns={ExpiredColums}
      vehicles={true}
      localStorageName="dashboardVehiclesColumns"
    />
  );
}

export default DocumentsTable;
