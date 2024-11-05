'use client';

import { useLoggedUserStore } from '@/store/loggedUser';
import cookies from 'js-cookie';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FiTool, FiTruck } from 'react-icons/fi';
import {
  MdHelpOutline,
  MdListAlt,
  MdOutlineCorporateFare,
  MdOutlinePersonAddAlt,
  MdOutlineSpaceDashboard,
  MdCalendarMonth,
} from 'react-icons/md';
export async function getServerSideProps(context: any) {
  const { params } = context;
  const { type } = params;
  return {
    props: {
      type,
    },
  };
}

const sizeIcons = 24;

const Allinks = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <MdOutlineSpaceDashboard size={sizeIcons} />,
  },
  {
    name: 'Empresa',
    href: '/dashboard/company/actualCompany',
    icon: <MdOutlineCorporateFare size={sizeIcons} />,
  },
  {
    name: 'Empleados',
    href: '/dashboard/employee',
    icon: <MdOutlinePersonAddAlt size={sizeIcons} />,
  },
  {
    name: 'Equipos',
    href: '/dashboard/equipment',
    icon: <FiTruck size={sizeIcons} />,
  },
  {
    name: 'Documentación',
    href: '/dashboard/document',
    icon: <MdListAlt size={sizeIcons} />,
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
  },
  // {
  //   name: 'Formularios',
  //   href: '/dashboard/forms',
  //   icon: <ArchiveIcon className="size-5" />,
  // },
  {
    name: 'Ayuda',
    href: '/dashboard/help',
    icon: <MdHelpOutline size={sizeIcons} />,
  },
];

export default function SideLinks({ expanded }: { expanded: boolean }) {
  //cambio
  const pathname = usePathname();
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const owner_id = useLoggedUserStore((state) => state.profile)?.[0]?.id;
  const profile = useLoggedUserStore((state) => state.profile);
  //const userShared = useLoggedUserStore(state => state.sharedUsers?.[0]?.role)
  const userShared = cookies.get('guestRole');
  const isAuditor = profile?.[0]?.role === 'Auditor';
  const administrador = userShared === 'Administrador' || null;

  const actualCompany = useLoggedUserStore((state) => state.actualCompany)?.owner_id.id;

  const share = useLoggedUserStore((state) => state.sharedCompanies);
  const profile2 = useLoggedUserStore((state) => state.credentialUser?.id);
  const owner2 = useLoggedUserStore((state) => state.actualCompany?.owner_id.id);
  const users = useLoggedUserStore((state) => state);
  const company = useLoggedUserStore((state) => state.actualCompany?.id);

  let role = '';
  if (owner2 === profile2) {
    role = users?.actualCompany?.owner_id?.role as string;
  } else {
    const roleRaw = share
      ?.filter(
        (item: any) =>
          item.company_id?.id === company &&
          Object.values(item).some((value) => typeof value === 'string' && value.includes(profile2 as string))
      )
      .map((item: any) => item.role);
    role = roleRaw?.join('');
  }

  // const links =
  //   !administrador && owner_id !== actualCompany ? Allinks?.filter((link) => link.name !== 'Empresa') : Allinks;
  const links =
    !administrador && owner_id !== actualCompany
      ? Allinks.filter(
          (link) =>
            link.name !== 'Empresa' && (role !== 'Invitado' || (link.name !== 'Dashboard' && link.name !== 'Ayuda'))
        )
      : Allinks.filter((link) => role !== 'Invitado' || (link.name !== 'Dashboard' && link.name !== 'Ayuda'));

  if (isAuditor) {
    return null;
  }
  const handleSubMenuClick = (index: any) => {
    if (openSubMenu === index) {
      setOpenSubMenu(null);
    } else {
      setOpenSubMenu(index);
    }
  };

  const handleSubMenuItemClick = () => {
    setOpenSubMenu(null);
  };

  return (
    <>
      {links?.map((link, index) => (
        <div key={link.name}>
          <Link
            href={link.href}
            className={`flex h-[48px] grow items-center justify-center gap-1 rounded-md p-3 text-black font-medium md:flex-none md:justify-start md:p-2 md:px-3 ${
              pathname === link.href
                ? 'bg-white text-black'
                : ' dark:text-neutral-100 text--neutral-950 hover:bg-blue-500 hover:shadow-[0px_0px_05px_05px_rgb(255,255,255,0.40)] hover:text-white'
            }`}
            onClick={() => handleSubMenuClick(index)}
            title={!expanded ? link.name : undefined}
          >
            {expanded ? (
              <>
                {link.icon}

                <p className="hidden md:block">{link.name}</p>
              </>
            ) : (
              link.icon
            )}
          </Link>
        </div>
      ))}
    </>
  );
}
