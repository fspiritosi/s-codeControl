import CompanyComponent from '@/components/CompanyComponent';
import { CovenantRegister } from '@/components/CovenantRegister';
import DangerZoneComponent from '@/components/DangerZoneComponent';
import DocumentTabComponent from '@/components/DocumentTabComponent';
import EditCompanyButton from '@/components/EditCompanyButton';
import { RegisterWithRole } from '@/components/RegisterWithRole';
import UsersTabComponent from '@/components/UsersTabComponent';
import Viewcomponent from '@/components/ViewComponent';
import { buttonVariants } from '@/components/ui/button';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { FormCustomContainer } from '../../maintenance/components/FormCustomContainer';
import Contacts from '../contact/Contact';
import Customers from '../customers/Customers';
import Cct from './covenant/CctComponent';
export default async function CompanyPage() {
  const coockiesStore = cookies();
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
              <Link href={'/dashboard/document'} className={buttonVariants({ variant: 'default' })}>
                Nuevo Documento
              </Link>
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
              href={'/dashboard/company/customers/action?action=new'}
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
        name: 'CCT',
        restricted: [''],
        content: {
          title: 'Convenios colectivos de trabajo',
          description: 'Lista de Convenios colectivos de trabajo',
          buttonActioRestricted: [''],
          buttonAction: <CovenantRegister />,
          component: <Cct />,
        },
      },
      {
        value: 'forms',
        name: 'Formularios',
        restricted: [],
        content: {
          title: 'Formularios',
          description: 'Formularios de empresa',
          buttonActioRestricted: [''],
          // buttonAction: <TypesDocumentAction optionChildrenProp="Personas" />,
          component: <FormCustomContainer company={true} />,
        },
      },
      // {
      //   value:"modules",
      //   name:"Módulos",
      //   restricted:[""],
      //   content:{
      //     title:"Módulos habilitados",
      //     description:"Lista de módulos habilitados",
      //     buttonAction:(
      //       ""
      //     ),
      //     component:<div>Modulos</div>
      //   }

      // },
    ],
  };

  return <Viewcomponent viewData={viewData} />;
}
