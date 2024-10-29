// 'use client';
import { getNextMonthExpiringDocumentsEmployees } from '@/app/server/GET/actions';
import { formatEmployeeDocuments } from '@/lib/utils';
import { ExpiredColums } from '../colums';
import { ExpiredDataTable } from '../data-table';

async function EmployeesTable() {
  // const documentsToShow = useLoggedUserStore((state) => state.documentsToShow);
  // const setShowLastMonthDocuments = useLoggedUserStore((state) => state.setShowLastMonthDocuments);
  const data = await getNextMonthExpiringDocumentsEmployees();
  const formatedData = data.map(formatEmployeeDocuments).filter((e) => e.validity !== '');

  // console.log(data, 'data');

  return (
    <ExpiredDataTable
      data={formatedData || []}
      // setShowLastMonthDocuments={setShowLastMonthDocuments}
      columns={ExpiredColums}
      localStorageName="dashboardEmployeesColumns"
    />
  );
}

export default EmployeesTable;
