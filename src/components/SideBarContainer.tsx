import { fetchCurrentCompany, fetchCurrentUser, verifyUserRoleInCompany } from '@/app/server/GET/actions';
import { supabaseServer } from '@/lib/supabase/server';
import InitState from '@/store/InitUser';
import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { cookies } from 'next/headers';
import SideBar from './Sidebar';

async function SideBarContainer() {
  const supabase = supabaseServer();
  const user = await fetchCurrentUser();
  const company = await fetchCurrentCompany();
  const userData: any = await verifyUserRoleInCompany();
  //console.log(userData, 'userData');
  const { data: credentialUser, error: profileError } = await supabase
    .from('profile')
    .select('*')
    .eq('credential_id', user?.id || '');

  const { data: companies, error } = await supabase
    .from('company')
    .select(
      `
    *,
    owner_id(*),
    share_company_users(*,
      profile(*)
    ),
    city (
      name,
      id
    ),
    province_id (
      name,
      id
    ),
    companies_employees (
      employees(
        *,
        city (
          name
        ),
        province(
          name
        ),
        workflow_diagram(
          name
        ),
        hierarchical_position(
          name
        ),
        birthplace(
          name
        ),
        contractor_employee(
          customers(
            *
          )
        )
      )
    )
  `
    )
    .eq('owner_id', user?.id || '');
  if (error) console.log(error);
  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(
      `*,company_id(*,
      owner_id(*),
    share_company_users(*,
      profile(*)
    ),
    city (
      name,
      id
    ),
    province_id (
      name,
      id
    ),
    companies_employees (
      employees(
        *,
        city (
          name
        ),
        province(
          name
        ),
        workflow_diagram(
          name
        ),
        hierarchical_position(
          name
        ),
        birthplace(
          name
        ),
        contractor_employee(
          customers(
            *
          )
        )
      )
    )
  )`
    )
    .eq('profile_id', user?.id || '');

  if (sharedError) console.log(sharedError);

  let role: any;

  const cookiesStore = cookies();
  const actualCompany = cookiesStore?.get('actualComp')?.value;

  if (actualCompany) {
    const is_owner = (companies?.find((company) => company.id === actualCompany) as any)?.owner_id.id === user?.id;
    // console.log(is_owner, 'is_owner', share_company_users);
    const is_shared = share_company_users?.find(
      (company: any) => company.company_id.id === actualCompany && company.profile_id === user?.id
    );
    role = is_owner ? 'owner' : is_shared?.role;
  }

  const sizeIcons = 24;
  const Allinks = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={sizeIcons} />,
      position: 1,
      // regex: /^\/dashboard(\/|$)/,
    },
    {
      name: 'Empresa',
      href: '/dashboard/company/actualCompany',
      icon: <Building2 size={sizeIcons} />,
      position: 2,
      // regex: /^\/dashboard\/company\/actualCompany(\/|$)/,
    },
    {
      name: 'Empleados',
      href: '/dashboard/employee',
      icon: <Users size={sizeIcons} />,
      position: 3,
      // regex: /^\/dashboard\/employee(\/|$)/,
    },
    {
      name: 'Equipos',
      href: '/dashboard/equipment',
      icon: <Truck size={sizeIcons} />,
      position: 4,
      // regex: /^\/dashboard\/equipment(\/|$)/,
    },
    {
      name: 'Documentación',
      href: '/dashboard/document',
      icon: <FileText size={sizeIcons} />,
      position: 5,
      // regex: /^\/dashboard\/document(\/|$)/,
    },
    {
      name: 'Operaciones',
      href: '/dashboard/operations',
      icon: <Calendar size={sizeIcons} />,
      position: 8,
    },
    {
      name: 'Mantenimiento',
      href: '/dashboard/maintenance',
      icon: <Wrench size={sizeIcons} />,
      position: 6,
      // regex: /^\/dashboard\/maintenance(\/|$)/,
    },
    {
      name: 'Formularios',
      href: '/dashboard/forms',
      icon: <ClipboardList size={sizeIcons} />,
      position: 7,
    },
    {
      name: 'Ayuda',
      href: '/dashboard/help',
      icon: <HelpCircle size={sizeIcons} />,
      position: 10,
      // regex: /^\/dashboard\/help(\/|$)/,
    },
  ];

  let liksToShow: any = [];

  const filterLinksRole = () => {
    if (role === 'owner') {
      liksToShow = Allinks;
      return;
    }

    if (role === 'Invitado') {
      liksToShow = Allinks.filter(
        (link) =>
          link.name.toLowerCase() !== 'empresa' &&
          link.name.toLowerCase() !== 'operaciones' &&
          link.name.toLowerCase() !== 'mantenimiento' &&
          link.name.toLowerCase() !== 'documentación' 
          // link.name.toLowerCase() !== 'dashboard'
      );
      return;
    }


    userData?.modulos?.length === 0
      ? (liksToShow = Allinks)
      : // TODO esta linea se tiene que sacar porque por defecto tiene que tener todos los modulos activos
        userData?.modulos?.map((mod: string) => {
          Allinks.filter((link) => {
            link.name.toLowerCase() === mod.toLowerCase() && liksToShow.push(link);
          });
        });
  };

  const sortedLinks = () => {
    liksToShow.sort((a: any, b: any) => a.position - b.position);
  };

  filterLinksRole();
  sortedLinks();

  return (
    <>
      <InitState
        companies={companies}
        user={user}
        share_company_users={share_company_users}
        credentialUser={credentialUser}
        role={role}
      />
      <SideBar key={role} role={role} Allinks={liksToShow} />
    </>
  );
}

export default SideBarContainer;
