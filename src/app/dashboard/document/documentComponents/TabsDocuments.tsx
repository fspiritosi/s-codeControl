'use client';
import DocumentNav from '@/components/DocumentNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyDocumentsType, useLoggedUserStore } from '@/store/loggedUser';
import cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ExpiredColums } from '../../colums';
import { ColumnsMonthly } from '../../columsMonthly';
import { DataTable } from '../../company/actualCompany/components/data-table';
import { columnsDocuments } from '../../company/actualCompany/components/document-colums';
import { ExpiredDataTable } from '../../data-table';
import TypesDocumentsView from './TypesDocumentsView';
import EquipmentDocumentsTable from './EquipmentDocumentsTable';

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
  id_document_types: string;
}
function TabsDocuments({
  serverRole,
  companyData,
  AllvaluesToShow,
  clientData,
  data1,
}: {
  serverRole: string | null;
  companyData: CompanyDocumentsType[];
  AllvaluesToShow: {
    employees: Document[];
    vehicles: Document[];
  };
  clientData: any[] | null;
  data1?: any[] | null;
}) {
  const actualComp = cookies.get('actualComp');

  useEffect(() => {
    router.refresh();
  }, [actualComp]);

  // const supabase = supabaseBrowser();

  const profile = useLoggedUserStore((state) => state);
  const sharedUsersAll = useLoggedUserStore((state) => state.sharedUsers);
  const role = serverRole ?? useLoggedUserStore((state) => state.roleActualCompany);
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
  const employees = useLoggedUserStore((state) => state.employeesToShow);
  const vehiclesData = useLoggedUserStore((state) => state.vehiclesToShow);

  const filteredCustomers = employees?.filter((customer: any) =>
    customer?.allocated_to?.includes(clientData?.[0]?.customer_id)
  );

  const filteredCustomersEmployeesRaw = AllvaluesToShow?.employees.filter((e) => !e.isItMonthly);
  const filteredCustomersEmployeesRawMonthly = AllvaluesToShow?.employees.filter((e) => e.isItMonthly);

  const filteredCustomersEmployees = filteredCustomersEmployeesRaw?.filter((customer: any) => {
    const customerResource = customer?.resource_id; // Asumiendo que es una cadena
    const employeeFullnames = filteredCustomers?.map((emp: any) => emp.id); // Array de cadenas

    return employeeFullnames?.includes(customerResource);
  });

  const filteredCustomersEmployeesMonthly = filteredCustomersEmployeesRawMonthly?.filter((customer: any) => {
    const customerResource = customer?.resource; // Asumiendo que es una cadena
    const employeeFullnames = filteredCustomers?.map((emp: any) => emp.full_name); // Array de cadenas

    return employeeFullnames?.includes(customerResource);
  });

  const filteredEquipment = vehiclesData?.filter((customer: any) =>
    customer.allocated_to?.includes(clientData?.[0]?.customer_id)
  );
  const filteredCustomersEquipmentRaw = AllvaluesToShow?.vehicles.filter((e) => !e.isItMonthly);
  const filteredCustomersEquipmentRawMonthly = AllvaluesToShow?.vehicles.filter((e) => e.isItMonthly);

  const filteredCustomersEquipment = filteredCustomersEquipmentRaw?.filter((customer: any) => {
    const customerResource = customer?.resource_id; // Asumiendo que es una cadena
    const equipmentFullnames = filteredEquipment?.map((emp: any) => emp.id); // Array de cadenas

    return equipmentFullnames?.includes(customerResource);
  });

  const filteredCustomersEquipmentMonthly = filteredCustomersEquipmentRawMonthly?.filter((customer: any) => {
    const customerResource = customer?.resource_id; // Asumiendo que es una cadena
    const employeeFullnames = filteredCustomers?.map((emp: any) => emp.id); // Array de cadenas

    return employeeFullnames?.includes(customerResource);
  });

  return (
    <Tabs defaultValue="Documentos de empleados" className="md:mx-7">
      <TabsList>
        <TabsTrigger value="Documentos de empleados">Documentos de empleados </TabsTrigger>
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
                data={
                  role === 'Invitado'
                    ? filteredCustomersEmployees
                    : AllvaluesToShow?.employees.filter((e) => !e.isItMonthly) || []
                }
                columns={ExpiredColums}
                pending={true}
                defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
                localStorageName={'dashboardEmployeesPermanentes'}
                permanent
              />
            </TabsContent>
            <TabsContent value="mensuales">
              <ExpiredDataTable
                data={
                  role === 'Invitado'
                    ? filteredCustomersEmployeesMonthly
                    : AllvaluesToShow?.employees.filter((e) => e.isItMonthly) || []
                }
                columns={ColumnsMonthly}
                pending={true}
                defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
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
              <div className="flex gap-4 flex-wrap pl-6">{role !== 'Invitado' && <DocumentNav />}</div>
            </div>
          </CardHeader>
          <EquipmentDocumentsTable AllvaluesToShow={AllvaluesToShow} clientData={clientData}/>
          {/* <Tabs defaultValue="permanentes">
            <CardContent>
              <TabsList>
                <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
                <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
              </TabsList>
            </CardContent>
            <TabsContent value="permanentes">
              <ExpiredDataTable
                data={
                  role === 'Invitado'
                    ? filteredCustomersEquipment
                    : AllvaluesToShow?.vehicles.filter((e) => !e.isItMonthly) || []
                }
                columns={ExpiredColums}
                pending={true}
                vehicles
                defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
                localStorageName={'dashboardVehiculosPermanentes'}
                permanent
              />
            </TabsContent>
            <TabsContent value="mensuales">
              <ExpiredDataTable
                data={
                  role === 'Invitado'
                    ? filteredCustomersEquipmentMonthly
                    : AllvaluesToShow?.vehicles.filter((e) => e.isItMonthly) || []
                }
                columns={ColumnsMonthly}
                pending={true}
                vehicles
                defaultVisibleColumnsCustom={['resource', 'documentName', 'validity', 'id', 'mandatory', 'state']}
                localStorageName={'dashboardVehiculosMensuales'}
                monthly
              />
            </TabsContent>
          </Tabs> */}
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
        <TypesDocumentsView equipos empresa personas />
      </TabsContent>
    </Tabs>
  );
}

export default TabsDocuments;
