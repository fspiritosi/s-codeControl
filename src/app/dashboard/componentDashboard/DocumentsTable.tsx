'use client'
import { useLoggedUserStore } from '@/store/loggedUser'
import { ExpiredColums } from '../colums'
import { ExpiredDataTable } from '../data-table'

function DocumentsTable() {
  const documentsToShow = useLoggedUserStore(state => state.documentsToShow)
  const setShowLastMonthDocuments = useLoggedUserStore(
    state => state.setShowLastMonthDocuments,
  )
  return (
    <ExpiredDataTable
      data={documentsToShow?.vehicles || []}
      setShowLastMonthDocuments={setShowLastMonthDocuments}
      columns={ExpiredColums}
      vehicles={true}
    />
  )
}

export default DocumentsTable
