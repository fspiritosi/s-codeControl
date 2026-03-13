import CompanyComponent from '@/modules/company/features/list/components/CompanyComponent';
import DangerZoneComponent from '@/shared/components/common/DangerZoneComponent';
import DocumentTabComponent from '@/modules/company/features/detail/components/DocumentTabComponent';
import EditCompanyButton from '@/modules/company/features/list/components/EditCompanyButton';
import { RegisterWithRole } from '@/modules/company/features/users/components/RegisterWithRole';
import ServiceComponent from '@/modules/maintenance/features/services/components/ServiceComponent';
import CompanySkeleton from '@/shared/components/common/Skeletons/CompanySkeleton';
import UsersTabComponent from '@/modules/company/features/users/components/UsersTabComponent';
import Viewcomponent from '@/shared/components/common/ViewComponent';
import { buttonVariants } from '@/shared/components/ui/button';
import PortalEmployeeWrapper from '@/modules/company/features/portal/components/PortalEmployeeWrapper';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import TypesDocumentAction from '@/modules/documents/features/types/components/TypesDocumentAction';
import Contacts from '@/modules/company/features/contacts/components/Contact';
import CovenantTreeFile from '@/modules/company/features/covenants/components/CovenantTreeFile';
import Customers from '@/modules/company/features/customers/components/Customers';
export default async function CompanyPage() {
  const coockiesStore = await cookies();
  const company_id = coockiesStore.get('actualComp')?.value;

  const viewData = {
    defaultValue: 'general',
    tabsValues: [
      {
        value: 'general',
        name: 'General',
        restricted: [''],
        content: {
          title: 'Datos generales de la empresa',
          description: 'Información de la empresa',
          buttonActioRestricted: [''],
          buttonAction: <EditCompanyButton companyId={company_id?.toString() ?? ''} />,
          component: (
            <div>
              <CompanyComponent />
              <DangerZoneComponent />
            </div>
          ),
        },
      },
      {
        value: '"documentacion"',
        name: 'Documentacion',
        restricted: [''],
        content: {
          title: 'Documentos de la empresa',
          description: 'Lista de documentos a nombre de la empresa',
          buttonActioRestricted: [''],
          buttonAction: (
            <div className="flex gap-4 flex-wrap pl-6">
              <TypesDocumentAction optionChildrenProp="Empresa" />
            </div>
          ),
          component: <DocumentTabComponent />,
        },
      },
      {
        value: 'users',
        name: 'Usuarios',
        restricted: [''],
        content: {
          title: 'Usuarios de la empresa',
          description: 'Lista de usuarios de la empresa',
          buttonActioRestricted: [''],
          buttonAction: <RegisterWithRole />,
          component: <UsersTabComponent />,
        },
      },
      {
        value: 'customers',
        name: 'Clientes',
        restricted: [''],
        content: {
          title: 'Clientes de la empresa',
          description: 'Lista de clientes de la empresa',
          buttonActioRestricted: [''],
          buttonAction: (
            <Link
              href={'/dashboard/company/actualCompany/customers/action?action=new'}
              className={buttonVariants({ variant: 'default' })}
            >
              Registrar Cliente
            </Link>
          ),
          component: <Customers />,
        },
      },
      {
        value: 'contacts',
        name: 'Contactos',
        restricted: [''],
        content: {
          title: 'Contactos de la empresa',
          description: 'Lista de contactos de la empresa',
          buttonActioRestricted: [''],
          buttonAction: (
            <Link
              href={'/dashboard/company/contact/action?action=new'}
              className={buttonVariants({ variant: 'default' })}
            >
              Registrar Contacto
            </Link>
          ),
          component: <Contacts />,
        },
      },
      {
        value: 'covenant',
        name: 'Convenios colectivos de trabajo',
        restricted: [''],
        content: {
          title: 'Convenios colectivos de trabajo',
          description: 'Lista de Convenios colectivos de trabajo',
          buttonActioRestricted: [''],
          // buttonAction: <CovenantRegister />,
          component: <CovenantTreeFile />,
        },
      },
      // {
      //   value: 'forms',
      //   name: 'Formularios',
      //   restricted: [],
      //   content: {
      //     title: 'Formularios',
      //     description: 'Formularios de empresa',
      //     buttonActioRestricted: [''],
      //     // buttonAction: <TypesDocumentAction optionChildrenProp="Personas" />,
      //     component: <CreatedForm />,
      //   },
      // },
      {
        value: 'service',
        name: 'Servicios',
        restricted: [''],
        content: {
          title: 'Servicios de la empresa',
          description: 'Crear y ver servicios de la empresa',
          buttonActioRestricted: [''],
          buttonAction: '',
          component: <ServiceComponent />,
        },
      },
      {
        value: 'portal_employee',
        name: 'Portal de Empleados',
        restricted: [''],
        content: {
          title: 'Portal de Empleados',
          description: 'Portal de Empleados',
          buttonActioRestricted: [''],
          buttonAction: '',
          component: <PortalEmployeeWrapper />,
        },
      },
    ],
  };

  return (
    <Suspense fallback={<CompanySkeleton />}>
      <Viewcomponent viewData={viewData} />
    </Suspense>
  );
}
