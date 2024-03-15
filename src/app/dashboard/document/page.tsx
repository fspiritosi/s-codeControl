'use client'
import DocumentNav from '@/components/DocumentNav'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocument } from '@/hooks/useDocuments'
import { useLoggedUserStore } from '@/store/loggedUser'
import { useEffect, useState } from 'react'
import { DataDocumentsEmployees } from '../document/data-documentEmployees'
import { DataDocumentsEquipment } from '../document/data-documentsEquipment'
import { columEmp } from './columEmp'
import { columns } from './columns'

export default function page() {
  const { actualCompany } = useLoggedUserStore()
  const [showInactive, setShowInactive] = useState(false)
  const [documentsDataEquipment, setDocumentsDataEquipment] = useState<
    unknown[]
  >([])
  const [documentsDataEmployees, setDocumentsDataEmployees] = useState<
    unknown[]
  >([])
  const { fetchDocumentEquipmentByCompany, fetchDocumentEmployeesByCompany } =
    useDocument()
    
  const handleToggleInactive = () => {
    setShowInactive(!showInactive)
  }
  const fetchDocuments = async () => {
    try {
      const documents = await fetchDocumentEquipmentByCompany()
      const transformedData = documents?.map(item => ({
        ...item,
        id_document_types: item.document_types.name,
        applies: item.vehicles.intern_number,
      }))
      //console.log('transformed Data: ', transformedData)
      setDocumentsDataEquipment(transformedData || [])
    } catch (error) {
      console.error('Error al obtener documentos:', error)
    }
  }
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocumentEquipmentByCompany])

  const fetchDocumentsEmployees = async () => {
    try {
      const documentsEmployees = await fetchDocumentEmployeesByCompany()
      const transformedData = documentsEmployees?.map(item => ({
        ...item,
        id_document_types: item.document_types.name,
        applies: item.employees.document_number,
      }))
      // console.log('transformed Data: ', documentsEmployees)
      // console.log('este es employees: ', documentsEmployees)
      setDocumentsDataEmployees(transformedData || [])
    } catch (error) {
      console.error('Error al obtener documentos:', error)
    }
  }
  // useEffect(() => {
  //   fetchDocumentsEmployees()
  // }, [fetchDocumentEmployeesByCompany])

  // useEffect(() => {
  //   const channels = supabase
  //     .channel('custom-all-channel')
  //     .on(
  //       'postgres_changes',
  //       { event: '*', schema: 'public', table: 'documents_employees' },
  //       payload => {
  //         fetchDocumentsEmployees()
  //       },
  //     )
  //     .subscribe()
  // }, [])

  // useEffect(() => {
  //   const channels = supabase
  //     .channel('custom-all-channel')
  //     .on(
  //       'postgres_changes',
  //       { event: '*', schema: 'public', table: 'documents_equipment' },
  //       payload => {
  //         fetchDocuments()
  //       },
  //     )
  //     .subscribe()
  // }, [])
  return (
    <section>
      <div className="flex justify-between flex-wrap flex-col">
        <div className="flex justify-between mb-3">
          <h2 className="inline">
            Aqui estaran todos los documentos de la empresa
          </h2>
          <div className="flex gap-4">
            <DocumentNav />
          </div>
        </div>
        <div className="flex gap-3 flex-wrap ">
          <div className="w-full">
            <Tabs defaultValue="Empleados" className="p-2">
              <TabsList className="grid w-full grid-cols-2 ">
                <TabsTrigger value="Empleados">Empleados</TabsTrigger>
                <TabsTrigger value="Equipos">Equipos</TabsTrigger>
              </TabsList>
              <TabsContent value="Empleados">
                <DataDocumentsEmployees
                  columEmp={columEmp}
                  data={documentsDataEmployees || []}
                  //allCompany={allCompany}
                  showInactive={showInactive}
                  setShowInactive={setShowInactive}
                />
              </TabsContent>
              <TabsContent value="Equipos">
                <DataDocumentsEquipment
                  columns={columns}
                  data={documentsDataEquipment || []}
                  //allCompany={allCompany}
                  showInactive={showInactive}
                  setShowInactive={setShowInactive}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  )
}
