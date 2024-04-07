'use client'
import DocumentNav from '@/components/DocumentNav'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocument } from '@/hooks/useDocuments'
import { useLoggedUserStore } from '@/store/loggedUser'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../supabase/supabase'
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
  const [documentsEmployeesAprobados, setDocumentsEmployeesAprobados] =
    useState<unknown[]>([])
  const [documentsEmployeesPresentados, setDocumentsEmployeesPresentados] =
    useState<unknown[]>([])
  const [documentsEmployeesVencidos, setDocumentsEmployeesVencidos] = useState<
    unknown[]
  >([])

  const [documentsEquipmentAprobados, setDocumentsEquipmentAprobados] =
    useState<unknown[]>([])
  const [documentsEquipmentPresentados, setDocumentsEquipmentPresentados] =
    useState<unknown[]>([])
  const [documentsEquipmentVencidos, setDocumentsEquipmentVencidos] = useState<
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
        domain: item.vehicles.domain || 'No disponible',
      }))
      //console.log('transformed Data: ', transformedData)
      const filteredAprobados = transformedData?.filter(
        item => item.state === 'aprobado',
      )
      const filteredPresentados = transformedData?.filter(
        item => item.state === 'presentado',
      )
      const filteredVencidos = transformedData?.filter(
        item => item.state === 'vencido',
      )
      // console.log('transformed Data: ', documentsEmployees)
      // console.log('este es employees: ', documentsEmployees)
      setDocumentsEquipmentVencidos(filteredVencidos || [])
      setDocumentsEquipmentPresentados(filteredPresentados || [])
      setDocumentsEquipmentAprobados(filteredAprobados || [])
      setDocumentsDataEquipment(transformedData || [])
    } catch (error) {
      console.error('Error al obtener documentos:', error)
    }
  }

  // useEffect(() => {
  //   fetchDocuments()
  // }, [fetchDocumentEquipmentByCompany])

  const fetchDocumentsEmployees = async () => {
    try {
      const documentsEmployees = await fetchDocumentEmployeesByCompany()
      const transformedData = documentsEmployees?.map(item => ({
        ...item,
        id_document_types: item.document_types.name,
        applies: item.employees.document_number,
        lastName: item.employees.lastname,
        firstName: item.employees.firstname,
      }))
      const filteredAprobados = transformedData?.filter(
        item => item.state === 'aprobado',
      )
      const filteredPresentados = transformedData?.filter(
        item => item.state === 'presentado',
      )
      const filteredVencidos = transformedData?.filter(
        item => item.state === 'vencido',
      )
      //console.log('transformed Data: ', transformedData)
      // console.log('este es employees: ', documentsEmployees)
      setDocumentsEmployeesVencidos(filteredVencidos || [])
      setDocumentsEmployeesPresentados(filteredPresentados || [])
      setDocumentsEmployeesAprobados(filteredAprobados || [])
      setDocumentsDataEmployees(transformedData || [])
    } catch (error) {
      console.error('Error al obtener documentos:', error)
    }
  }

  useEffect(() => {
    const channels = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents_employees' },
        payload => {
          fetchDocumentsEmployees()
        },
      )
      .subscribe()
  }, [])

  useEffect(() => {
    const channels = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents_equipment' },
        payload => {
          fetchDocuments()
        },
      )
      .subscribe()
  }, [])

  console.log('esto viene del page')

  return (
    <section>
      <div className="flex justify-between flex-wrap flex-col">
        <div className="flex justify-between mb-3">
          <div>
            <h2 className="text-4xl mb-3">Documentos cargados</h2>
            <p>
              Aquí se muestra una tabla con los documentos cargados de los
              empleados y equipos
            </p>
          </div>
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
                <Tabs defaultValue="Todos" className="p-2">
                  <TabsList className="grid w-full grid-cols-4 ">
                    <TabsTrigger value="Todos">Todos</TabsTrigger>
                    <TabsTrigger value="Aprobados">Aprobados</TabsTrigger>
                    <TabsTrigger value="Presentados">Presentados</TabsTrigger>
                    <TabsTrigger value="Vencidos">Vencidos</TabsTrigger>
                  </TabsList>
                  <TabsContent value="Todos">
                    <DataDocumentsEmployees
                      columEmp={columEmp}
                      data={documentsDataEmployees || []}
                      //allCompany={allCompany}
                      showInactive={showInactive}
                      setShowInactive={setShowInactive}
                    />
                  </TabsContent>
                  <TabsContent value="Aprobados">
                    <DataDocumentsEmployees
                      columEmp={columEmp}
                      data={documentsEmployeesAprobados || []}
                      //allCompany={allCompany}
                      showInactive={showInactive}
                      setShowInactive={setShowInactive}
                    />
                  </TabsContent>
                  <TabsContent value="Presentados">
                    <DataDocumentsEmployees
                      columEmp={columEmp}
                      data={documentsEmployeesPresentados || []}
                      //allCompany={allCompany}
                      showInactive={showInactive}
                      setShowInactive={setShowInactive}
                    />
                  </TabsContent>
                  <TabsContent value="Vencidos">
                    <DataDocumentsEmployees
                      columEmp={columEmp}
                      data={documentsEmployeesVencidos || []}
                      //allCompany={allCompany}
                      showInactive={showInactive}
                      setShowInactive={setShowInactive}
                    />
                  </TabsContent>
                </Tabs>
                {/* ////////////////////////////////////////////////// */}
              </TabsContent>
              <TabsContent value="Equipos">
                {/* <DataDocumentsEquipment
                  columns={columns}
                  data={documentsDataEquipment || []}
                  //allCompany={allCompany}
                  showInactive={showInactive}
                  setShowInactive={setShowInactive}
                /> */}
                <Tabs defaultValue="Todos" className="p-2">
                  <TabsList className="grid w-full grid-cols-4 ">
                    <TabsTrigger value="Todos">Todos</TabsTrigger>
                    <TabsTrigger value="Aprobados">Aprobados</TabsTrigger>
                    <TabsTrigger value="Presentados">Presentados</TabsTrigger>
                    <TabsTrigger value="Vencidos">Vencidos</TabsTrigger>
                  </TabsList>
                  <TabsContent value="Todos">
                    <DataDocumentsEquipment
                      columns={columns}
                      data={documentsDataEquipment || []}
                      //allCompany={allCompany}
                      showInactive={showInactive}
                      setShowInactive={setShowInactive}
                    />
                  </TabsContent>
                  <TabsContent value="Aprobados">
                    <DataDocumentsEquipment
                      columns={columns}
                      data={documentsEquipmentAprobados || []}
                      //allCompany={allCompany}
                      showInactive={showInactive}
                      setShowInactive={setShowInactive}
                    />
                  </TabsContent>
                  <TabsContent value="Presentados">
                    <DataDocumentsEquipment
                      columns={columns}
                      data={documentsEquipmentPresentados || []}
                      //allCompany={allCompany}
                      showInactive={showInactive}
                      setShowInactive={setShowInactive}
                    />
                  </TabsContent>
                  <TabsContent value="Vencidos">
                    <DataDocumentsEquipment
                      columns={columns}
                      data={documentsEquipmentVencidos || []}
                      //allCompany={allCompany}
                      showInactive={showInactive}
                      setShowInactive={setShowInactive}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>

            {/* </Tabs> */}
          </div>
        </div>
      </div>
    </section>
  )
}
