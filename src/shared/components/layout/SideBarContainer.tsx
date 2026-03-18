import { fetchCurrentUser, verifyUserRoleInCompany } from '@/shared/actions/auth';
import { fetchCompaniesByOwner, fetchSharedCompaniesByProfile } from '@/modules/company/features/list/actions.server';
import { prisma } from '@/shared/lib/prisma';
import InitState from '@/shared/store/InitUser';
import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { cookies } from 'next/headers';
import SideBar from '@/shared/components/layout/Sidebar';

async function SideBarContainer() {
  const user = await fetchCurrentUser();
  const userData: any = await verifyUserRoleInCompany();

  // Fetch profile by id (replaces supabase .from('profile').eq('credential_id', ...))
  const credentialUser = user?.id
    ? await prisma.profile.findMany({ where: { id: user.id } })
    : [];

  // Fetch owned companies with relations (replaces supabase .from('company') query)
  const companies = await fetchCompaniesByOwner(user?.id || '');

  // Fetch shared companies (replaces supabase .from('share_company_users') query)
  const share_company_users = await fetchSharedCompaniesByProfile(user?.id || '');

  let role: any;

  const cookiesStore = await cookies();
  let actualCompany = cookiesStore?.get('actualComp')?.value;

  // If no actualComp cookie, fall back to first owned or shared company
  if (!actualCompany) {
    if (companies?.length > 0) {
      actualCompany = (companies[0] as any).id;
    } else if (share_company_users?.length > 0) {
      actualCompany = (share_company_users[0] as any).company_id;
    }
  }

  if (actualCompany) {
    const ownedCompany = companies?.find((company: any) => company.id === actualCompany);
    const is_owner = ownedCompany && (ownedCompany as any).owner_id === user?.id;
    const is_shared = share_company_users?.find(
      (entry: any) => (entry.company_id === actualCompany || entry.company?.id === actualCompany) && entry.profile_id === user?.id
    );
    role = is_owner ? 'owner' : (is_shared as any)?.role;
  }

  const sizeIcons = 24;
  const Allinks = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={sizeIcons} />,
      position: 1,
    },
    {
      name: 'Empresa',
      href: '/dashboard/company/actualCompany',
      icon: <Building2 size={sizeIcons} />,
      position: 2,
    },
    {
      name: 'Empleados',
      href: '/dashboard/employee',
      icon: <Users size={sizeIcons} />,
      position: 3,
    },
    {
      name: 'Equipos',
      href: '/dashboard/equipment',
      icon: <Truck size={sizeIcons} />,
      position: 4,
    },
    {
      name: 'Documentación',
      href: '/dashboard/document',
      icon: <FileText size={sizeIcons} />,
      position: 5,
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
    },
    {
      name: 'Formularios',
      href: '/dashboard/forms',
      icon: <ClipboardList size={sizeIcons} />,
      position: 7,
    },
    {
      name: 'HSE',
      href: '/dashboard/hse',
      icon: <GraduationCap size={sizeIcons} />,
      position: 9,
    },
    {
      name: 'Ayuda',
      href: '/dashboard/help',
      icon: <HelpCircle size={sizeIcons} />,
      position: 10,
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
      );
      return;
    }

    userData?.modulos?.length === 0
      ? (liksToShow = Allinks)
      : userData?.modulos?.map((mod: string) => {
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
