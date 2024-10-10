import { fetchCurrentUser } from '@/app/server/GET/actions';
import { supabaseServer } from '@/lib/supabase/server';
import InitState from '@/store/InitUser';
import { cookies } from 'next/headers';
import { FiTool, FiTruck } from 'react-icons/fi';
import {
  MdCalendarMonth,
  MdHelpOutline,
  MdListAlt,
  MdOutlineCorporateFare,
  MdOutlinePersonAddAlt,
  MdOutlineSpaceDashboard,
} from 'react-icons/md';
import SideBar from './Sidebar';

async function SideBarContainer() {
  const supabase = supabaseServer();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  const user = await fetchCurrentUser();

  const { data: credentialUser, error: profileError } = await supabase
    .from('profile')
    .select('*')
    .eq('credential_id', user?.id || '');

  if (profileError) console.log(profileError);

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
      icon: <MdOutlineSpaceDashboard size={sizeIcons} />,
      position: 1,
      // regex: /^\/dashboard(\/|$)/,
    },
    {
      name: 'Empresa',
      href: '/dashboard/company/actualCompany',
      icon: <MdOutlineCorporateFare size={sizeIcons} />,
      position: 2,
      // regex: /^\/dashboard\/company\/actualCompany(\/|$)/,
    },
    {
      name: 'Empleados',
      href: '/dashboard/employee',
      icon: <MdOutlinePersonAddAlt size={sizeIcons} />,
      position: 3,
      // regex: /^\/dashboard\/employee(\/|$)/,
    },
    {
      name: 'Equipos',
      href: '/dashboard/equipment',
      icon: <FiTruck size={sizeIcons} />,
      position: 4,
      // regex: /^\/dashboard\/equipment(\/|$)/,
    },
    {
      name: 'Documentación',
      href: '/dashboard/document',
      icon: <MdListAlt size={sizeIcons} />,
      position: 5,
      // regex: /^\/dashboard\/document(\/|$)/,
    },
    {
      name: 'Operaciones',
      href: '/dashboard/operations',
      icon: <MdCalendarMonth size={sizeIcons} />,
    },
    {
      name: 'Mantenimiento',
      href: '/dashboard/maintenance',
      icon: <FiTool size={sizeIcons} />,
      position: 6,
      // regex: /^\/dashboard\/maintenance(\/|$)/,
    },
    {
      name: 'Ayuda',
      href: '/dashboard/help',
      icon: <MdHelpOutline size={sizeIcons} />,
      position: 10,
      // regex: /^\/dashboard\/help(\/|$)/,
    },
  ];

  let liksToShow: any = [];

  //const filteredLinks = Allinks.filter((link) => link.name !== 'Empresa' && link.name !== 'Ayuda');

  const filterLinksRole = () => {
    if (role === 'owner') {
      liksToShow = Allinks;
      return;
    }
    credentialUser?.[0].modulos === null
      ? (liksToShow = Allinks) // TODO esta linea se tiene que sacar porque por defecto tiene que tener todos los modulos activos
      : credentialUser?.[0].modulos?.map((mod: string) => {
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
