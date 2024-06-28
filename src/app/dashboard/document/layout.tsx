// import { AlertComponent } from '@/components/AlertComponent'
'use client';
import DocumentNav from '@/components/DocumentNav';
import NewDocumentType from '@/components/NewDocumentType';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { CaretUpIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EditModal } from './documentComponents/EditDocumenTypeModal';

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  const document_types = useCountriesStore((state) => state.companyDocumentTypes);
  let doc_personas = document_types?.filter((doc) => doc.applies === 'Persona').filter((e) => e.is_active);
  let doc_equipos = document_types?.filter((doc) => doc.applies === 'Equipos').filter((e) => e.is_active);
  let doc_empresa = document_types?.filter((doc) => doc.applies === 'Empresa').filter((e) => e.is_active);
  const profile = useLoggedUserStore((state) => state);
  let role: string = '';
  if (profile?.actualCompany?.owner_id?.credential_id === profile?.credentialUser?.id) {
    role = profile?.actualCompany?.owner_id?.role as string;
  } else {
    role = profile?.actualCompany?.share_company_users?.[0]?.role as string;
  }
  const { actualCompany, allDocumentsToShow } = useLoggedUserStore();
  const fetchDocumentTypes = useCountriesStore((state) => state.documentTypes);
  const pathName = usePathname();
  return (
    <div className="md:mx-7">
      <Accordion type="single" className='mb-6' collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl pl-6 font-bold">Tipos de documento</AccordionTrigger>
          <AccordionContent>
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
                            <TableHead className="w-[100px] text-center" align="center">
                              Multirecurso
                            </TableHead>
                            <TableHead className="w-[100px] text-center" align="center">
                              Vence
                            </TableHead>
                            <TableHead className="w-[100px] text-center" align="center">
                              Mandatorio
                            </TableHead>
                            <TableHead className="w-[100px] text-center" align="center">
                              Editar
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {doc_personas?.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">{doc.name}</TableCell>
                              <TableCell align="center">{doc.multiresource ? 'Si' : 'No'}</TableCell>
                              <TableCell align="center">{doc.explired ? 'Si' : 'No'}</TableCell>
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
                          {doc_equipos?.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">{doc.name}</TableCell>
                              <TableCell>{doc.multiresource ? 'Si' : 'No'}</TableCell>
                              <TableCell>{doc.explired ? 'Si' : 'No'}</TableCell>
                              <TableCell>{doc.mandatory ? 'Si' : 'No'}</TableCell>
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
                    <AccordionTrigger>Empresa</AccordionTrigger>
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
                          {doc_empresa?.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">{doc.name}</TableCell>
                              <TableCell>{doc.multiresource ? 'Si' : 'No'}</TableCell>
                              <TableCell>{doc.explired ? 'Si' : 'No'}</TableCell>
                              <TableCell>{doc.mandatory ? 'Si' : 'No'}</TableCell>
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
              </CardFooter>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="flex justify-between flex-wrap flex-col">
        <div className="">
          <Card className=" dark:bg-slate-950 w-full grid grid-cols-1">
            <section>
              <CardHeader className=" mb-4  w-full bg-muted dark:bg-muted/50 border-b-2">
                <div className="flex flex-row gap-4 justify-between items-center flex-wrap">
                  <div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Documentos cargados</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Aquí encontrarás todos los documentos cargados
                    </CardDescription>
                  </div>
                  <div className="flex gap-4 flex-wrap pl-6">
                    <DocumentNav />
                  </div>
                </div>
                <nav className="flex gap-4  pt-3">
                  <Link
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      !pathName.includes('equipment') && !pathName.includes('company') && 'bg-muted'
                    )}
                    href={'/dashboard/document'}
                  >
                    Empleados
                    <CaretUpIcon
                      className={cn(
                        'ml-2 transition-all',
                        !pathName.includes('equipment') && !pathName.includes('company') && 'rotate-180'
                      )}
                    />
                  </Link>
                  <Link
                    className={cn(buttonVariants({ variant: 'outline' }), pathName.includes('equipment') && 'bg-muted')}
                    href={'/dashboard/document/equipment'}
                  >
                    Equipos
                    <CaretUpIcon
                      className={cn('ml-2 transition-all', pathName.includes('equipment') && 'rotate-180')}
                    />
                  </Link>
                  {/* <Link
                    className={cn(buttonVariants({ variant: 'outline' }), pathName.includes('company') && 'bg-muted')}
                    href={'/dashboard/document/company'}
                  >
                    Empresa
                    <CaretUpIcon className={cn('ml-2 transition-all', pathName.includes('company') && 'rotate-180')} />
                  </Link> */}
                </nav>
              </CardHeader>
              {children}
            </section>
          </Card>
        </div>
      </div>
    </div>
  );
}
