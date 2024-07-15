'use client';
import NewDocumentType from '@/components/NewDocumentType';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { EditModal } from './EditDocumenTypeModal';

<<<<<<< HEAD
function TypesDocumentsView({empresa,equipos,personas}: { personas?: boolean; equipos?: boolean; empresa?: boolean }) {
=======

function TypesDocumentsView({personas, equipos, empresa}:{personas?:boolean, equipos?:boolean, empresa?:boolean}) {
>>>>>>> facc09f9da3db5009e203ad9fb18af414b5fc9c3
  const fetchDocumentTypes = useCountriesStore((state) => state.documentTypes);
  const document_types = useCountriesStore((state) => state.companyDocumentTypes);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const role = useLoggedUserStore((state) => state.roleActualCompany);
  let doc_personas = document_types?.filter((doc) => doc.applies === 'Persona').filter((e) => e.is_active);
  let doc_equipos = document_types?.filter((doc) => doc.applies === 'Equipos').filter((e) => e.is_active);
  let doc_empresa = document_types?.filter((doc) => doc.applies === 'Empresa').filter((e) => e.is_active);
  return (
    <Card>
      <div className="flex justify-between items-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">Tipos de documentos</CardTitle>
          <CardDescription className="text-muted-foreground">Tipos de documentos auditables</CardDescription>
        </CardHeader>

        <AlertDialog>
          <AlertDialogTrigger asChild className="mr-4">
            {role !== 'Invitado' && <Button>Crear nuevo</Button>}
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
                  document.getElementById('create_new_document')?.click();
                  fetchDocumentTypes(actualCompany?.id);
                }}
              >
                Crear documento
              </Button>
              <AlertDialogCancel id="close_document_modal">Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <CardContent>
        <Tabs defaultValue="Personas" className="w-full">
          <TabsList>
<<<<<<< HEAD
=======
            
>>>>>>> facc09f9da3db5009e203ad9fb18af414b5fc9c3
            {personas && <TabsTrigger value="Personas">Personas</TabsTrigger>}
            {equipos && <TabsTrigger value="Equipos">Equipos</TabsTrigger>}
            {empresa && <TabsTrigger value="Empresa">Empresa</TabsTrigger>}
          </TabsList>
          <TabsContent value="Personas">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Documento</TableHead>
                  <TableHead className="w-[100px] text-center" align="center">
                    Multirecurso
                  </TableHead>
                  <TableHead className="w-[130px] text-center" align="center">
                    Es especial?
                  </TableHead>
                  <TableHead className="w-[130px] text-center" align="center">
                    Es mensual?
                  </TableHead>
                  <TableHead className="w-[100px] text-center" align="center">
                    Vence
                  </TableHead>
                  <TableHead className="w-[100px] text-center" align="center">
                    Mandatorio
                  </TableHead>
                  <TableHead className="w-[100px] text-center" align="center">
                    Es privado?
                  </TableHead>
                  <TableHead className="w-[100px] text-center" align="center">
                    Editar
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doc_personas
                  ?.sort((a, b) => {
                    if (a.company_id === null && b.company_id !== null) {
                      return -1;
                    } else if (a.company_id !== null && b.company_id === null) {
                      return 1;
                    } else {
                      return a.name.localeCompare(b.name);
                    }
                  })
                  ?.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell align="center">{doc.multiresource ? 'Si' : 'No'}</TableCell>
                      <TableCell align="center">{doc.special ? 'Si' : 'No'}</TableCell>
                      <TableCell align="center">{doc.is_it_montlhy ? 'Si' : 'No'}</TableCell>
                      <TableCell align="center">{doc.explired ? 'Si' : 'No'}</TableCell>
                      <TableCell align="center">{doc.mandatory ? 'Si' : 'No'}</TableCell>
                      <TableCell align="center">{doc.private ? 'Si' : 'No'}</TableCell>
                      {doc.company_id && (
                        <TableCell align="center">
                          <EditModal Equipo={doc} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="Equipos">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Documento</TableHead>
                  <TableHead className="w-[100px] text-center" align="center">
                    Multirecurso
                  </TableHead>
                  <TableHead className="w-[130px] text-center" align="center">
                    Es especial?
                  </TableHead>
                  <TableHead className="w-[130px] text-center" align="center">
                    Es mensual?
                  </TableHead>
                  <TableHead className="w-[100px] text-center" align="center">
                    Vence
                  </TableHead>
                  <TableHead className="w-[100px] text-center" align="center">
                    Mandatorio
                  </TableHead>
                  <TableHead className="w-[100px] text-center" align="center">
                    Es privado?
                  </TableHead>
                  <TableHead className="w-[100px] text-center" align="center">
                    Editar
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doc_equipos
                  ?.sort((a, b) => {
                    if (a.company_id === null && b.company_id !== null) {
                      return -1;
                    } else if (a.company_id !== null && b.company_id === null) {
                      return 1;
                    } else {
                      return a.name.localeCompare(b.name);
                    }
                  })
                  ?.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell align="center">{doc.multiresource ? 'Si' : 'No'}</TableCell>
                      <TableCell align="center">{doc.special ? 'Si' : 'No'}</TableCell>
                      <TableCell align="center">{doc.is_it_montlhy ? 'Si' : 'No'}</TableCell>
                      <TableCell align="center">{doc.explired ? 'Si' : 'No'}</TableCell>
                      <TableCell align="center">{doc.mandatory ? 'Si' : 'No'}</TableCell>
                      <TableCell align="center">{doc.private ? 'Si' : 'No'}</TableCell>
                      {doc.company_id && (
                        <TableCell align="center">
                          <EditModal Equipo={doc} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="Empresa">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Documento</TableHead>
                  <TableHead className="w-[100px] text-center">Vence</TableHead>
                  <TableHead className="w-[130px] text-center">Es mensual?</TableHead>
                  <TableHead className="w-[100px] text-center">Es privado?</TableHead>
                  <TableHead className="w-[100px] text-center">Mandatorio</TableHead>
                  <TableHead className="w-[100px] text-center">Editar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doc_empresa?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell align="center">{doc.explired ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.is_it_montlhy ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.private ? 'Si' : 'No'}</TableCell>
                    <TableCell align="center">{doc.mandatory ? 'Si' : 'No'}</TableCell>
                    {doc.company_id && (
                      <TableCell align="center">
                        <EditModal Equipo={doc} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default TypesDocumentsView;
