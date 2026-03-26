import CompanyComponent from '@/modules/company/features/list/components/CompanyComponent';
import DangerZoneComponent from '@/shared/components/common/DangerZoneComponent';
import DocumentTabComponent from '@/modules/company/features/detail/components/DocumentTabComponent';
import EditCompanyButton from '@/modules/company/features/list/components/EditCompanyButton';
import { RegisterWithRole } from '@/modules/company/features/users/components/RegisterWithRole';
import ServiceComponent from '@/modules/maintenance/features/services/components/ServiceComponent';
import CompanySkeleton from '@/shared/components/common/Skeletons/CompanySkeleton';
import UsersTabComponent from '@/modules/company/features/users/components/UsersTabComponent';
import PortalEmployeeWrapper from '@/modules/company/features/portal/components/PortalEmployeeWrapper';
import { buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import Contacts from '@/modules/company/features/contacts/components/Contact';
import CovenantTreeFile from '@/modules/company/features/covenants/components/CovenantTreeFile';
import Customers from '@/modules/company/features/customers/components/Customers';

const VALID_TABS = ['general', 'documentacion', 'users', 'customers', 'contacts', 'covenant', 'service', 'portal_employee'] as const;
type CompanyTab = (typeof VALID_TABS)[number];

export default async function CompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; [key: string]: string | undefined }>;
}) {
  const resolved = await searchParams;
  const cookiesStore = await cookies();
  const company_id = cookiesStore.get('actualComp')?.value;

  const currentTab: CompanyTab = VALID_TABS.includes(resolved.tab as CompanyTab)
    ? (resolved.tab as CompanyTab)
    : 'general';

  return (
    <Suspense fallback={<CompanySkeleton />}>
      <UrlTabs value={currentTab} paramName="tab" baseUrl="/dashboard/company/actualCompany">
        <UrlTabsList className="mx-6 mt-4">
          <UrlTabsTrigger value="general">General</UrlTabsTrigger>
          <UrlTabsTrigger value="documentacion">Documentación</UrlTabsTrigger>
          <UrlTabsTrigger value="users">Usuarios</UrlTabsTrigger>
          <UrlTabsTrigger value="customers">Clientes</UrlTabsTrigger>
          <UrlTabsTrigger value="contacts">Contactos</UrlTabsTrigger>
          <UrlTabsTrigger value="covenant">Convenios</UrlTabsTrigger>
          <UrlTabsTrigger value="service">Servicios</UrlTabsTrigger>
          <UrlTabsTrigger value="portal_employee">Portal de Empleados</UrlTabsTrigger>
        </UrlTabsList>

        <UrlTabsContent value="general">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Datos generales de la empresa</CardTitle>
                <CardDescription>Información de la empresa</CardDescription>
              </div>
              <EditCompanyButton companyId={company_id?.toString() ?? ''} />
            </CardHeader>
            <CardContent>
              <CompanyComponent />
              <DangerZoneComponent />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="documentacion">
          <Card>
            <CardHeader>
              <CardTitle>Documentos de la empresa</CardTitle>
              <CardDescription>Lista de documentos a nombre de la empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTabComponent />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuarios de la empresa</CardTitle>
                <CardDescription>Lista de usuarios de la empresa</CardDescription>
              </div>
              <RegisterWithRole />
            </CardHeader>
            <CardContent>
              <UsersTabComponent />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="customers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Clientes de la empresa</CardTitle>
                <CardDescription>Lista de clientes de la empresa</CardDescription>
              </div>
              <Link
                href="/dashboard/company/actualCompany/customers/action?action=new"
                className={buttonVariants({ variant: 'default' })}
              >
                Registrar Cliente
              </Link>
            </CardHeader>
            <CardContent>
              <Customers />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="contacts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contactos de la empresa</CardTitle>
                <CardDescription>Lista de contactos de la empresa</CardDescription>
              </div>
              <Link
                href="/dashboard/company/contact/action?action=new"
                className={buttonVariants({ variant: 'default' })}
              >
                Registrar Contacto
              </Link>
            </CardHeader>
            <CardContent>
              <Contacts />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="covenant">
          <Card>
            <CardHeader>
              <CardTitle>Convenios colectivos de trabajo</CardTitle>
              <CardDescription>Lista de Convenios colectivos de trabajo</CardDescription>
            </CardHeader>
            <CardContent>
              <CovenantTreeFile />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="service">
          <Card>
            <CardHeader>
              <CardTitle>Servicios de la empresa</CardTitle>
              <CardDescription>Crear y ver servicios de la empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceComponent />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="portal_employee">
          <Card>
            <CardHeader>
              <CardTitle>Portal de Empleados</CardTitle>
              <CardDescription>Configuración del portal de empleados</CardDescription>
            </CardHeader>
            <CardContent>
              <PortalEmployeeWrapper />
            </CardContent>
          </Card>
        </UrlTabsContent>
      </UrlTabs>
    </Suspense>
  );
}
