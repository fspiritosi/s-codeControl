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
import { useCountriesStore } from '@/store/countries'
import { useLoggedUserStore } from '@/store/loggedUser'
import { useRouter } from 'next/navigation'
import { ExpiredColums } from '../colums'
import { ExpiredDataTable } from '../data-table'
import { EditModal } from './documentComponents/EditDocumenTypeModal'

export default function page() {
  const { allDocumentsToShow, actualCompany } = useLoggedUserStore()
  const document_types = useCountriesStore(state => state.companyDocumentTypes)
  const fetchDocumentTypes = useCountriesStore(state => state.documentTypes)
  let doc_personas = document_types?.filter(doc => doc.applies === 'Persona')
  let doc_equipos = document_types?.filter(doc => doc.applies === 'Equipos')

  const profile = useLoggedUserStore(state => state)

  let role: string = ''
  if (
    profile?.actualCompany?.owner_id?.credential_id ===
    profile?.credentialUser?.id
  ) {
    role = profile?.actualCompany?.owner_id?.role as string
  } else {
    role = profile?.actualCompany?.share_company_users?.[0]?.role as string
  }
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
                      <TableHead
                        className="w-[100px] text-center"
                        align="center"
                      >
                        Multirecurso
                      </TableHead>
                      <TableHead
                        className="w-[100px] text-center"
                        align="center"
                      >
                        Vence
                      </TableHead>
                      <TableHead
                        className="w-[100px] text-center"
                        align="center"
                      >
                        Mandatorio
                      </TableHead>
                      <TableHead
                        className="w-[100px] text-center"
                        align="center"
                      >
                        Editar
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doc_personas?.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.name}
                        </TableCell>
                        <TableCell align="center">
                          {doc.multiresource ? 'Si' : 'No'}
                        </TableCell>
                        <TableCell align="center">
                          {doc.explired ? 'Si' : 'No'}
                        </TableCell>
                        <TableCell align="center">
                          {doc.mandatory ? 'Si' : 'No'}
                        </TableCell>
                        {doc.company_id && (
                          <TableCell align="center">
                           <EditModal Equipo={doc} />
                          </TableCell>
                        )}
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
              {role && role !== 'Invitado' && <Button>Crear nuevo</Button>}
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
                    fetchDocumentTypes(actualCompany?.id)
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