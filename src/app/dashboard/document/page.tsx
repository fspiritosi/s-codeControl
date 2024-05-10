'use client'
import DocumentNav from '@/components/DocumentNav'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import NewDocumentType from '@/components/NewDocumentType'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLoggedUserStore } from '@/store/loggedUser'
import { AuditorDocument } from '@/types/types'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { supabase } from '../../../supabase'
import { ExpiredColums } from '../colums'
import { ExpiredDataTable } from '../data-table'

export default function page() {
  const { allDocumentsToShow, actualCompany } = useLoggedUserStore()
  const [document_types, setDocumentTypes] = useState<any[] | null>([])
  const [documents_employees, setDocumentsEmployees] = useState<any[] | null>(
    [],
  )

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No vence'
    const [day, month, year] = dateString.split('/')
    const formattedDate = `${day}/${month}/${year}`
    return formattedDate || 'No vence'
  }

  const fetchDocumentTypes = async () => {
    if (!actualCompany) return
    let { data: document_types, error } = await supabase
      .from('document_types')
      .select('*')
      .filter('is_active', 'eq', true)
      .or(`company_id.eq.${actualCompany?.id},company_id.is.null`)

    if (error) {
      console.error('Error fetching document types:', error.message)
      return
    }

    setDocumentTypes(document_types)
  }

  const fetchDocumentsEmployees = async () => {
    let { data: equipmentData, error: equipmentError } = await supabase
      .from('documents_equipment')
      .select(
        `
    *,
    document_types:document_types(*),
    applies(*,type(*),type_of_vehicle(*),model(*),brand(*),company_id(*))
    `,
      )
      .eq('state', 'presentado')
      .order('created_at', { ascending: false })

    const mapVehicle = (doc: any) => {
      const formattedDate = formatDate(doc.validity)
      return {
        date: doc.created_at
          ? format(new Date(doc.created_at), 'dd/MM/yyyy')
          : 'No vence',
        allocated_to: doc.applies?.type_of_vehicle?.name,
        documentName: doc.document_types?.name,
        state: doc.state,
        multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
        validity: formattedDate,
        id: doc.id,
        resource: doc.applies?.domain || doc.applies?.intern_number,
        companyName: doc.applies?.company_id?.company_name,
      }
    }
    const mappedVehicles = equipmentData?.map(mapVehicle)

    let { data: documents_employees, error } = await supabase
      .from('documents_employees')
      .select(
        `
      *,
      document_types(*),
      applies(*,
        contractor_employee(
          contractors(
            *
          )
        ),
        company_id(*)
      )
    `,
      )
      .eq('state', 'presentado')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    const mapEmployee = (doc: any) => {
      const formattedDate = formatDate(doc.validity)
      return {
        date: doc.created_at
          ? format(new Date(doc.created_at), 'dd/MM/yyyy')
          : 'No vence',
        companyName: doc.applies?.company_id?.company_name,
        allocated_to: doc.applies?.contractor_employee
          ?.map((doc: any) => doc.contractors.name)
          .join(', '),
        documentName: doc.document_types?.name,
        state: doc.state,
        multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
        validity: formattedDate || 'No vence',
        id: doc.id,
        resource: `${doc.applies?.lastname} ${doc.applies?.firstname}`,
      }
    }
    const mappedEmployees = documents_employees?.map(mapEmployee)

    if (error) {
      console.error('Error fetching document types:', error.message)
      return
    }

    setDocumentsEmployees([
      ...(mappedVehicles || []),
      ...(mappedEmployees || []),
    ])
  }

  let doc_personas = document_types?.filter(doc => doc.applies === 'Persona')
  let doc_equipos = document_types?.filter(doc => doc.applies === 'Equipos')

  useEffect(() => {
    fetchDocumentTypes()
    fetchDocumentsEmployees()
  }, [actualCompany])

  const filteredData = documents_employees as AuditorDocument[]
  return (
    <section className={'flex flex-col md:mx-7'}>
      <Card>
        <CardHeader>
          <CardTitle>Tipos de documentos</CardTitle>
          <CardDescription>Tipos de documentos auditables</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Personas</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre del Documento</TableHead>
                      <TableHead className="w-[100px]">Multirecurso</TableHead>
                      <TableHead className="w-[100px]">Vence</TableHead>
                      <TableHead className="w-[100px]">Mandatorio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doc_personas?.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.name}
                        </TableCell>
                        <TableCell>{doc.multiresource ? 'Si' : 'No'}</TableCell>
                        <TableCell>{doc.explired ? 'Si' : 'No'}</TableCell>
                        <TableCell>{doc.mandatory ? 'Si' : 'No'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Equipos</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre del Documento</TableHead>
                      <TableHead className="w-[100px]">Multirecurso</TableHead>
                      <TableHead className="w-[100px]">Vence</TableHead>
                      <TableHead className="w-[100px]">Mandatorio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doc_equipos?.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.name}
                        </TableCell>
                        <TableCell>{doc.multiresource ? 'Si' : 'No'}</TableCell>
                        <TableCell>{doc.explired ? 'Si' : 'No'}</TableCell>
                        <TableCell>{doc.mandatory ? 'Si' : 'No'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Crear nuevo</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Nuevo tipo de documento</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <NewDocumentType codeControlClient />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button
                  onClick={() => {
                    document.getElementById('create_new_document')?.click()
                    //cerrar el modal
                  }}
                >
                  Crear documento
                </Button>
                <AlertDialogCancel id="close_document_modal">
                  Cancel
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
      <Separator />
      <div className="flex justify-between flex-wrap flex-col">
        <div className="">
          <Card className=" dark:bg-slate-950 w-full grid grid-cols-1">
            <section>
              <CardHeader className=" mb-4 flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Documentos cargados
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Aquí encontrarás todos los documentos cargados
                  </CardDescription>
                </div>
                <div className="flex gap-4 flex-wrap pl-6">
                  <DocumentNav />
                </div>
              </CardHeader>
              <Tabs defaultValue="Empleados">
                <CardContent>
                  <TabsList>
                    <TabsTrigger value="Empleados">Empleados</TabsTrigger>
                    <TabsTrigger value="Vehiculos">Vehiculos</TabsTrigger>
                  </TabsList>
                </CardContent>
                <TabsContent value="Empleados" className="">
                  <ExpiredDataTable
                    data={allDocumentsToShow?.employees || []}
                    // setShowLastMonthDocuments={setShowLastMonthDocuments}
                    columns={ExpiredColums}
                    pending={true}
                    defaultVisibleColumnsCustom={[
                      'date',
                      'resource',
                      'documentName',
                      'validity',
                      'id',
                      'mandatory',
                      'state',
                    ]}
                  />
                </TabsContent>
                <TabsContent value="Vehiculos">
                  <ExpiredDataTable
                    data={allDocumentsToShow?.vehicles || []}
                    columns={ExpiredColums}
                    vehicles={true}
                    pending={true}
                    defaultVisibleColumnsCustom={[
                      'date',
                      'resource',
                      'documentName',
                      'validity',
                      'id',
                      'mandatory',
                      'state',
                    ]}
                  />
                </TabsContent>
              </Tabs>
            </section>
          </Card>
        </div>
      </div>
    </section>
  )
}
