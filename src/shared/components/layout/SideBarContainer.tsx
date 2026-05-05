import { getSession } from '@/shared/lib/session';
import InitState from '@/shared/store/InitUser';
import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
  Wrench,
} from 'lucide-react';
import SideBar from '@/shared/components/layout/Sidebar';

const sizeIcons = 24;

interface SideLink {
  name: string;
  href: string;
  icon: React.ReactNode;
  position: number;
  /** Permiso requerido para mostrar el link. null = siempre visible. */
  requiredPermission: string | null;
}

const ALL_LINKS: SideLink[] = [
  { name: 'Dashboard',     href: '/dashboard',                          icon: <LayoutDashboard size={sizeIcons} />, position: 1,  requiredPermission: null },
  { name: 'Empresa',       href: '/dashboard/company/actualCompany',    icon: <Building2 size={sizeIcons} />,       position: 2,  requiredPermission: 'empresa.view' },
  { name: 'Empleados',     href: '/dashboard/employee',                 icon: <Users size={sizeIcons} />,           position: 3,  requiredPermission: 'empleados.view' },
  { name: 'Equipos',       href: '/dashboard/equipment',                icon: <Truck size={sizeIcons} />,           position: 4,  requiredPermission: 'equipos.view' },
  { name: 'Documentación', href: '/dashboard/document',                 icon: <FileText size={sizeIcons} />,        position: 5,  requiredPermission: 'documentacion.view' },
  { name: 'Almacenes',     href: '/dashboard/warehouse',                icon: <Warehouse size={sizeIcons} />,       position: 6,  requiredPermission: 'almacenes.view' },
  { name: 'Compras',       href: '/dashboard/purchasing',               icon: <ShoppingCart size={sizeIcons} />,    position: 7,  requiredPermission: 'compras.view' },
  { name: 'Tesorería',     href: '/dashboard/treasury',                 icon: <Wallet size={sizeIcons} />,          position: 8,  requiredPermission: 'tesoreria.view' },
  { name: 'Mantenimiento', href: '/dashboard/maintenance',              icon: <Wrench size={sizeIcons} />,          position: 9,  requiredPermission: 'mantenimiento.view' },
  { name: 'Formularios',   href: '/dashboard/forms',                    icon: <ClipboardList size={sizeIcons} />,   position: 10, requiredPermission: 'formularios.view' },
  { name: 'Operaciones',   href: '/dashboard/operations',               icon: <Calendar size={sizeIcons} />,        position: 11, requiredPermission: 'operaciones.view' },
  { name: 'HSE',           href: '/dashboard/hse',                      icon: <GraduationCap size={sizeIcons} />,   position: 12, requiredPermission: null },
  { name: 'Configuración', href: '/dashboard/settings',                 icon: <Settings size={sizeIcons} />,        position: 13, requiredPermission: null },
  { name: 'Ayuda',         href: '/dashboard/help',                     icon: <HelpCircle size={sizeIcons} />,      position: 14, requiredPermission: 'ayuda.view' },
];

function filterLinks(role: string | null, permissions: string[]): SideLink[] {
  // owner: shortcut (también podríamos verificar permissions, pero el set ya es completo).
  if (role === 'owner') return ALL_LINKS;

  const granted = new Set(permissions);
  return ALL_LINKS.filter((link) => link.requiredPermission === null || granted.has(link.requiredPermission));
}

async function SideBarContainer() {
  const session = await getSession();

  const links = filterLinks(session.role, session.permissions).sort((a, b) => a.position - b.position);

  return (
    <>
      <InitState
        companies={session.companies}
        user={session.user}
        share_company_users={session.sharedCompanies}
        credentialUser={session.profile ? [session.profile] : []}
        role={session.role || ''}
        permissions={session.permissions}
      />
      <SideBar key={session.role} role={session.role || ''} Allinks={links} />
    </>
  );
}

export default SideBarContainer;
