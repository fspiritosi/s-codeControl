'use client';
import { useLoggedUserStore } from '@/store/loggedUser';
import { ExpiredColums } from '../colums';
import { ExpiredDataTable } from '../data-table';

function EmployeesTable() {
  const documentsToShow = useLoggedUserStore(state => state.documentsToShow)
  const setShowLastMonthDocuments = useLoggedUserStore(
    state => state.setShowLastMonthDocuments,
  )
  // // // console.log(documentsToShow, 'documentsToShow')
  return (
    <ExpiredDataTable
      data={documentsToShow?.employees || []}
      setShowLastMonthDocuments={setShowLastMonthDocuments}
      columns={ExpiredColums}
      localStorageName="dashboardEmployeesColumns"
    />
  );
}

export default EmployeesTable;
