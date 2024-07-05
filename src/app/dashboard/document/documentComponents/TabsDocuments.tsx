'use client';
import DocumentNav from '@/components/DocumentNav';
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
import { CompanyDocumentsType, useLoggedUserStore } from '@/store/loggedUser';
import { useRouter } from 'next/navigation';
import { ExpiredColums } from '../../colums';
import { ColumnsMonthly } from '../../columsMonthly';
import { DataTable } from '../../company/actualCompany/components/data-table';
import { columnsDocuments } from '../../company/actualCompany/components/document-colums';
import { ExpiredDataTable } from '../../data-table';
import { EditModal } from './EditDocumenTypeModal';
interface Document {
  date: string;
  allocated_to: string;
  documentName: string;
  multiresource: string;
  validity: string;
  id: string;
  resource: string;
  state: string;
  document_path?: string;
  is_active: boolean;
  isItMonthly: boolean;
  applies: string;
  mandatory: string;
}
function TabsDocuments({
  serverRole,
  companyData,
  AllvaluesToShow,
}: {
  serverRole: string | null;
  companyData: CompanyDocumentsType[];
  AllvaluesToShow: {
    employees: Document[];
    vehicles: Document[];
  };
}) {
  const { actualCompany } = useLoggedUserStore();

  const document_types = useCountriesStore((state) => state.companyDocumentTypes);
  let doc_personas = document_types?.filter((doc) => doc.applies === 'Persona').filter((e) => e.is_active);
  let doc_equipos = document_types?.filter((doc) => doc.applies === 'Equipos').filter((e) => e.is_active);
  let doc_empresa = document_types?.filter((doc) => doc.applies === 'Empresa').filter((e) => e.is_active);
  const profile = useLoggedUserStore((state) => state);
  const sharedUsersAll = useLoggedUserStore((state) => state.sharedUsers);
  const role = serverRole ?? useLoggedUserStore((state) => state.roleActualCompany);
  const fetchDocumentTypes = useCountriesStore((state) => state.documentTypes);
  const AllCompanyDocuments = useLoggedUserStore((state) => state.companyDocuments);
  const ownerUser = useLoggedUserStore((state) => state.profile);
  const sharedUsers =
    sharedUsersAll?.map((user) => {
      return {
        email: user.profile_id.email,
        fullname: user.profile_id.fullname,
        role: user?.role,
        alta: user.created_at,
        id: user.id,
        img: user.profile_id.avatar || '',
      };
    }) || [];
  const owner = ownerUser?.map((user) => {
    return {
      email: user.email,
      fullname: user.fullname as string,
      role: 'Propietario',
      alta: user.created_at ? new Date(user.created_at) : new Date(),
      id: user.id || '',
      img: user.avatar || '',
    };
  });

  const data = owner?.concat(
    sharedUsers?.map((user) => ({
      ...user,
      fullname: user.fullname || '',
    })) || []
  );
  const documentCompany = companyData
    ?.filter((e) => !e.id_document_types.private && !e.id_document_types.is_it_montlhy)
    .map((document) => {
      const sharedUserRole = data?.find((e) => e.email === document.user_id?.email)?.role;
      return {
        email: document.user_id?.email ?? 'Documento pendiente',
        fullname: document.id_document_types.name,
        role: sharedUserRole ?? 'Documento pendiente',
        alta: (document.user_id?.email && document.created_at) ?? 'Documento pendiente',
        id: document.id_document_types.id,
        img: document.user_id?.avatar,
        vencimiento: document.validity
          ? document.validity
          : document.id_document_types.explired
            ? 'Documento pendiente'
            : 'No expira',
        documentId: document.id,
        private: document.id_document_types.private,
      };
    });
  const documentCompanyMensual = companyData
    ?.filter((e) => !e.id_document_types.private && e.id_document_types.is_it_montlhy)
    .map((document) => {
      const sharedUserRole = data?.find((e) => e.email === document.user_id?.email)?.role;
      return {
        email: document.user_id?.email ?? 'Documento pendiente',
        fullname: document.id_document_types.name,
        role: sharedUserRole ?? 'Documento pendiente',
        alta: (document.user_id?.email && document.created_at) ?? 'Documento pendiente',
        id: document.id_document_types.id,
        img: document.user_id?.avatar,
        vencimiento: document.validity
          ? document.validity
          : document.id_document_types.explired
            ? 'Documento pendiente'
            : 'No expira',
        documentId: document.id,
        private: document.id_document_types.private,
      };
    });
  const router = useRouter();
  console.log(doc_personas);

  return (
    <Tabs defaultValue="Documentos de empleados" className="md:mx-7">
      <TabsList>
        <TabsTrigger value="Documentos de empleados">Documentos de empleados</TabsTrigger>
        <TabsTrigger value="Documentos de equipos">Documentos de equipos</TabsTrigger>
        <TabsTrigger value="Documentos de empresa">Documentos de empresa</TabsTrigger>
        {role !== 'Invitado' && <TabsTrigger value="Tipos de documentos">Tipos de documentos</TabsTrigger>}
      </TabsList>
      <TabsContent value="Documentos de empleados">
        <Card>
          <CardHeader className=" mb-4  w-full bg-muted dark:bg-muted/50 border-b-2">
            <div className="flex flex-row gap-4 justify-between items-center flex-wrap">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Documentos cargados</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Aquí encontrarás todos los documentos de tus empleados
                </CardDescription>
              </div>
              <div className="flex gap-4 flex-wrap pl-6">
                <DocumentNav />
              </div>
            </div>
          </CardHeader>
          <Tabs defaultValue="permanentes">
            <CardContent>
              <TabsList>
                <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
                <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
              </TabsList>
            </CardContent>
            <TabsContent value="permanentes">
              <ExpiredDataTable
                data={AllvaluesToShow?.employees.filter((e) => !e.isItMonthly) || []}
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
                localStorageName={'dashboardEmployeesPermanentes'}
                permanent
              />
            </TabsContent>
            <TabsContent value="mensuales">
              <ExpiredDataTable
                data={AllvaluesToShow?.employees.filter((e) => e.isItMonthly) || []}
                columns={ColumnsMonthly}
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
                localStorageName={'dashboardEmployeesMensuales'}
                monthly
              />
            </TabsContent>
          </Tabs>
        </Card>
      </TabsContent>
      <TabsContent value="Documentos de equipos">
        <Card>
          <CardHeader className=" mb-4  w-full bg-muted dark:bg-muted/50 border-b-2">
            <div className="flex flex-row gap-4 justify-between items-center flex-wrap">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Documentos cargados</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Aquí encontrarás todos los documentos de tus equipos
                </CardDescription>
              </div>
              <div className="flex gap-4 flex-wrap pl-6">
                <DocumentNav />
              </div>
            </div>
          </CardHeader>
          <Tabs defaultValue="permanentes">
            <CardContent>
              <TabsList>
                <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
                <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
              </TabsList>
            </CardContent>
            <TabsContent value="permanentes">
              <ExpiredDataTable
                data={AllvaluesToShow?.vehicles.filter((e) => !e.isItMonthly) || []}
                columns={ExpiredColums}
                pending={true}
                vehicles
                defaultVisibleColumnsCustom={[
                  'date',
                  'resource',
                  'documentName',
                  'validity',
                  'id',
                  'mandatory',
                  'state',
                ]}
                localStorageName={'dashboardVehiculosPermanentes'}
                permanent
              />
            </TabsContent>
            <TabsContent value="mensuales">
              <ExpiredDataTable
                data={AllvaluesToShow?.vehicles.filter((e) => e.isItMonthly) || []}
                columns={ColumnsMonthly}
                pending={true}
                vehicles
                defaultVisibleColumnsCustom={[
                  'date',
                  'resource',
                  'documentName',
                  'validity',
                  'id',
                  'mandatory',
                  'state',
                ]}
                localStorageName={'dashboardVehiculosMensuales'}
                monthly
              />
            </TabsContent>
          </Tabs>
        </Card>
      </TabsContent>
      <TabsContent value="Documentos de empresa">
        <Card>
          <CardHeader className=" mb-4  w-full bg-muted dark:bg-muted/50 border-b-2">
            <div className="flex flex-row gap-4 justify-between items-center flex-wrap">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Documentos cargados</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Aquí encontrarás todos los documentos publicos de la empresa
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Tabs defaultValue="mensuales">
            <CardContent>
              <TabsList>
                <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
                <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
              </TabsList>
            </CardContent>
            <TabsContent value="permanentes">
              <div className="p-4">
                <DataTable isDocuments data={documentCompany || []} columns={columnsDocuments} />
              </div>
            </TabsContent>
            <TabsContent value="mensuales">
              <div className="p-4">
                <DataTable isDocuments data={documentCompanyMensual || []} columns={columnsDocuments} />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </TabsContent>
      <TabsContent value="Tipos de documentos">
        <Card>
          <div className="flex justify-between items-center">
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-tight">Tipos de documentos</CardTitle>
              <CardDescription className="text-muted-foreground">Tipos de documentos auditables</CardDescription>
            </CardHeader>

            <AlertDialog>
              <AlertDialogTrigger asChild className="mr-4">
                { role !== 'Invitado' && <Button>Crear nuevo</Button>}
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
                <TabsTrigger value="Personas">Personas</TabsTrigger>
                <TabsTrigger value="Equipos">Equipos</TabsTrigger>
                <TabsTrigger value="Empresa">Empresa</TabsTrigger>
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
                    {doc_personas?.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell align="center">{doc.multiresource ? 'Si' : 'No'}</TableCell>
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
                    {doc_equipos?.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell align="center">{doc.multiresource ? 'Si' : 'No'}</TableCell>
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
      </TabsContent>
    </Tabs>
  );
}

export default TabsDocuments;
