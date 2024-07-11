import { supabaseServer } from '@/lib/supabase/server';
import { CompanyDocumentsType } from '@/store/loggedUser';
import { VehiclesAPI } from '@/types/types';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import TabsDocuments from './documentComponents/TabsDocuments';

<<<<<<< HEAD
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
import { EditModal } from './documentComponents/EditDocumentTypeModal'
=======
export default async function page() {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No vence';
    const [day, month, year] = dateString.split('/');
    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate || 'No vence';
  };
  const mapDocument = (doc: any) => {
    const formattedDate = formatDate(doc.validity);
    return {
      date: format(new Date(doc.created_at), 'dd/MM/yyyy'),
      allocated_to: doc.employees?.contractor_employee?.map((doc: any) => doc.contractors?.name).join(', '),
      documentName: doc.document_types?.name,
      state: doc.state,
      multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
      isItMonthly: doc.document_types?.is_it_montlhy,
      validity: formattedDate,
      mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
      id: doc.id,
      resource: `${doc.employees?.lastname?.charAt(0)?.toUpperCase()}${doc?.employees.lastname.slice(
        1
      )} ${doc.employees?.firstname?.charAt(0)?.toUpperCase()}${doc?.employees.firstname.slice(1)}`,
      document_number: doc.employees.document_number,
      document_url: doc.document_path,
      is_active: doc.employees.is_active,
      period: doc.period,
      applies: doc.document_types.applies,
      id_document_types: doc.document_types.id,
      intern_number: null,
    };
  };
  const mapVehicle = (doc: any) => {
    const formattedDate = formatDate(doc.validity);
    return {
      date: doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : 'No vence',
      allocated_to: doc.applies?.type_of_vehicle?.name,
      documentName: doc.document_types?.name,
      state: doc.state,
      multiresource: doc.document_types?.multiresource ? 'Si' : 'No',
      isItMonthly: doc.document_types?.is_it_montlhy,
      validity: formattedDate,
      mandatory: doc.document_types?.mandatory ? 'Si' : 'No',
      id: doc.id,
      resource: `${doc.applies?.domain}`,
      vehicle_id: doc.applies?.id,
      is_active: doc.applies?.is_active,
      period: doc.period,
      applies: doc.document_types.applies,
      id_document_types: doc.document_types.id,
      intern_number: `${doc.applies?.intern_number}`,
    };
  };
>>>>>>> 37a920db50574ef4220d3221ba76c05d12563b78

  const supabase = supabaseServer();
  const user = await supabase.auth.getUser();
  const cookiesStore = cookies();
  const { data: userShared } = await supabase
    .from('share_company_users')
    .select('*')
    .eq('profile_id', user?.data?.user?.id);
  const role: string | null = userShared?.[0]?.role || null;
  const actualCompany = cookiesStore.get('actualComp')?.value;

  let { data: documents_company, error: documents_company_error } = await supabase
    .from('documents_company')
    .select('*,id_document_types(*),user_id(*)')
    .eq('applies', actualCompany);

  let { data: document_employees, error } = await supabase
    .from('documents_employees')
    .select(
      `
    *,
    employees:employees(*,contractor_employee(
      customers(
        *
      )
    )),
    document_types:document_types(*)
`
    )
    .not('employees', 'is', null)
    .eq('employees.company_id', actualCompany);

  let { data: equipmentData, error: equipmentError } = await supabase
    .from('documents_equipment')
    .select(
      `*,
    document_types:document_types(*),
    applies(*,type(*),type_of_vehicle(*),model(*),brand(*))
    `
    )
    .eq('applies.company_id', actualCompany)
    .not('applies', 'is', null);

  const typedData: VehiclesAPI[] | null = equipmentData as VehiclesAPI[];

  const equipmentData1 = role === 'Invitado' ? typedData?.filter((e) => !e.document_types.private) : typedData; //! falta agrelar las columnas

  const typedDataCompany: CompanyDocumentsType[] | null = documents_company as CompanyDocumentsType[];

  const companyData =
    role === 'Invitado' ? typedDataCompany?.filter((e) => !e.id_document_types.private) : typedDataCompany;
  const employeesData =
    role === 'Invitado' ? document_employees?.filter((e) => !e.document_types.private) : document_employees; //! falta agrelar las columnas

  const AllvaluesToShow = {
    employees: employeesData?.map(mapDocument) || [],
    vehicles: equipmentData1?.map(mapVehicle) || [],
  };

  let clientData: any[] | null = [];

  if (role === 'Invitado') {
    const { data, error: shared_error } = await supabase
      .from('share_company_users')
      .select('*')
      .eq('company_id', actualCompany)
      .eq('profile_id', user?.data?.user?.id);

    if (!error) {
      clientData = data;
    }
  }
<<<<<<< HEAD
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
=======

  return (
    <>
      <TabsDocuments
        clientData={clientData || []}
        AllvaluesToShow={AllvaluesToShow}
        companyData={companyData}
        serverRole={role}
      />
    </>
  );
>>>>>>> 37a920db50574ef4220d3221ba76c05d12563b78
}
