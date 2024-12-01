// 'use client';
import { getNextMonthExpiringDocumentsEmployees } from '@/app/server/GET/actions';
import { formatEmployeeDocuments } from '@/lib/utils';
import { ExpiringDocumentTable } from './table/data-table-expiring-document';
import { ExpiredDocumentColums } from './table/expiringDocumentColumns';

async function EmployeesTable() {
  // const documentsToShow = useLoggedUserStore((state) => state.documentsToShow);
  // const setShowLastMonthDocuments = useLoggedUserStore((state) => state.setShowLastMonthDocuments);
  const data = await getNextMonthExpiringDocumentsEmployees();
  const formatedData = data.map(formatEmployeeDocuments).filter((e) => e.validity !== '');

  //console.log(data, 'data');

  return (
    <div className="px-4 pb-4">
      <ExpiringDocumentTable columns={ExpiredDocumentColums} data={formatedData} />
    </div>
  );
}

export default EmployeesTable;
