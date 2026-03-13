// 'use client';
import { getNextMonthExpiringDocumentsEmployees } from '@/modules/documents/features/list/actions.server';
import { formatEmployeeDocuments } from '@/shared/lib/utils';
import { ExpiringDocumentTable } from '@/modules/dashboard/features/expiring-documents/components/data-table-expiring-document';
import { ExpiredDocumentColums } from '@/modules/dashboard/features/expiring-documents/components/expiringDocumentColumns';

async function EmployeesTable() {
  // const documentsToShow = useLoggedUserStore((state) => state.documentsToShow);
  // const setShowLastMonthDocuments = useLoggedUserStore((state) => state.setShowLastMonthDocuments);
  const data = await getNextMonthExpiringDocumentsEmployees();
  const formatedData = data.map((d) => formatEmployeeDocuments(d as unknown as EmployeeDocumentWithContractors)).filter((e) => e.validity !== '');


  return (
    <div className="px-4 pb-4">
      <ExpiringDocumentTable columns={ExpiredDocumentColums} data={formatedData} />
    </div>
  );
}

export default EmployeesTable;
